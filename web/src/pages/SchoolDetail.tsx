import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Building2, MapPin, Star, Users, CheckCircle, BookOpen } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

interface School {
    id: string;
    name: string;
    city?: string;
    is_verified: boolean;
    rating_avg: number;
    rating_count: number;
    phone?: string;
    address?: string;
    teachers?: { id: string; name: string; email: string; rating_avg: number; rating_count: number }[];
}

export default function SchoolDetail() {
    const { id } = useParams<{ id: string }>();

    const { data: school, isLoading } = useQuery<School>({
        queryKey: ['school', id],
        queryFn: () => api.get(`/api/schools/${id}`).then(r => r.data),
        enabled: !!id,
    });

    if (isLoading) return <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>;
    if (!school) return <div style={{ padding: '32px', textAlign: 'center', color: '#dc2626' }}>School not found</div>;

    return (
        <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* School Header */}
            <div style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', borderRadius: '16px', padding: '32px', color: 'white', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={28} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{school.name}</h1>
                        {school.city && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', opacity: 0.9, fontSize: '14px' }}>
                                <MapPin size={14} /> {school.city}
                            </div>
                        )}
                    </div>
                    {school.is_verified && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '13px' }}>
                            <CheckCircle size={14} /> Verified
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '32px' }}>
                    <div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Rating</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <Star size={18} fill="white" />
                            <span style={{ fontSize: '20px', fontWeight: 700 }}>{school.rating_avg?.toFixed(1) || '—'}</span>
                            <span style={{ fontSize: '13px', opacity: 0.8 }}>({school.rating_count} reviews)</span>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Teachers</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <Users size={18} />
                            <span style={{ fontSize: '20px', fontWeight: 700 }}>{school.teachers?.length || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            {(school.phone || school.address) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {school.phone && (
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Phone</div>
                            <div style={{ fontSize: '14px', fontWeight: 500 }}>{school.phone}</div>
                        </div>
                    )}
                    {school.address && (
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Address</div>
                            <div style={{ fontSize: '14px', fontWeight: 500 }}>{school.address}</div>
                        </div>
                    )}
                </div>
            )}

            {/* Teachers Section */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} style={{ color: '#3b82f6' }} />
                    <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Teachers</h2>
                </div>
                {school.teachers && school.teachers.length > 0 ? (
                    <div style={{ display: 'grid', gap: '1px', background: '#f3f4f6' }}>
                        {school.teachers.map(t => (
                            <div key={t.id} style={{ padding: '16px 20px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontWeight: 600 }}>
                                        {(t.name || t.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{t.name || t.email}</div>
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{t.email}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Star size={14} style={{ color: '#f59e0b' }} fill="#f59e0b" />
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{t.rating_avg?.toFixed(1) || '—'}</span>
                                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>({t.rating_count})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                        <BookOpen size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <div>No teachers registered yet</div>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link to="/" style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none' }}>← Back to Dashboard</Link>
            </div>
        </div>
    );
}
