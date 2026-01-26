import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { User, Mail, Calendar, UserPlus, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import RatingDisplay from '../components/RatingDisplay';
import RatingInput from '../components/RatingInput';
import { useState } from 'react';

interface Teacher {
    id: string;
    email: string;
    name: string;
    role: string;
    rating_avg: number;
    rating_count: number;
    created_at: string;
}

export default function Teachers() {
    const queryClient = useQueryClient();
    const [ratingTarget, setRatingTarget] = useState<string | null>(null);
    const [ratingScore, setRatingScore] = useState<number>(0);
    const [ratingComment, setRatingComment] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);

    const { data: teachers, isLoading, error } = useQuery<Teacher[]>({
        queryKey: ['teachers'],
        queryFn: async () => {
            const res = await api.get('/api/schools/teachers');
            return res.data;
        },
    });

    const submitRatingMutation = useMutation({
        mutationFn: async (data: { to_user_id: string, score: number, comment: string }) => {
            return api.post('/api/ratings', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
            setRatingTarget(null);
            setRatingScore(0);
            setRatingComment('');
            setSubmitError(null);
        },
        onError: (err: any) => {
            setSubmitError(err.response?.data || 'Failed to submit rating. You must collaborate in a course with this teacher.');
        }
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500 italic">Loading staff directory...</div>;
    if (error) return <div className="p-8 text-center text-red-500 font-medium">Error loading teachers. You might not have permission.</div>;

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Teachers</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your school faculty and staff records.</p>
                </div>
                <Link
                    to="/add-teacher"
                    className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                    <UserPlus className="h-4 w-4" />
                    Add Teacher
                </Link>
            </div>

            {!teachers || teachers.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <User className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 italic">No teachers found</h3>
                    <p className="mt-1 text-sm text-gray-500">Add your first teacher to start managing courses.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {teachers.map((teacher) => (
                        <div
                            key={teacher.id}
                            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                    <User className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{teacher.name || teacher.email.split('@')[0]}</h3>
                                    <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider">{teacher.role}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <RatingDisplay rating={teacher.rating_avg} count={teacher.rating_count} />
                            </div>

                            <div className="space-y-3 text-sm text-gray-600 mb-6">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="truncate">{teacher.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    Joined {new Date(teacher.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            {ratingTarget === teacher.id ? (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-bold mb-2">Submit Rating</h4>
                                    <RatingInput onSelect={setRatingScore} />
                                    <textarea
                                        className="mt-2 w-full text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        rows={2}
                                        placeholder="Add a comment (optional)"
                                        value={ratingComment}
                                        onChange={(e) => setRatingComment(e.target.value)}
                                    />
                                    {submitError && <p className="mt-1 text-xs text-red-500">{submitError}</p>}
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => submitRatingMutation.mutate({ to_user_id: teacher.id, score: ratingScore, comment: ratingComment })}
                                            disabled={ratingScore === 0 || submitRatingMutation.isPending}
                                            className="flex-1 bg-indigo-600 text-white py-1.5 px-3 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {submitRatingMutation.isPending ? 'Submitting...' : 'Submit'}
                                        </button>
                                        <button
                                            onClick={() => { setRatingTarget(null); setSubmitError(null); }}
                                            className="px-3 py-1.5 rounded text-sm font-medium border border-gray-300 hover:bg-white"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setRatingTarget(teacher.id)}
                                    className="flex items-center justify-center gap-2 w-full text-center py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <Star className="h-4 w-4" />
                                    Rate Teacher
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
