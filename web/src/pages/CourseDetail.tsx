import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
    BookOpen, Users, Star, MapPin, Calendar, Clock, Globe, Tag,
    ChevronDown, ChevronRight, Plus, Pencil, Trash2, Eye, EyeOff,
    GraduationCap, X, Check, ArrowLeft, ClipboardList, BarChart3,
    Camera, UserPlus, Mail, CreditCard, Upload, Download, FileText, ImageIcon
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import imageCompression from 'browser-image-compression';
import RatingDisplay from '../components/RatingDisplay';

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
    school_id?: string;
    school_name?: string;
    teacher_id?: string;
    teacher_name?: string;
    teacher_email?: string;
    teacher_avatar?: string;
    cover_image_url?: string;
    language?: string;
    category_id?: string;
    category_name?: string;
    difficulty?: string;
    tags?: string[];
    price: number;
    rating_avg?: number;
    rating_count?: number;
    created_at: string;
}

interface Topic {
    id: string;
    course_id: string;
    title: string;
    description: string;
    sort_order: number;
    visible: boolean;
    created_at: string;
    is_completed?: boolean;
}

interface Material {
    id: string;
    course_id: string;
    topic_id?: string;
    file_name: string;
    file_size: number;
    content_type: string;
    uploaded_by: string;
    created_at: string;
}

interface RosterStudent {
    enrollment_id: string;
    student_user_id: string;
    student_name: string;
    student_avatar?: string;
}

interface Grade {
    id: string;
    student_user_id: string;
    student_name?: string;
    course_id: string;
    title: string;
    score: number;
    letter_grade: string;
    comment: string;
    graded_by: string;
    graded_at: string;
}

interface AttendanceRecord {
    id: string;
    enrollment_id: string;
    student_user_id: string;
    student_name?: string;
    student_avatar?: string;
    date: string;
    status: string;
    note: string;
}

interface Enrollment {
    id: string;
    student_user_id: string;
    student_name?: string;
    student_avatar?: string;
    course_id: string;
    enrolled_at: string;
    status: string;
    progress?: number;
}

interface EnrollmentWithCourse {
    enrollment: Enrollment;
    course: Course;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function TopicExpandedContent({ topic, courseId, isOwner, uploadingTopicId, setUploadingTopicId, setEditingTopic, updateTopicMutation, deleteTopicMutation, queryClient }: {
    topic: Topic;
    courseId: string;
    isOwner: boolean;
    uploadingTopicId: string | null;
    setUploadingTopicId: (id: string | null) => void;
    setEditingTopic: (id: string | null) => void;
    updateTopicMutation: any;
    deleteTopicMutation: any;
    queryClient: any;
}) {
    const { data: materials = [] } = useQuery<Material[]>({
        queryKey: ['topic-materials', topic.id],
        queryFn: () => api.get(`/api/courses/${courseId}/curriculum/${topic.id}/materials`).then(r => r.data || []),
    });

    const isUploading = uploadingTopicId === topic.id;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingTopicId(topic.id);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post(`/api/courses/${courseId}/curriculum/${topic.id}/materials`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            queryClient.invalidateQueries({ queryKey: ['topic-materials', topic.id] });
        } catch (err: any) {
            alert('Upload failed: ' + (err.response?.data || err.message));
        } finally {
            setUploadingTopicId(null);
            e.target.value = '';
        }
    };

    const handleDelete = async (materialId: string, fileName: string) => {
        if (!confirm(`Delete "${fileName}"?`)) return;
        try {
            await api.delete(`/api/materials/${materialId}`);
            queryClient.invalidateQueries({ queryKey: ['topic-materials', topic.id] });
        } catch (err: any) {
            alert('Delete failed: ' + (err.response?.data || err.message));
        }
    };

