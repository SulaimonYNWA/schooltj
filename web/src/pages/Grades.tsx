import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { api } from '../lib/axios';
import { Award, BookOpen, Plus, Star, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface Grade {
    id: string;
    student_user_id: string;
    student_name?: string;
    course_id: string;
    course_title?: string;
    title: string;
    score: number | null;
    letter_grade: string | null;
    comment?: string;
    graded_at: string;
}

interface Course {
    id: string;
    title: string;
}

export default function Grades() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isStudent = user?.role === 'student';
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ student_user_id: '', title: '', score: '', letter_grade: '', comment: '' });

    const { data: myGrades = [] } = useQuery<Grade[]>({
        queryKey: ['my-grades'],
        queryFn: () => api.get('/api/my-grades').then(r => r.data),
        enabled: isStudent,
    });

    const { data: courses = [] } = useQuery<Course[]>({
        queryKey: ['courses'],
        queryFn: () => api.get('/api/courses').then(r => r.data),
        enabled: !isStudent,
    });

    const { data: courseGrades = [] } = useQuery<Grade[]>({
        queryKey: ['course-grades', selectedCourse],
        queryFn: () => api.get(`/api/courses/${selectedCourse}/grades`).then(r => r.data),
        enabled: !!selectedCourse,
    });

    const createGrade = useMutation({
        mutationFn: (data: typeof form) => api.post(`/api/courses/${selectedCourse}/grades`, {
            student_user_id: data.student_user_id,
            title: data.title,
            score: data.score ? parseFloat(data.score) : null,
            letter_grade: data.letter_grade || null,
            comment: data.comment,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course-grades', selectedCourse] });
            setForm({ student_user_id: '', title: '', score: '', letter_grade: '', comment: '' });
            setShowForm(false);
        }
    });

    // Calculate GPA-like summary for students
    const avgScore = myGrades.length > 0
        ? (myGrades.filter(g => g.score !== null).reduce((s, g) => s + (g.score ?? 0), 0) / myGrades.filter(g => g.score !== null).length)
        : 0;

    return (
        <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <Award size={28} style={{ color: '#7c3aed' }} />
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Grades & Report Card</h1>
            </div>

            {isStudent ? (
                <>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', borderRadius: '12px', padding: '20px', color: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <TrendingUp size={18} />
                                <span style={{ fontSize: '13px', opacity: 0.9 }}>Average Score</span>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 700 }}>{avgScore.toFixed(1)}%</div>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', borderRadius: '12px', padding: '20px', color: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <Star size={18} />
                                <span style={{ fontSize: '13px', opacity: 0.9 }}>Total Grades</span>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 700 }}>{myGrades.length}</div>
                        </div>
                    </div>

                    {/* Student's Grades Table */}
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Course</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Title</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Score</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Grade</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Comment</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myGrades.map(g => (
                                    <tr key={g.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <BookOpen size={14} style={{ color: '#7c3aed' }} />
                                                {g.course_title}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '14px' }}>{g.title}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center', fontWeight: 600 }}>
                                            {g.score !== null ? (
                                                <span style={{ color: (g.score ?? 0) >= 70 ? '#059669' : (g.score ?? 0) >= 50 ? '#d97706' : '#dc2626' }}>{g.score}%</span>
                                            ) : '—'}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            {g.letter_grade && (
                                                <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>{g.letter_grade}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.comment || '—'}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280', textAlign: 'right' }}>{new Date(g.graded_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {myGrades.length === 0 && (
                                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No grades yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <>
                    {/* Teacher / Admin: Select course, add grades */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
                        <select
                            value={selectedCourse}
                            onChange={e => setSelectedCourse(e.target.value)}
                            style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', minWidth: '240px' }}
                        >
                            <option value="">Select a course</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                        {selectedCourse && (
                            <button
                                onClick={() => setShowForm(!showForm)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#7c3aed', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                            >
                                <Plus size={16} /> Add Grade
                            </button>
                        )}
                    </div>

                    {showForm && selectedCourse && (
                        <div style={{ background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Add New Grade</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                <input placeholder="Student User ID" value={form.student_user_id} onChange={e => setForm({ ...form, student_user_id: e.target.value })}
                                    style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                                <input placeholder="Title (e.g. Midterm)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                    style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                                <input placeholder="Score (%)" type="number" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })}
                                    style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                                <input placeholder="Letter (A, B+...)" value={form.letter_grade} onChange={e => setForm({ ...form, letter_grade: e.target.value })}
                                    style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                                <input placeholder="Comment" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })}
                                    style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                            </div>
                            <button
                                onClick={() => createGrade.mutate(form)}
                                style={{ marginTop: '12px', background: '#7c3aed', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                            >Save Grade</button>
                        </div>
                    )}

                    {selectedCourse && (
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Student</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Title</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Score</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Grade</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Comment</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courseGrades.map(g => (
                                        <tr key={g.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{g.student_name}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>{g.title}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: (g.score ?? 0) >= 70 ? '#059669' : '#dc2626' }}>{g.score !== null ? `${g.score}%` : '—'}</td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                {g.letter_grade && <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>{g.letter_grade}</span>}
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{g.comment || '—'}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280', textAlign: 'right' }}>{new Date(g.graded_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {courseGrades.length === 0 && (
                                        <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No grades for this course yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
