import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { api } from '../lib/axios';
import {
    Users, GraduationCap, DollarSign, BookOpen, Clock, Star, Eye,
    TrendingUp, Calendar, Megaphone, UserPlus, BarChart3
} from 'lucide-react';
import CourseInvitationModal from '../components/CourseInvitationModal';
import RatingModal from '../components/RatingModal';
import { useState } from 'react';

interface EnrollmentWithCourse {
    enrollment: {
        id: string;
        status: string;
        enrolled_at: string;
    };
    course: {
        id: string;
        title: string;
        description: string;
        schedule: string;
        teacher_id?: string;
        teacher_name?: string;
        teacher_email?: string;
        school_name?: string;
        price: number;
    };
}

interface DashboardStats {
    total_students: number;
    total_courses: number;
    total_teachers: number;
    total_revenue: number;
    active_enrolments: number;
    avg_attendance: number;
    recent_payments: number;
    pending_requests: number;
}

interface ActivityItem {
    type: string;
    message: string;
    timestamp: string;
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    author_name: string;
    course_title: string;
    is_pinned: boolean;
    created_at: string;
}

const activityIcons: Record<string, { icon: React.ElementType; color: string }> = {
    enrollment: { icon: UserPlus, color: 'text-blue-600 bg-blue-50' },
    payment: { icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
    announcement: { icon: Megaphone, color: 'text-amber-600 bg-amber-50' },
};

export default function Dashboard() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedInvitation, setSelectedInvitation] = useState<EnrollmentWithCourse | null>(null);
    const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
    const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string } | null>(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

    const { data: enrollments, isLoading } = useQuery<EnrollmentWithCourse[]>({
        queryKey: ['my-enrollments'],
        queryFn: async () => {
            const res = await api.get('/api/my-enrollments');
            return res.data;
        },
        enabled: user?.role === 'student',
    });

    const respondMutation = useMutation({
        mutationFn: async ({ id, accept }: { id: string, accept: boolean }) => {
            return api.post(`/api/invitations/${id}/respond`, { accept });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
            setIsInvitationModalOpen(false);
            setSelectedInvitation(null);
        }
    });

    const handleViewInvitation = (enrollment: EnrollmentWithCourse) => {
        setSelectedInvitation(enrollment);
        setIsInvitationModalOpen(true);
    };

    const handleAcceptInvitation = (enrollmentId: string) => {
        respondMutation.mutate({ id: enrollmentId, accept: true });
    };

    const handleRejectInvitation = (enrollmentId: string) => {
        respondMutation.mutate({ id: enrollmentId, accept: false });
    };

    const handleRateTeacher = (teacherId: string, teacherName: string) => {
        setRatingTarget({ id: teacherId, name: teacherName });
        setIsRatingModalOpen(true);
    };

    const handleRatingSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
        setIsRatingModalOpen(false);
        setRatingTarget(null);
    };

    if (user?.role === 'student') {
        return (
            <StudentDashboard
                user={user}
                enrollments={enrollments}
                isLoading={isLoading}
                onViewInvitation={handleViewInvitation}
                onRateTeacher={handleRateTeacher}
                selectedInvitation={selectedInvitation}
                isInvitationModalOpen={isInvitationModalOpen}
                onCloseInvitation={() => { setIsInvitationModalOpen(false); setSelectedInvitation(null); }}
                onAcceptInvitation={handleAcceptInvitation}
                onRejectInvitation={handleRejectInvitation}
                isProcessing={respondMutation.isPending}
                ratingTarget={ratingTarget}
                isRatingModalOpen={isRatingModalOpen}
                onCloseRating={() => { setIsRatingModalOpen(false); setRatingTarget(null); }}
                onRatingSuccess={handleRatingSuccess}
            />
        );
    }

    return <AdminDashboard user={user} />;
}

