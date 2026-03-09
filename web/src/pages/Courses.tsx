import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useAuth } from '../lib/auth';
import { BookOpen, User, School, Tag, Plus, Mail, X, Calendar, Clock, DollarSign, FileText, Upload, Download, Trash2, Edit2, Check, Image, Camera, UserCheck, UserX, Users } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import imageCompression from 'browser-image-compression';

interface Schedule {
    days: string[];
    start_time: string;
    end_time: string;
    start_date: string;
    end_date: string;
}

interface Course {
    id: string;
    title: string;
    description: string;
    schedule?: Schedule;
    price: number;
    language?: string;
    teacher_id?: string;
    teacher_name?: string;
    teacher_email?: string;
    teacher_avatar?: string;
    cover_image_url?: string;
    school_name?: string;
    created_at: string;
}

interface Enrollment {
    id: string;
    student_user_id: string;
    student_name?: string;
    student_avatar?: string;
    course_id: string;
    enrolled_at: string;
    status: string;
}

interface EnrollmentWithCourse {
    enrollment: Enrollment;
    course: Course;
}

interface CurriculumTopic {
    id: string;
    course_id: string;
    title: string;
    description: string;
    sort_order: number;
    created_at: string;
}

interface CourseMaterial {
    id: string;
    course_id: string;
    file_name: string;
    file_size: number;
    content_type: string;
    uploaded_by: string;
    created_at: string;
}

