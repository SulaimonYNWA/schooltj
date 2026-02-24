import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Search, GraduationCap, Star, BookOpen, Users, Trophy, Medal, Award, ChevronDown, Loader2 } from 'lucide-react';
import RatingDisplay from '../components/RatingDisplay';
import RatingModal from '../components/RatingModal';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';

interface Student {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar_url?: string;
    rating_avg: number;
    rating_count: number;
    created_at: string;
}

interface Course {
    id: string;
    title: string;
}

export default function Students() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState<'all' | 'my' | 'course' | 'connections'>('all');
    const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string } | null>(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [offset, setOffset] = useState(0);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const limit = 30;

    // ── Search suggestions ──
    const [suggestionsQuery, setSuggestionsQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setOffset(0);
            setAllStudents([]);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Debounce suggestions query
    useEffect(() => {
        const timer = setTimeout(() => {
            setSuggestionsQuery(search);
        }, 200);
        return () => clearTimeout(timer);
    }, [search]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Reset offset when view mode or course changes
    useEffect(() => {
        setOffset(0);
        setAllStudents([]);
    }, [viewMode, selectedCourseId]);

    // ── Fetch courses for filter dropdown ──
    const { data: courses } = useQuery<Course[]>({
        queryKey: ['courses-filter'],
        queryFn: async () => {
            const res = await api.get('/api/courses');
            return res.data;
        },
    });

    // ── Search suggestions query ──
    const { data: suggestions } = useQuery<Student[]>({
        queryKey: ['student-suggestions', suggestionsQuery],
        queryFn: async () => {
            const res = await api.get(`/api/students/suggestions?q=${encodeURIComponent(suggestionsQuery)}`);
            return res.data;
        },
        enabled: suggestionsQuery.length >= 2,
    });

    // ── Main students query ──
    const { data: studentsPage, isLoading, error } = useQuery<Student[]>({
        queryKey: ['students', debouncedSearch, viewMode, selectedCourseId, offset],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            params.append('limit', String(limit));
            params.append('offset', String(offset));

            if (viewMode === 'course' && selectedCourseId) {
                params.append('course_id', selectedCourseId);
                const res = await api.get(`/api/students/by-course?${params.toString()}`);
                return res.data;
            } else if (viewMode === 'connections') {
                const res = await api.get(`/api/students/connections?${params.toString()}`);
                return res.data;
            } else if (viewMode === 'my') {
                const res = await api.get('/api/my-students');
                return res.data;
            } else {
                const res = await api.get(`/api/students?${params.toString()}`);
                return res.data;
            }
        },
    });

    // Accumulate students for "Load More"
    useEffect(() => {
        if (studentsPage) {
            if (offset === 0) {
                setAllStudents(studentsPage);
            } else {
                setAllStudents(prev => [...prev, ...studentsPage]);
            }
        }
    }, [studentsPage, offset]);

    const isEducator = user?.role === 'school_admin' || user?.role === 'teacher';
    const isStudent = user?.role === 'student';
    const hasMore = studentsPage && studentsPage.length === limit;

    const handleRateStudent = (studentId: string, studentName: string) => {
        setRatingTarget({ id: studentId, name: studentName });
        setIsRatingModalOpen(true);
    };

    const handleRatingSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['students'] });
        setIsRatingModalOpen(false);
        setRatingTarget(null);
    };

    const handleSuggestionClick = (student: Student) => {
        setSearch(student.name);
        setShowSuggestions(false);
    };

    const getRankBadge = (index: number) => {
        if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
        if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
        if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
        return <span className="text-xs font-bold text-gray-400 w-5 text-center">#{index + 1}</span>;
    };

    const getRankStyle = (index: number) => {
        if (index === 0) return 'ring-2 ring-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50';
        if (index === 1) return 'ring-2 ring-gray-200 bg-gradient-to-br from-gray-50 to-slate-50';
        if (index === 2) return 'ring-2 ring-amber-200 bg-gradient-to-br from-orange-50 to-amber-50';
        return 'bg-white';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <GraduationCap className="h-7 w-7 text-indigo-600" />
                            Students
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {viewMode === 'all' && 'Browse all students, sorted by rating.'}
                            {viewMode === 'my' && 'Students enrolled in your courses or school.'}
                            {viewMode === 'course' && 'Students in the selected course.'}
                            {viewMode === 'connections' && 'Students who share courses with you.'}
                        </p>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            All Students
                        </button>
                        {isEducator && (
                            <button
                                onClick={() => setViewMode('my')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'my' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                My Students
                            </button>
                        )}
                        <button
                            onClick={() => setViewMode('course')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${viewMode === 'course' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <BookOpen className="h-3.5 w-3.5" />
                            By Course
                        </button>
                        {isStudent && (
                            <button
                                onClick={() => setViewMode('connections')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${viewMode === 'connections' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Users className="h-3.5 w-3.5" />
                                Connections
                            </button>
                        )}
                    </div>

                    {/* Course dropdown — only shown with 'course' filter */}
                    {viewMode === 'course' && (
                        <div className="relative">
                            <select
                                value={selectedCourseId || ''}
                                onChange={(e) => setSelectedCourseId(e.target.value || null)}
                                className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-1.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                            >
                                <option value="">Select a course...</option>
                                {courses?.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>

            {/* Search bar with suggestions */}
            <div className="mb-6 relative" ref={suggestionsRef}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search students by name..."
                    className="pl-10 block w-full rounded-xl border border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 bg-white transition-shadow focus:shadow-md"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => { if (search.length >= 2) setShowSuggestions(true); }}
                />

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions && suggestions.length > 0 && search.length >= 2 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                        {suggestions.map(s => (
                            <button
                                key={s.id}
                                onClick={() => handleSuggestionClick(s)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="h-8 w-8 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                    {s.avatar_url ? (
                                        <img
                                            src={s.avatar_url}
                                            alt={s.name || ''}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement?.querySelector('svg')?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <GraduationCap className={`h-4 w-4 text-indigo-600 ${s.avatar_url ? 'hidden' : ''}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">{s.name || s.email.split('@')[0]}</p>
                                    <p className="text-xs text-gray-500 truncate">{s.email}</p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                                    <span className="text-xs font-semibold text-gray-600">{s.rating_avg?.toFixed(1) || '0.0'}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            {isLoading && offset === 0 ? (
                <div className="p-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 text-indigo-500 animate-spin" />
                    <p className="mt-3 text-sm text-gray-500">Loading students...</p>
                </div>
            ) : error ? (
                <div className="p-8 text-center text-red-500 font-medium">Error loading students. Please try again.</div>
            ) : viewMode === 'course' && !selectedCourseId ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">Select a course</h3>
                    <p className="mt-1 text-sm text-gray-500">Choose a course from the dropdown to see enrolled students.</p>
                </div>
            ) : !allStudents || allStudents.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 italic">No students found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {search ? 'Try adjusting your search terms.' : 'No students match the current filter.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {allStudents.map((student, index) => (
                            <div
                                key={student.id}
                                className={`rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all ${getRankStyle(index)}`}
                            >
                                {/* Top section: rank + avatar + info */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="relative">
                                        <div className={`h-14 w-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${index < 3 ? 'bg-gradient-to-br from-indigo-100 to-purple-100' : 'bg-indigo-50'}`}>
                                            {student.avatar_url ? (
                                                <img
                                                    src={student.avatar_url}
                                                    alt={student.name || ''}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).parentElement?.querySelector('svg')?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : null}
                                            <GraduationCap className={`h-7 w-7 ${student.avatar_url ? 'hidden' : ''} ${index < 3 ? 'text-indigo-700' : 'text-indigo-500'}`} />
                                        </div>
                                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                                            {getRankBadge(index)}
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-gray-900 truncate text-lg">
                                            {student.name || student.email.split('@')[0]}
                                        </h3>
                                        <p className="text-xs text-gray-500 truncate">{student.email}</p>
                                    </div>
                                </div>

                                {/* Rating display */}
                                <div className="mb-4 bg-gray-50 rounded-lg p-3">
                                    <RatingDisplay rating={student.rating_avg} count={student.rating_count} size={14} />
                                </div>

                                {/* Meta info */}
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>Joined {new Date(student.created_at).toLocaleDateString()}</span>
                                    {index < 3 && (
                                        <span className={`font-bold uppercase tracking-wider ${index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-500' : 'text-amber-600'}`}>
                                            {index === 0 ? '🥇 Gold' : index === 1 ? '🥈 Silver' : '🥉 Bronze'}
                                        </span>
                                    )}
                                </div>

                                {/* Rate button for educators */}
                                {isEducator && viewMode === 'my' && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => handleRateStudent(student.id, student.name || student.email.split('@')[0])}
                                            className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                        >
                                            <Star className="w-4 h-4 mr-1.5" /> Rate Student
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Load More */}
                    {hasMore && viewMode !== 'my' && (
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setOffset(prev => prev + limit)}
                                disabled={isLoading}
                                className="inline-flex items-center px-6 py-2.5 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    'Load More Students'
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Rating Modal */}
            {ratingTarget && (
                <RatingModal
                    targetUserId={ratingTarget.id}
                    targetName={ratingTarget.name}
                    targetType="student"
                    isOpen={isRatingModalOpen}
                    onClose={() => {
                        setIsRatingModalOpen(false);
                        setRatingTarget(null);
                    }}
                    onSuccess={handleRatingSuccess}
                />
            )}
        </div>
    );
}
