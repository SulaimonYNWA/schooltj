import { useAuth } from '../lib/auth';
import { Users, GraduationCap, DollarSign, BookOpen } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();

    const stats = [
        { name: 'Total Students', value: '120', icon: Users, color: 'bg-blue-500' },
        { name: 'Active Courses', value: '12', icon: BookOpen, color: 'bg-green-500' },
        { name: 'Revenue', value: 'TJS 24,500', icon: DollarSign, color: 'bg-yellow-500' },
        { name: 'Teachers', value: '8', icon: GraduationCap, color: 'bg-indigo-500' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Welcome back, <span className="font-medium text-gray-900">{user?.email}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                    <div
                        key={item.name}
                        className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
                    >
                        <dt>
                            <div className={`absolute rounded-md p-3 ${item.color}`}>
                                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                            <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
                        </dt>
                        <dd className="ml-16 flex items-baseline pb-1 sm:pb-7">
                            <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                        </dd>
                    </div>
                ))}
            </div>

            <div className="mt-8 rounded-lg bg-white shadow">
                <div className="p-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">Recent Activity</h3>
                    <div className="mt-6 border-t border-gray-100">
                        <p className="py-4 text-sm text-gray-500">No recent activity.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
