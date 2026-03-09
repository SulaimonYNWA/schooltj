import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, MapPin, Phone, Mail, Globe, FileText } from 'lucide-react';

export default function SchoolSetup() {
    const navigate = useNavigate();

    const { data: school } = useQuery<any>({
        queryKey: ['my-school'],
        queryFn: async () => {
            const schools = await api.get('/api/schools').then(r => r.data);
            // The GET /api/schools/my doesn't exist yet, so we find our school via list
            // or better: we fetch from the update endpoint
            return schools?.[0] || {};
        },
    });

    const [form, setForm] = useState({
        name: '',
        description: '',
        phone: '',
        email: '',
        address: '',
        city: 'Dushanbe',
        website: '',
    });

    // Pre-fill when school data loads
    const [prefilled, setPrefilled] = useState(false);
    if (school && !prefilled && school.name) {
        setForm({
            name: school.name === 'My School' ? '' : school.name,
            description: school.description || '',
            phone: school.phone || '',
            email: school.email || '',
            address: school.address || '',
            city: school.city || 'Dushanbe',
            website: school.website || '',
        });
        setPrefilled(true);
    }

    const updateSchool = useMutation({
        mutationFn: () => api.put('/api/schools/my', form),
        onSuccess: () => navigate('/'),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mb-4 shadow-lg">
                        <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Set Up Your School</h1>
                    <p className="mt-2 text-gray-500 text-sm">
                        Provide information about your educational center
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <div className="space-y-6">
                        {/* School Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                <Building2 className="inline h-4 w-4 mr-1 text-gray-400" />
                                School Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. Bright Future Academy"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                <FileText className="inline h-4 w-4 mr-1 text-gray-400" />
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Tell students about your school, subjects, teaching approach..."
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    <Phone className="inline h-4 w-4 mr-1 text-gray-400" />
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="+992 XXX XX XX"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    <Mail className="inline h-4 w-4 mr-1 text-gray-400" />
                                    Contact Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="info@school.com"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* City */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    <MapPin className="inline h-4 w-4 mr-1 text-gray-400" />
                                    City
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="Dushanbe"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>

                            {/* Website */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    <Globe className="inline h-4 w-4 mr-1 text-gray-400" />
                                    Website
                                </label>
                                <input
                                    type="url"
                                    name="website"
                                    value={form.website}
                                    onChange={handleChange}
                                    placeholder="https://yourschool.tj"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                <MapPin className="inline h-4 w-4 mr-1 text-gray-400" />
                                Address
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                placeholder="Street, building number"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex items-center justify-between">
                        <button
                            onClick={() => navigate('/')}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Skip for now
                        </button>
                        <button
                            onClick={() => updateSchool.mutate()}
                            disabled={!form.name || updateSchool.isPending}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {updateSchool.isPending ? 'Saving...' : 'Save & Continue'}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
