import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { User, Calendar, Mail, Shield, Loader2, MessageSquare } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { format } from 'date-fns';

interface PublicProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar_url?: string;
    created_at: string;
}

export default function UserProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const { data: profile, isLoading, error } = useQuery<PublicProfile>({
        queryKey: ['user', id],
        queryFn: async () => {
            const res = await api.get(`/api/users/${id}`);
            return res.data;
        },
        enabled: !!id,
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

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
                        </div>
                        {currentUser?.id !== profile.id && (
                            <div className="mt-4 flex justify-center sm:justify-start">
                                <button
                                    onClick={() => navigate(`/messages?new_chat_user_id=${profile.id}&new_chat_user_name=${encodeURIComponent(profile.name)}`)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors cursor-pointer"
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
        </div>
    );
}
