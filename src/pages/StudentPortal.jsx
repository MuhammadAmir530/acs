import React, { useState } from 'react';
import {
    User, Calendar, Award, BarChart3, BookOpen,
    LogOut, TrendingUp, DollarSign, CheckCircle, XCircle,
    ArrowUp, ArrowDown, Minus, BookMarked, Menu, X
} from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';

const StudentPortal = ({ student, setIsLoggedIn, setCurrentPage, setLoggedInStudent }) => {
    const { schoolData, TERMS } = useSchoolData();
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedPrevTerm, setSelectedPrevTerm] = useState(0);
    const [selectedTerm, setSelectedTerm] = useState(TERMS[0] || '');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        setIsLoggedIn(false);
        setLoggedInStudent(null);
        setCurrentPage('home');
    };

    if (!student) return null;

    // Use live data from context if available (updated by teacher), otherwise use the student prop
    const studentsData = schoolData?.students;
    const liveStudent = studentsData ? studentsData.find(s => s.id === student.id) || student : student;

    // Get results for a specific term
    const getTermResults = (termLabel) => {
        return (liveStudent.results || []).filter(r => r.term === termLabel);
    };

    // Get results for the currently selected term (or all if none selected)
    const currentTermResults = selectedTerm ? getTermResults(selectedTerm) : (liveStudent.results || []);

    // Calculate grade average for selected term
    const avgPercentage = currentTermResults.length > 0
        ? (currentTermResults.reduce((sum, r) => sum + r.percentage, 0) / currentTermResults.length).toFixed(1)
        : '0.0';

    // Best & weakest subjects for selected term
    const sortedResults = [...currentTermResults].sort((a, b) => b.percentage - a.percentage);
    const bestSubject = sortedResults[0] || { subject: 'N/A', percentage: 0, obtained: 0, total: 100, grade: '-' };
    const weakestSubject = sortedResults[sortedResults.length - 1] || { subject: 'N/A', percentage: 0, obtained: 0, total: 100, grade: '-' };

    // Attendance ring helpers
    const attendancePercent = liveStudent.attendance.percentage;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (attendancePercent / 100) * circumference;
    const attendanceColor = attendancePercent >= 95 ? '#10b981' : attendancePercent >= 85 ? '#3b82f6' : attendancePercent >= 75 ? '#f59e0b' : '#ef4444';

    // Grade color helper
    const getGradeColor = (pct) => {
        if (pct >= 90) return '#10b981';
        if (pct >= 80) return '#3b82f6';
        if (pct >= 70) return '#f59e0b';
        return '#ef4444';
    };

    // Trend arrow between previous term and current selected term
    const getTrend = (subject) => {
        const prev = liveStudent.previousResults;
        if (!prev || prev.length === 0) return null;
        const lastTerm = prev[prev.length - 1].results.find(r => r.subject === subject);
        const current = currentTermResults.find(r => r.subject === subject);
        if (!lastTerm || !current) return null;
        const diff = current.percentage - lastTerm.percentage;
        if (diff > 0) return { icon: ArrowUp, color: '#10b981', diff: `+${diff}%` };
        if (diff < 0) return { icon: ArrowDown, color: '#ef4444', diff: `${diff}%` };
        return { icon: Minus, color: '#9ca3af', diff: '0%' };
    };

    // Card style
    const cardStyle = {
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.05)'
    };

    const studentTabs = [
        { id: 'overview', label: 'Dashboard', icon: BarChart3, desc: 'Your academic overview and quick stats.' },
        { id: 'results', label: 'Term Results', icon: Award, desc: 'View your detailed grades and performance.' },
        { id: 'attendance', label: 'Attendance Record', icon: Calendar, desc: 'Track your presence and absences.' },
        { id: 'history', label: 'Previous Results', icon: BookMarked, desc: 'Review your historical academic performance.' },
        { id: 'fees', label: 'Fee Status', icon: DollarSign, desc: 'Check your current fee payments.' }
    ];

    return (
        <div className="dashboard-container">
            {/* ── MOBILE OVERLAY ── */}
            <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

            {/* ── LEFT SIDEBAR ── */}
            <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)' }}>
                <div style={{ padding: '2rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #334155', position: 'relative' }}>

                    {/* Close button for mobile inside sidebar */}
                    <button className="mobile-menu-btn" style={{ position: 'absolute', top: '10px', right: '10px', color: '#f8fafc', background: 'transparent', border: 'none' }} onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>

                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 800, color: 'white',
                        border: '3px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
                    }}>
                        {liveStudent.name.charAt(0)}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#f8fafc' }}>{liveStudent.name.split(' ')[0]}</div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>{liveStudent.grade} • ID: {liveStudent.id}</div>
                    </div>
                </div>

                <nav style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ margin: '0.5rem 0 0.5rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Menu</div>

                    {studentTabs.map((tab, idx) => {
                        const tabColors = [
                            { bg: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)', shadow: 'rgba(37, 99, 235, 0.4)' },
                            { bg: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', shadow: 'rgba(16, 185, 129, 0.4)' },
                            { bg: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)', shadow: 'rgba(245, 158, 11, 0.4)' },
                            { bg: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)', shadow: 'rgba(139, 92, 246, 0.4)' },
                            { bg: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)', shadow: 'rgba(20, 184, 166, 0.4)' }
                        ];
                        const c = tabColors[idx % tabColors.length];
                        const isActive = activeTab === tab.id;

                        return (
                            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }} className="btn hover-scale" style={{
                                justifyContent: 'flex-start',
                                padding: '0.85rem 1.25rem',
                                background: isActive ? c.bg : 'transparent',
                                color: isActive ? 'white' : '#94a3b8',
                                fontWeight: isActive ? 700 : 500,
                                border: 'none',
                                boxShadow: isActive ? `0 4px 12px -3px ${c.shadow}` : 'none',
                                borderRadius: '12px',
                                width: '100%',
                                textAlign: 'left',
                                transition: 'all 0.2s ease'
                            }}>
                                <tab.icon size={20} style={{ marginRight: '0.75rem', opacity: isActive ? 1 : 0.7 }} /> {tab.label}
                            </button>
                        );
                    })}
                </nav>

                <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid #334155' }}>
                    <button onClick={handleLogout} className="btn hover-scale" style={{ width: '100%', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="dashboard-main">

                {/* Top Header Row representing the current Active Tab */}
                <header style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '1.5rem 2.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    zIndex: 5
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Menu size={24} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ color: '#2563eb' }}>{studentTabs.find(t => t.id === activeTab)?.label}</span>
                            </h1>
                            <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
                                {studentTabs.find(t => t.id === activeTab)?.desc}
                            </p>
                        </div>
                    </div>
                </header>

                <div style={{ padding: '2.5rem', width: '100%', maxWidth: '1400px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>

                    {/* ════════════════ OVERVIEW TAB ════════════════ */}
                    {activeTab === 'overview' && (
                        <div className="animate-fade-in">
                            {/* Quick Stats Row */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: '1.25rem',
                                marginBottom: '2rem'
                            }}>
                                {/* Avg Grade Card */}
                                <div style={{
                                    ...cardStyle,
                                    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                                    color: 'white', border: 'none'
                                }}>
                                    <div className="flex-between">
                                        <div>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>
                                                {avgPercentage}%
                                            </div>
                                            <div style={{ opacity: 0.9, marginTop: '0.3rem', fontSize: '0.9rem' }}>Average Grade</div>
                                        </div>
                                        <TrendingUp size={36} style={{ opacity: 0.7 }} />
                                    </div>
                                </div>

                                {/* Attendance Card */}
                                <div style={{
                                    ...cardStyle,
                                    background: 'linear-gradient(135deg, #059669, #10b981)',
                                    color: 'white', border: 'none'
                                }}>
                                    <div className="flex-between">
                                        <div>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>
                                                {liveStudent.attendance.percentage}%
                                            </div>
                                            <div style={{ opacity: 0.9, marginTop: '0.3rem', fontSize: '0.9rem' }}>Attendance Rate</div>
                                        </div>
                                        <Calendar size={36} style={{ opacity: 0.7 }} />
                                    </div>
                                </div>

                                {/* Best Subject */}
                                <div style={{
                                    ...cardStyle,
                                    background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                                    color: 'white', border: 'none'
                                }}>
                                    <div className="flex-between">
                                        <div>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>
                                                {bestSubject.percentage}%
                                            </div>
                                            <div style={{ opacity: 0.9, marginTop: '0.3rem', fontSize: '0.9rem' }}>Best: {bestSubject.subject}</div>
                                        </div>
                                        <Award size={36} style={{ opacity: 0.7 }} />
                                    </div>
                                </div>

                                {/* Fee Status */}
                                <div style={{
                                    ...cardStyle,
                                    background: liveStudent.feeStatus === 'paid'
                                        ? 'linear-gradient(135deg, #0d9488, #14b8a6)'
                                        : 'linear-gradient(135deg, #dc2626, #ef4444)',
                                    color: 'white', border: 'none'
                                }}>
                                    <div className="flex-between">
                                        <div>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, textTransform: 'uppercase' }}>
                                                {liveStudent.feeStatus || 'N/A'}
                                            </div>
                                            <div style={{ opacity: 0.9, marginTop: '0.3rem', fontSize: '0.9rem' }}>Fee Status</div>
                                        </div>
                                        <DollarSign size={36} style={{ opacity: 0.7 }} />
                                    </div>
                                </div>
                            </div>

                            {/* Two-column: Subject Performance + Attendance Ring */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 340px',
                                gap: '1.5rem'
                            }}>
                                {/* Subject Performance Cards */}
                                <div style={cardStyle}>
                                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem', color: '#1e293b' }}>
                                        📊 Subject Performance
                                    </h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                        {currentTermResults.map((result, idx) => {
                                            const trend = getTrend(result.subject);
                                            return (
                                                <div key={idx} style={{
                                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                                    padding: '0.65rem 0',
                                                    borderBottom: idx < currentTermResults.length - 1 ? '1px solid #f1f5f9' : 'none'
                                                }}>
                                                    <div style={{ width: '120px', fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>
                                                        {result.subject}
                                                    </div>
                                                    {/* Progress bar */}
                                                    <div style={{
                                                        flex: 1, height: '10px',
                                                        background: '#f1f5f9',
                                                        borderRadius: '999px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${result.percentage}%`,
                                                            height: '100%',
                                                            borderRadius: '999px',
                                                            background: `linear-gradient(90deg, ${getGradeColor(result.percentage)}, ${getGradeColor(result.percentage)}cc)`,
                                                            transition: 'width 1s ease-out'
                                                        }} />
                                                    </div>
                                                    <div style={{ width: '80px', textAlign: 'right', fontWeight: 700, color: getGradeColor(result.percentage), fontSize: '0.8rem' }}>
                                                        {result.obtained !== undefined ? `${result.obtained}/${result.total || 100}` : `${result.percentage}%`}
                                                    </div>
                                                    <span style={{
                                                        background: '#f1f5f9', borderRadius: '6px',
                                                        padding: '0.2rem 0.6rem', fontSize: '0.8rem',
                                                        fontWeight: 700, color: getGradeColor(result.percentage)
                                                    }}>
                                                        {result.grade}
                                                    </span>
                                                    {/* Trend */}
                                                    {trend && (
                                                        <span style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.2rem',
                                                            fontSize: '0.75rem', fontWeight: 600, color: trend.color
                                                        }}>
                                                            <trend.icon size={14} />
                                                            {trend.diff}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Attendance Ring */}
                                <div style={{ ...cardStyle, textAlign: 'center' }}>
                                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>
                                        📅 Attendance
                                    </h2>
                                    <svg width="140" height="140" style={{ margin: '0 auto', display: 'block' }}>
                                        <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
                                        <circle
                                            cx="70" cy="70" r={radius} fill="none"
                                            stroke={attendanceColor} strokeWidth="10"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={offset}
                                            strokeLinecap="round"
                                            transform="rotate(-90 70 70)"
                                            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
                                        />
                                        <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="800" fill="#1e293b">
                                            {attendancePercent}%
                                        </text>
                                        <text x="70" y="84" textAnchor="middle" fontSize="10" fill="#64748b">
                                            Attendance
                                        </text>
                                    </svg>

                                    <div style={{
                                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                                        gap: '0.75rem', marginTop: '1.25rem'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                                                {liveStudent.attendance.present}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Present</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>
                                                {liveStudent.attendance.absent}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Absent</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>
                                                {liveStudent.attendance.total}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ════════════════ RESULTS TAB ════════════════ */}
                    {activeTab === 'results' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
                                📝 Term Results
                            </h2>
                            <p style={{ color: '#64748b', marginBottom: '1rem' }}>Your academic performance separated by term</p>

                            {/* Term selector */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                {TERMS.map(t => {
                                    const termRes = getTermResults(t);
                                    const hasData = termRes.length > 0;
                                    return (
                                        <button
                                            key={t}
                                            onClick={() => setSelectedTerm(t)}
                                            style={{
                                                padding: '0.6rem 1.5rem',
                                                borderRadius: '999px',
                                                fontWeight: 700,
                                                fontSize: '0.9rem',
                                                border: selectedTerm === t ? '2px solid #2563eb' : '2px solid #e2e8f0',
                                                background: selectedTerm === t ? '#2563eb' : 'white',
                                                color: selectedTerm === t ? 'white' : '#475569',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                opacity: hasData ? 1 : 0.5
                                            }}
                                        >
                                            {t} {hasData ? `(${termRes.length})` : '(No data)'}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Summary bar */}
                            <div style={{
                                ...cardStyle,
                                display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap',
                                gap: '1rem', marginBottom: '1.5rem',
                                background: 'linear-gradient(135deg, #f0f9ff, #eff6ff)',
                                border: '1px solid #bfdbfe'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb' }}>{avgPercentage}%</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Average</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{bestSubject.subject}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Highest ({bestSubject.percentage}%)</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{weakestSubject.subject}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Needs Focus ({weakestSubject.obtained !== undefined ? `${weakestSubject.obtained}/${weakestSubject.total}` : `${weakestSubject.percentage}%`})</div>
                                </div>
                            </div>

                            {/* Subject Cards Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '1.25rem'
                            }}>
                                {currentTermResults.length > 0 ? currentTermResults.map((result, idx) => {
                                    const trend = getTrend(result.subject);
                                    return (
                                        <div key={idx} style={{
                                            ...cardStyle,
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            {/* Colored top accent */}
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                                                background: getGradeColor(result.percentage)
                                            }} />
                                            <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
                                                    {result.subject}
                                                </h3>
                                                <span style={{
                                                    background: getGradeColor(result.percentage) + '1a',
                                                    color: getGradeColor(result.percentage),
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700
                                                }}>
                                                    {result.grade}
                                                </span>
                                            </div>

                                            {/* Large percentage */}
                                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getGradeColor(result.percentage), marginBottom: '0.2rem' }}>
                                                {result.percentage}%
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>
                                                {result.obtained !== undefined ? `${result.obtained} / ${result.total || 100}` : 'Marks obtained'}
                                            </div>

                                            {/* Progress bar */}
                                            <div style={{
                                                height: '8px', background: '#f1f5f9',
                                                borderRadius: '999px', overflow: 'hidden',
                                                marginBottom: '0.75rem'
                                            }}>
                                                <div style={{
                                                    width: `${result.percentage}%`,
                                                    height: '100%',
                                                    borderRadius: '999px',
                                                    background: getGradeColor(result.percentage),
                                                    transition: 'width 1s ease-out'
                                                }} />
                                            </div>

                                            {/* Trend comparison */}
                                            {trend && (
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                    fontSize: '0.8rem', color: trend.color, fontWeight: 600
                                                }}>
                                                    <trend.icon size={14} />
                                                    {trend.diff} from last term
                                                </div>
                                            )}
                                        </div>
                                    );
                                }) : (
                                    <div style={{
                                        ...cardStyle,
                                        textAlign: 'center',
                                        padding: '3rem',
                                        color: '#94a3b8',
                                        gridColumn: '1 / -1'
                                    }}>
                                        <Award size={48} style={{ margin: '0 auto 1rem', color: '#cbd5e1' }} />
                                        <p style={{ fontWeight: 600 }}>No results available for {selectedTerm} yet.</p>
                                        <p style={{ fontSize: '0.85rem' }}>Results will appear here once your teacher enters marks for this term.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ════════════════ ATTENDANCE TAB ════════════════ */}
                    {activeTab === 'attendance' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
                                📅 Attendance Record
                            </h2>
                            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Detailed breakdown of your attendance this academic year</p>

                            {/* Big ring + stat grid side by side */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1.5rem',
                                marginBottom: '2rem'
                            }}>
                                {/* Ring card */}
                                <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="200" height="200">
                                        <circle cx="100" cy="100" r="80" fill="none" stroke="#f1f5f9" strokeWidth="14" />
                                        <circle
                                            cx="100" cy="100" r="80" fill="none"
                                            stroke={attendanceColor} strokeWidth="14"
                                            strokeDasharray={2 * Math.PI * 80}
                                            strokeDashoffset={2 * Math.PI * 80 - (attendancePercent / 100) * 2 * Math.PI * 80}
                                            strokeLinecap="round"
                                            transform="rotate(-90 100 100)"
                                            style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                                        />
                                        <text x="100" y="94" textAnchor="middle" fontSize="32" fontWeight="800" fill="#1e293b">
                                            {attendancePercent}%
                                        </text>
                                        <text x="100" y="118" textAnchor="middle" fontSize="13" fill="#94a3b8">
                                            Attendance Rate
                                        </text>
                                    </svg>
                                    <p style={{
                                        marginTop: '1rem', fontSize: '0.95rem', color: '#64748b',
                                        fontWeight: 500, textAlign: 'center'
                                    }}>
                                        {attendancePercent >= 95
                                            ? '🌟 Outstanding attendance! Keep it up!'
                                            : attendancePercent >= 85
                                                ? '👍 Good attendance. Try to improve further!'
                                                : '⚠️ Attendance needs improvement. Please be regular.'}
                                    </p>
                                </div>

                                {/* Stat cards */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {[
                                        {
                                            label: 'Days Present', value: liveStudent.attendance.present,
                                            color: '#10b981', bg: '#ecfdf5', icon: CheckCircle,
                                            desc: 'Days you attended classes'
                                        },
                                        {
                                            label: 'Days Absent', value: liveStudent.attendance.absent,
                                            color: '#ef4444', bg: '#fef2f2', icon: XCircle,
                                            desc: 'Days you were absent'
                                        },
                                        {
                                            label: 'Total School Days', value: liveStudent.attendance.total,
                                            color: '#3b82f6', bg: '#eff6ff', icon: Calendar,
                                            desc: 'Total working days this year'
                                        }
                                    ].map((stat, idx) => (
                                        <div key={idx} style={{
                                            ...cardStyle,
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            background: stat.bg,
                                            border: `1px solid ${stat.color}25`
                                        }}>
                                            <div style={{
                                                width: '52px', height: '52px', borderRadius: '14px',
                                                background: stat.color + '20',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <stat.icon size={24} color={stat.color} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                                                    {stat.value}
                                                </div>
                                                <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>{stat.label}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{stat.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Attendance bar visual */}
                            <div style={cardStyle}>
                                <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>Attendance Breakdown</h3>
                                <div style={{
                                    height: '32px', borderRadius: '999px', overflow: 'hidden',
                                    display: 'flex', background: '#f1f5f9'
                                }}>
                                    <div style={{
                                        width: `${(liveStudent.attendance.present / liveStudent.attendance.total * 100).toFixed(1)}%`,
                                        background: 'linear-gradient(90deg, #10b981, #34d399)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontSize: '0.75rem', fontWeight: 700,
                                        transition: 'width 1s ease-out'
                                    }}>
                                        Present {(liveStudent.attendance.present / liveStudent.attendance.total * 100).toFixed(1)}%
                                    </div>
                                    <div style={{
                                        width: `${(liveStudent.attendance.absent / liveStudent.attendance.total * 100).toFixed(1)}%`,
                                        background: 'linear-gradient(90deg, #ef4444, #f87171)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontSize: '0.75rem', fontWeight: 700,
                                        transition: 'width 1s ease-out'
                                    }}>
                                        {liveStudent.attendance.absent > 0 ? 'Absent' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ════════════════ PREVIOUS RESULTS TAB ════════════════ */}
                    {activeTab === 'history' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
                                📚 Previous Results
                            </h2>
                            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Review your performance across past terms</p>

                            {/* Term selector */}
                            {liveStudent.previousResults && liveStudent.previousResults.length > 0 ? (
                                <>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                        {liveStudent.previousResults.map((term, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedPrevTerm(idx)}
                                                style={{
                                                    padding: '0.6rem 1.5rem',
                                                    borderRadius: '999px',
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem',
                                                    border: selectedPrevTerm === idx ? '2px solid #2563eb' : '2px solid #e2e8f0',
                                                    background: selectedPrevTerm === idx ? '#2563eb' : 'white',
                                                    color: selectedPrevTerm === idx ? 'white' : '#475569',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {term.term}
                                            </button>
                                        ))}
                                        {/* Also add current term button */}
                                        <button
                                            onClick={() => setSelectedPrevTerm(-1)}
                                            style={{
                                                padding: '0.6rem 1.5rem',
                                                borderRadius: '999px',
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                border: selectedPrevTerm === -1 ? '2px solid #10b981' : '2px solid #e2e8f0',
                                                background: selectedPrevTerm === -1 ? '#10b981' : 'white',
                                                color: selectedPrevTerm === -1 ? 'white' : '#475569',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            📌 Current Term
                                        </button>
                                    </div>

                                    {/* Results Table */}
                                    {(() => {
                                        const termResults = selectedPrevTerm === -1
                                            ? liveStudent.results
                                            : liveStudent.previousResults[selectedPrevTerm].results;
                                        const termAvg = (termResults.reduce((s, r) => s + r.percentage, 0) / termResults.length).toFixed(1);

                                        return (
                                            <>
                                                {/* Term average banner */}
                                                <div style={{
                                                    ...cardStyle,
                                                    background: 'linear-gradient(135deg, #1e293b, #334155)',
                                                    color: 'white',
                                                    marginBottom: '1.5rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    flexWrap: 'wrap',
                                                    gap: '1rem'
                                                }}>
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                                                            {selectedPrevTerm === -1 ? 'Current Term' : liveStudent.previousResults[selectedPrevTerm].term}
                                                        </div>
                                                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                                                            Average: {termAvg}%
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        fontSize: '3rem', fontWeight: 800,
                                                        background: 'rgba(255,255,255,0.1)',
                                                        borderRadius: '16px',
                                                        padding: '0.5rem 1.5rem'
                                                    }}>
                                                        {termAvg >= 90 ? 'A' : termAvg >= 80 ? 'B' : termAvg >= 70 ? 'C' : 'D'}
                                                    </div>
                                                </div>

                                                {/* Subject cards */}
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                                    gap: '1.25rem'
                                                }}>
                                                    {termResults.map((result, idx) => (
                                                        <div key={idx} style={{
                                                            ...cardStyle,
                                                            position: 'relative',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                                                                background: getGradeColor(result.percentage)
                                                            }} />
                                                            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                                                <h3 style={{ fontWeight: 700, color: '#1e293b' }}>{result.subject}</h3>
                                                                <span style={{
                                                                    background: getGradeColor(result.percentage) + '1a',
                                                                    color: getGradeColor(result.percentage),
                                                                    padding: '0.2rem 0.7rem',
                                                                    borderRadius: '999px',
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: 700
                                                                }}>{result.grade}</span>
                                                            </div>
                                                            <div style={{
                                                                fontSize: '2rem', fontWeight: 800,
                                                                color: getGradeColor(result.percentage), marginBottom: '0.5rem'
                                                            }}>
                                                                {result.percentage}%
                                                            </div>
                                                            <div style={{
                                                                height: '6px', background: '#f1f5f9',
                                                                borderRadius: '999px', overflow: 'hidden'
                                                            }}>
                                                                <div style={{
                                                                    width: `${result.percentage}%`,
                                                                    height: '100%',
                                                                    borderRadius: '999px',
                                                                    background: getGradeColor(result.percentage),
                                                                    transition: 'width 0.8s ease-out'
                                                                }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </>
                            ) : (
                                <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    No previous results available.
                                </div>
                            )}
                        </div>
                    )}

                    {/* ════════════════ FEE STATUS TAB ════════════════ */}
                    {activeTab === 'fees' && (() => {
                        const feeHistory = liveStudent.feeHistory || [];
                        const unpaidMonths = feeHistory.filter(h => h.status === 'unpaid');
                        const paidMonths = feeHistory.filter(h => h.status === 'paid');

                        return (
                            <div className="animate-fade-in">
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
                                    💰 Fee History
                                </h2>
                                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Your month-by-month fee payment records</p>

                                {/* Summary banner */}
                                {unpaidMonths.length > 0 ? (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                                        border: '1px solid #fca5a5',
                                        borderRadius: '14px',
                                        padding: '1.25rem 1.5rem',
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        <XCircle size={32} style={{ color: '#dc2626', flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '1.1rem' }}>
                                                ⚠ {unpaidMonths.length} Month{unpaidMonths.length > 1 ? 's' : ''} Overdue
                                            </div>
                                            <div style={{ color: '#9f1239', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                                                Please contact the school office to clear your dues: {unpaidMonths.map(h => h.month).join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                ) : feeHistory.length > 0 ? (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                                        border: '1px solid #86efac',
                                        borderRadius: '14px',
                                        padding: '1.25rem 1.5rem',
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}>
                                        <CheckCircle size={32} style={{ color: '#16a34a', flexShrink: 0 }} />
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#16a34a', fontSize: '1.1rem' }}>All Fees Cleared!</div>
                                            <div style={{ color: '#166534', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                                                All {paidMonths.length} month{paidMonths.length > 1 ? 's' : ''} paid. Thank you!
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Stats */}
                                {feeHistory.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                        {[
                                            { label: 'Total Months', val: feeHistory.length, color: '#2563eb', bg: '#eff6ff' },
                                            { label: 'Paid', val: paidMonths.length, color: '#16a34a', bg: '#f0fdf4' },
                                            { label: 'Unpaid / Dues', val: unpaidMonths.length, color: '#dc2626', bg: '#fef2f2' },
                                        ].map(s => (
                                            <div key={s.label} style={{ background: s.bg, borderRadius: '10px', padding: '0.85rem', textAlign: 'center', border: `1px solid ${s.color}22` }}>
                                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '0.1rem' }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Month cards */}
                                {feeHistory.length === 0 ? (
                                    <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                        <DollarSign size={48} style={{ margin: '0 auto 1rem', color: '#cbd5e1' }} />
                                        <p style={{ fontWeight: 600 }}>No fee records yet.</p>
                                        <p style={{ fontSize: '0.85rem' }}>Your monthly fee history will appear here once the school opens fee months.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                                        {[...feeHistory].reverse().map(h => (
                                            <div key={h.month} style={{
                                                ...cardStyle,
                                                border: `1.5px solid ${h.status === 'paid' ? '#86efac' : '#fca5a5'}`,
                                                background: h.status === 'paid' ? '#f0fdf4' : '#fef2f2',
                                                padding: '1.25rem'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{h.month}</div>
                                                    <span style={{
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '999px',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 800,
                                                        background: h.status === 'paid' ? '#dcfce7' : '#fee2e2',
                                                        color: h.status === 'paid' ? '#16a34a' : '#dc2626'
                                                    }}>
                                                        {h.status === 'paid' ? '✓ PAID' : '✗ UNPAID'}
                                                    </span>
                                                </div>
                                                {h.status === 'paid' && h.paidOn ? (
                                                    <div style={{ fontSize: '0.8rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <CheckCircle size={12} /> Paid on {h.paidOn}
                                                    </div>
                                                ) : h.status === 'unpaid' ? (
                                                    <div style={{ fontSize: '0.8rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <XCircle size={12} /> Contact school office
                                                    </div>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </main>
        </div>
    );
};

export default StudentPortal;
