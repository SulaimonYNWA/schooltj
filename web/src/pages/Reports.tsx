import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { api } from '../lib/axios';
import {
    AreaChart, Area, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    Users, DollarSign, BookOpen, TrendingUp, GraduationCap,
    Download, BarChart3, CalendarRange
} from 'lucide-react';

interface Stats {
    total_students: number;
    total_teachers: number;
    total_courses: number;
    total_revenue: number;
    active_enrolments: number;
    avg_attendance: number;
    recent_payments: number;
    pending_requests: number;
}

interface MonthlyPoint {
    month: string;
    value: number;
}

interface CourseBreakdownItem {
    course_title: string;
    enrollments: number;
    revenue: number;
}

const CHART_COLORS = {
    blue: '#6366f1',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e',
    violet: '#8b5cf6',
};

function StatCard({ label, value, icon: Icon, color, subtext }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    subtext?: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
            <div className={`p-3 rounded-xl`} style={{ background: `${color}18` }}>
                <Icon className="h-6 w-6" style={{ color }} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-6">{title}</h3>
            {children}
        </div>
    );
}

const shortMonth = (m: string) => {
    const [year, month] = m.split('-');
    return new Date(+year, +month - 1).toLocaleString('default', { month: 'short' });
};

export default function Reports() {
    const { user } = useAuth();
    const isTeacherOrAdmin = user?.role === 'school_admin' || user?.role === 'teacher' || user?.role === 'admin';

    const { data: stats } = useQuery<Stats>({
        queryKey: ['dashboard-stats'],
        queryFn: () => api.get('/api/dashboard/stats').then(r => r.data),
        enabled: isTeacherOrAdmin,
    });

    const { data: enrollmentTrend } = useQuery<MonthlyPoint[]>({
        queryKey: ['enrollment-trend'],
        queryFn: () => api.get('/api/analytics/enrollment-trend').then(r => r.data),
        enabled: isTeacherOrAdmin,
    });

    const { data: revenueTrend } = useQuery<MonthlyPoint[]>({
        queryKey: ['revenue-trend'],
        queryFn: () => api.get('/api/analytics/revenue-trend').then(r => r.data),
        enabled: isTeacherOrAdmin,
    });

    const { data: attendanceTrend } = useQuery<MonthlyPoint[]>({
        queryKey: ['attendance-trend'],
        queryFn: () => api.get('/api/analytics/attendance-trend').then(r => r.data),
        enabled: isTeacherOrAdmin,
    });

    const { data: courseBreakdown } = useQuery<CourseBreakdownItem[]>({
        queryKey: ['course-breakdown'],
        queryFn: () => api.get('/api/analytics/course-breakdown').then(r => r.data),
        enabled: isTeacherOrAdmin,
    });

    const handleExport = () => {
        window.open('/api/analytics/export', '_blank');
    };

    const enrollmentData = enrollmentTrend?.map(p => ({ name: shortMonth(p.month), value: p.value })) ?? [];
    const revenueData = revenueTrend?.map(p => ({ name: shortMonth(p.month), value: p.value })) ?? [];
    const attendanceData = attendanceTrend?.map(p => ({ name: shortMonth(p.month), value: p.value })) ?? [];
    const breakdownData = courseBreakdown?.map(c => ({
        name: c.course_title.length > 20 ? c.course_title.slice(0, 18) + '…' : c.course_title,
        enrollments: c.enrollments,
        revenue: c.revenue,
    })) ?? [];

    if (!isTeacherOrAdmin) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h2 className="text-lg font-semibold text-gray-700">Analytics are available for teachers and school admins.</h2>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
                    <p className="mt-1 text-sm text-gray-500">School performance overview for the last 12 months</p>
                </div>
                <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </button>
            </div>

            {/* Summary Stats */}
            <section className="mb-10">
                <SectionHeader title="Overview" subtitle="Current platform-wide statistics" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Students"
                        value={stats?.total_students ?? 0}
                        icon={Users}
                        color={CHART_COLORS.blue}
                    />
                    <StatCard
                        label="Total Teachers"
                        value={stats?.total_teachers ?? 0}
                        icon={GraduationCap}
                        color={CHART_COLORS.violet}
                    />
                    <StatCard
                        label="Active Courses"
                        value={stats?.total_courses ?? 0}
                        icon={BookOpen}
                        color={CHART_COLORS.emerald}
                    />
                    <StatCard
                        label="Total Revenue"
                        value={`TJS ${(stats?.total_revenue ?? 0).toLocaleString()}`}
                        icon={DollarSign}
                        color={CHART_COLORS.amber}
                        subtext="All-time payments"
                    />
                    <StatCard
                        label="Active Enrollments"
                        value={stats?.active_enrolments ?? 0}
                        icon={TrendingUp}
                        color={CHART_COLORS.rose}
                    />
                    <StatCard
                        label="Avg Attendance"
                        value={`${stats?.avg_attendance ?? 0}%`}
                        icon={CalendarRange}
                        color={CHART_COLORS.blue}
                    />
                    <StatCard
                        label="Recent Payments"
                        value={stats?.recent_payments ?? 0}
                        icon={DollarSign}
                        color={CHART_COLORS.emerald}
                        subtext="Last 30 days"
                    />
                    <StatCard
                        label="Pending Requests"
                        value={stats?.pending_requests ?? 0}
                        icon={Users}
                        color={CHART_COLORS.amber}
                        subtext="Awaiting approval"
                    />
                </div>
            </section>

            {/* Trend Charts */}
            <section className="mb-10">
                <SectionHeader title="Trends" subtitle="Month-by-month analytics for the past 12 months" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    <ChartCard title="Enrollment Trend">
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={enrollmentData} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => [String(v), 'Enrollments']} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={CHART_COLORS.blue}
                                    strokeWidth={2.5}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Revenue Trend (TJS)">
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={revenueData} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.emerald} stopOpacity={0.18} />
                                        <stop offset="95%" stopColor={CHART_COLORS.emerald} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => [`TJS ${Number(v).toLocaleString()}`, 'Revenue']} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={CHART_COLORS.emerald}
                                    strokeWidth={2.5}
                                    fill="url(#revenueGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard title="Attendance Rate (%)">
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={attendanceData} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={CHART_COLORS.amber} stopOpacity={0.18} />
                                        <stop offset="95%" stopColor={CHART_COLORS.amber} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(v) => [`${v}%`, 'Attendance']} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={CHART_COLORS.amber}
                                    strokeWidth={2.5}
                                    fill="url(#attendGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Placeholder for future chart */}
                    <ChartCard title="Enrollment vs Revenue by Course">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={breakdownData.slice(0, 6)} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="enrollments" fill={CHART_COLORS.blue} name="Enrollments" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="right" dataKey="revenue" fill={CHART_COLORS.emerald} name="Revenue (TJS)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </section>

            {/* Course Breakdown Table */}
            <section>
                <SectionHeader title="Course Breakdown" subtitle="Top courses by enrollment and revenue" />
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Students</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue (TJS)</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Popularity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {courseBreakdown?.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">No course data yet</td>
                                </tr>
                            )}
                            {courseBreakdown?.map((c, i) => {
                                const maxEnroll = Math.max(...(courseBreakdown.map(x => x.enrollments)), 1);
                                const pct = Math.round((c.enrollments / maxEnroll) * 100);
                                return (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.course_title}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 text-right tabular-nums">{c.enrollments}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 text-right tabular-nums">{c.revenue.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 justify-end">
                                                <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
