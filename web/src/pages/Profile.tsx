import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Save, Edit2, Shield, Clock, Camera, Trash2, Loader2 } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';
import imageCompression from 'browser-image-compression';

export default function Profile() {
    const { user: authUser, setUser } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (authUser) {
            setFormData({
                name: authUser.name || '',
                email: authUser.email || '',
            });
        }
    }, [authUser]);

    const updateProfileMutation = useMutation({
        mutationFn: async (data: { name: string, email: string }) => {
            const response = await api.put('/me', data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            if (authUser) {
                setUser({ ...authUser, name: variables.name, email: variables.email });
            }
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
            setTimeout(() => setMessage(null), 3000);
        },
        onError: (error: any) => {
            setMessage({
                type: 'error',
                text: error.response?.data || 'Failed to update profile'
            });
            setTimeout(() => setMessage(null), 5000);
        }
    });

    const updateAvatarMutation = useMutation({
        mutationFn: async (avatar_url: string) => {
            const response = await api.put('/me/avatar', { avatar_url });
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            if (authUser) {
                setUser({ ...authUser, avatar_url: variables });
            }
            setMessage({ type: 'success', text: 'Avatar updated successfully!' });
            setTimeout(() => setMessage(null), 3000);
        },
        onError: (error: any) => {
            setMessage({
                type: 'error',
                text: error.response?.data || 'Failed to save avatar URL to profile'
            });
            setTimeout(() => setMessage(null), 5000);
        }
    });

    const deleteAvatarMutation = useMutation({
        mutationFn: async () => {
            await api.delete('/me/avatar');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            if (authUser) {
                setUser({ ...authUser, avatar_url: undefined });
            }
            setMessage({ type: 'success', text: 'Avatar removed successfully!' });
            setTimeout(() => setMessage(null), 3000);
        },
        onError: (error: any) => {
            setMessage({
                type: 'error',
                text: error.response?.data || 'Failed to remove avatar from profile'
            });
            setTimeout(() => setMessage(null), 3000);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !authUser) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select an image file.' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setMessage({ type: 'error', text: 'Image must be less than 5MB.' });
            return;
        }

        try {
            setUploadingAvatar(true);
            setUploadProgress(0);

            // Compress the image
            const options = {
                maxSizeMB: 1, // Max file size in MB
                maxWidthOrHeight: 800, // Max width or height in pixels
                useWebWorker: true,
                fileType: 'image/webp' // Converting to webp for better compression
            };
            const compressedFile = await imageCompression(file, options);

            // Create a unique filename
            const ext = 'webp'; // Since we are compressing to webp
            const filename = `avatars/${authUser.id}-${Date.now()}.${ext}`;
            const storageRef = ref(storage, filename);

            const uploadTask = uploadBytesResumable(storageRef, compressedFile);

            uploadTask.on('state_changed',
                (snapshot: any) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(Math.round(progress));
                },
                (error: any) => {
                    console.error("Firebase upload error:", error);
                    setMessage({ type: 'error', text: 'Failed to upload image.' });
                    setUploadingAvatar(false);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    updateAvatarMutation.mutate(downloadURL);
                    setUploadingAvatar(false);
                }
            );
        } catch (error) {
            console.error("Upload process error:", error);
            setMessage({ type: 'error', text: 'An unexpected error occurred during upload.' });
            setUploadingAvatar(false);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteAvatar = async () => {
        if (!authUser?.avatar_url) return;

        if (window.confirm('Are you sure you want to remove your profile picture?')) {
            try {
                // Try to delete from Firebase storage if it's a firebase URL
                if (authUser.avatar_url.includes('firebasestorage')) {
                    const storageRef = ref(storage, authUser.avatar_url);
                    await deleteObject(storageRef).catch((e: any) => console.warn("Could not delete from Firebase, might already be gone:", e));
                }

                // Remove from our backend
                deleteAvatarMutation.mutate();
            } catch (error) {
                console.error("Delete avatar error:", error);
                setMessage({ type: 'error', text: 'Failed to delete avatar image.' });
            }
        }
    };

    if (!authUser) return <div className="p-8">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="mt-2 text-gray-600">Manage your account settings and personal information.</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                <div className="p-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

                <div className="p-6 sm:p-10">
                    <div className="flex flex-col md:flex-row gap-10">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-white shadow-lg relative">
                                    {uploadingAvatar ? (
                                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
                                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                                            <span className="text-xs font-medium text-blue-700">{uploadProgress}%</span>
                                        </div>
                                    ) : null}

                                    {authUser.avatar_url ? (
                                        <img
                                            src={authUser.avatar_url}
                                            alt={authUser.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback if image fails to load
                                                (e.target as HTMLImageElement).src = '';
                                                (e.target as HTMLImageElement).onerror = null;
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement?.querySelector('svg')?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}

                                    <User size={64} className={`text-gray-400 ${authUser.avatar_url ? 'hidden' : ''}`} />
                                </div>

                                {/* Hover overlay for uploading */}
                                <label className={`absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity ${uploadingAvatar ? 'hidden' : ''}`}>
                                    <Camera size={24} className="mb-1" />
                                    <span className="text-xs font-medium">Change Photo</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={handleFileChange}
                                        ref={fileInputRef}
                                        disabled={uploadingAvatar || updateAvatarMutation.isPending}
                                    />
                                </label>

                                {/* Delete button */}
                                {authUser.avatar_url && !uploadingAvatar && (
                                    <button
                                        onClick={handleDeleteAvatar}
                                        disabled={deleteAvatarMutation.isPending}
                                        className="absolute bottom-0 right-0 bg-red-100 text-red-600 p-2 rounded-full shadow-sm hover:bg-red-200 transition-colors border-2 border-white"
                                        title="Remove photo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="mt-4 text-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase tracking-wider">
                                    {authUser.role}
                                </span>
                                {authUser.created_at && (
                                    <div className="mt-2 flex items-center justify-center text-xs text-gray-500">
                                        <Clock size={12} className="mr-1" />
                                        Joined {new Date(authUser.created_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-800">Personal Details</h2>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        <Edit2 size={16} className="mr-2" />
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'
                                                    }`}
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Your full name"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                disabled={!isEditing}
                                                className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'
                                                    }`}
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Role</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Shield size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                disabled
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed sm:text-sm capitalize"
                                                value={authUser.role}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-400">Your role is managed by administrators.</p>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setFormData({
                                                    name: authUser.name || '',
                                                    email: authUser.email || '',
                                                });
                                            }}
                                            className="px-4 py-2 border border-transparent text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={updateProfileMutation.isPending}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {updateProfileMutation.isPending ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={16} className="mr-2" />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="mt-8 bg-white shadow rounded-2xl border border-gray-100 p-6 sm:p-10">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Security</h2>
                <div className="flex items-center justify-between py-4 border-b border-gray-50">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Password</p>
                        <p className="text-xs text-gray-500">Last changed 3 months ago</p>
                    </div>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
                        Change Password
                    </button>
                </div>
                <div className="flex items-center justify-between py-4">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Two-Factor Authentication</p>
                        <p className="text-xs text-gray-500">Not enabled</p>
                    </div>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
                        Enable
                    </button>
                </div>
            </div>
        </div>
    );
}
