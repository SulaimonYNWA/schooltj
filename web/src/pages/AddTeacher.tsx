import { useState } from 'react';
import { api } from '../lib/axios';
import { useNavigate } from 'react-router-dom';

export default function AddTeacher() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [bio, setBio] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.post('/api/schools/teachers', { email, password, bio });
            setSuccess('Teacher added successfully!');
            setTimeout(() => navigate('/'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add teacher');
        }
    };

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Add New Teacher</h1>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                        type="email"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                    />
                </div>

                {error && <div className="text-red-500 text-sm">{error}</div>}
                {success && <div className="text-green-500 text-sm">{success}</div>}

                <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Add Teacher
                </button>
            </form>
        </div>
    );
}
