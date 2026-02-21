import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useAuth } from '../lib/auth';
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle, Users, Save, ChevronLeft, ChevronRight } from 'lucide-react';

interface Course {
    id: string;
    title: string;
}

interface RosterStudent {
    enrollment_id: string;
    student_user_id: string;
    student_name: string;
}

interface AttendanceRecord {
    id: string;
    enrollment_id: string;
    course_id: string;
    student_user_id: string;
    student_name: string;
    date: string;
    status: string;
    note: string;
}

interface AttendanceSummary {
    course_id: string;
    course_title: string;
    total_sessions: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
    present: { label: 'Present', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200 ring-green-500', icon: CheckCircle },
    absent: { label: 'Absent', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200 ring-red-500', icon: XCircle },
    late: { label: 'Late', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200 ring-yellow-500', icon: Clock },
    excused: { label: 'Excused', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200 ring-blue-500', icon: AlertTriangle },
};

export default function Attendance() {
    const { user } = useAuth();
    const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'school_admin';

    if (isTeacherOrAdmin) {
        return <TeacherAttendanceView />;
    }
    return <StudentAttendanceView />;
}

// ─── Teacher View ───────────────────────────────────────────────────────
function TeacherAttendanceView() {
    const queryClient = useQueryClient();
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [marks, setMarks] = useState<Record<string, { status: string; note: string }>>({});
    const [saveSuccess, setSaveSuccess] = useState(false);

    const { data: courses } = useQuery<Course[]>({
        queryKey: ['courses'],
        queryFn: async () => {
            const res = await api.get('/api/courses');
            return res.data;
        },
    });

    const { data: roster, isLoading: rosterLoading } = useQuery<RosterStudent[]>({
        queryKey: ['roster', selectedCourseId],
        queryFn: async () => {
            const res = await api.get(`/api/courses/${selectedCourseId}/roster`);
            return res.data;
        },
        enabled: !!selectedCourseId,
    });

    const { data: existingRecords } = useQuery<AttendanceRecord[]>({
        queryKey: ['attendance', selectedCourseId, selectedDate],
        queryFn: async () => {
            const res = await api.get(`/api/courses/${selectedCourseId}/attendance?date=${selectedDate}`);
            return res.data;
        },
        enabled: !!selectedCourseId && !!selectedDate,
    });

    // Pre-fill marks from existing records
    const getStudentStatus = (enrollmentId: string): string => {
        if (marks[enrollmentId]) return marks[enrollmentId].status;
        const existing = existingRecords?.find(r => r.enrollment_id === enrollmentId);
        return existing?.status || 'present';
    };

    const getStudentNote = (enrollmentId: string): string => {
        if (marks[enrollmentId]) return marks[enrollmentId].note;
        const existing = existingRecords?.find(r => r.enrollment_id === enrollmentId);
        return existing?.note || '';
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            const records = roster?.map(s => ({
                enrollment_id: s.enrollment_id,
                student_user_id: s.student_user_id,
                status: getStudentStatus(s.enrollment_id),
                note: getStudentNote(s.enrollment_id),
            })) || [];
            return api.post(`/api/courses/${selectedCourseId}/attendance`, {
                date: selectedDate,
                records,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance', selectedCourseId, selectedDate] });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        },
    });

    const changeDate = (delta: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + delta);
        setSelectedDate(d.toISOString().split('T')[0]);
        setMarks({});
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <Calendar className="h-7 w-7 text-indigo-600" />
                    Mark Attendance
                </h1>
                <p className="mt-1 text-sm text-gray-500">Select a course and date, then mark attendance for each student.</p>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                        <select
                            value={selectedCourseId}
                            onChange={e => { setSelectedCourseId(e.target.value); setMarks({}); }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Select a course...</option>
                            {courses?.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <div className="flex items-center gap-2">
                            <button onClick={() => changeDate(-1)} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => { setSelectedDate(e.target.value); setMarks({}); }}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button onClick={() => changeDate(1)} className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Roster */}
            {selectedCourseId && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-gray-400" />
                            <h2 className="font-semibold text-gray-900">Student Roster</h2>
                            {roster && <span className="text-sm text-gray-500">({roster.length} students)</span>}
                        </div>
                        <button
                            onClick={() => saveMutation.mutate()}
                            disabled={!roster?.length || saveMutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            {saveMutation.isPending ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Attendance'}
                        </button>
                    </div>

                    {rosterLoading ? (
                        <div className="p-8 text-center text-gray-500 italic">Loading students...</div>
                    ) : !roster?.length ? (
                        <div className="p-8 text-center text-gray-400">
                            <Users className="mx-auto h-10 w-10 mb-2" />
                            <p className="text-sm font-medium">No enrolled students found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {roster.map((student) => {
                                const status = getStudentStatus(student.enrollment_id);
                                return (
                                    <div key={student.enrollment_id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-bold text-indigo-600">
                                                {student.student_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{student.student_name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {Object.entries(statusConfig).map(([key, config]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setMarks(prev => ({
                                                        ...prev,
                                                        [student.enrollment_id]: { status: key, note: prev[student.enrollment_id]?.note || '' }
                                                    }))}
                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${status === key
                                                        ? `${config.bgColor} ${config.color} ring-2`
                                                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <config.icon className="h-3.5 w-3.5" />
                                                    {config.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Student View ───────────────────────────────────────────────────────
function StudentAttendanceView() {
    const { data: summaries, isLoading } = useQuery<AttendanceSummary[]>({
        queryKey: ['my-attendance-summary'],
        queryFn: async () => {
            const res = await api.get('/api/my-attendance/summary');
            return res.data;
        },
    });

    const { data: records } = useQuery<AttendanceRecord[]>({
        queryKey: ['my-attendance'],
        queryFn: async () => {
            const res = await api.get('/api/my-attendance');
            return res.data;
        },
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500 italic">Loading attendance...</div>;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <Calendar className="h-7 w-7 text-indigo-600" />
                    My Attendance
                </h1>
                <p className="mt-1 text-sm text-gray-500">Track your attendance across all enrolled courses.</p>
            </div>

            {/* Summary Cards */}
            {summaries && summaries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {summaries.map(s => (
                        <div key={s.course_id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 truncate mb-4">{s.course_title}</h3>
                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-gray-600">Attendance Rate</span>
                                    <span className={`text-sm font-bold ${s.percentage >= 80 ? 'text-green-600' : s.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {s.percentage.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full transition-all ${s.percentage >= 80 ? 'bg-green-500' : s.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${Math.min(s.percentage, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="bg-green-50 rounded-lg p-2">
                                    <p className="text-lg font-bold text-green-700">{s.present}</p>
                                    <p className="text-xs text-green-600">Present</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-2">
                                    <p className="text-lg font-bold text-red-700">{s.absent}</p>
                                    <p className="text-xs text-red-600">Absent</p>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-2">
                                    <p className="text-lg font-bold text-yellow-700">{s.late}</p>
                                    <p className="text-xs text-yellow-600">Late</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-2">
                                    <p className="text-lg font-bold text-blue-700">{s.excused}</p>
                                    <p className="text-xs text-blue-600">Excused</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center mb-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No attendance data yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Your attendance will appear here once your teacher starts marking it.</p>
                </div>
            )}

            {/* Recent Records */}
            {records && records.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Recent Records</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {records.slice(0, 20).map(r => {
                            const config = statusConfig[r.status];
                            const Icon = config?.icon || CheckCircle;
                            return (
                                <div key={r.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-500 w-24 font-mono">{r.date}</span>
                                        <span className="text-sm font-medium text-gray-900">{r.course_id.slice(0, 8)}...</span>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config?.bgColor} ${config?.color}`}>
                                        <Icon className="h-3.5 w-3.5" />
                                        {config?.label || r.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
