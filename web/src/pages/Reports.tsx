import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { BarChart3, TrendingUp, Users, DollarSign, BookOpen } from 'lucide-react';

interface Stats {
    total_students: number;
    total_teachers: number;
    total_courses: number;
    total_revenue: number;
    active_enrollments: number;
}

export default function Reports() {
    const { data: stats } = useQuery<Stats>({
        queryKey: ['dashboard-stats'],
        queryFn: () => api.get('/api/dashboard/stats').then(r => r.data),
    });

    const metrics = [
        { label: 'Total Students', value: stats?.total_students ?? 0, icon: Users, color: '#3b82f6', bg: '#dbeafe' },
        { label: 'Total Teachers', value: stats?.total_teachers ?? 0, icon: Users, color: '#7c3aed', bg: '#ede9fe' },
        { label: 'Active Courses', value: stats?.total_courses ?? 0, icon: BookOpen, color: '#059669', bg: '#dcfce7' },
        { label: 'Total Revenue', value: `$${(stats?.total_revenue ?? 0).toLocaleString()}`, icon: DollarSign, color: '#d97706', bg: '#fef3c7' },
        { label: 'Active Enrollments', value: stats?.active_enrollments ?? 0, icon: TrendingUp, color: '#dc2626', bg: '#fee2e2' },
    ];

    return (
        <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <BarChart3 size={28} style={{ color: '#059669' }} />
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Reports & Analytics</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {metrics.map((m, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <m.icon size={18} color={m.color} />
                            </div>
                            <span style={{ fontSize: '13px', color: '#6b7280' }}>{m.label}</span>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>{m.value}</div>
                    </div>
                ))}
            </div>

            {/* Visual bar chart */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 20px' }}>Distribution Overview</h2>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', height: '200px' }}>
                    {metrics.slice(0, 4).map((m, i) => {
                        const maxVal = Math.max(...metrics.slice(0, 4).map(x => typeof x.value === 'number' ? x.value : 0), 1);
                        const val = typeof m.value === 'number' ? m.value : 0;
                        const height = Math.max((val / maxVal) * 160, 6);
                        return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: m.color }}>{m.value}</span>
                                <div style={{ width: '48px', height: `${height}px`, background: `linear-gradient(to top, ${m.color}, ${m.bg})`, borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease' }} />
                                <span style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>{m.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
