import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { api } from '../lib/axios';
import { BookOpen, Clock, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Schedule {
    days?: string[];
    start_time?: string;
    end_time?: string;
}

interface CourseSlot {
    id: string;
    title: string;
    teacher_name?: string;
    school_name?: string;
    schedule: Schedule | null;
}

interface EnrollmentWithCourse {
    enrollment: { id: string; status: string };
    course: CourseSlot;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7:00 – 19:00

const PALETTE = [
    { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
    { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
    { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
    { bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
];

function timeToRow(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h - 7) * 2 + (m >= 30 ? 1 : 0);
}

function timeSpan(start: string, end: string): number {
    return Math.max(timeToRow(end) - timeToRow(start), 1);
}

export default function Timetable() {
    const { user } = useAuth();
    const isStudent = user?.role === 'student';

    const { data: studentEnrollments } = useQuery<EnrollmentWithCourse[]>({
        queryKey: ['my-enrollments'],
        queryFn: async () => (await api.get('/api/my-enrollments')).data,
        enabled: isStudent,
    });

    const { data: teacherCourses } = useQuery<CourseSlot[]>({
        queryKey: ['courses'],
        queryFn: async () => (await api.get('/api/courses')).data,
        enabled: !isStudent,
    });

    // Normalize courses
    const courses: CourseSlot[] = isStudent
        ? (studentEnrollments?.filter(e => e.enrollment.status === 'active').map(e => e.course) || [])
        : (teacherCourses || []);

    // Build a grid: day -> list of positioned blocks
    type SlotInfo = { course: CourseSlot; startRow: number; span: number; colorIdx: number; column: number; totalColumns: number };
    const grid: Record<string, SlotInfo[]> = {};
    DAYS.forEach(d => (grid[d] = []));

    courses.forEach((course, idx) => {
        if (!course.schedule?.days || !course.schedule.start_time || !course.schedule.end_time) return;
        const colorIdx = idx % PALETTE.length;
        course.schedule.days.forEach(day => {
            const normalDay = day.substring(0, 3);
            if (grid[normalDay]) {
                grid[normalDay].push({
                    course,
                    startRow: timeToRow(course.schedule!.start_time!),
                    span: timeSpan(course.schedule!.start_time!, course.schedule!.end_time!),
                    colorIdx,
                    column: 0,
                    totalColumns: 1,
                });
            }
        });
    });

    // Detect overlaps and assign sub-columns within each day
    DAYS.forEach(day => {
        const slots = grid[day];
        if (slots.length < 2) return;

        // Sort by start row, then by span (longer first)
        slots.sort((a, b) => a.startRow - b.startRow || b.span - a.span);

        // Find overlap groups: slots that share time ranges
        const overlapsWith = (a: SlotInfo, b: SlotInfo) =>
            a.startRow < b.startRow + b.span && b.startRow < a.startRow + a.span;

        // Greedy column assignment
        for (let i = 0; i < slots.length; i++) {
            const usedCols = new Set<number>();
            for (let j = 0; j < i; j++) {
                if (overlapsWith(slots[i], slots[j])) {
                    usedCols.add(slots[j].column);
                }
            }
            let col = 0;
            while (usedCols.has(col)) col++;
            slots[i].column = col;
        }

        // Compute totalColumns for each overlap cluster
        for (let i = 0; i < slots.length; i++) {
            let maxCol = slots[i].column;
            for (let j = 0; j < slots.length; j++) {
                if (i !== j && overlapsWith(slots[i], slots[j])) {
                    maxCol = Math.max(maxCol, slots[j].column);
                }
            }
            slots[i].totalColumns = maxCol + 1;
        }
    });

    const totalRows = HOURS.length * 2; // 30-min slots

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Clock className="h-6 w-6 text-indigo-500" />
                        Timetable
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Your weekly class schedule
                    </p>
                </div>
                <button
                    onClick={async () => {
                        try {
                            const res = await api.get('/api/calendar/ical', { responseType: 'blob' });
                            const blob = new Blob([res.data], { type: 'text/calendar' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'schooltj_schedule.ics';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        } catch (err) {
                            console.error('Failed to export calendar:', err);
                        }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                    title="Download as .ics for Google Calendar, Apple Calendar, etc."
                >
                    <Download className="h-4 w-4" />
                    Export to Calendar
                </button>
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-3 text-gray-500">No scheduled courses to display.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Grid */}
                    <div className="grid" style={{ gridTemplateColumns: '64px repeat(6, 1fr)' }}>
                        {/* Header row */}
                        <div className="bg-gray-50 border-b border-r border-gray-200 p-2" />
                        {DAYS.map(day => (
                            <div key={day} className="bg-gray-50 border-b border-r border-gray-200 px-3 py-2.5 text-center">
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{day}</span>
                            </div>
                        ))}

                        {/* Time rows */}
                        {HOURS.map(hour => (
                            <div key={hour} className="contents">
                                {/* Time label */}
                                <div className="border-r border-gray-100 px-2 py-1 text-right" style={{ gridRow: `span 2` }}>
                                    <span className="text-xs text-gray-400 font-mono">{String(hour).padStart(2, '0')}:00</span>
                                </div>

                                {/* Day cells (two 30-min slots per hour) */}
                                {DAYS.map(day => (
                                    <div key={`${day}-${hour}-0`} className="border-r border-b border-gray-50 relative" style={{ minHeight: '24px' }} />
                                ))}
                                {DAYS.map(day => (
                                    <div key={`${day}-${hour}-1`} className="border-r border-dotted border-gray-50 relative" style={{ minHeight: '24px' }} />
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Overlay positioned course blocks */}
                    <div className="relative" style={{ marginTop: `-${totalRows * 24 + 40}px`, height: `${totalRows * 24 + 40}px` }}>
                        <div className="grid" style={{ gridTemplateColumns: '64px repeat(6, 1fr)', height: '100%' }}>
                            <div />
                            {DAYS.map((day) => (
                                <div key={day} className="relative">
                                    {grid[day].map((slot, i) => {
                                        const colors = PALETTE[slot.colorIdx];
                                        const colWidth = 100 / slot.totalColumns;
                                        const leftPct = slot.column * colWidth;
                                        return (
                                            <div
                                                key={`${slot.course.id}-${i}`}
                                                className={`absolute rounded-lg border px-2 py-1 overflow-hidden ${colors.bg} hover:shadow-md transition-shadow cursor-default`}
                                                style={{
                                                    top: `${40 + slot.startRow * 24}px`,
                                                    height: `${slot.span * 24 - 2}px`,
                                                    left: `calc(${leftPct}% + 2px)`,
                                                    width: `calc(${colWidth}% - 4px)`,
                                                    zIndex: 10,
                                                }}
                                                title={`${slot.course.title}\n${slot.course.schedule?.start_time} – ${slot.course.schedule?.end_time}`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${colors.dot} flex-shrink-0`} />
                                                    <p className={`text-xs font-semibold truncate ${colors.text}`}>
                                                        <Link to={`/courses/${slot.course.id}`} className="hover:underline">
                                                            {slot.course.title}
                                                        </Link>
                                                    </p>
                                                </div>
                                                {slot.span >= 2 && (
                                                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                                                        {slot.course.schedule?.start_time} – {slot.course.schedule?.end_time}
                                                    </p>
                                                )}
                                                {slot.span >= 3 && slot.course.teacher_name && (
                                                    <p className="text-[10px] text-gray-400 truncate">
                                                        {slot.course.teacher_name}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Course Legend */}
            {courses.length > 0 && (
                <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Courses</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {courses.filter(c => c.schedule?.days?.length).map((course, idx) => {
                            const colors = PALETTE[idx % PALETTE.length];
                            return (
                                <div key={course.id} className="flex items-center gap-2">
                                    <div className={`h-3 w-3 rounded ${colors.dot}`} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            <Link to={`/courses/${course.id}`} className="hover:text-indigo-600 hover:underline">
                                                {course.title}
                                            </Link>
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {course.schedule?.days?.join(', ')} · {course.schedule?.start_time}–{course.schedule?.end_time}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
