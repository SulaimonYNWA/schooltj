import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Bell, Check, CheckCheck, Clock, Info } from 'lucide-react';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

const typeIcon: Record<string, { bg: string; color: string }> = {
    grade: { bg: '#ede9fe', color: '#7c3aed' },
    assignment: { bg: '#fef3c7', color: '#d97706' },
    message: { bg: '#dbeafe', color: '#2563eb' },
    announcement: { bg: '#dcfce7', color: '#16a34a' },
    system: { bg: '#f3f4f6', color: '#6b7280' },
};

export default function Notifications() {
    const queryClient = useQueryClient();

    const { data: notifications = [] } = useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: () => api.get('/api/notifications').then(r => r.data),
    });

    const markAllRead = useMutation({
        mutationFn: () => api.post('/api/notifications/mark-all-read'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notification-count'] });
        },
    });

    const markRead = useMutation({
        mutationFn: (id: string) => api.post(`/api/notifications/${id}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notification-count'] });
        },
    });

    const unread = notifications.filter(n => !n.is_read).length;

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString();
    };

    return (
        <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Bell size={28} style={{ color: '#2563eb' }} />
                    <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Notifications</h1>
                    {unread > 0 && (
                        <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>{unread}</span>
                    )}
                </div>
                {unread > 0 && (
                    <button
                        onClick={() => markAllRead.mutate()}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #d1d5db', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', color: '#374151', fontSize: '13px' }}
                    >
                        <CheckCheck size={14} /> Mark all read
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map(n => {
                    const style = typeIcon[n.type] || typeIcon.system;
                    return (
                        <div
                            key={n.id}
                            onClick={() => !n.is_read && markRead.mutate(n.id)}
                            style={{
                                background: n.is_read ? '#fafafa' : 'white',
                                borderRadius: '12px',
                                border: `1px solid ${n.is_read ? '#f3f4f6' : '#e5e7eb'}`,
                                padding: '16px',
                                cursor: n.is_read ? 'default' : 'pointer',
                                transition: 'all 0.15s',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '14px',
                                opacity: n.is_read ? 0.65 : 1,
                            }}
                        >
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {n.type === 'grade' ? <Info size={18} color={style.color} /> :
                                    n.type === 'assignment' ? <Clock size={18} color={style.color} /> :
                                        <Bell size={18} color={style.color} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{n.title}</span>
                                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatTime(n.created_at)}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>{n.message}</p>
                            </div>
                            {!n.is_read && (
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: '6px' }} />
                            )}
                            {n.is_read && (
                                <Check size={14} style={{ color: '#9ca3af', flexShrink: 0, marginTop: '4px' }} />
                            )}
                        </div>
                    );
                })}
                {notifications.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                        <Bell size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                        <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
