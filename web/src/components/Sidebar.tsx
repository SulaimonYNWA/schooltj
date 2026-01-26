import { Home, User, BookOpen, Settings, LogOut, Users, Tag } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Sidebar() {
    const { logout, user } = useAuth();

    const navigation = [
        { name: 'Overview', href: '/', icon: Home, visible: true },
        {
            name: 'Teachers',
            href: '/teachers',
            icon: Users,
            visible: user?.role === 'school_admin'
        },
        {
            name: 'Courses',
            href: '/courses',
            icon: BookOpen,
            visible: user?.role === 'school_admin' || user?.role === 'student'
        },
        {
            name: 'My Schedule',
            href: '/schedule',
            icon: BookOpen,
            visible: user?.role === 'teacher'
        },
        {
            name: 'Browse Courses',
            href: '/courses',
            icon: BookOpen,
            visible: user?.role === 'student' || user?.role === 'teacher'
        },
        {
            name: 'My Enrollments',
            href: '/enrollments',
            icon: Tag,
            visible: user?.role === 'student'
        },
        { name: 'Profile', href: '/profile', icon: User, visible: true },
        { name: 'Settings', href: '/settings', icon: Settings, visible: true },
    ];

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900 px-4 py-6 text-white">
            <div className="flex items-center gap-2 mb-8 px-2">
                <BookOpen className="h-8 w-8 text-indigo-400" />
                <span className="text-xl font-bold">SchoolTJ</span>
            </div>

            {user && (
                <div className="mb-6 px-2 text-sm text-gray-400">
                    <p>Welcome,</p>
                    <p className="font-semibold text-white">{user.email}</p>
                    <p className="text-xs uppercase mt-1 text-indigo-400 border border-indigo-400 rounded w-max px-1">{user.role}</p>
                </div>
            )}

            <nav className="flex-1 space-y-1">
                {navigation.filter(item => item.visible).map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                            `flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors ${isActive
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto border-t border-gray-800 pt-4">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Sign out
                </button>
            </div>
        </div>
    );
}
