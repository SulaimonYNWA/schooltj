import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useAuth } from '../lib/auth';
import { Megaphone, Plus, Pin, Trash2, BookOpen } from 'lucide-react';

interface Course {
    id: string;
    title: string;
}

interface Announcement {
    id: string;
    course_id: string | null;
    course_title: string;
    author_id: string;
    author_name: string;
    title: string;
    content: string;
    is_pinned: boolean;
    created_at: string;
}

export default function Announcements() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'school_admin';
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        course_id: '',
        title: '',
        content: '',
        is_pinned: false,
    });

    const { data: courses } = useQuery<Course[]>({
        queryKey: ['courses'],
        queryFn: async () => {
            const res = await api.get('/api/courses');
            return res.data;
        },
        enabled: isTeacherOrAdmin,
    });

    const { data: announcements, isLoading } = useQuery<Announcement[]>({
        queryKey: ['announcements'],
        queryFn: async () => {
            const res = await api.get('/api/announcements');
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            return api.post('/api/announcements', {
                ...formData,
                course_id: formData.course_id || undefined,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            setShowForm(false);
            setFormData({ course_id: '', title: '', content: '', is_pinned: false });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/api/announcements/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
        },
    });

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Megaphone className="h-7 w-7 text-amber-600" />
                        Announcements
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {isTeacherOrAdmin ? 'Post and manage announcements for your courses.' : 'Stay updated with announcements from your courses.'}
                    </p>
                </div>
                {isTeacherOrAdmin && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Announcement
                    </button>
                )}
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Create Announcement</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course (optional)</label>
                                <select
                                    value={formData.course_id}
                                    onChange={e => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="">General (All students)</option>
                                    {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_pinned}
                                        onChange={e => setFormData(prev => ({ ...prev, is_pinned: e.target.checked }))}
                                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <Pin className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-700">Pin announcement</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Announcement title..."
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                            <textarea
                                value={formData.content}
                                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="Write your announcement..."
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => createMutation.mutate()}
                                disabled={!formData.title || !formData.content || createMutation.isPending}
                                className="px-5 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
                            >
                                {createMutation.isPending ? 'Posting...' : 'Post Announcement'}
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Announcements Feed */}
            {isLoading ? (
                <div className="p-8 text-center text-gray-500 italic">Loading announcements...</div>
            ) : !announcements?.length ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <Megaphone className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No announcements yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {isTeacherOrAdmin ? 'Create your first announcement to keep students informed.' : 'Announcements from your courses will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map(a => (
                        <div key={a.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${a.is_pinned ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-200'}`}>
                            <div className="px-6 py-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {a.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
                                            <h3 className="font-bold text-gray-900">{a.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                            <span>{a.author_name}</span>
                                            <span>•</span>
                                            <span>{timeAgo(a.created_at)}</span>
                                            {a.course_title && (
                                                <>
                                                    <span>•</span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                                                        <BookOpen className="h-3 w-3" />
                                                        {a.course_title}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.content}</p>
                                    </div>
                                    {a.author_id === user?.id && (
                                        <button
                                            onClick={() => deleteMutation.mutate(a.id)}
                                            className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
