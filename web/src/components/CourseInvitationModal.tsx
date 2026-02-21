import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Calendar, DollarSign, User, Building2, BookOpen } from 'lucide-react';

interface Course {
    id: string;
    title: string;
    description: string;
    schedule?: string;
    teacher_name?: string;
    teacher_email?: string;
    school_name?: string;
    price: number;
}

interface Enrollment {
    id: string;
    status: string;
    enrolled_at: string;
}

interface EnrollmentWithCourse {
    enrollment: Enrollment;
    course: Course;
}

interface CourseInvitationModalProps {
    enrollment: EnrollmentWithCourse | null;
    isOpen: boolean;
    onClose: () => void;
    onAccept: (enrollmentId: string) => void;
    onReject: (enrollmentId: string) => void;
    isProcessing?: boolean;
}

export default function CourseInvitationModal({
    enrollment,
    isOpen,
    onClose,
    onAccept,
    onReject,
    isProcessing = false
}: CourseInvitationModalProps) {
    if (!enrollment) return null;

    const { course, enrollment: inv } = enrollment;

    const handleAccept = () => {
        onAccept(inv.id);
    };

    const handleReject = () => {
        onReject(inv.id);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <Dialog.Title className="text-2xl font-bold text-gray-900">
                                            Course Invitation
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Review the course details before accepting
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500 transition-colors"
                                        disabled={isProcessing}
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Course Details */}
                                <div className="space-y-6">
                                    {/* Course Title & Description */}
                                    <div>
                                        <h3 className="text-xl font-semibold text-indigo-600 mb-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            {course.description}
                                        </p>
                                    </div>

                                    {/* Course Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Teacher */}
                                        {course.teacher_name && (
                                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                                <div className="flex-shrink-0">
                                                    <User className="h-5 w-5 text-indigo-600 mt-0.5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-500">Teacher</p>
                                                    <p className="text-base font-semibold text-gray-900 truncate">
                                                        {course.teacher_name}
                                                    </p>
                                                    {course.teacher_email && (
                                                        <p className="text-sm text-gray-600 truncate">
                                                            {course.teacher_email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* School */}
                                        {course.school_name && (
                                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                                <div className="flex-shrink-0">
                                                    <Building2 className="h-5 w-5 text-indigo-600 mt-0.5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-500">School</p>
                                                    <p className="text-base font-semibold text-gray-900 truncate">
                                                        {course.school_name}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Schedule */}
                                        {course.schedule && (
                                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                                <div className="flex-shrink-0">
                                                    <Calendar className="h-5 w-5 text-indigo-600 mt-0.5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-500">Schedule</p>
                                                    <p className="text-base font-semibold text-gray-900">
                                                        {course.schedule}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Price */}
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-shrink-0">
                                                <DollarSign className="h-5 w-5 text-indigo-600 mt-0.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-500">Price</p>
                                                <p className="text-base font-semibold text-gray-900">
                                                    {course.price > 0 ? `TJS ${course.price.toFixed(2)}` : 'Free'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Invitation Date */}
                                    <div className="border-t pt-4">
                                        <p className="text-sm text-gray-500">
                                            Invited on {new Date(inv.enrolled_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={handleReject}
                                        disabled={isProcessing}
                                        className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <X className="w-5 h-5 mr-2" />
                                        Decline
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAccept}
                                        disabled={isProcessing}
                                        className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <BookOpen className="w-5 h-5 mr-2" />
                                        {isProcessing ? 'Processing...' : 'Accept Invitation'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
