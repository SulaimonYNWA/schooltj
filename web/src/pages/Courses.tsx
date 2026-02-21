import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useAuth } from '../lib/auth';
import { BookOpen, User, School, Tag, Plus, Mail, X, Calendar, Clock, DollarSign } from 'lucide-react';

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
    teacher_name?: string;
    teacher_email?: string;
    school_name?: string;
    created_at: string;
}

interface Enrollment {
    id: string;
    student_user_id: string;
    course_id: string;
    enrolled_at: string;
    status: string;
}

interface EnrollmentWithCourse {
    enrollment: Enrollment;
    course: Course;
}

export default function CourseList() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [viewedCourse, setViewedCourse] = useState<Course | null>(null);
    const [viewMode, setViewMode] = useState<'all' | 'my'>('all');

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

    const isTeacherOrSchool = user?.role === 'teacher' || user?.role === 'school_admin';
    const isStudent = user?.role === 'student';

    if ((isLoadingMy && viewMode === 'my') || (isLoading && viewMode === 'all')) {
        return <div className="p-8 text-center text-gray-500 italic">Loading courses...</div>;
    }
    if ((errorMy && viewMode === 'my') || (error && viewMode === 'all')) {
        return <div className="p-8 text-center text-red-500 font-medium">Error loading courses. Please try again.</div>;
    }

    const displayedCourses = viewMode === 'all' ? courses : myEnrollments?.map(e => e.course);

    const handleRequestAccess = async (courseId: string) => {
        try {
            await api.post(`/api/courses/${courseId}/request-access`);
            alert('Access requested successfully!');
            queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
        } catch (err: any) {
            console.error(err);
            alert('Failed to request access: ' + (err.response?.data || err.message));
        }
    };

    const handleRespondInvitation = async (enrollmentId: string, accept: boolean) => {
        try {
            await api.post(`/api/invitations/${enrollmentId}/respond`, { accept });
            queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
        } catch (err: any) {
            console.error(err);
            alert('Failed to respond to invitation: ' + (err.response?.data || err.message));
        }
    };

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
                                enrollment?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800';

                        return (
                            <div
                                key={course.id}
                                onClick={() => setViewedCourse(course)}
                                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-indigo-100 cursor-pointer"
                            >
                                <div className="h-48 bg-gray-200 group-hover:scale-105 transition-transform duration-300 relative">
                                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-50 text-indigo-200">
                                        <BookOpen className="h-12 w-12" />
                                    </div>
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
                                        <div className="flex items-center">
                                            <User className="mr-1.5 h-4 w-4 text-amber-500" />
                                            {course.teacher_name || 'Unknown Teacher'}
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
                                                setViewedCourse(course);
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

            {/* Course Details Modal */}
            {viewedCourse && (
                <CourseDetailsModal
                    course={viewedCourse}
                    onClose={() => setViewedCourse(null)}
                    onInvite={() => {
                        setSelectedCourseId(viewedCourse.id);
                        setIsInviteModalOpen(true);
                    }}
                    canInvite={isTeacherOrSchool}
                    isStudent={isStudent}
                    enrollment={myEnrollments?.find(e => e.course.id === viewedCourse.id)?.enrollment}
                    onRequestAccess={() => handleRequestAccess(viewedCourse.id)}
                    onRespond={handleRespondInvitation}
                />
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
                        // Optionally show success message
                    }}
                />
            )
            }
        </div >
    );
}

function CourseDetailsModal({
    course, onClose, onInvite, canInvite, isStudent, enrollment, onRequestAccess, onRespond
}: {
    course: Course,
    onClose: () => void,
    onInvite: () => void,
    canInvite: boolean,
    isStudent?: boolean,
    enrollment?: Enrollment,
    onRequestAccess?: () => void,
    onRespond?: (enrollmentId: string, accept: boolean) => void
}) {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                                <BookOpen className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-2xl leading-6 font-bold text-gray-900" id="modal-title">
                                        {course.title}
                                    </h3>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500 mb-6">
                                        {course.description}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Schedule</h4>
                                            {course.schedule ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center text-sm text-gray-700">
                                                        <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                                                        <span>{course.schedule.start_date} - {course.schedule.end_date}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-700">
                                                        <Clock className="h-4 w-4 mr-2 text-indigo-500" />
                                                        <span>{course.schedule.days.join(', ')}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-700 ml-6">
                                                        <span>{course.schedule.start_time} - {course.schedule.end_time}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500 italic">No schedule available</span>
                                            )}
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Details</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <User className="h-4 w-4 mr-2 text-amber-500" />
                                                    <span className="font-medium">Teacher:</span>
                                                    <span className="ml-1">{course.teacher_name || 'Unknown'}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <School className="h-4 w-4 mr-2 text-blue-500" />
                                                    <span className="font-medium">School:</span>
                                                    <span className="ml-1">{course.school_name || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                                                    <span className="font-medium">Price:</span>
                                                    <span className="ml-1 font-bold text-gray-900">TJS {course.price.toLocaleString()}</span>
                                                </div>
                                                {enrollment && (
                                                    <div className="flex items-center text-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${enrollment.status === 'active' ? 'bg-green-100 text-green-800' :
                                                            enrollment.status === 'invited' ? 'bg-blue-100 text-blue-800' :
                                                                enrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            Status: {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                        {canInvite && (
                            <button
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
                                onClick={onInvite}
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Invite Student
                            </button>
                        )}

                        {isStudent && (
                            <>
                                {!enrollment && onRequestAccess && (
                                    <button
                                        type="button"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
                                        onClick={onRequestAccess}
                                    >
                                        Request Access
                                    </button>
                                )}
                                {enrollment?.status === 'invited' && onRespond && (
                                    <>
                                        <button
                                            type="button"
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:w-auto sm:text-sm"
                                            onClick={() => onRespond(enrollment.id, true)}
                                        >
                                            Accept Invitation
                                        </button>
                                        <button
                                            type="button"
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm"
                                            onClick={() => onRespond(enrollment.id, false)}
                                        >
                                            Decline
                                        </button>
                                    </>
                                )}
                                {enrollment?.status === 'pending' && (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-400 text-base font-medium text-white cursor-not-allowed sm:w-auto sm:text-sm"
                                    >
                                        Request Pending
                                    </button>
                                )}
                            </>
                        )}

                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CreateCourseModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
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
