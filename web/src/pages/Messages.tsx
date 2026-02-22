import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { MessageSquare, Send, ArrowLeft, Search, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/auth';

interface Conversation { user_id: string; user_name: string; user_email: string; last_message: string; last_time: string; unread_count: number; }
interface Message { id: string; from_user_id: string; from_name: string; to_user_id: string; to_name: string; content: string; is_read: boolean; created_at: string; }
interface UserResult { id: string; name: string; email: string; role: string; }

export default function Messages() {
    const { user: currentUser } = useAuth();
    const qc = useQueryClient();
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [activeName, setActiveName] = useState<string>('');
    const [newMsg, setNewMsg] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const msgEnd = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    const { data: convos = [] } = useQuery<Conversation[]>({
        queryKey: ['conversations'],
        queryFn: () => api.get('/api/messages/conversations').then(r => r.data),
    });

    const { data: msgs = [] } = useQuery<Message[]>({
        queryKey: ['messages', activeChat],
        queryFn: () => api.get(`/api/messages/${activeChat}`).then(r => r.data),
        enabled: !!activeChat,
        refetchInterval: 5000,
    });

    const { data: searchResults = [] } = useQuery<UserResult[]>({
        queryKey: ['user-search', searchQuery],
        queryFn: () => api.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`).then(r => r.data),
        enabled: searchQuery.length >= 2,
    });

    const send = useMutation({
        mutationFn: (data: { to_user_id: string; content: string }) => api.post('/api/messages', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['messages', activeChat] });
            qc.invalidateQueries({ queryKey: ['conversations'] });
            setNewMsg('');
        },
    });

    useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const formatTime = (s: string) => {
        const d = new Date(s);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const selectUser = (u: UserResult) => {
        setSelectedUser(u);
        setSearchQuery('');
        setShowSuggestions(false);
    };

    const startChatWithSelected = () => {
        if (!selectedUser || !newMsg.trim()) return;
        send.mutate({ to_user_id: selectedUser.id, content: newMsg });
        setActiveChat(selectedUser.id);
        setActiveName(selectedUser.name || selectedUser.email);
        setShowNew(false);
        setSelectedUser(null);
    };

    const openConversation = (c: Conversation) => {
        setActiveChat(c.user_id);
        setActiveName(c.user_name);
        setShowNew(false);
    };

    // Filter out current user from search results
    const filteredResults = searchResults.filter(u => u.id !== currentUser?.id);

    return (
        <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <MessageSquare size={28} style={{ color: '#2563eb' }} />
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Messages</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px', height: '600px' }}>
                {/* Sidebar */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>Chats</span>
                        <button onClick={() => { setShowNew(!showNew); setActiveChat(null); setSelectedUser(null); setSearchQuery(''); }}
                            style={{ background: showNew ? '#eff6ff' : 'none', border: '1px solid', borderColor: showNew ? '#2563eb' : 'transparent', color: '#2563eb', cursor: 'pointer', fontSize: '20px', lineHeight: 1, width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {convos.map(c => (
                            <div key={c.user_id} onClick={() => openConversation(c)}
                                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', background: activeChat === c.user_id ? '#eff6ff' : 'transparent', transition: 'background 0.1s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: activeChat === c.user_id ? '#bfdbfe' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', color: '#374151', flexShrink: 0 }}>
                                        {(c.user_name || c.user_email).charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontWeight: 500, fontSize: '14px' }}>{c.user_name}</span>
                                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{formatTime(c.last_time)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                            <span style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{c.last_message}</span>
                                            {c.unread_count > 0 && <span style={{ background: '#2563eb', color: 'white', borderRadius: '10px', padding: '1px 8px', fontSize: '11px', fontWeight: 700 }}>{c.unread_count}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {convos.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No conversations yet</div>}
                    </div>
                </div>

                {/* Chat Area */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {showNew ? (
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>New Message</h3>

                            {/* User Search Field */}
                            <div ref={searchRef} style={{ position: 'relative', marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>To:</label>
                                {selectedUser ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#f9fafb' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#2563eb' }}>
                                            {(selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontWeight: 500, fontSize: '14px' }}>{selectedUser.name || selectedUser.email}</span>
                                            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>{selectedUser.email}</span>
                                        </div>
                                        <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#9ca3af' }}><X size={16} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                            <input
                                                placeholder="Search by name or email..."
                                                value={searchQuery}
                                                onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                                                onFocus={() => setShowSuggestions(true)}
                                                style={{ width: '100%', padding: '8px 12px 8px 34px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                                            />
                                        </div>

                                        {/* Suggestions Dropdown */}
                                        {showSuggestions && searchQuery.length >= 2 && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 10, maxHeight: '240px', overflowY: 'auto', marginTop: '4px' }}>
                                                {filteredResults.length > 0 ? filteredResults.map(u => (
                                                    <div key={u.id} onClick={() => selectUser(u)}
                                                        style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f9fafb', transition: 'background 0.1s' }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: '#7c3aed' }}>
                                                            {(u.name || u.email).charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 500, fontSize: '14px' }}>{u.name || u.email}</div>
                                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{u.email} · {u.role}</div>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No users found</div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Message Input */}
                            <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                                <input
                                    placeholder={selectedUser ? `Message ${selectedUser.name || selectedUser.email}...` : 'Select a recipient first...'}
                                    value={newMsg}
                                    onChange={e => setNewMsg(e.target.value)}
                                    disabled={!selectedUser}
                                    onKeyDown={e => { if (e.key === 'Enter') startChatWithSelected(); }}
                                    style={{ flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', opacity: selectedUser ? 1 : 0.5 }}
                                />
                                <button onClick={startChatWithSelected}
                                    disabled={!selectedUser || !newMsg.trim()}
                                    style={{ background: selectedUser && newMsg.trim() ? '#2563eb' : '#d1d5db', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: selectedUser && newMsg.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s' }}>
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    ) : activeChat ? (
                        <>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><ArrowLeft size={18} /></button>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '13px', color: '#2563eb' }}>
                                    {(activeName || 'C').charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>{activeName || convos.find(c => c.user_id === activeChat)?.user_name || 'Chat'}</span>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {msgs.map(m => (
                                    <div key={m.id} style={{ alignSelf: m.to_user_id === activeChat ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                        <div style={{ background: m.to_user_id === activeChat ? '#2563eb' : '#f3f4f6', color: m.to_user_id === activeChat ? 'white' : '#1f2937', padding: '10px 14px', borderRadius: m.to_user_id === activeChat ? '12px 12px 2px 12px' : '12px 12px 12px 2px', fontSize: '14px', lineHeight: 1.5 }}>{m.content}</div>
                                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', textAlign: m.to_user_id === activeChat ? 'right' : 'left' }}>{formatTime(m.created_at)}</div>
                                    </div>
                                ))}
                                <div ref={msgEnd} />
                            </div>
                            <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
                                <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..."
                                    onKeyDown={e => { if (e.key === 'Enter' && newMsg.trim()) send.mutate({ to_user_id: activeChat, content: newMsg }); }}
                                    style={{ flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                                <button onClick={() => { if (newMsg.trim()) send.mutate({ to_user_id: activeChat, content: newMsg }); }}
                                    style={{ background: newMsg.trim() ? '#2563eb' : '#d1d5db', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: newMsg.trim() ? 'pointer' : 'default', transition: 'background 0.15s' }}><Send size={16} /></button>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                            <div style={{ textAlign: 'center' }}>
                                <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p style={{ margin: 0, fontSize: '14px' }}>Select a conversation or start a new one</p>
                                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#d1d5db' }}>Click the + button to search for users</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
