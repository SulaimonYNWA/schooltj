import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { BookOpen, User, School, Tag } from 'lucide-react';

interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    teacher_name: string;
    school_name: string;
    created_at: string;
}

export default function CourseList() {
    const { data: courses, isLoading, error } = useQuery<Course[]>({
        queryKey: ['courses'],
        queryFn: async () => {
            const res = await api.get('/api/courses');
            return res.data;
        },
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500 italic">Finding available courses...</div>;
    if (error) return <div className="p-8 text-center text-red-500 font-medium">Error loading courses. Please try again.</div>;

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Courses</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage and browse available educational programs.</p>
                </div>
            </div>

            {!courses || courses.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 italic">No courses found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first course.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md hover:border-indigo-100"
                        >
                            <div className="p-6 flex-1">
                                <div className="flex items-start justify-between">
                                    <div className="bg-indigo-50 p-2 rounded-lg">
                                        <BookOpen className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                                        Active
                                    </span>
                                </div>
                                <h3 className="mt-4 text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                    {course.title}
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-2">
                                    {course.description}
                                </p>

                                <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500 border-t border-gray-50 pt-4">
                                    <div className="flex items-center">
                                        <User className="mr-1.5 h-4 w-4 text-gray-400 group-hover:text-amber-500" />
                                        {course.teacher_name}
                                    </div>
                                    <div className="flex items-center">
                                        <School className="mr-1.5 h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                                        {course.school_name}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center font-bold text-gray-900">
                                    <Tag className="mr-1.5 h-4 w-4 text-indigo-500" />
                                    TJS {course.price.toLocaleString()}
                                </div>
                                <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                                    Details →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
