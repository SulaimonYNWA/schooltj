import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useAuth } from '../lib/auth';
import { DollarSign, Plus, CreditCard, Banknote, ArrowRightLeft, MoreHorizontal, Filter } from 'lucide-react';

interface Course {
    id: string;
    title: string;
}

interface RosterStudent {
    enrollment_id: string;
    student_user_id: string;
    student_name: string;
}

interface Payment {
    id: string;
    student_user_id: string;
    student_name: string;
    course_id: string;
    course_title: string;
    amount: number;
    method: string;
    note: string;
    recorded_by: string;
    paid_at: string;
    created_at: string;
}

const methodConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    cash: { label: 'Cash', icon: Banknote, color: 'text-green-600 bg-green-50' },
    card: { label: 'Card', icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
    transfer: { label: 'Transfer', icon: ArrowRightLeft, color: 'text-purple-600 bg-purple-50' },
    other: { label: 'Other', icon: MoreHorizontal, color: 'text-gray-600 bg-gray-50' },
};

export default function Payments() {
    const { user } = useAuth();
    const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'school_admin';

    if (isTeacherOrAdmin) {
        return <AdminPaymentsView />;
    }
    return <StudentPaymentsView />;
}

// ─── Admin/Teacher View ─────────────────────────────────────────────────
function AdminPaymentsView() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [filterCourse, setFilterCourse] = useState('');
    const [formData, setFormData] = useState({
        student_user_id: '',
        course_id: '',
        amount: '',
        method: 'cash',
        note: '',
        paid_at: new Date().toISOString().split('T')[0],
    });
    const [formError, setFormError] = useState('');

    const { data: courses } = useQuery<Course[]>({
        queryKey: ['courses'],
        queryFn: async () => {
            const res = await api.get('/api/courses');
            return res.data;
        },
    });

    const { data: roster } = useQuery<RosterStudent[]>({
        queryKey: ['roster', formData.course_id],
        queryFn: async () => {
            const res = await api.get(`/api/courses/${formData.course_id}/roster`);
            return res.data;
        },
        enabled: !!formData.course_id,
    });

    const { data: payments, isLoading } = useQuery<Payment[]>({
        queryKey: ['payments', filterCourse],
        queryFn: async () => {
            const url = filterCourse ? `/api/payments?course_id=${filterCourse}` : '/api/payments';
            const res = await api.get(url);
            return res.data;
        },
    });

    const recordMutation = useMutation({
        mutationFn: async () => {
            return api.post('/api/payments', {
                ...formData,
                amount: parseFloat(formData.amount),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            setShowForm(false);
            setFormData({ student_user_id: '', course_id: '', amount: '', method: 'cash', note: '', paid_at: new Date().toISOString().split('T')[0] });
            setFormError('');
        },
        onError: (err: any) => {
            setFormError(err.response?.data || 'Failed to record payment');
        },
    });

    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <DollarSign className="h-7 w-7 text-emerald-600" />
                        Payments
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">Record and manage student payments.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Record Payment
                </button>
            </div>

            {/* Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <p className="text-sm text-gray-500">Total Collected</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <p className="text-sm text-gray-500">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{payments?.length || 0}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <p className="text-sm text-gray-500">Average Payment</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        ${payments?.length ? (totalRevenue / payments.length).toFixed(2) : '0.00'}
                    </p>
                </div>
            </div>

            {/* Payment Form */}
            {showForm && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Record New Payment</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                            <select
                                value={formData.course_id}
                                onChange={e => setFormData(prev => ({ ...prev, course_id: e.target.value, student_user_id: '' }))}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="">Select course...</option>
                                {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                            <select
                                value={formData.student_user_id}
                                onChange={e => setFormData(prev => ({ ...prev, student_user_id: e.target.value }))}
                                disabled={!formData.course_id}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                            >
                                <option value="">Select student...</option>
                                {roster?.map(s => <option key={s.student_user_id} value={s.student_user_id}>{s.student_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.amount}
                                onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                placeholder="0.00"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                            <div className="flex gap-2">
                                {Object.entries(methodConfig).map(([key, config]) => (
                                    <button
                                        key={key}
                                        onClick={() => setFormData(prev => ({ ...prev, method: key }))}
                                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${formData.method === key
                                                ? `${config.color} border-current ring-1 ring-current`
                                                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                            }`}
                                    >
                                        <config.icon className="h-3.5 w-3.5" />
                                        {config.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Paid</label>
                            <input
                                type="date"
                                value={formData.paid_at}
                                onChange={e => setFormData(prev => ({ ...prev, paid_at: e.target.value }))}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                            <input
                                type="text"
                                value={formData.note}
                                onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                placeholder="Optional note..."
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    {formError && <p className="mt-3 text-sm text-red-500">{formError}</p>}
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={() => recordMutation.mutate()}
                            disabled={!formData.student_user_id || !formData.amount || recordMutation.isPending}
                            className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                            {recordMutation.isPending ? 'Saving...' : 'Save Payment'}
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="mb-4 flex items-center gap-3">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                    value={filterCourse}
                    onChange={e => setFilterCourse(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                    <option value="">All Courses</option>
                    {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
            </div>

            {/* Payment Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500 italic">Loading payments...</div>
                ) : !payments?.length ? (
                    <div className="p-12 text-center text-gray-400">
                        <DollarSign className="mx-auto h-10 w-10 mb-2" />
                        <p className="text-sm font-medium">No payments recorded yet</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-6 py-3 font-medium text-gray-500">Student</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500">Course</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500">Amount</th>
                                <th className="text-center px-6 py-3 font-medium text-gray-500">Method</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payments.map(p => {
                                const mc = methodConfig[p.method] || methodConfig.other;
                                const MIcon = mc.icon;
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3.5 font-medium text-gray-900">{p.student_name}</td>
                                        <td className="px-6 py-3.5 text-gray-600">{p.course_title}</td>
                                        <td className="px-6 py-3.5 text-right font-semibold text-emerald-600">
                                            ${p.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${mc.color}`}>
                                                <MIcon className="h-3 w-3" />
                                                {mc.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-gray-500 font-mono text-xs">
                                            {new Date(p.paid_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-3.5 text-gray-400 truncate max-w-[200px]">{p.note || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// ─── Student View ───────────────────────────────────────────────────────
function StudentPaymentsView() {
    const { data: payments, isLoading } = useQuery<Payment[]>({
        queryKey: ['my-payments'],
        queryFn: async () => {
            const res = await api.get('/api/my-payments');
            return res.data;
        },
    });

    const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    if (isLoading) return <div className="p-8 text-center text-gray-500 italic">Loading payments...</div>;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <DollarSign className="h-7 w-7 text-emerald-600" />
                    My Payments
                </h1>
                <p className="mt-1 text-sm text-gray-500">View your payment history across all courses.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-400 mt-1">{payments?.length || 0} transaction(s)</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {!payments?.length ? (
                    <div className="p-12 text-center text-gray-400">
                        <DollarSign className="mx-auto h-10 w-10 mb-2" />
                        <p className="text-sm font-medium">No payments yet</p>
                        <p className="text-xs mt-1">Your payment records will appear here once your teacher records them.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {payments.map(p => {
                            const mc = methodConfig[p.method] || methodConfig.other;
                            const MIcon = mc.icon;
                            return (
                                <div key={p.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-medium text-gray-900">{p.course_title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(p.paid_at).toLocaleDateString()} • <span className={`inline-flex items-center gap-1 ${mc.color} px-1.5 py-0.5 rounded text-xs`}><MIcon className="h-3 w-3" />{mc.label}</span>
                                        </p>
                                        {p.note && <p className="text-xs text-gray-400 mt-1">{p.note}</p>}
                                    </div>
                                    <span className="text-lg font-bold text-emerald-600">${p.amount.toFixed(2)}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
