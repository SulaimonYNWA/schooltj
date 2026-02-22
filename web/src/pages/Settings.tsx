import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { api } from '../lib/axios';
import { Settings as SettingsIcon, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';

export default function Settings() {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const changePasswordMutation = useMutation({
        mutationFn: async (data: { current_password: string; new_password: string }) => {
            return api.post('/api/settings/change-password', data);
        },
        onSuccess: () => {
            setSuccessMsg('Password changed successfully!');
            setErrorMsg('');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (err: any) => {
            setErrorMsg(err?.response?.data || 'Failed to change password');
            setSuccessMsg('');
        }
    });

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (newPassword.length < 6) {
            setErrorMsg('New password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setErrorMsg('Passwords do not match');
            return;
        }
        changePasswordMutation.mutate({
            current_password: currentPassword,
            new_password: newPassword,
        });
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <SettingsIcon className="h-6 w-6 text-gray-500" />
                    Settings
                </h1>
                <p className="mt-1 text-sm text-gray-500">Manage your account preferences</p>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <User className="h-4 w-4 text-gray-400" />
                    Account Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</label>
                        <p className="mt-1">
                            <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 uppercase">
                                {user?.role?.replace('_', ' ')}
                            </span>
                        </p>
                    </div>
                    {user?.name && (
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</label>
                            <p className="mt-1 text-sm font-medium text-gray-900">{user.name}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <Lock className="h-4 w-4 text-gray-400" />
                    Change Password
                </h2>

                {successMsg && (
                    <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                            Current Password
                        </label>
                        <input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                            New Password
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm New Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
