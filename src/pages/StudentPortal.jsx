import React, { useState } from 'react';
import {
    User, Calendar, Award, BarChart3, BookOpen,
    LogOut, TrendingUp, DollarSign, CheckCircle, XCircle
} from 'lucide-react';

const StudentPortal = ({ student, studentsData, setIsLoggedIn, setCurrentPage, setLoggedInStudent }) => {
    const [activeTab, setActiveTab] = useState('overview');

    const handleLogout = () => {
        setIsLoggedIn(false);
        setLoggedInStudent(null);
        setCurrentPage('home');
    };

    if (!student) return null;

    // Use live data from studentsData if available (updated by teacher), otherwise use the student prop
    const liveStudent = studentsData ? studentsData.find(s => s.id === student.id) || student : student;

    // Calculate grade average
    const avgPercentage = (
        liveStudent.results.reduce((sum, r) => sum + r.percentage, 0) / liveStudent.results.length
    ).toFixed(1);

    return (
        <div style={{ background: 'var(--color-gray-50)', minHeight: 'calc(100vh - 80px)' }}>
            {/* Header */}
            <section style={{
                background: 'var(--gradient-primary)',
                color: 'white',
                padding: '3rem 0 2rem'
            }}>
                <div className="container">
                    <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 style={{
                                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                                fontWeight: 'var(--font-weight-bold)',
                                marginBottom: '0.5rem'
                            }}>
                                Welcome, {liveStudent.name.split(' ')[0]}!
                            </h1>
                            <p style={{ opacity: 0.95 }}>{liveStudent.grade}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn"
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '2px solid white'
                            }}
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>
            </section>

            {/* Navigation Tabs */}
            <section className="bg-white" style={{
                borderBottom: '1px solid var(--color-gray-200)',
                position: 'sticky',
                top: '80px',
                zIndex: 10
            }}>
                <div className="container">
                    <div className="flex gap-1" style={{
                        overflowX: 'auto',
                        padding: '0.5rem 0'
                    }}>
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'results', label: 'Results', icon: Award },
                            { id: 'attendance', label: 'Attendance', icon: Calendar },
                            { id: 'fees', label: 'Fee Status', icon: DollarSign }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="flex gap-2"
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-gray-600)',
                                    borderBottom: activeTab === tab.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                                    transition: 'all var(--transition-base)',
                                    whiteSpace: 'nowrap',
                                    alignItems: 'center'
                                }}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="section">
                <div className="container">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="animate-fade-in">
                            <div className="grid grid-cols-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
                                <div className="card" style={{ background: 'var(--color-primary)', color: 'white' }}>
                                    <div className="flex-between">
                                        <div>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 'var(--font-weight-bold)' }}>
                                                {avgPercentage}%
                                            </div>
                                            <div style={{ opacity: 0.9 }}>Average Grade</div>
                                        </div>
                                        <TrendingUp size={40} style={{ opacity: 0.8 }} />
                                    </div>
                                </div>

                                <div className="card" style={{ background: 'var(--color-success)', color: 'white' }}>
                                    <div className="flex-between">
                                        <div>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 'var(--font-weight-bold)' }}>
                                                {liveStudent.attendance.percentage}%
                                            </div>
                                            <div style={{ opacity: 0.9 }}>Attendance</div>
                                        </div>
                                        <Calendar size={40} style={{ opacity: 0.8 }} />
                                    </div>
                                </div>

                                <div className="card" style={{ background: liveStudent.feeStatus === 'paid' ? 'var(--color-secondary)' : 'var(--color-danger)', color: 'white' }}>
                                    <div className="flex-between">
                                        <div>
                                            <div style={{ fontSize: '2.5rem', fontWeight: 'var(--font-weight-bold)', textTransform: 'uppercase' }}>
                                                {liveStudent.feeStatus || 'N/A'}
                                            </div>
                                            <div style={{ opacity: 0.9 }}>Fee Status</div>
                                        </div>
                                        <DollarSign size={40} style={{ opacity: 0.8 }} />
                                    </div>
                                </div>
                            </div>

                            <h2 style={{
                                fontSize: '1.75rem',
                                fontWeight: 'var(--font-weight-bold)',
                                marginBottom: '1.5rem'
                            }}>
                                Recent Results
                            </h2>
                            <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                                {liveStudent.results.slice(0, 4).map((result, idx) => (
                                    <div key={idx} className="card">
                                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontWeight: 'var(--font-weight-bold)' }}>
                                                {result.subject}
                                            </h3>
                                            <span className="badge badge-primary">{result.grade}</span>
                                        </div>
                                        <div style={{
                                            background: 'var(--color-gray-100)',
                                            borderRadius: 'var(--radius-full)',
                                            height: '8px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${result.percentage}%`,
                                                height: '100%',
                                                background: 'var(--gradient-primary)',
                                                transition: 'width 1s ease-out'
                                            }} />
                                        </div>
                                        <div style={{
                                            marginTop: '0.5rem',
                                            fontSize: '0.875rem',
                                            color: 'var(--color-gray-600)'
                                        }}>
                                            {result.percentage}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results Tab */}
                    {activeTab === 'results' && (
                        <div className="animate-fade-in">
                            <h2 style={{
                                fontSize: '1.75rem',
                                fontWeight: 'var(--font-weight-bold)',
                                marginBottom: '1.5rem'
                            }}>
                                Academic Results
                            </h2>
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-gray-50)' }}>
                                            <th style={{
                                                padding: '1rem',
                                                textAlign: 'left',
                                                fontWeight: 'var(--font-weight-bold)',
                                                color: 'var(--color-gray-900)'
                                            }}>
                                                Subject
                                            </th>
                                            <th style={{
                                                padding: '1rem',
                                                textAlign: 'center',
                                                fontWeight: 'var(--font-weight-bold)',
                                                color: 'var(--color-gray-900)'
                                            }}>
                                                Grade
                                            </th>
                                            <th style={{
                                                padding: '1rem',
                                                textAlign: 'center',
                                                fontWeight: 'var(--font-weight-bold)',
                                                color: 'var(--color-gray-900)'
                                            }}>
                                                Percentage
                                            </th>
                                            <th style={{
                                                padding: '1rem',
                                                textAlign: 'right',
                                                fontWeight: 'var(--font-weight-bold)',
                                                color: 'var(--color-gray-900)'
                                            }}>
                                                Performance
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {liveStudent.results.map((result, idx) => (
                                            <tr
                                                key={idx}
                                                style={{
                                                    borderTop: '1px solid var(--color-gray-200)',
                                                    transition: 'background var(--transition-base)'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-gray-50)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '1rem', fontWeight: 'var(--font-weight-medium)' }}>
                                                    {result.subject}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span className="badge badge-primary">{result.grade}</span>
                                                </td>
                                                <td style={{
                                                    padding: '1rem',
                                                    textAlign: 'center',
                                                    fontWeight: 'var(--font-weight-bold)',
                                                    color: 'var(--color-primary)'
                                                }}>
                                                    {result.percentage}%
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{
                                                        background: 'var(--color-gray-100)',
                                                        borderRadius: 'var(--radius-full)',
                                                        height: '8px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${result.percentage}%`,
                                                            height: '100%',
                                                            background: result.percentage >= 90 ? 'var(--color-success)' :
                                                                result.percentage >= 70 ? 'var(--color-primary)' : 'var(--color-accent)'
                                                        }} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Attendance Tab */}
                    {activeTab === 'attendance' && (
                        <div className="animate-fade-in">
                            <h2 style={{
                                fontSize: '1.75rem',
                                fontWeight: 'var(--font-weight-bold)',
                                marginBottom: '1.5rem'
                            }}>
                                Attendance Record
                            </h2>

                            <div className="grid grid-cols-3" style={{ gap: '2rem', marginBottom: '2rem' }}>
                                <div className="card text-center">
                                    <div style={{
                                        fontSize: '3rem',
                                        fontWeight: 'var(--font-weight-extrabold)',
                                        color: 'var(--color-success)'
                                    }}>
                                        {liveStudent.attendance.present}
                                    </div>
                                    <div style={{ color: 'var(--color-gray-600)' }}>Days Present</div>
                                </div>

                                <div className="card text-center">
                                    <div style={{
                                        fontSize: '3rem',
                                        fontWeight: 'var(--font-weight-extrabold)',
                                        color: 'var(--color-danger)'
                                    }}>
                                        {liveStudent.attendance.absent}
                                    </div>
                                    <div style={{ color: 'var(--color-gray-600)' }}>Days Absent</div>
                                </div>

                                <div className="card text-center">
                                    <div style={{
                                        fontSize: '3rem',
                                        fontWeight: 'var(--font-weight-extrabold)',
                                        color: 'var(--color-primary)'
                                    }}>
                                        {liveStudent.attendance.percentage}%
                                    </div>
                                    <div style={{ color: 'var(--color-gray-600)' }}>Attendance Rate</div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Fee Status Tab */}
                    {activeTab === 'fees' && (
                        <div className="animate-fade-in">
                            <h2 style={{
                                fontSize: '1.75rem',
                                fontWeight: 'var(--font-weight-bold)',
                                marginBottom: '1.5rem'
                            }}>
                                Fee Status
                            </h2>

                            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                                <div className="flex-center" style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: liveStudent.feeStatus === 'paid' ? 'var(--color-success)' : 'var(--color-danger)',
                                    color: 'white',
                                    margin: '0 auto 1.5rem'
                                }}>
                                    {liveStudent.feeStatus === 'paid' ? <CheckCircle size={40} /> : <XCircle size={40} />}
                                </div>

                                <div style={{
                                    fontSize: '2rem',
                                    fontWeight: 'var(--font-weight-bold)',
                                    color: liveStudent.feeStatus === 'paid' ? 'var(--color-success)' : 'var(--color-danger)',
                                    textTransform: 'uppercase',
                                    marginBottom: '0.5rem'
                                }}>
                                    {liveStudent.feeStatus || 'N/A'}
                                </div>

                                <p style={{ color: 'var(--color-gray-600)', fontSize: '1.1rem' }}>
                                    {liveStudent.feeStatus === 'paid'
                                        ? 'Your fees have been paid. Thank you!'
                                        : 'Your fees are pending. Please contact the school office.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default StudentPortal;
