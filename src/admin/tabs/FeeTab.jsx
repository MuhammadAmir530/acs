import React from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';

const FeeTab = ({
    students, selectedClass, setSelectedClass, sectionClasses,
    openNewFeeMonth, toggleMonthFeeStatus, markAllPaidForMonth,
    markAllUnpaidForMonth, deleteFeeMonth,
}) => {
    const classStudents = students
        .filter(s => s.grade === selectedClass)
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    const allMonths = [...new Set(classStudents.flatMap(s => (s.feeHistory || []).map(h => h.month)))];
    const totalEntries = classStudents.reduce((sum, s) => sum + (s.feeHistory || []).length, 0);
    const totalPaid = classStudents.reduce((sum, s) => sum + (s.feeHistory || []).filter(h => h.status === 'paid').length, 0);
    const totalUnpaid = totalEntries - totalPaid;
    const studentsWithDues = classStudents.filter(s => (s.feeHistory || []).some(h => h.status === 'unpaid')).length;

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b' }}>💰 Fee Management</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Track monthly fee payments for each student</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select className="form-input" style={{ padding: '0.5rem 0.8rem', minWidth: '160px' }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                        {sectionClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={openNewFeeMonth} className="btn btn-primary" style={{ gap: '0.4rem', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                        <PlusCircle size={16} /> Open New Month
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Students', val: classStudents.length, color: '#2563eb', bg: '#eff6ff' },
                    { label: 'Months Tracked', val: allMonths.length, color: '#7c3aed', bg: '#f5f3ff' },
                    { label: 'Paid Entries', val: totalPaid, color: '#16a34a', bg: '#f0fdf4' },
                    { label: 'Unpaid Entries', val: totalUnpaid, color: '#dc2626', bg: '#fef2f2' },
                    { label: 'Students with Dues', val: studentsWithDues, color: '#b45309', bg: '#fffbeb' },
                ].map(stat => (
                    <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.color}22`, borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.val}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '0.2rem' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {allMonths.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                    <h3 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>No Fee Months Opened Yet</h3>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Click "Open New Month" to start tracking fees for {selectedClass}.</p>
                    <button onClick={openNewFeeMonth} className="btn btn-primary">
                        <PlusCircle size={16} /> Open {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </button>
                </div>
            ) : (
                <>
                    {/* Month cards */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {allMonths.map(month => {
                            const paidCount = classStudents.filter(s => (s.feeHistory || []).some(h => h.month === month && h.status === 'paid')).length;
                            const unpaidCount = classStudents.filter(s => (s.feeHistory || []).some(h => h.month === month && h.status === 'unpaid')).length;
                            const allPaid = unpaidCount === 0;
                            return (
                                <div key={month} style={{ background: allPaid ? '#f0fdf4' : '#fef2f2', border: `1px solid ${allPaid ? '#86efac' : '#fca5a5'}`, borderRadius: '12px', padding: '0.9rem 1.1rem', minWidth: '200px' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginBottom: '0.5rem' }}>{month}</div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                                        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>✓ {paidCount} Paid</span>
                                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>✗ {unpaidCount} Unpaid</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button onClick={() => markAllPaidForMonth(month)} style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', fontWeight: 700, background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>All Paid</button>
                                        <button onClick={() => markAllUnpaidForMonth(month)} style={{ flex: 1, padding: '0.3rem', fontSize: '0.7rem', fontWeight: 700, background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Reset</button>
                                        <button onClick={() => deleteFeeMonth(month)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Student table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                            <thead>
                                <tr style={{ background: 'linear-gradient(to right, #f8fafc, #edf2f7)', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Student</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Dues</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>Month-by-Month History (click to toggle)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classStudents.map(student => {
                                    const history = student.feeHistory || [];
                                    const unpaidMonths = history.filter(h => h.status === 'unpaid');
                                    return (
                                        <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', background: unpaidMonths.length > 0 ? '#fffbeb' : 'white' }}>
                                            <td style={{ padding: '0.85rem 1rem', minWidth: '160px' }}>
                                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{student.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{student.id}</div>
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem', minWidth: '100px' }}>
                                                {unpaidMonths.length > 0 ? (
                                                    <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                        ⚠ {unpaidMonths.length} Due{unpaidMonths.length > 1 ? 's' : ''}
                                                    </span>
                                                ) : (
                                                    <span style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700 }}>✓ Clear</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.85rem 1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                    {history.length === 0 ? (
                                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>No records yet</span>
                                                    ) : (
                                                        history.map(h => (
                                                            <button key={h.month} onClick={() => toggleMonthFeeStatus(student.id, h.month)}
                                                                title={h.status === 'paid' ? `Paid — click to mark unpaid` : `Unpaid — click to mark paid`}
                                                                style={{ padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.73rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: h.status === 'paid' ? '#dcfce7' : '#fee2e2', color: h.status === 'paid' ? '#16a34a' : '#dc2626', transition: 'all 0.15s ease', whiteSpace: 'nowrap' }}
                                                                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                                                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                                                {h.status === 'paid' ? '✓' : '✗'} {h.month}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default FeeTab;
