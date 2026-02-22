import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { api } from '../lib/axios';
import { ClipboardList, Plus, Clock, CheckCircle, Send, BookOpen } from 'lucide-react';
import { useState } from 'react';

interface Assignment {
    id: string;
    course_id: string;
    course_title?: string;
    title: string;
    description?: string;
    due_date?: string;
    max_score: number;
}

interface Course { id: string; title: string; }
interface Submission { id: string; student_name?: string; content?: string; link?: string; score: number | null; submitted_at: string; }

export default function Homework() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const isStudent = user?.role === 'student';
    const [selCourse, setSelCourse] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [subForm, setSubForm] = useState<{ id: string; content: string; link: string } | null>(null);
    const [form, setForm] = useState({ title: '', description: '', due_date: '', max_score: '100' });
    const [viewSubs, setViewSubs] = useState<string | null>(null);

    const { data: myAssign = [] } = useQuery<Assignment[]>({
        queryKey: ['my-assignments'],
        queryFn: () => api.get('/api/my-assignments').then(r => r.data),
        enabled: isStudent,
    });
    const { data: courses = [] } = useQuery<Course[]>({
        queryKey: ['courses'],
        queryFn: () => api.get('/api/courses').then(r => r.data),
        enabled: !isStudent,
    });
    const { data: cAssign = [] } = useQuery<Assignment[]>({
        queryKey: ['course-assignments', selCourse],
        queryFn: () => api.get(`/api/courses/${selCourse}/assignments`).then(r => r.data),
        enabled: !!selCourse,
    });
    const { data: subs = [] } = useQuery<Submission[]>({
        queryKey: ['submissions', viewSubs],
        queryFn: () => api.get(`/api/assignments/${viewSubs}/submissions`).then(r => r.data),
        enabled: !!viewSubs,
    });

    const create = useMutation({
        mutationFn: () => api.post(`/api/courses/${selCourse}/assignments`, {
            title: form.title, description: form.description,
            due_date: form.due_date || null, max_score: parseFloat(form.max_score),
        }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['course-assignments', selCourse] }); setShowForm(false); setForm({ title: '', description: '', due_date: '', max_score: '100' }); },
    });
    const submit = useMutation({
        mutationFn: (d: { id: string; content: string; link: string }) =>
            api.post(`/api/assignments/${d.id}/submit`, { content: d.content, link: d.link }),
        onSuccess: () => { setSubForm(null); qc.invalidateQueries({ queryKey: ['my-assignments'] }); },
    });

    const isOverdue = (d?: string) => d ? new Date(d) < new Date() : false;
    const isDueSoon = (d?: string) => { if (!d) return false; const diff = new Date(d).getTime() - Date.now(); return diff > 0 && diff < 3 * 864e5; };

    return (
        <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <ClipboardList size={28} style={{ color: '#d97706' }} />
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Homework & Assignments</h1>
            </div>
            {isStudent ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {myAssign.map(a => (
                        <div key={a.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <BookOpen size={14} style={{ color: '#d97706' }} />
                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{a.course_title}</span>
                                    </div>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{a.title}</h3>
                                    {a.description && <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{a.description}</p>}
                                </div>
                                {a.due_date && (
                                    <span style={{ fontSize: '13px', color: isOverdue(a.due_date) ? '#dc2626' : isDueSoon(a.due_date) ? '#d97706' : '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={14} />{isOverdue(a.due_date) ? 'Overdue' : new Date(a.due_date).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <div style={{ marginTop: '12px' }}>
                                {subForm?.id === a.id ? (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input placeholder="Answer..." value={subForm.content} onChange={e => setSubForm({ ...subForm, content: e.target.value })} style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                                        <input placeholder="Link" value={subForm.link} onChange={e => setSubForm({ ...subForm, link: e.target.value })} style={{ width: '180px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                                        <button onClick={() => submit.mutate(subForm)} style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Send size={14} />Submit</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setSubForm({ id: a.id, content: '', link: '' })} style={{ background: '#d97706', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}><Send size={14} />Submit Work</button>
                                )}
                            </div>
                        </div>
                    ))}
                    {myAssign.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}><ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '12px' }} /><p>No assignments yet</p></div>}
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        <select value={selCourse} onChange={e => { setSelCourse(e.target.value); setViewSubs(null); }} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', minWidth: '240px' }}>
                            <option value="">Select a course</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                        {selCourse && <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#d97706', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}><Plus size={16} />New Assignment</button>}
                    </div>
                    {showForm && selCourse && (
                        <div style={{ background: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d', padding: '20px', marginBottom: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '12px' }}>
                                <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                                <input placeholder="Max Score" type="number" value={form.max_score} onChange={e => setForm({ ...form, max_score: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                            </div>
                            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', marginTop: '12px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', minHeight: '60px', boxSizing: 'border-box' }} />
                            <button onClick={() => create.mutate()} style={{ marginTop: '12px', background: '#d97706', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>Create</button>
                        </div>
                    )}
                    {selCourse && cAssign.map(a => (
                        <div key={a.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{a.title}</h3>
                                    {a.description && <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{a.description}</p>}
                                </div>
                                {a.due_date && <span style={{ fontSize: '13px', color: '#6b7280' }}>Due: {new Date(a.due_date).toLocaleDateString()}</span>}
                            </div>
                            <button onClick={() => setViewSubs(viewSubs === a.id ? null : a.id)} style={{ marginTop: '8px', background: 'none', border: '1px solid #d1d5db', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>{viewSubs === a.id ? 'Hide' : 'View'} Submissions</button>
                            {viewSubs === a.id && (
                                <div style={{ marginTop: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                                    {subs.map(s => (
                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
                                            <span style={{ fontWeight: 500, fontSize: '14px' }}>{s.student_name} <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '13px', marginLeft: '8px' }}>{s.content || s.link}</span></span>
                                            {s.score !== null ? <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} />{s.score}/{a.max_score}</span> : <span style={{ color: '#9ca3af', fontSize: '12px' }}>Not graded</span>}
                                        </div>
                                    ))}
                                    {subs.length === 0 && <div style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '16px' }}>No submissions</div>}
                                </div>
                            )}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}
