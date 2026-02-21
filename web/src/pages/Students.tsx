import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Mail, Search, GraduationCap, Star } from 'lucide-react';
import RatingDisplay from '../components/RatingDisplay';
import RatingModal from '../components/RatingModal';
import { useState } from 'react';
import { useAuth } from '../lib/auth';

interface Student {
    id: string;
    email: string;
    name: string;
    role: string;
    rating_avg: number;
    rating_count: number;
    created_at: string;
}

export default function Students() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'all' | 'my'>('all');
    const [ratingTarget, setRatingTarget] = useState<{ id: string; name: string } | null>(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

    const { data: students, isLoading, error } = useQuery<Student[]>({
        queryKey: ['students', search, viewMode],
        queryFn: async () => {
            if (viewMode === 'my') {
                const res = await api.get('/api/my-students');
                return res.data;
            } else {
                const params = new URLSearchParams();
                if (search) params.append('search', search);
                const res = await api.get(`/api/students?${params.toString()}`);
                return res.data;
            }
        },
    });

    const isEducator = user?.role === 'school_admin' || user?.role === 'teacher';

    const handleRateStudent = (studentId: string, studentName: string) => {
        setRatingTarget({ id: studentId, name: studentName });
        setIsRatingModalOpen(true);
    };

    const handleRatingSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['students'] });
        setIsRatingModalOpen(false);
        setRatingTarget(null);
    };

    return (
        <div>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Students</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {viewMode === 'all' ? 'Browse top rated students.' : 'Students enrolled in your courses/school.'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {isEducator && (
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('all')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                All Students
                            </button>
                            <button
                                onClick={() => setViewMode('my')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'my' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                My Students
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search students by name..."
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="p-8 text-center text-gray-500 italic">Loading students...</div>
            ) : error ? (
                <div className="p-8 text-center text-red-500 font-medium">Error loading students.</div>
            ) : !students || students.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 italic">No students found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {students.map((student) => (
                        <div
                            key={student.id}
                            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                    <GraduationCap className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{student.name || student.email.split('@')[0]}</h3>
                                    <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider">{student.role}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <RatingDisplay rating={student.rating_avg} count={student.rating_count} />
                            </div>

                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="truncate">{student.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Joined {new Date(student.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Rate Student Button for Educators */}
                            {isEducator && viewMode === 'my' && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleRateStudent(student.id, student.name || student.email.split('@')[0])}
                                        className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                    >
                                        <Star className="w-4 h-4 mr-1.5" /> Rate Student
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
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
