import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Building2, MapPin, Star, Users, CheckCircle, BookOpen, Globe, Phone, Mail, ExternalLink, MessageSquare, GraduationCap } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useState } from 'react';

interface School {
    id: string;
    admin_user_id: string;
    name: string;
    description?: string;
    city?: string;
    is_verified: boolean;
    rating_avg: number;
    rating_count: number;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    logo_url?: string;
    teachers?: Teacher[];
    courses?: Course[];
}

interface Teacher {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    rating_avg: number;
    rating_count: number;
}

interface Course {
    id: string;
    title: string;
    description?: string;
    language?: string;
    price: number;
    teacher_name?: string;
    cover_image_url?: string;
}

interface Rating {
    id: string;
    from_user_id: string;
    score: number;
    comment: string;
    reviewer_name: string;
    created_at: string;
}

export default function SchoolDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [langFilter, setLangFilter] = useState('');
    const [activeTab, setActiveTab] = useState<'courses' | 'teachers' | 'reviews'>('courses');

    const { data: school, isLoading } = useQuery<School>({
        queryKey: ['school', id],
        queryFn: () => api.get(`/api/schools/${id}`).then(r => r.data),
        enabled: !!id,
    });

    const { data: ratings = [] } = useQuery<Rating[]>({
        queryKey: ['school-ratings', id],
        queryFn: () => api.get(`/api/schools/${id}/ratings`).then(r => r.data),
        enabled: !!id,
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500 italic">Loading...</div>;
    if (!school) return <div className="p-8 text-center text-red-500 font-medium">School not found</div>;

    const isAdmin = user?.id === school.admin_user_id;

    // Extract unique languages from courses
    const languages = [...new Set((school.courses || []).map(c => c.language).filter(Boolean))];
    const filteredCourses = langFilter
        ? (school.courses || []).filter(c => c.language === langFilter)
        : (school.courses || []);

    const timeAgo = (d: string) => {
        const diff = Date.now() - new Date(d).getTime();
        const days = Math.floor(diff / 86400000);
        if (days < 1) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 30) return `${days} days ago`;
        if (days < 365) return `${Math.floor(days / 30)} months ago`;
        return `${Math.floor(days / 365)} years ago`;
    };

    const renderStars = (score: number) => {
        return Array.from({ length: 10 }, (_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < score ? 'text-amber-400' : 'text-gray-200'}`} fill={i < score ? '#fbbf24' : 'none'} />
        ));
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl overflow-hidden mb-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-40" />
                <div className="relative px-8 py-10">
                    <div className="flex items-start gap-5">
                        {school.logo_url ? (
                            <img src={school.logo_url} alt="" className="h-20 w-20 rounded-2xl object-cover border-2 border-white/30 shadow-xl flex-shrink-0" />
                        ) : (
                            <div className="h-20 w-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-10 w-10 text-white/80" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold text-white">{school.name}</h1>
                                {school.is_verified && (
                                    <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                                        <CheckCircle className="h-3.5 w-3.5" /> Verified
                                    </span>
                                )}
                            </div>
                            {school.city && (
                                <div className="flex items-center gap-1 text-blue-200 text-sm mt-2">
                                    <MapPin className="h-4 w-4" /> {school.city}
                                    {school.address && <span className="text-blue-300"> · {school.address}</span>}
                                </div>
                            )}
                            {school.description && (
                                <p className="text-blue-100 text-sm mt-3 leading-relaxed max-w-2xl">{school.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 mt-6 pt-6 border-t border-white/15">
                        <div>
                            <div className="text-xs text-blue-300 uppercase tracking-wide">Rating</div>
                            <div className="flex items-center gap-2 mt-1">
                                <Star className="h-5 w-5 text-amber-300" fill="#fcd34d" />
                                <span className="text-xl font-bold text-white">{school.rating_avg?.toFixed(1) || '—'}</span>
                                <span className="text-sm text-blue-300">({school.rating_count} reviews)</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-blue-300 uppercase tracking-wide">Teachers</div>
                            <div className="flex items-center gap-2 mt-1">
                                <Users className="h-5 w-5 text-blue-300" />
                                <span className="text-xl font-bold text-white">{school.teachers?.length || 0}</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-blue-300 uppercase tracking-wide">Courses</div>
                            <div className="flex items-center gap-2 mt-1">
                                <GraduationCap className="h-5 w-5 text-blue-300" />
                                <span className="text-xl font-bold text-white">{school.courses?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Cards */}
            {(school.phone || school.email || school.website) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {school.phone && (
                        <a href={`tel:${school.phone}`} className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Phone className="h-5 w-5 text-blue-600" />
                            </div>
                            <div><div className="text-xs text-gray-500">Phone</div><div className="text-sm font-medium text-gray-900">{school.phone}</div></div>
                        </a>
                    )}
                    {school.email && (
                        <a href={`mailto:${school.email}`} className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div><div className="text-xs text-gray-500">Email</div><div className="text-sm font-medium text-gray-900 truncate">{school.email}</div></div>
                        </a>
                    )}
                    {school.website && (
                        <a href={school.website.startsWith('http') ? school.website : `https://${school.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Globe className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div><div className="text-xs text-gray-500">Website</div><div className="text-sm font-medium text-gray-900 flex items-center gap-1 truncate">{school.website.replace(/^https?:\/\//, '')}<ExternalLink className="h-3 w-3 text-gray-400" /></div></div>
                        </a>
                    )}
                </div>
            )}

            {/* Admin Edit */}
            {isAdmin && (
                <div className="mb-6">
                    <Link to="/schools/setup" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        Edit School Info
                    </Link>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
                {(['courses', 'teachers', 'reviews'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        {tab === 'courses' && <BookOpen className="inline h-4 w-4 mr-1.5" />}
                        {tab === 'teachers' && <Users className="inline h-4 w-4 mr-1.5" />}
                        {tab === 'reviews' && <MessageSquare className="inline h-4 w-4 mr-1.5" />}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        <span className="ml-1.5 text-xs text-gray-400">
                            {tab === 'courses' && (school.courses?.length || 0)}
                            {tab === 'teachers' && (school.teachers?.length || 0)}
                            {tab === 'reviews' && ratings.length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Courses Tab */}
            {activeTab === 'courses' && (
                <div>
                    {/* Language Filter */}
                    {languages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            <button
                                onClick={() => setLangFilter('')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${!langFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >All</button>
                            {languages.map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setLangFilter(lang!)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${langFilter === lang ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >{lang}</button>
                            ))}
                        </div>
                    )}

                    {filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredCourses.map(c => (
                                <Link key={c.id} to={`/courses?view=${c.id}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all group">
                                    {c.cover_image_url && (
                                        <img src={c.cover_image_url} alt="" className="w-full h-32 object-cover" />
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{c.title}</h3>
                                        {c.description && <p className="text-sm text-gray-500 line-clamp-2 mt-1">{c.description}</p>}
                                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                                            {c.language && (
                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">{c.language}</span>
                                            )}
                                            {c.teacher_name && (
                                                <span className="text-xs text-gray-500">{c.teacher_name}</span>
                                            )}
                                            {c.price > 0 && (
                                                <span className="ml-auto text-sm font-bold text-emerald-600">${c.price}</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <BookOpen className="mx-auto h-8 w-8 text-gray-300" />
                            <p className="mt-2 text-sm text-gray-500">No courses available</p>
                        </div>
                    )}
                </div>
            )}

            {/* Teachers Tab */}
            {activeTab === 'teachers' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {school.teachers && school.teachers.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {school.teachers.map(t => (
                                <Link key={t.id} to={`/users/${t.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                                    {t.avatar_url ? (
                                        <img src={t.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                                            {(t.name || t.email).charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900">{t.name || t.email}</div>
                                        <div className="text-xs text-gray-500">{t.email}</div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Star className="h-4 w-4 text-amber-400" fill="#fbbf24" />
                                        <span className="text-sm font-semibold text-gray-900">{t.rating_avg?.toFixed(1) || '—'}</span>
                                        <span className="text-xs text-gray-400">({t.rating_count})</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-400">
                            <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No teachers registered yet</p>
                        </div>
                    )}
                </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
                <div className="space-y-4">
                    {ratings.length > 0 ? (
                        ratings.map(r => (
                            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                                            {r.reviewer_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <Link to={`/users/${r.from_user_id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">{r.reviewer_name}</Link>
                                            <div className="text-xs text-gray-400 mt-0.5">{timeAgo(r.created_at)}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full">
                                        <Star className="h-3.5 w-3.5 text-amber-500" fill="#f59e0b" />
                                        <span className="text-sm font-bold text-amber-700">{r.score}/10</span>
                                    </div>
                                </div>
                                <div className="flex gap-0.5 mt-3">
                                    {renderStars(r.score)}
                                </div>
                                {r.comment && (
                                    <p className="mt-3 text-sm text-gray-700 leading-relaxed">{r.comment}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <MessageSquare className="mx-auto h-8 w-8 text-gray-300" />
                            <p className="mt-2 text-sm text-gray-500">No reviews yet</p>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-6 text-center">
                <Link to="/schools" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">← Back to Schools</Link>
            </div>
        </div>
    );
}
