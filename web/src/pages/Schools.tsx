import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Building2, MapPin, Star, CheckCircle, Globe, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

interface School {
    id: string;
    name: string;
    description?: string;
    city?: string;
    website?: string;
    logo_url?: string;
    email?: string;
    phone?: string;
    is_verified: boolean;
    rating_avg: number;
    rating_count: number;
}

export default function Schools() {
    const { data: schools = [], isLoading } = useQuery<School[]>({
        queryKey: ['schools'],
        queryFn: () => api.get('/api/schools').then(r => r.data),
    });

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500 italic">Loading schools...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    Educational Centers
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Browse schools and learning centers
                </p>
            </div>

            {schools.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                    <Building2 className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-3 text-gray-500">No schools registered yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {schools.map(school => (
                        <Link
                            key={school.id}
                            to={`/schools/${school.id}`}
                            className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-200"
                        >
                            {/* Header with gradient */}
                            <div className="relative h-32 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-end p-5">
                                {school.logo_url ? (
                                    <img
                                        src={school.logo_url}
                                        alt={school.name}
                                        className="absolute top-4 right-4 h-14 w-14 rounded-xl object-cover border-2 border-white/30 shadow-lg"
                                    />
                                ) : (
                                    <div className="absolute top-4 right-4 h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Building2 className="h-7 w-7 text-white/80" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-100 transition-colors line-clamp-1">
                                        {school.name}
                                    </h3>
                                    {school.city && (
                                        <div className="flex items-center gap-1 text-blue-200 text-xs mt-1">
                                            <MapPin className="h-3 w-3" />
                                            {school.city}
                                        </div>
                                    )}
                                </div>
                                {school.is_verified && (
                                    <div className="absolute top-4 left-4 flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                                        <CheckCircle className="h-3 w-3" /> Verified
                                    </div>
                                )}
                            </div>

                            {/* Body */}
                            <div className="p-5">
                                {school.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                        {school.description}
                                    </p>
                                )}

                                {/* Stats row */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-amber-400" fill="#fbbf24" />
                                        <span className="font-semibold text-gray-900">
                                            {school.rating_avg?.toFixed(1) || '—'}
                                        </span>
                                        <span className="text-gray-400 text-xs">
                                            ({school.rating_count})
                                        </span>
                                    </div>
                                </div>

                                {/* Contact info */}
                                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 text-xs text-gray-500">
                                    {school.phone && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> {school.phone}
                                        </span>
                                    )}
                                    {school.email && (
                                        <span className="flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> {school.email}
                                        </span>
                                    )}
                                    {school.website && (
                                        <span className="flex items-center gap-1">
                                            <Globe className="h-3 w-3" /> Website
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