    const handleDownload = async (materialId: string, fileName: string) => {
        try {
            const res = await api.get(`/api/materials/${materialId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            alert('Download failed: ' + (err.response?.data || err.message));
        }
    };

    return (
        <div className="px-5 pb-4 border-t border-gray-100 pt-3">
            {topic.description ? (
                <p className="text-sm text-gray-600 leading-relaxed">{topic.description}</p>
            ) : (
                <p className="text-sm text-gray-400 italic">No description</p>
            )}

            {/* Materials Section */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Materials</h4>
                    {isOwner && (
                        <label className="cursor-pointer">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isUploading
                                ? 'bg-indigo-50 text-indigo-400'
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                }`}>
                                <Upload className="h-3.5 w-3.5" />
                                {isUploading ? 'Uploading...' : 'Upload File'}
                            </div>
                            <input
                                type="file"
                                accept=".pdf,image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                        </label>
                    )}
                </div>

                {materials.length > 0 ? (
                    <div className="space-y-1.5">
                        {materials.map(m => (
                            <div key={m.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                                {m.content_type === 'application/pdf' ? (
                                    <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                                ) : (
                                    <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 font-medium truncate">{m.file_name}</p>
                                    <p className="text-xs text-gray-400">{formatFileSize(m.file_size)}</p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDownload(m.id, m.file_name)}
                                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                        title="Download"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </button>
                                    {isOwner && (
                                        <button
                                            onClick={() => handleDelete(m.id, m.file_name)}
                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 italic">No materials uploaded yet</p>
                )}
            </div>

            {/* Owner Actions */}
            {isOwner && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                        onClick={() => setEditingTopic(topic.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    >
                        <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                        onClick={() => updateTopicMutation.mutate({
                            topicId: topic.id,
                            title: topic.title,
                            description: topic.description,
                            sort_order: topic.sort_order,
                            visible: !topic.visible,
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                    >
                        {topic.visible ? <><EyeOff className="h-3 w-3" /> Hide</> : <><Eye className="h-3 w-3" /> Show</>}
                    </button>
                    <button
                        onClick={() => { if (confirm('Delete this topic?')) deleteTopicMutation.mutate(topic.id); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <Trash2 className="h-3 w-3" /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

export default function CourseDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'students' | 'grades' | 'attendance' | 'reviews'>('overview');
    const [editingTopic, setEditingTopic] = useState<string | null>(null);
    const [showAddTopic, setShowAddTopic] = useState(false);
    const [topicForm, setTopicForm] = useState({ title: '', description: '', sort_order: 0 });
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteSearch, setInviteSearch] = useState('');
    const [suggestions, setSuggestions] = useState<{ id: string; name: string; email: string }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [uploadingTopicId, setUploadingTopicId] = useState<string | null>(null);


    const isTeacher = user?.role === 'teacher';
    const isSchoolAdmin = user?.role === 'school_admin';

    const { data: course, isLoading } = useQuery<Course>({
        queryKey: ['course', id],
        queryFn: () => api.get(`/api/courses/${id}`).then(r => r.data),
        enabled: !!id,
    });

    const { data: topics = [] } = useQuery<Topic[]>({
        queryKey: ['course-topics', id],
        queryFn: () => api.get(`/api/courses/${id}/curriculum`).then(r => r.data || []),
        enabled: !!id,
    });

    const { data: roster = [] } = useQuery<RosterStudent[]>({
        queryKey: ['course-roster', id],
        queryFn: () => api.get(`/api/courses/${id}/roster`).then(r => r.data || []),
        enabled: !!id,
    });

    const { data: grades = [] } = useQuery<Grade[]>({
        queryKey: ['course-grades', id],
        queryFn: () => api.get(`/api/courses/${id}/grades`).then(r => r.data || []),
        enabled: !!id && (isTeacher || isSchoolAdmin),
    });

    const { data: enrollments = [] } = useQuery<{ id: string; student_user_id: string; student_name: string; student_avatar?: string; status: string }[]>({
        queryKey: ['course-enrollments', id],
        queryFn: () => api.get(`/api/courses/${id}/enrollments`).then(r => r.data || []),
        enabled: !!id && (isTeacher || isSchoolAdmin),
    });

    const { data: attendance = [] } = useQuery<AttendanceRecord[]>({
        queryKey: ['course-attendance', id, attendanceDate],
        queryFn: () => api.get(`/api/courses/${id}/attendance?date=${attendanceDate}`).then(r => r.data),
        enabled: !!id && activeTab === 'attendance',
    });

    const isStudent = user?.role === 'student';
    const { data: myEnrollments } = useQuery<EnrollmentWithCourse[]>({
        queryKey: ['my-enrollments'],
        queryFn: () => api.get('/api/my-enrollments').then(r => r.data),
        enabled: !!user && isStudent,
    });

    const studentEnrollment = myEnrollments?.find(e => e.course.id === id)?.enrollment;

    const addTopicMutation = useMutation({
        mutationFn: (data: { title: string; description: string; sort_order: number }) =>
            api.post(`/api/courses/${id}/curriculum`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-topics', id] });
            setShowAddTopic(false);
            setTopicForm({ title: '', description: '', sort_order: 0 });
        },
    });

    const updateTopicMutation = useMutation({
        mutationFn: (data: { topicId: string; title: string; description: string; sort_order: number; visible: boolean }) =>
            api.put(`/api/courses/${id}/curriculum/${data.topicId}`, {
                title: data.title,
                description: data.description,
                sort_order: data.sort_order,
                visible: data.visible,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-topics', id] });
            setEditingTopic(null);
        },
    });

    const deleteTopicMutation = useMutation({
        mutationFn: (topicId: string) => api.delete(`/api/courses/${id}/curriculum/${topicId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-topics', id] });
        },
    });

    const toggleTopicCompleteMutation = useMutation({
        mutationFn: async (vars: { topicId: string, isCompleted: boolean }) => {
            if (vars.isCompleted) {
                return api.delete(`/api/topics/${vars.topicId}/complete`);
            } else {
                return api.post(`/api/topics/${vars.topicId}/complete`);
            }
        },
        onMutate: async (vars) => {
            // Optimistic update: toggle topic completion immediately
            await queryClient.cancelQueries({ queryKey: ['course-topics', id] });
            const prevTopics = queryClient.getQueryData<Topic[]>(['course-topics', id]);
            queryClient.setQueryData<Topic[]>(['course-topics', id], old =>
                (old || []).map(t => t.id === vars.topicId ? { ...t, is_completed: !vars.isCompleted } : t)
            );
            return { prevTopics };
        },
        onError: (_err, _vars, context) => {
            if (context?.prevTopics) {
                queryClient.setQueryData(['course-topics', id], context.prevTopics);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['course-topics', id] });
            queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
        },
    });

    const enrollment = studentEnrollment;

    const handleRequestAccess = async () => {
        try {
            await api.post(`/api/courses/${id}/request-access`);
            queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
        } catch (err: any) {
            alert('Failed to request access: ' + (err.response?.data || err.message));
        }
    };

    const handleRespondInvitation = async (accept: boolean) => {
        if (!enrollment) return;
        try {
            await api.post(`/api/invitations/${enrollment.id}/respond`, { accept });
            queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
        } catch (err: any) {
            alert('Failed: ' + (err.response?.data || err.message));
        }
    };

    const handleCancelRequest = async () => {
        if (!enrollment) return;
        try {
            await api.delete(`/api/enrollments/${enrollment.id}/cancel`);
            queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
        } catch (err: any) {
            alert('Failed: ' + (err.response?.data || err.message));
        }
    };

    const handleInviteSearch = async (query: string) => {
        setInviteSearch(query);
        setInviteEmail('');
        if (query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        try {
            const res = await api.get(`/api/students/suggestions?q=${encodeURIComponent(query)}`);
            setSuggestions(res.data || []);
            setShowSuggestions(true);
        } catch {
            setSuggestions([]);
        }
    };

    const handleSelectStudent = (student: { id: string; name: string; email: string }) => {
        setInviteEmail(student.email);
        setInviteSearch(student.name);
        setShowSuggestions(false);
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        try {
            await api.post(`/api/courses/${id}/invite`, { email: inviteEmail });
            setInviteEmail('');
            setInviteSearch('');
            setSuggestions([]);
            setShowInvite(false);
            queryClient.invalidateQueries({ queryKey: ['course-roster', id] });
            queryClient.invalidateQueries({ queryKey: ['course-enrollments', id] });
        } catch (err: any) {
            alert('Failed to invite: ' + (err.response?.data || err.message));
        }
    };

    const approveEnrollment = useMutation({
        mutationFn: ({ enrollmentId, approve }: { enrollmentId: string; approve: boolean }) =>
            api.post(`/api/enrollments/${enrollmentId}/approve`, { approve }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-enrollments', id] });
            queryClient.invalidateQueries({ queryKey: ['course-roster', id] });
        },
        onError: (err: any) => {
            alert('Failed to update request: ' + (err.response?.data || err.message));
        }
    });

    const handlePay = async (provider: string) => {
        if (!course) return;
        setIsPaying(true);
        try {
            const res = await api.post('/api/payments/initiate', {
                course_id: id,
                amount: course.price,
                provider: provider,
            });
            if (res.data.redirect_url) {
                window.location.href = res.data.redirect_url;
            }
        } catch (err: any) {
            alert('Payment execution failed: ' + (err.response?.data || err.message));
        } finally {
            setIsPaying(false);
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingCover(true);
        try {
            const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200 });
            const storageRef = ref(storage, `course-covers/${id}-${Date.now()}`);
            const task = uploadBytesResumable(storageRef, compressed);
            task.on('state_changed', null, (err) => { console.error(err); setUploadingCover(false); }, async () => {
                const url = await getDownloadURL(task.snapshot.ref);
                await api.put(`/api/courses/${id}/cover-image`, { cover_image_url: url });
                queryClient.invalidateQueries({ queryKey: ['course', id] });
                queryClient.invalidateQueries({ queryKey: ['courses'] });
                setUploadingCover(false);
            });
        } catch {
            setUploadingCover(false);
        }
    };

    const toggleExpanded = (topicId: string) => {
        setExpandedTopics(prev => {
            const next = new Set(prev);
            if (next.has(topicId)) next.delete(topicId);
            else next.add(topicId);
            return next;
        });
    };

    const isOwner = user?.id === course?.teacher_id || (user?.role === 'school_admin');

    const { data: courseRatings = [] } = useQuery<any[]>({
        queryKey: ['course-ratings', id],
        queryFn: () => api.get(`/api/courses/${id}/ratings`).then(r => r.data),
        enabled: !!id && isOwner,
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500 italic">Loading course...</div>;
    if (!course) return <div className="p-8 text-center text-red-500">Course not found</div>;


    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back link */}
            <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Courses
            </Link>

            {/* Hero */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-2xl overflow-hidden mb-6">
                {course.cover_image_url && (
                    <div className="absolute inset-0">
                        <img src={course.cover_image_url} alt="" className="w-full h-full object-cover opacity-20" />
                    </div>
                )}
                {/* Cover image upload button */}
                {isOwner && (
                    <label className="absolute top-4 right-4 z-10 cursor-pointer">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${uploadingCover ? 'bg-white/30 text-white' : 'bg-white/20 hover:bg-white/30 text-white'}`}>
                            <Camera className="h-3.5 w-3.5" />
                            {uploadingCover ? 'Uploading...' : course.cover_image_url ? 'Change Cover' : 'Add Cover'}
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
                    </label>
                )}
                <div className="relative px-8 py-10">
                    <h1 className="text-2xl font-bold text-white">{course.title}</h1>
                    {course.description && (
                        <p className="mt-2 text-indigo-100 text-sm max-w-2xl leading-relaxed">{course.description}</p>
                    )}

                    <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-white/15">
                        {course.teacher_name && (
                            <div className="flex items-center gap-2">
                                {course.teacher_avatar ? (
                                    <img src={course.teacher_avatar} alt="" className="h-8 w-8 rounded-full object-cover border border-white/30" />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center text-white text-sm font-semibold">
                                        {course.teacher_name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <div className="text-xs text-indigo-300">Teacher</div>
                                    <Link to={course.teacher_id ? `/users/${course.teacher_id}` : '#'} className="text-sm text-white hover:text-indigo-200">
                                        {course.teacher_name}
                                    </Link>
                                </div>
                            </div>
                        )}
                        {course.school_name && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-indigo-300" />
                                <div>
                                    <div className="text-xs text-indigo-300">School</div>
                                    <Link to={course.school_id ? `/schools/${course.school_id}` : '#'} className="text-sm text-white hover:text-indigo-200">
                                        {course.school_name}
                                    </Link>
                                </div>
                            </div>
                        )}
                        {course.rating_avg !== undefined && course.rating_avg > 0 && (
                            <div className="flex items-center gap-2">
                                <RatingDisplay rating={course.rating_avg} count={course.rating_count} size={20} />
                            </div>
                        )}
                        {course.language && (
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-indigo-300" />
                                <div>
                                    <div className="text-xs text-indigo-300">Language</div>
                                    <span className="text-sm text-white">{course.language}</span>
                                </div>
                            </div>
                        )}
                        {course.category_name && (
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-indigo-300" />
                                <div>
                                    <div className="text-xs text-indigo-300">Category</div>
                                    <span className="text-sm text-white">{course.category_name}</span>
                                </div>
                            </div>
                        )}
                        {course.difficulty && (
                            <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-indigo-300" />
                                <div>
                                    <div className="text-xs text-indigo-300">Difficulty</div>
                                    <span className="text-sm text-white capitalize">{course.difficulty}</span>
                                </div>
                            </div>
                        )}
                        {studentEnrollment && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-indigo-300" />
                                <div>
                                    <div className="text-xs text-indigo-300">Enrolled On</div>
                                    <span className="text-sm text-white">
                                        {new Date(studentEnrollment.enrolled_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-indigo-300" />
                            <div>
                                <div className="text-xs text-indigo-300">Price</div>
                                <span className="text-sm text-white font-semibold">TJS {course.price.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {course.tags && course.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {course.tags.map(tag => (
                                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-500/20 text-indigo-100 border border-indigo-500/30">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Schedule */}
                    {course.schedule && (
                        <div className="flex flex-wrap gap-4 mt-4">
                            {course.schedule.days?.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs text-indigo-200 bg-white/10 px-2.5 py-1 rounded-full">
                                    <Calendar className="h-3 w-3" /> {course.schedule.days.join(', ')}
                                </span>
                            )}
                            {course.schedule.start_time && (
                                <span className="inline-flex items-center gap-1 text-xs text-indigo-200 bg-white/10 px-2.5 py-1 rounded-full">
                                    <Clock className="h-3 w-3" /> {course.schedule.start_time} – {course.schedule.end_time}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 mt-5">
                        {isStudent && !enrollment && (
                            <button
                                onClick={handleRequestAccess}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                                <UserPlus className="h-4 w-4" /> Request Access
                            </button>
                        )}
                        {isStudent && enrollment?.status === 'pending' && (
                            <button
                                onClick={handleCancelRequest}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/80 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                <X className="h-4 w-4" /> Cancel Request
                            </button>
                        )}
                        {isStudent && enrollment?.status === 'invited' && (
                            <>
                                <button
                                    onClick={() => handleRespondInvitation(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
                                >
                                    <Check className="h-4 w-4" /> Accept Invitation
                                </button>
                                <button
                                    onClick={() => handleRespondInvitation(false)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/80 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    <X className="h-4 w-4" /> Decline
                                </button>
                            </>
                        )}
                        {isStudent && !enrollment && (
                            <button
                                onClick={() => handlePay('alif')}
                                disabled={isPaying}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50"
                            >
                                <CreditCard className="h-4 w-4" />
                                {isPaying ? 'Redirecting...' : 'Pay with Alif Mobi'}
                            </button>
                        )}
                        {isStudent && enrollment?.status === 'active' && (
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-100 text-sm font-medium rounded-lg">
                                    <Check className="h-4 w-4" /> Enrolled
                                </span>
                                <span className="text-xs text-indigo-200">
                                    Enrolled on {new Date(enrollment.enrolled_at).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        {isOwner && (
                            <button
                                onClick={() => setShowInvite(!showInvite)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white text-sm font-semibold rounded-lg hover:bg-white/30 transition-colors"
                            >
                                <Mail className="h-4 w-4" /> Invite Student
                            </button>
                        )}
                    </div>

                    {/* Inline Invite Form with Autocomplete */}
                    {showInvite && (
                        <div className="mt-3">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Search student by name..."
                                        value={inviteSearch}
                                        onChange={e => handleInviteSearch(e.target.value)}
                                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        className="w-full rounded-lg border-0 bg-white/15 text-white placeholder-indigo-200 px-3 py-2 text-sm focus:ring-2 focus:ring-white/30"
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-48 overflow-y-auto">
                                            {suggestions.map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onMouseDown={e => e.preventDefault()}
                                                    onClick={() => handleSelectStudent(s)}
                                                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors flex items-center gap-2 text-sm"
                                                >
                                                    <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs flex-shrink-0">
                                                        {s.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-gray-900 font-medium truncate">{s.name}</p>
                                                        <p className="text-gray-400 text-xs truncate">{s.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {showSuggestions && inviteSearch.length >= 2 && suggestions.length === 0 && (
                                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 px-3 py-3 text-sm text-gray-400 italic">
                                            No students found
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleInvite}
                                    disabled={!inviteEmail.trim()}
                                    className="px-4 py-2 bg-white text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                                >
                                    Send
                                </button>
                            </div>
                            {inviteEmail && (
                                <p className="text-xs text-indigo-200 mt-1.5">Will invite: {inviteEmail}</p>
                            )}
                        </div>
                    )}

                    {/* Progress Bar (Student Only) */}
                    {isStudent && enrollment?.status === 'active' && topics.length > 0 && (() => {
                        const visibleTopics = topics.filter(t => t.visible);
                        const completedCount = visibleTopics.filter(t => t.is_completed).length;
                        const progress = visibleTopics.length > 0 ? (completedCount / visibleTopics.length) * 100 : 0;
                        return (
                            <div className="mt-6 pt-6 border-t border-white/15">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-white font-medium">Your Progress</span>
                                    <span className="text-sm text-indigo-200 font-semibold">{completedCount}/{visibleTopics.length} topics · {Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
                {(['overview', 'topics', 'grades', 'attendance', 'students', 'reviews'] as const)
                    .filter(tab => tab !== 'reviews' || isOwner || isSchoolAdmin)
                    .map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            {tab === 'overview' && <BookOpen className="inline h-4 w-4 mr-1" />}
                            {tab === 'topics' && <GraduationCap className="inline h-4 w-4 mr-1" />}
                            {tab === 'grades' && <BarChart3 className="inline h-4 w-4 mr-1" />}
                            {tab === 'attendance' && <ClipboardList className="inline h-4 w-4 mr-1" />}
                            {tab === 'students' && <Users className="inline h-4 w-4 mr-1" />}
                            {tab === 'reviews' && <Star className="inline h-4 w-4 mr-1" />}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'topics' && <span className="ml-1 text-xs text-gray-400">{topics.length}</span>}
                            {tab === 'grades' && <span className="ml-1 text-xs text-gray-400">{grades.length}</span>}
                            {tab === 'students' && <span className="ml-1 text-xs text-gray-400">{roster.length}</span>}
                            {tab === 'reviews' && courseRatings && <span className="ml-1 text-xs text-gray-400">{courseRatings.length}</span>}
                            {tab === 'students' && enrollments.some(e => e.status === 'pending') && (
                                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                        </button>
                    ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">About this Course</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">{course.description || 'No description provided.'}</p>
                    </div>
                    {course.schedule && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Schedule</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {course.schedule.days?.length > 0 && (
                                    <div><span className="text-gray-500">Days:</span> <span className="font-medium">{course.schedule.days.join(', ')}</span></div>
                                )}
                                {course.schedule.start_time && (
                                    <div><span className="text-gray-500">Time:</span> <span className="font-medium">{course.schedule.start_time} – {course.schedule.end_time}</span></div>
                                )}
                                {course.schedule.start_date && (
                                    <div><span className="text-gray-500">Start:</span> <span className="font-medium">{course.schedule.start_date}</span></div>
                                )}
                                {course.schedule.end_date && (
                                    <div><span className="text-gray-500">End:</span> <span className="font-medium">{course.schedule.end_date}</span></div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Topics Tab */}
            {activeTab === 'topics' && (
                <div>
                    {/* Add Topic Button */}
                    {isOwner && (
                        <div className="mb-4">
                            {!showAddTopic ? (
                                <button
                                    onClick={() => { setShowAddTopic(true); setTopicForm({ title: '', description: '', sort_order: topics.length + 1 }); }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <Plus className="h-4 w-4" /> Add Topic
                                </button>
                            ) : (
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <h3 className="font-semibold text-gray-900 mb-3">New Topic</h3>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Topic title"
                                            value={topicForm.title}
                                            onChange={e => setTopicForm(p => ({ ...p, title: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <textarea
                                            placeholder="Topic description (optional)"
                                            value={topicForm.description}
                                            onChange={e => setTopicForm(p => ({ ...p, description: e.target.value }))}
                                            rows={3}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => addTopicMutation.mutate(topicForm)}
                                                disabled={!topicForm.title || addTopicMutation.isPending}
                                                className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                            >
                                                <Check className="h-4 w-4" /> {addTopicMutation.isPending ? 'Saving...' : 'Save'}
                                            </button>
                                            <button onClick={() => setShowAddTopic(false)} className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Topic List */}
                    {topics.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <GraduationCap className="mx-auto h-8 w-8 text-gray-300" />
                            <p className="mt-2 text-sm text-gray-500">No topics added yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topics.map((topic, i) => (
                                <div
                                    key={topic.id}
                                    className={`bg-white rounded-xl border overflow-hidden transition-all ${!topic.visible ? 'border-gray-100 opacity-60' : 'border-gray-200'}`}
                                >
                                    {editingTopic === topic.id ? (
                                        /* Editing Mode */
                                        <div className="p-5">
                                            <input
                                                type="text"
                                                defaultValue={topic.title}
                                                id={`edit-title-${topic.id}`}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold mb-2 focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <textarea
                                                defaultValue={topic.description}
                                                id={`edit-desc-${topic.id}`}
                                                rows={3}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const titleEl = document.getElementById(`edit-title-${topic.id}`) as HTMLInputElement;
                                                        const descEl = document.getElementById(`edit-desc-${topic.id}`) as HTMLTextAreaElement;
                                                        updateTopicMutation.mutate({
                                                            topicId: topic.id,
                                                            title: titleEl.value,
                                                            description: descEl.value,
                                                            sort_order: topic.sort_order,
                                                            visible: topic.visible,
                                                        });
                                                    }}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700"
                                                >
                                                    <Check className="h-3.5 w-3.5" /> Save
                                                </button>
                                                <button onClick={() => setEditingTopic(null)} className="px-3 py-1.5 border border-gray-300 text-xs rounded-lg hover:bg-gray-50">
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View Mode */
                                        <>
                                            <div
                                                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                onClick={() => toggleExpanded(topic.id)}
                                            >
                                                {isStudent && enrollment?.status === 'active' ? (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            toggleTopicCompleteMutation.mutate({ topicId: topic.id, isCompleted: !!topic.is_completed });
                                                        }}
                                                        className={`relative z-10 flex items-center justify-center h-6 w-6 rounded-full border-2 flex-shrink-0 transition-colors ${topic.is_completed
                                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                                            : 'border-gray-300 hover:border-indigo-400'
                                                            }`}
                                                    >
                                                        {topic.is_completed && <Check className="h-4 w-4" />}
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex-shrink-0">
                                                        {i + 1}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-semibold text-sm ${topic.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{topic.title}</h3>
                                                </div>
                                                {isOwner && !topic.visible && (
                                                    <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                                                        <EyeOff className="h-3 w-3" /> Hidden
                                                    </span>
                                                )}
                                                {expandedTopics.has(topic.id) ? (
                                                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                )}
                                            </div>
                                            {expandedTopics.has(topic.id) && (
                                                <TopicExpandedContent
                                                    topic={topic}
                                                    courseId={id!}
                                                    isOwner={isOwner}
                                                    uploadingTopicId={uploadingTopicId}
                                                    setUploadingTopicId={setUploadingTopicId}
                                                    setEditingTopic={setEditingTopic}
                                                    updateTopicMutation={updateTopicMutation}
                                                    deleteTopicMutation={deleteTopicMutation}
                                                    queryClient={queryClient}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
                <div className="space-y-6">
                    {/* Pending Requests */}
                    {enrollments.filter(e => e.status === 'pending').length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Requests</h3>
                            <div className="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden">
                                <div className="divide-y divide-gray-50">
                                    {enrollments.filter(e => e.status === 'pending').map(req => (
                                        <div key={req.id} className="flex items-center gap-4 px-6 py-4 bg-yellow-50/50">
                                            {req.student_avatar ? (
                                                <img src={req.student_avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-semibold">
                                                    {(req.student_name || '?').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900">{req.student_name || 'Unknown Student'}</div>
                                                <div className="text-xs text-yellow-600">Requested access to join</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => approveEnrollment.mutate({ enrollmentId: req.id, approve: true })}
                                                    disabled={approveEnrollment.isPending}
                                                    className="p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                                                    title="Accept Request"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => approveEnrollment.mutate({ enrollmentId: req.id, approve: false })}
                                                    disabled={approveEnrollment.isPending}
                                                    className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                    title="Reject Request"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Roster */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Students</h3>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {roster.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {roster.map(s => (
                                        <Link key={s.enrollment_id} to={`/users/${s.student_user_id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                                            {s.student_avatar ? (
                                                <img src={s.student_avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                                                    {s.student_name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900">{s.student_name}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-gray-400">
                                    <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    <p className="text-sm">No students enrolled yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Grades Tab */}
            {activeTab === 'grades' && (
                <div className="space-y-4">
                    {grades.length > 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-5 py-3 text-left font-semibold text-gray-700">Student</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-700">Assessment</th>
                                        <th className="px-5 py-3 text-center font-semibold text-gray-700">Score</th>
                                        <th className="px-5 py-3 text-center font-semibold text-gray-700">Grade</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-700 hidden sm:table-cell">Comment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {grades.map(g => (
                                        <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3">
                                                <Link to={`/users/${g.student_user_id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                                                    {g.student_name || g.student_user_id.slice(0, 8)}
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3 text-gray-700">{g.title}</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`font-semibold ${g.score >= 90 ? 'text-emerald-600' :
                                                    g.score >= 80 ? 'text-blue-600' :
                                                        g.score >= 70 ? 'text-amber-600' : 'text-red-600'
                                                    }`}>{g.score}</span>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${g.letter_grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                                                    g.letter_grade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                                                        g.letter_grade.startsWith('C') ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                    }`}>{g.letter_grade}</span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 hidden sm:table-cell max-w-xs truncate">{g.comment}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                            <BarChart3 className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">No grades recorded yet</p>
                        </div>
                    )}
                </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Date:</label>
                        <input
                            type="date"
                            value={attendanceDate}
                            onChange={e => setAttendanceDate(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {attendance.length > 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="divide-y divide-gray-50">
                                {attendance.map(a => (
                                    <div key={a.id} className="flex items-center gap-4 px-6 py-4">
                                        {a.student_avatar ? (
                                            <img src={a.student_avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                                                {(a.student_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/users/${a.student_user_id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                                                {a.student_name || a.student_user_id.slice(0, 8)}
                                            </Link>
                                            {a.note && <p className="text-xs text-gray-400 mt-0.5">{a.note}</p>}
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${a.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                            a.status === 'late' ? 'bg-amber-100 text-amber-700' :
                                                a.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                            <ClipboardList className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">No attendance records for {attendanceDate}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Course Reviews</h2>
                    {courseRatings && courseRatings.length > 0 ? (
                        <div className="grid gap-4">
                            {courseRatings.map((r: any) => (
                                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                {r.reviewer_name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{r.reviewer_name}</p>
                                                <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <RatingDisplay rating={r.score} size={14} />
                                        </div>
                                    </div>
                                    {r.comment && (
                                        <p className="text-sm text-gray-600 italic mt-2">"{r.comment}"</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                            <Star className="mx-auto h-8 w-8 text-gray-300" />
                            <p className="mt-2 text-sm text-gray-500">No reviews yet</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
