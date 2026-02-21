import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { X, Star } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/axios';

interface RatingModalProps {
    targetUserId: string;
    targetName: string;
    targetType: 'teacher' | 'student';
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RatingModal({
    targetUserId,
    targetName,
    targetType,
    isOpen,
    onClose,
    onSuccess
}: RatingModalProps) {
    const [score, setScore] = useState(0);
    const [hoverScore, setHoverScore] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

    const submitRatingMutation = useMutation({
        mutationFn: async (data: { to_user_id: string; score: number; comment: string }) => {
            return api.post('/api/ratings', data);
        },
        onSuccess: () => {
            // Reset form
            setScore(0);
            setComment('');
            setError('');
            onSuccess();
            onClose();
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to submit rating. Please try again.');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (score < 1 || score > 10) {
            setError('Please select a rating between 1 and 10');
            return;
        }

        submitRatingMutation.mutate({
            to_user_id: targetUserId,
            score,
            comment: comment.trim()
        });
    };

    const handleClose = () => {
        if (!submitRatingMutation.isPending) {
            setScore(0);
            setComment('');
            setError('');
            onClose();
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <Dialog.Title className="text-xl font-bold text-gray-900">
                                            Rate {targetType === 'teacher' ? 'Teacher' : 'Student'}
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Share your experience with {targetName}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="text-gray-400 hover:text-gray-500 transition-colors"
                                        disabled={submitRatingMutation.isPending}
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Star Rating */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Rating (1-10)
                                        </label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setScore(value)}
                                                    onMouseEnter={() => setHoverScore(value)}
                                                    onMouseLeave={() => setHoverScore(0)}
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                    disabled={submitRatingMutation.isPending}
                                                >
                                                    <Star
                                                        className={`h-8 w-8 ${(hoverScore || score) >= value
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-gray-300'
                                                            } transition-colors`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        {score > 0 && (
                                            <p className="text-sm text-gray-600 mt-2">
                                                You rated: <span className="font-semibold text-indigo-600">{score}/10</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                                            Comment (Optional)
                                        </label>
                                        <textarea
                                            id="comment"
                                            rows={4}
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder={`Share your thoughts about ${targetName}...`}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            disabled={submitRatingMutation.isPending}
                                        />
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="rounded-lg bg-red-50 p-3">
                                            <p className="text-sm text-red-800">{error}</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            disabled={submitRatingMutation.isPending}
                                            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={score < 1 || submitRatingMutation.isPending}
                                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {submitRatingMutation.isPending ? 'Submitting...' : 'Submit Rating'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
