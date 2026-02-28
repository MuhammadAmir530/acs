import React from 'react';
import { Download } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const AttendanceTab = ({
    students, selectedClass, setSelectedClass, sectionClasses,
    attDateFilter, setAttDateFilter,
    markAttendance, removeAttendanceRecord, exportAttendanceExcel,
    fetchData, showSaveMessage, openConfirm,
}) => {
    const today = new Date().toISOString().split('T')[0];
    const filterDate = attDateFilter || today;
    const classStudents = students
        .filter(s => s.grade === selectedClass)
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    const totalDays = [...new Set(
        classStudents.flatMap(s => (s.attendance?.records || []).map(r => r.date))
    )].length;

    const excelBtnStyle = { padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-semibold)', border: '2px solid', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', transition: 'all var(--transition-base)' };

    const markAll = async (status) => {
        for (const s of classStudents) {
            const oldAtt = s.attendance || {};
            const records = [...(oldAtt.records || [])];
            const idx = records.findIndex(r => r.date === filterDate);
            if (idx >= 0) records[idx] = { date: filterDate, status };
            else records.push({ date: filterDate, status });
            const present = records.filter(r => r.status === 'present').length;
            const absent = records.length - present;
            await supabase.from('students').update({ attendance: { records, total: records.length, present, absent, percentage: parseFloat(((present / records.length) * 100).toFixed(1)) } }).eq('id', s.id);
        }
        fetchData();
        showSaveMessage(`All ${classStudents.length} students marked ${status === 'present' ? 'Present' : 'Absent'} for ${filterDate}!`);
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b' }}>📅 Attendance</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Day-by-day attendance tracking — {totalDays} school day{totalDays !== 1 ? 's' : ''} recorded</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select className="form-input" style={{ padding: '0.5rem 0.8rem', minWidth: '150px' }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                        {sectionClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="date" value={attDateFilter} onChange={e => setAttDateFilter(e.target.value)} className="form-input" style={{ padding: '0.5rem 0.8rem' }} />
                    <button onClick={exportAttendanceExcel} style={{ ...excelBtnStyle, background: '#217346', color: 'white', borderColor: '#217346' }}>
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Mark All */}
            <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>Mark Entire Class for: <span style={{ color: '#2563eb' }}>{filterDate}</span></div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Click to mark all {classStudents.length} students at once</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => markAll('present')} style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>✓ All Present</button>
                    <button onClick={() => markAll('absent')} style={{ padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>✗ All Absent</button>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'linear-gradient(to right, #f8fafc, #edf2f7)', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Student</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Today ({filterDate})</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Overall %</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Recent Records</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classStudents.map(student => {
                            const records = (student.attendance?.records || []).sort((a, b) => b.date.localeCompare(a.date));
                            const todayRecord = records.find(r => r.date === filterDate);
                            const pct = student.attendance?.percentage || 0;
                            const pctColor = pct >= 90 ? '#16a34a' : pct >= 75 ? '#2563eb' : pct >= 60 ? '#d97706' : '#dc2626';
                            return (
                                <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.85rem 1rem', minWidth: '160px' }}>
                                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{student.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{student.id}</div>
                                    </td>
                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', minWidth: '140px' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                            <button onClick={() => markAttendance(student.id, 'present')} title="Mark Present"
                                                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: todayRecord?.status === 'present' ? '#16a34a' : '#dcfce7', color: todayRecord?.status === 'present' ? 'white' : '#16a34a', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>✓ P</button>
                                            <button onClick={() => markAttendance(student.id, 'absent')} title="Mark Absent"
                                                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: todayRecord?.status === 'absent' ? '#dc2626' : '#fee2e2', color: todayRecord?.status === 'absent' ? 'white' : '#dc2626', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>✗ A</button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.85rem 1rem', minWidth: '130px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: pctColor, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                            </div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: pctColor, minWidth: '38px' }}>{pct}%</span>
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                                            {student.attendance?.present || 0}P / {student.attendance?.absent || 0}A / {student.attendance?.total || 0} days
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.85rem 1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', maxWidth: '360px' }}>
                                            {records.slice(0, 10).map(r => (
                                                <span key={r.date} title={`${r.date} — click to remove`}
                                                    onClick={() => openConfirm('Remove Record', `Remove attendance record for ${student.name} on ${r.date}?`, () => removeAttendanceRecord(student.id, r.date), false)}
                                                    style={{ padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', background: r.status === 'present' ? '#dcfce7' : '#fee2e2', color: r.status === 'present' ? '#15803d' : '#dc2626', border: `1px solid ${r.status === 'present' ? '#86efac' : '#fca5a5'}` }}>
                                                    {r.date.slice(5)} {r.status === 'present' ? '✓' : '✗'}
                                                </span>
                                            ))}
                                            {records.length > 10 && <span style={{ fontSize: '0.68rem', color: '#94a3b8', padding: '0.15rem 0.4rem' }}>+{records.length - 10} more</span>}
                                            {records.length === 0 && <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontStyle: 'italic' }}>No records yet</span>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceTab;