// ─── Admin/Teacher Dashboard ────────────────────────────────────────────
function AdminDashboard({ user }: { user: any }) {
    const { data: stats } = useQuery<DashboardStats>({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await api.get('/api/dashboard/stats');
            return res.data;
        },
    });

    const { data: activity } = useQuery<ActivityItem[]>({
        queryKey: ['dashboard-activity'],
        queryFn: async () => {
            const res = await api.get('/api/dashboard/activity');
            return res.data;
        },
    });

    const { data: announcements } = useQuery<Announcement[]>({
        queryKey: ['announcements'],
        queryFn: async () => {
            const res = await api.get('/api/announcements');
            return res.data;
        },
    });

    const statCards = [
        { name: 'Total Students', value: stats?.total_students ?? 0, icon: Users, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-600' },
        { name: 'Active Courses', value: stats?.total_courses ?? 0, icon: BookOpen, color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-600' },
        { name: 'Revenue', value: `$${(stats?.total_revenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'from-amber-500 to-amber-600', textColor: 'text-amber-600' },
        { name: 'Teachers', value: stats?.total_teachers ?? 0, icon: GraduationCap, color: 'from-purple-500 to-purple-600', textColor: 'text-purple-600' },
    ];

    const miniStats = [
        { name: 'Active Enrollments', value: stats?.active_enrolments ?? 0, icon: UserPlus },
        { name: 'Avg Attendance', value: `${stats?.avg_attendance ?? 0}%`, icon: BarChart3 },
        { name: 'Recent Payments', value: stats?.recent_payments ?? 0, icon: TrendingUp },
        { name: 'Pending Requests', value: stats?.pending_requests ?? 0, icon: Clock },
    ];

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Welcome back, <span className="font-medium text-gray-900">{user?.name || user?.email}</span>
                </p>
            </div>

            {/* Primary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                {statCards.map((item) => (
                    <div key={item.name} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{item.name}</p>
                                <p className={`text-2xl font-bold mt-1 ${item.textColor}`}>{item.value}</p>
                            </div>
                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                                <item.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mini Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {miniStats.map((item) => (
                    <div key={item.name} className="bg-gray-50 rounded-lg border border-gray-100 px-4 py-3 flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500">{item.name}</p>
                            <p className="text-sm font-bold text-gray-900">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Two-column layout: Activity + Announcements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                            Recent Activity
                        </h3>
                    </div>
                    {!activity?.length ? (
                        <div className="px-6 py-8 text-center text-gray-400 text-sm italic">No recent activity yet.</div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {activity.map((item, i) => {
                                const config = activityIcons[item.type] || activityIcons.enrollment;
                                const Icon = config.icon;
                                return (
                                    <div key={i} className="px-6 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-700">{item.message}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.timestamp)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Announcements */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-gray-400" />
                            Latest Announcements
                        </h3>
                    </div>
                    {!announcements?.length ? (
                        <div className="px-6 py-8 text-center text-gray-400 text-sm italic">No announcements yet.</div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {announcements.slice(0, 5).map(a => (
                                <div key={a.id} className="px-6 py-3.5 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        {a.is_pinned && <span className="text-amber-500 text-xs">📌</span>}
                                        <h4 className="text-sm font-medium text-gray-900">{a.title}</h4>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-1">{a.content}</p>
                                    <p className="text-xs text-gray-400 mt-1">{a.author_name} · {timeAgo(a.created_at)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Student Dashboard ──────────────────────────────────────────────────
function StudentDashboard({
    user, enrollments, isLoading,
    onViewInvitation, onRateTeacher,
    selectedInvitation, isInvitationModalOpen, onCloseInvitation,
    onAcceptInvitation, onRejectInvitation, isProcessing,
    ratingTarget, isRatingModalOpen, onCloseRating, onRatingSuccess,
}: any) {
    const invitations = enrollments?.filter((e: any) => e.enrollment.status === 'invited') || [];
    const activeCourses = enrollments?.filter((e: any) => e.enrollment.status === 'active') || [];

    const { data: attendanceSummary } = useQuery<any[]>({
        queryKey: ['my-attendance-summary'],
        queryFn: async () => {
            const res = await api.get('/api/my-attendance/summary');
            return res.data;
        },
    });

    const { data: announcements } = useQuery<Announcement[]>({
        queryKey: ['announcements'],
        queryFn: async () => {
            const res = await api.get('/api/announcements');
            return res.data;
        },
    });

    const overallAttendance = attendanceSummary?.length
        ? Math.round(attendanceSummary.reduce((s: number, a: any) => s + a.percentage, 0) / attendanceSummary.length)
        : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Welcome back, <span className="font-medium text-gray-900">{user?.name || user?.email}</span>
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Active Courses</p>
                            <p className="text-xl font-bold text-gray-900">{activeCourses.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Invitations</p>
                            <p className="text-xl font-bold text-gray-900">{invitations.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Attendance</p>
                            <p className={`text-xl font-bold ${overallAttendance >= 80 ? 'text-emerald-600' : overallAttendance >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{overallAttendance}%</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <Megaphone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Announcements</p>
                            <p className="text-xl font-bold text-gray-900">{announcements?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-gray-500 italic">Loading your courses...</div>
            ) : (
                <div className="space-y-8">
                    {/* Invitations Section */}
                    {invitations.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                Pending Invitations
                                <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{invitations.length}</span>
                            </h2>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    {invitations.map((item: EnrollmentWithCourse) => (
                                        <div key={item.enrollment.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-semibold text-indigo-600">{item.course.title}</h3>
                                                <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{item.course.description}</p>
                                                {item.course.teacher_name && (
                                                    <p className="text-xs text-gray-400 mt-1">Teacher: {item.course.teacher_name}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => onViewInvitation(item)}
                                                className="ml-4 inline-flex items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
                                            >
                                                <Eye className="w-4 h-4 mr-2" /> View
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Active Courses */}
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-500" />
                            My Active Courses
                        </h2>
                        {activeCourses.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                                <BookOpen className="mx-auto h-10 w-10 text-gray-300" />
                                <p className="mt-2 text-sm text-gray-500">You are not enrolled in any courses yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {activeCourses.map((item: EnrollmentWithCourse) => (
                                    <div key={item.enrollment.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                        <div className="px-5 py-4 flex-1">
                                            <h3 className="text-base font-bold text-gray-900 truncate">{item.course.title}</h3>
                                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.course.description}</p>
                                            {item.course.teacher_name && (
                                                <p className="mt-2 text-sm text-gray-600">
                                                    <span className="font-medium">Teacher:</span> {item.course.teacher_name}
                                                </p>
                                            )}
                                            {item.course.schedule && (
                                                <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
                                                    {item.course.schedule}
                                                </span>
                                            )}
                                        </div>
                                        <div className="bg-gray-50 px-5 py-3 space-y-2 border-t border-gray-100">
                                            <p className="text-xs text-gray-400">
                                                Enrolled on {new Date(item.enrollment.enrolled_at).toLocaleDateString()}
                                            </p>
                                            {item.course.teacher_id && item.course.teacher_name && (
                                                <button
                                                    onClick={() => onRateTeacher(item.course.teacher_id!, item.course.teacher_name!)}
                                                    className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                                                >
                                                    <Star className="w-4 h-4 mr-1.5" /> Rate Teacher
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* Modals */}
            <CourseInvitationModal
                enrollment={selectedInvitation}
                isOpen={isInvitationModalOpen}
                onClose={onCloseInvitation}
                onAccept={onAcceptInvitation}
                onReject={onRejectInvitation}
                isProcessing={isProcessing}
            />

            {ratingTarget && (
                <RatingModal
                    targetUserId={ratingTarget.id}
                    targetName={ratingTarget.name}
                    targetType="teacher"
                    isOpen={isRatingModalOpen}
                    onClose={onCloseRating}
                    onSuccess={onRatingSuccess}
                />
            )}
        </div>
    );
}
