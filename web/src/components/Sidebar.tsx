import { Home, User, BookOpen, LogOut, Users, Calendar, DollarSign, Megaphone, Clock, Settings, Award, Bell, ClipboardList, MessageSquare, BarChart3, Building2 } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

export default function Sidebar() {
    const { logout, user } = useAuth();
    const { t } = useTranslation();

    const { data: notifData } = useQuery<{ count: number }>({
        queryKey: ['notif-unread'],
        queryFn: () => api.get('/api/notifications/unread-count').then(r => r.data),
        refetchInterval: 200000,
    });

    const navigation = [
        { name: t('nav.dashboard'), href: '/', icon: Home, visible: true },
        {
            name: t('nav.teachers'),
            href: '/teachers',
            icon: Users,
            visible: user?.role === 'school_admin' || user?.role === 'admin'
        },
        {
            name: t('nav.courses'),
            href: '/courses',
            icon: BookOpen,
            visible: true
        },
        {
            name: t('nav.schools'),
            href: '/schools',
            icon: Building2,
            visible: true
        },
        {
            name: t('nav.timetable'),
            href: '/timetable',
            icon: Clock,
            visible: user?.role === 'student' || user?.role === 'teacher' || user?.role === 'admin'
        },
        {
            name: t('nav.grades'),
            href: '/grades',
            icon: Award,
            visible: true
        },
        {
            name: t('nav.homework'),
            href: '/homework',
            icon: ClipboardList,
            visible: true
        },
        {
            name: t('nav.students'),
            href: '/students',
            icon: Users,
            visible: user?.role === 'school_admin' || user?.role === 'teacher' || user?.role === 'admin'
        },
        {
            name: t('nav.attendance'),
            href: '/attendance',
            icon: Calendar,
            visible: user?.role === 'teacher' || user?.role === 'school_admin' || user?.role === 'student' || user?.role === 'admin'
        },
        {
            name: t('nav.payments'),
            href: '/payments',
            icon: DollarSign,
            visible: true
        },
        {
            name: t('nav.announcements'),
            href: '/announcements',
            icon: Megaphone,
            visible: true
        },
        {
            name: t('nav.messages'),
            href: '/messages',
            icon: MessageSquare,
            visible: true,
        },
        {
            name: t('nav.notifications'),
            href: '/notifications',
            icon: Bell,
            visible: true,
            badge: notifData?.count || 0,
        },
        {
            name: t('nav.reports'),
            href: '/reports',
            icon: BarChart3,
            visible: user?.role === 'school_admin' || user?.role === 'admin'
        },
        { name: t('nav.profile'), href: '/profile', icon: User, visible: true },
        { name: t('nav.settings'), href: '/settings', icon: Settings, visible: true },
    ];

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900 px-4 py-6 text-white">
            <div className="flex items-center gap-2 mb-8 px-2">
                <BookOpen className="h-8 w-8 text-indigo-400" />
                <span className="text-xl font-bold">SchoolTJ</span>
            </div>

            {user && (
                <Link to="/profile" className="mb-6 px-2 py-2 -mx-2 flex items-center gap-3 hover:bg-gray-800 rounded-md transition-colors cursor-pointer text-decoration-none">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-5 w-5 text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-white">{user.name || user.email.split('@')[0]}</p>
                        <p className="truncate text-xs text-indigo-400 capitalize">{user.role.replace('_', ' ')}</p>
                    </div>
                </Link>
            )}

            <nav className="flex-1 space-y-1 overflow-y-auto">
                {navigation.filter(item => item.visible).map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) =>
                            `flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors ${isActive
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="flex-1">{item.name}</span>
                        {'badge' in item && (item as any).badge > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                                {(item as any).badge > 99 ? '99+' : (item as any).badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto border-t border-gray-800 pt-4 space-y-2">
                <LanguageSwitcher />
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    {t('auth.logout')}
                </button>
            </div>
        </div>
    );
}
