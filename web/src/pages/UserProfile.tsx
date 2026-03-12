import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { User, Calendar, Mail, Shield, Loader2, MessageSquare, Star } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { format } from 'date-fns';
import { useState } from 'react';
import RatingDisplay from '../components/RatingDisplay';
import RatingInput from '../components/RatingInput';

interface PublicProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar_url?: string;
    rating_avg: number;
    rating_count: number;
    created_at: string;
}

interface Review {
    id: string;
    from_user_id: string;
    to_user_id?: string;
    score: number;
    comment: string;
    created_at: string;
    reviewer_name: string;
}

// Local StarPicker removed in favor of centralized RatingInput

export default function UserProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();

    const [reviewScore, setReviewScore] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showReviewForm, setShowReviewForm] = useState(false);

    const { data: profile, isLoading, error } = useQuery<PublicProfile>({
        queryKey: ['user', id],
        queryFn: async () => {
            const res = await api.get(`/api/users/${id}`);
            return res.data;
        },
        enabled: !!id,
    });

    const { data: reviews } = useQuery<Review[]>({
        queryKey: ['user-reviews', id],
        queryFn: async () => {
            const res = await api.get(`/api/users/${id}/ratings`);
            return res.data;
        },
        enabled: !!id,
    });

    const submitReview = useMutation({
        mutationFn: async (data: { to_user_id: string; score: number; comment: string }) => {
            return api.post('/api/ratings', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-reviews', id] });
            queryClient.invalidateQueries({ queryKey: ['user', id] });
            setReviewScore(0);
            setReviewComment('');
            setSubmitError(null);
            setShowReviewForm(false);
        },
        onError: (err: any) => {
            setSubmitError(err.response?.data || 'Failed to submit review. You may need to be enrolled in a course with this user.');
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
                    <User className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">User Not Found</h2>
                    <p className="mt-2 text-gray-500">The user you are looking for does not exist or has been removed.</p>
                </div>
            </div>
        );
    }

    const isOwnProfile = currentUser?.id === profile.id;
    const isTeacher = profile.role === 'teacher';

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
            {/* Main Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header Profile Section */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32 sm:h-40"></div>
                <div className="px-6 sm:px-10 pb-8 flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 gap-6">
                    <div className="relative">
                        <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-white bg-white overflow-hidden flex items-center justify-center shadow-md">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-16 w-16 text-gray-300" />
                            )}
                        </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left pt-2 sm:pt-0 sm:pb-4">
                        <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                                <Shield className="h-3 w-3 mr-1" />
                                {profile.role.replace('_', ' ')}
                            </span>
                            <RatingDisplay rating={profile.rating_avg} count={profile.rating_count} />
                        </div>
                        {!isOwnProfile && (
                            <div className="mt-4 flex justify-center sm:justify-start gap-3">
                                <button
                                    onClick={() => navigate(`/messages?new_chat_user_id=${profile.id}&new_chat_user_name=${encodeURIComponent(profile.name)}`)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Send Message
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Section */}
                <div className="border-t border-gray-100 px-6 sm:px-10 py-8 bg-gray-50/50">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">About</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Email Address</p>
                                <p className="text-sm text-gray-500">{profile.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">Joined</p>
                                <p className="text-sm text-gray-500">
                                    {profile.created_at ? format(new Date(profile.created_at), 'MMMM d, yyyy') : 'Recently'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            {(isTeacher || (reviews && reviews.length > 0)) && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 sm:px-10 py-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Reviews</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {reviews?.length ?? 0} review{(reviews?.length ?? 0) !== 1 ? 's' : ''}
                            </p>
                        </div>
                        {!isOwnProfile && !showReviewForm && (
                            <button
                                onClick={() => setShowReviewForm(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
                            >
                                <Star className="h-4 w-4" />
                                Write a Review
                            </button>
                        )}
                    </div>

                    {/* Write Review Form */}
                    {showReviewForm && !isOwnProfile && (
                        <div className="px-6 sm:px-10 py-6 bg-amber-50/50 border-b border-amber-100">
                            <h4 className="text-sm font-bold text-gray-900 mb-3">Your Review</h4>
                            <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Rating</label>
                                <RatingInput onSelect={setReviewScore} initialRating={reviewScore} />
                            </div>
                            <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Comment</label>
                                <textarea
                                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                                    rows={3}
                                    placeholder="Share your experience..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                />
                            </div>
                            {submitError && <p className="mb-2 text-xs text-red-600 font-medium">{submitError}</p>}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => submitReview.mutate({ to_user_id: profile.id, score: reviewScore, comment: reviewComment })}
                                    disabled={reviewScore === 0 || submitReview.isPending}
                                    className="px-5 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                                >
                                    {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
                                </button>
                                <button
                                    onClick={() => { setShowReviewForm(false); setSubmitError(null); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Review List */}
                    <div className="divide-y divide-gray-100">
                        {(!reviews || reviews.length === 0) ? (
                            <div className="px-6 sm:px-10 py-12 text-center">
                                <Star className="mx-auto h-10 w-10 text-gray-200 mb-3" />
                                <p className="text-sm text-gray-500">No reviews yet. Be the first to leave a review!</p>
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.id} className="px-6 sm:px-10 py-5 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-indigo-700">
                                                {review.reviewer_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-gray-900">{review.reviewer_name}</span>
                                                <div className="flex items-center gap-2">
                                                    <RatingDisplay rating={review.score} size={14} />
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                                            )}
                                            <p className="mt-1 text-xs text-gray-400">
                                                {format(new Date(review.created_at), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
