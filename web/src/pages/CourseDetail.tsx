import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
    BookOpen, Users, Star, MapPin, Calendar, Clock, Globe, Tag,
    ChevronDown, ChevronRight, Plus, Pencil, Trash2, Eye, EyeOff,
    GraduationCap, X, Check, ArrowLeft, ClipboardList, BarChart3,
    Camera, UserPlus, Mail
} from 'lucide-react';
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
    school_id?: string;
    school_name?: string;
    teacher_id?: string;
    teacher_name?: string;
    teacher_email?: string;
    teacher_avatar?: string;
    cover_image_url?: string;
    language?: string;
    price: number;
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
    course_id: string;
    enrolled_at: string;
    status: string;
}

interface EnrollmentWithCourse {
    enrollment: Enrollment;
    course: { id: string };
}

export default function CourseDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'students' | 'grades' | 'attendance'>('overview');
    const [editingTopic, setEditingTopic] = useState<string | null>(null);
    const [showAddTopic, setShowAddTopic] = useState(false);
    const [topicForm, setTopicForm] = useState({ title: '', description: '', sort_order: 0 });
    const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');


    const { data: course, isLoading } = useQuery<Course>({
        queryKey: ['course', id],
        queryFn: () => api.get(`/api/courses/${id}`).then(r => r.data),
        enabled: !!id,
    });

    const { data: topics = [] } = useQuery<Topic[]>({
        queryKey: ['course-topics', id],
        queryFn: () => api.get(`/api/courses/${id}/curriculum`).then(r => r.data),
        enabled: !!id,
    });

    const { data: roster = [] } = useQuery<RosterStudent[]>({
        queryKey: ['course-roster', id],
        queryFn: () => api.get(`/api/courses/${id}/roster`).then(r => r.data),
        enabled: !!id && (activeTab === 'students' || activeTab === 'attendance'),
    });

    const { data: grades = [] } = useQuery<Grade[]>({
        queryKey: ['course-grades', id],
        queryFn: () => api.get(`/api/courses/${id}/grades`).then(r => r.data),
        enabled: !!id && activeTab === 'grades',
    });

    const { data: attendance = [] } = useQuery<AttendanceRecord[]>({
        queryKey: ['course-attendance', id, attendanceDate],
        queryFn: () => api.get(`/api/courses/${id}/attendance?date=${attendanceDate}`).then(r => r.data),
        enabled: !!id && activeTab === 'attendance',
    });

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

    // Enrollment for students
    const isStudent = user?.role === 'student';
    const { data: myEnrollments } = useQuery<EnrollmentWithCourse[]>({
        queryKey: ['my-enrollments'],
        queryFn: () => api.get('/api/my-enrollments').then(r => r.data),
        enabled: !!user && isStudent,
    });
    const enrollment = myEnrollments?.find(e => e.course.id === id)?.enrollment;

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

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        try {
            await api.post(`/api/courses/${id}/invite`, { email: inviteEmail });
            setInviteEmail('');
            setShowInvite(false);
            queryClient.invalidateQueries({ queryKey: ['course-roster', id] });
        } catch (err: any) {
            alert('Failed to invite: ' + (err.response?.data || err.message));
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

    if (isLoading) return <div className="p-8 text-center text-gray-500 italic">Loading course...</div>;
    if (!course) return <div className="p-8 text-center text-red-500">Course not found</div>;

    const isOwner = user?.id === course.teacher_id || (user?.role === 'school_admin');

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
                        {course.language && (
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-indigo-300" />
                                <div>
                                    <div className="text-xs text-indigo-300">Language</div>
                                    <span className="text-sm text-white">{course.language}</span>
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
                        {isStudent && enrollment?.status === 'active' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-100 text-sm font-medium rounded-lg">
                                <Check className="h-4 w-4" /> Enrolled
                            </span>
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

                    {/* Inline Invite Form */}
                    {showInvite && (
                        <div className="flex gap-2 mt-3">
                            <input
                                type="email"
                                placeholder="student@email.com"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                className="flex-1 rounded-lg border-0 bg-white/15 text-white placeholder-indigo-200 px-3 py-2 text-sm focus:ring-2 focus:ring-white/30"
                            />
                            <button
                                onClick={handleInvite}
                                disabled={!inviteEmail.trim()}
                                className="px-4 py-2 bg-white text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                            >
                                Send
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
                {(['overview', 'topics', 'grades', 'attendance', 'students'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        {tab === 'overview' && <BookOpen className="inline h-4 w-4 mr-1" />}
                        {tab === 'topics' && <GraduationCap className="inline h-4 w-4 mr-1" />}
                        {tab === 'grades' && <BarChart3 className="inline h-4 w-4 mr-1" />}
                        {tab === 'attendance' && <ClipboardList className="inline h-4 w-4 mr-1" />}
                        {tab === 'students' && <Users className="inline h-4 w-4 mr-1" />}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {tab === 'topics' && <span className="ml-1 text-xs text-gray-400">{topics.length}</span>}
                        {tab === 'grades' && <span className="ml-1 text-xs text-gray-400">{grades.length}</span>}
                        {tab === 'students' && <span className="ml-1 text-xs text-gray-400">{roster.length}</span>}
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
                                                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex-shrink-0">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-sm">{topic.title}</h3>
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
                                                <div className="px-5 pb-4 border-t border-gray-100 pt-3">
                                                    {topic.description ? (
                                                        <p className="text-sm text-gray-600 leading-relaxed">{topic.description}</p>
                                                    ) : (
                                                        <p className="text-sm text-gray-400 italic">No description</p>
                                                    )}
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
                                    <Star className="h-4 w-4 text-gray-200" />
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
        </div>
    );
}