export default function CourseList() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<'all' | 'my'>('all');
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const { data: courses, isLoading, error } = useQuery<Course[]>({
        queryKey: ['courses'],
        queryFn: async () => {
            const res = await api.get('/api/courses');
            return res.data;
        },
        enabled: viewMode === 'all',
    });

    const { data: myEnrollments, isLoading: isLoadingMy, error: errorMy } = useQuery<EnrollmentWithCourse[]>({
        queryKey: ['my-enrollments'],
        queryFn: async () => {
            const res = await api.get('/api/my-enrollments');
            return res.data;
        },
        enabled: !!user && user.role === 'student',
    });

    // Auto-redirect when ?view=courseId is in URL
    useEffect(() => {
        const viewCourseId = searchParams.get('view');
        if (viewCourseId) {
            setSearchParams({}, { replace: true });
            navigate(`/courses/${viewCourseId}`);
        }
    }, [searchParams, setSearchParams, navigate]);

    const isTeacherOrSchool = user?.role === 'teacher' || user?.role === 'school_admin';
    const isStudent = user?.role === 'student';

    if ((isLoadingMy && viewMode === 'my') || (isLoading && viewMode === 'all')) {
        return <div className="p-8 text-center text-gray-500 italic">Loading courses...</div>;
    }
    if ((errorMy && viewMode === 'my') || (error && viewMode === 'all')) {
        return <div className="p-8 text-center text-red-500 font-medium">Error loading courses. Please try again.</div>;
    }

    const displayedCourses = viewMode === 'all' ? courses : myEnrollments?.map(e => e.course);



    const formatSchedule = (s?: Schedule) => {
        if (!s) return null;
        const days = s.days?.join('/') || '';
        return `${days} ${s.start_time || ''}-${s.end_time || ''}`;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        {viewMode === 'all' ? 'Available Courses' : 'My Enrollments'}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {viewMode === 'all' ? 'Expand your knowledge with our expert-led courses.' : 'Manage your active courses and invitations.'}
                    </p>
                </div>
                <div className="flex gap-4">
                    {isStudent && (
                        <div className="bg-gray-100 p-1 rounded-lg flex">
                            <button
                                onClick={() => setViewMode('all')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                All Courses
                            </button>
                            <button
                                onClick={() => setViewMode('my')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'my' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                My Enrollments
                            </button>
                        </div>
                    )}
                    {isTeacherOrSchool && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" />
                            Create Course
                        </button>
                    )}
                </div>
            </div>

            {(!displayedCourses || displayedCourses.length === 0) ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 italic">No courses found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {viewMode === 'all' ? 'Get started by creating your first course or browse available ones.' : 'You are not enrolled in any courses yet.'}
                    </p>
                    {isTeacherOrSchool && viewMode === 'all' && (
                        <div className="mt-6">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                                New Course
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {displayedCourses.map((course) => {
                        const enrollment = myEnrollments?.find(e => e.course.id === course.id)?.enrollment;
                        const statusColor = enrollment?.status === 'active' ? 'bg-green-100 text-green-800' :
                            enrollment?.status === 'invited' ? 'bg-blue-100 text-blue-800' :
                                enrollment?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    enrollment?.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-800';

                        return (
                            <div
                                key={course.id}
                                onClick={() => navigate(`/courses/${course.id}`)}
                                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-indigo-100 cursor-pointer"
                            >
                                <div className="h-48 bg-gray-200 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                                    {course.cover_image_url ? (
                                        <img src={course.cover_image_url} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-indigo-50 text-indigo-200">
                                            <BookOpen className="h-12 w-12" />
                                        </div>
                                    )}
                                    {enrollment && enrollment.status && (
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                                                {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className="bg-indigo-50 p-2 rounded-lg">
                                            <BookOpen className="h-6 w-6 text-indigo-600" />
                                        </div>
                                    </div>
                                    <h3 className="mt-4 text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-2">
                                        {course.description}
                                    </p>
                                    {course.schedule && (
                                        <p className="mt-2 text-xs font-medium text-gray-500 bg-gray-50 inline-block px-2 py-1 rounded">
                                            {formatSchedule(course.schedule)}
                                        </p>
                                    )}

                                    <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500 border-t border-gray-50 pt-4">
                                        <div className="flex items-center gap-1.5">
                                            <Link to={course.teacher_id ? `/users/${course.teacher_id}` : '#'} className="hover:opacity-80 transition-opacity">
                                                {course.teacher_avatar ? (
                                                    <img src={course.teacher_avatar} alt="" className="h-5 w-5 rounded-full object-cover bg-gray-100 block" />
                                                ) : (
                                                    <User className="h-4 w-4 text-amber-500 block" />
                                                )}
                                            </Link>
                                            <Link to={course.teacher_id ? `/users/${course.teacher_id}` : '#'} className="hover:text-indigo-600 hover:underline">
                                                {course.teacher_name || 'Unknown Teacher'}
                                            </Link>
                                        </div>
                                        {course.school_name && (
                                            <div className="flex items-center">
                                                <School className="mr-1.5 h-4 w-4 text-blue-500" />
                                                {course.school_name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                                    <div className="flex items-center font-bold text-gray-900">
                                        <Tag className="mr-1.5 h-4 w-4 text-indigo-500" />
                                        TJS {course.price.toLocaleString()}
                                        {course.language && (
                                            <span className="ml-3 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">{course.language}</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {isTeacherOrSchool && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCourseId(course.id);
                                                    setIsInviteModalOpen(true);
                                                }}
                                                className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors p-1 rounded hover:bg-gray-200"
                                                title="Invite Student"
                                            >
                                                <Mail className="h-5 w-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/courses/${course.id}`);
                                            }}
                                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                                        >
                                            Details →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}



            {isCreateModalOpen && (
                <CreateCourseModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        queryClient.invalidateQueries({ queryKey: ['courses'] });
                    }}
                />
            )}

            {isInviteModalOpen && selectedCourseId && (
                <InviteStudentModal
                    courseId={selectedCourseId}
                    onClose={() => {
                        setIsInviteModalOpen(false);
                        setSelectedCourseId(null);
                    }}
                    onSuccess={() => {
                        setIsInviteModalOpen(false);
                        setSelectedCourseId(null);
                    }}
                />
            )}
        </div>
    );
}


function CreateCourseModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        language: '',
        days: [] as string[],
        start_time: '',
        end_time: '',
        start_date: '',
        end_date: '',
        teacher_id: '',
    });

    const isSchoolAdmin = user?.role === 'school_admin';

    // Fetch teachers if user is school admin
    const { data: teachers, isLoading: isLoadingTeachers } = useQuery({
        queryKey: ['school-teachers'],
        queryFn: async () => {
            const res = await api.get('/api/schools/teachers');
            return res.data;
        },
        enabled: isSchoolAdmin,
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            return api.post('/api/courses', {
                title: data.title,
                description: data.description,
                price: parseFloat(data.price),
                language: data.language,
                teacher_id: isSchoolAdmin ? data.teacher_id : undefined,
                schedule: {
                    days: data.days,
                    start_time: data.start_time,
                    end_time: data.end_time,
                    start_date: data.start_date,
                    end_date: data.end_date,
                }
            });
        },
        onSuccess: () => {
            onSuccess();
        }
    });

    const handleDayChange = (day: string) => {
        setFormData(prev => {
            const days = prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day];
            return { ...prev, days };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                            <Plus className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-5">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Create New Course</h3>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                required
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Teacher Selection for School Admin */}
                        {isSchoolAdmin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Assign Teacher</label>
                                {isLoadingTeachers ? (
                                    <div className="text-sm text-gray-500">Loading teachers...</div>
                                ) : (
                                    <select
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                        value={formData.teacher_id}
                                        onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                    >
                                        <option value="">Select a teacher...</option>
                                        {teachers?.map((t: any) => (
                                            <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">End Date</label>
                                <input
                                    type="date"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                <input
                                    type="time"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">End Time</label>
                                <input
                                    type="time"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Days</label>
                            <div className="flex flex-wrap gap-2">
                                {daysOfWeek.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleDayChange(day)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium border ${formData.days.includes(day)
                                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price (TJS)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Language</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                                value={formData.language}
                                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                            >
                                <option value="">Select language...</option>
                                {['English', 'Russian', 'Tajik', 'Arabic', 'Chinese', 'French', 'German', 'Spanish', 'Korean', 'Japanese', 'Turkish', 'Persian', 'Hindi', 'Uzbek', 'Italian', 'Portuguese', 'Urdu', 'Kazakh', 'Kyrgyz', 'Malay'].map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create'}
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function InviteStudentModal({ courseId, onClose, onSuccess }: { courseId: string, onClose: () => void, onSuccess: () => void }) {
    const [email, setEmail] = useState('');

    const inviteMutation = useMutation({
        mutationFn: async (email: string) => {
            return api.post(`/api/courses/${courseId}/invite`, { email });
        },
        onSuccess: () => {
            alert('Invitation sent successfully!'); // Simple feedback
            onSuccess();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        inviteMutation.mutate(email);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                            <Mail className="h-6 w-6 text-blue-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-5">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Invite Student</h3>
                            <div className="mt-2 text-sm text-gray-500">
                                Enter the email address of the student you want to invite.
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Student Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            {inviteMutation.isError && (
                                <div className="text-red-600 text-sm text-center">Failed to send invitation. Ensure email is correct and user is a student.</div>
                            )}
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="submit"
                                    disabled={inviteMutation.isPending}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                                >
                                    {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
