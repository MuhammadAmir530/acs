import React, { useState } from 'react';
import { Download, Printer, X, ChevronDown } from 'lucide-react';
import { supabase } from '../../supabaseClient';

/* ─────────────────────────────────────────────
   PRINT HELPER  – opens a new window with a
   fully-styled, printer-ready HTML document.
───────────────────────────────────────────── */
function openPrintWindow(htmlBody, title = 'Attendance Report') {
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;color:#0f172a;background:#fff;padding:32px 40px;font-size:13px}
  .report-header{display:flex;align-items:center;gap:20px;border-bottom:3px solid #1e3a5f;padding-bottom:16px;margin-bottom:22px}
  .school-badge{width:54px;height:54px;background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;flex-shrink:0}
  .school-name{font-size:20px;font-weight:800;color:#1e3a5f;line-height:1.2}
  .school-sub{font-size:11px;color:#64748b;margin-top:3px;font-weight:500}
  .report-title{text-align:right;margin-left:auto}
  .report-title h2{font-size:18px;font-weight:700;color:#1e3a5f}
  .report-title p{font-size:11px;color:#64748b;margin-top:4px}
  .meta-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
  .meta-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;text-align:center}
  .meta-card .val{font-size:22px;font-weight:800;color:#1e3a5f}
  .meta-card .lbl{font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
  .meta-card.green .val{color:#15803d} .meta-card.red .val{color:#dc2626} .meta-card.amber .val{color:#b45309}
  table{width:100%;border-collapse:collapse;margin-bottom:22px}
  thead tr{background:#1e3a5f;color:#fff}
  thead th{padding:8px 10px;font-size:11px;font-weight:700;text-align:left;text-transform:uppercase;letter-spacing:.3px}
  tbody tr:nth-child(even){background:#f8fafc}
  tbody td{padding:7px 10px;font-size:12px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
  .badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700}
  .badge.present{background:#dcfce7;color:#15803d}
  .badge.absent{background:#fee2e2;color:#dc2626}
  .badge.unmarked{background:#fef9c3;color:#92400e}
  .pct-bar-wrap{background:#e2e8f0;border-radius:4px;height:7px;width:80px;display:inline-block;vertical-align:middle;overflow:hidden;}
  .pct-bar{height:100%;border-radius:4px}
  .section-title{font-size:14px;font-weight:700;color:#1e3a5f;border-left:4px solid #2563eb;padding-left:10px;margin:18px 0 10px}
  .monthly-day-grid{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px}
  .day-chip{padding:2px 7px;border-radius:6px;font-size:10px;font-weight:700}
  .day-chip.p{background:#dcfce7;color:#15803d}
  .day-chip.a{background:#fee2e2;color:#dc2626}
  .footer{margin-top:28px;border-top:1px solid #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8}
  @media print{
    body{padding:16px 20px}
    @page{margin:1.5cm}
  }
</style>
</head>
<body>
${htmlBody}
<div class="footer">
  <span>Generated: ${new Date().toLocaleString()}</span>
  <span>ACS School Management System</span>
</div>
<script>window.onload=()=>{window.print();}<\/script>
</body>
</html>`);
    win.document.close();
}

/* ─────────────────────────────────────────────
   BUILD REPORT HTML HELPERS
───────────────────────────────────────────── */
function schoolHeader(schoolName, reportTitle, reportSub) {
    return `
<div class="report-header">
  <div class="school-badge">🏫</div>
  <div>
    <div class="school-name">${schoolName || 'School'}</div>
    <div class="school-sub">Official Attendance Report</div>
  </div>
  <div class="report-title">
    <h2>${reportTitle}</h2>
    <p>${reportSub}</p>
  </div>
</div>`;
}

function pctBar(pct) {
    const color = pct >= 90 ? '#16a34a' : pct >= 75 ? '#2563eb' : pct >= 60 ? '#d97706' : '#dc2626';
    return `<span class="pct-bar-wrap"><span class="pct-bar" style="width:${pct}%;background:${color}"></span></span> <strong style="color:${color}">${pct}%</strong>`;
}

/* ── Daily class report ───────────────────── */
function buildDailyClassHTML(students, className, date, schoolName, genderFilter) {
    const filtered = students
        .filter(s => s.grade === className)
        .filter(s => {
            if (genderFilter === 'boys') return s.admissions?.[0]?.gender === 'Male';
            if (genderFilter === 'girls') return s.admissions?.[0]?.gender === 'Female';
            return true;
        })
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    const presentList = filtered.filter(s => (s.attendance?.records || []).some(r => r.date === date && r.status === 'present'));
    const absentList = filtered.filter(s => (s.attendance?.records || []).some(r => r.date === date && r.status === 'absent'));
    const unmarkedList = filtered.filter(s => !(s.attendance?.records || []).some(r => r.date === date));

    const rows = filtered.map((s, i) => {
        const rec = (s.attendance?.records || []).find(r => r.date === date);
        const status = rec ? rec.status : 'unmarked';
        return `<tr>
          <td>${i + 1}</td>
          <td><strong>${s.name}</strong></td>
          <td style="color:#64748b">${s.id}</td>
          <td>${s.admissions?.[0]?.gender || '—'}</td>
          <td>${s.admissions?.[0]?.fatherName || '—'}</td>
          <td><span class="badge ${status}">${status === 'present' ? '✓ Present' : status === 'absent' ? '✗ Absent' : '— Unmarked'}</span></td>
          <td>${pctBar(s.attendance?.percentage || 0)}</td>
        </tr>`;
    }).join('');

    return `
${schoolHeader(schoolName, 'Daily Attendance Report', `Class: ${className} | Date: ${date} | Filter: ${genderFilter === 'all' ? 'All Students' : genderFilter === 'boys' ? 'Boys' : 'Girls'}`)}
<div class="meta-grid">
  <div class="meta-card"><div class="val">${filtered.length}</div><div class="lbl">Total Students</div></div>
  <div class="meta-card green"><div class="val">${presentList.length}</div><div class="lbl">Present</div></div>
  <div class="meta-card red"><div class="val">${absentList.length}</div><div class="lbl">Absent</div></div>
  <div class="meta-card amber"><div class="val">${unmarkedList.length}</div><div class="lbl">Unmarked</div></div>
</div>
<table>
  <thead><tr><th>#</th><th>Student Name</th><th>ID</th><th>Gender</th><th>Father Name</th><th>Status</th><th>Overall %</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
${absentList.length > 0 ? `
<div class="section-title">⚠ Absent Students (${absentList.length})</div>
<p style="font-size:12px;color:#64748b;margin-bottom:12px">${absentList.map(s => s.name).join(' • ')}</p>
` : ''}`;
}

/* ── Monthly class report ─────────────────── */
function buildMonthlyClassHTML(students, className, year, month, schoolName, genderFilter) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthLabel = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    const filtered = students
        .filter(s => s.grade === className)
        .filter(s => {
            if (genderFilter === 'boys') return s.admissions?.[0]?.gender === 'Male';
            if (genderFilter === 'girls') return s.admissions?.[0]?.gender === 'Female';
            return true;
        })
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    // All days recorded in this month across entire class
    const allDays = [...new Set(
        filtered.flatMap(s => (s.attendance?.records || []).filter(r => r.date.startsWith(prefix)).map(r => r.date))
    )].sort();

    const rows = filtered.map((s, i) => {
        const monthRecs = (s.attendance?.records || []).filter(r => r.date.startsWith(prefix));
        const present = monthRecs.filter(r => r.status === 'present').length;
        const absent = monthRecs.filter(r => r.status === 'absent').length;
        const pct = monthRecs.length > 0 ? parseFloat(((present / monthRecs.length) * 100).toFixed(1)) : 0;
        const chips = allDays.map(d => {
            const rec = monthRecs.find(r => r.date === d);
            const cls = rec ? (rec.status === 'present' ? 'p' : 'a') : '';
            const label = d.slice(8); // day digits
            return `<span class="day-chip ${cls}" title="${d}">${label}${rec ? (rec.status === 'present' ? '✓' : '✗') : ''}</span>`;
        }).join('');
        return `<tr>
          <td>${i + 1}</td>
          <td><strong>${s.name}</strong></td>
          <td style="color:#64748b">${s.id}</td>
          <td>${present}</td>
          <td>${absent}</td>
          <td>${monthRecs.length}</td>
          <td>${pctBar(pct)}</td>
          <td><div class="monthly-day-grid">${chips || '<span style="color:#94a3b8;font-size:10px">No records</span>'}</div></td>
        </tr>`;
    }).join('');

    const totalPresent = filtered.reduce((sum, s) => sum + (s.attendance?.records || []).filter(r => r.date.startsWith(prefix) && r.status === 'present').length, 0);
    const totalAbsent = filtered.reduce((sum, s) => sum + (s.attendance?.records || []).filter(r => r.date.startsWith(prefix) && r.status === 'absent').length, 0);
    const avgPct = filtered.length > 0
        ? Math.round(filtered.reduce((sum, s) => {
            const recs = (s.attendance?.records || []).filter(r => r.date.startsWith(prefix));
            return sum + (recs.length > 0 ? (recs.filter(r => r.status === 'present').length / recs.length) * 100 : 0);
        }, 0) / filtered.length)
        : 0;

    return `
${schoolHeader(schoolName, 'Monthly Attendance Report', `Class: ${className} | Month: ${monthLabel} | Filter: ${genderFilter === 'all' ? 'All Students' : genderFilter === 'boys' ? 'Boys' : 'Girls'}`)}
<div class="meta-grid">
  <div class="meta-card"><div class="val">${filtered.length}</div><div class="lbl">Students</div></div>
  <div class="meta-card green"><div class="val">${totalPresent}</div><div class="lbl">Total Present Entries</div></div>
  <div class="meta-card red"><div class="val">${totalAbsent}</div><div class="lbl">Total Absent Entries</div></div>
  <div class="meta-card ${avgPct >= 75 ? 'green' : 'red'}"><div class="val">${avgPct}%</div><div class="lbl">Class Avg Attendance</div></div>
</div>
<table>
  <thead><tr><th>#</th><th>Student Name</th><th>ID</th><th>Present</th><th>Absent</th><th>Days Recorded</th><th>Month %</th><th>Day-by-Day (date→status)</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`;
}

/* ── Individual student — daily ───────────── */
function buildStudentDailyHTML(student, date, schoolName) {
    const rec = (student.attendance?.records || []).find(r => r.date === date);
    const status = rec ? rec.status : 'unmarked';
    const pct = student.attendance?.percentage || 0;
    const adm = student.admissions?.[0] || {};
    return `
${schoolHeader(schoolName, 'Student Daily Attendance', `${student.name} (${student.id}) | Date: ${date}`)}
<div class="meta-grid">
  <div class="meta-card"><div class="val">${student.grade || '—'}</div><div class="lbl">Class</div></div>
  <div class="meta-card ${status === 'present' ? 'green' : status === 'absent' ? 'red' : 'amber'}">
    <div class="val">${status === 'present' ? '✓' : status === 'absent' ? '✗' : '—'}</div>
    <div class="lbl">${status.toUpperCase()}</div>
  </div>
  <div class="meta-card ${pct >= 75 ? 'green' : 'red'}"><div class="val">${pct}%</div><div class="lbl">Overall %</div></div>
  <div class="meta-card"><div class="val">${student.attendance?.total || 0}</div><div class="lbl">Total Days</div></div>
</div>
<table>
  <thead><tr><th>Field</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Full Name</td><td><strong>${student.name}</strong></td></tr>
    <tr><td>Student ID</td><td>${student.id}</td></tr>
    <tr><td>Class</td><td>${student.grade || '—'}</td></tr>
    <tr><td>Gender</td><td>${adm.gender || '—'}</td></tr>
    <tr><td>Father Name</td><td>${adm.fatherName || '—'}</td></tr>
    <tr><td>Contact</td><td>${adm.contact || '—'}</td></tr>
    <tr><td>Status on ${date}</td><td><span class="badge ${status}">${status === 'present' ? '✓ Present' : status === 'absent' ? '✗ Absent' : '— Not Marked'}</span></td></tr>
    <tr><td>Overall Attendance</td><td>${pctBar(pct)} (${student.attendance?.present || 0} Present / ${student.attendance?.absent || 0} Absent / ${student.attendance?.total || 0} Days)</td></tr>
  </tbody>
</table>`;
}

/* ── Individual student — monthly ─────────── */
function buildStudentMonthlyHTML(student, year, month, schoolName) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthLabel = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    const adm = student.admissions?.[0] || {};
    const monthRecs = (student.attendance?.records || [])
        .filter(r => r.date.startsWith(prefix))
        .sort((a, b) => a.date.localeCompare(b.date));
    const present = monthRecs.filter(r => r.status === 'present').length;
    const absent = monthRecs.filter(r => r.status === 'absent').length;
    const pct = monthRecs.length > 0 ? parseFloat(((present / monthRecs.length) * 100).toFixed(1)) : 0;

    const recRows = monthRecs.map((r, i) =>
        `<tr><td>${i + 1}</td><td>${r.date}</td><td>${new Date(r.date).toLocaleDateString('default', { weekday: 'long' })}</td><td><span class="badge ${r.status}">${r.status === 'present' ? '✓ Present' : '✗ Absent'}</span></td></tr>`
    ).join('');

    return `
${schoolHeader(schoolName, 'Student Monthly Attendance Report', `${student.name} (${student.id}) | Month: ${monthLabel}`)}
<div class="meta-grid">
  <div class="meta-card green"><div class="val">${present}</div><div class="lbl">Days Present</div></div>
  <div class="meta-card red"><div class="val">${absent}</div><div class="lbl">Days Absent</div></div>
  <div class="meta-card"><div class="val">${monthRecs.length}</div><div class="lbl">Days Recorded</div></div>
  <div class="meta-card ${pct >= 75 ? 'green' : 'red'}"><div class="val">${pct}%</div><div class="lbl">Month Attendance</div></div>
</div>
<table>
  <thead><tr><th>Field</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Full Name</td><td><strong>${student.name}</strong></td></tr>
    <tr><td>Student ID</td><td>${student.id}</td></tr>
    <tr><td>Class</td><td>${student.grade || '—'}</td></tr>
    <tr><td>Father Name</td><td>${adm.fatherName || '—'}</td></tr>
  </tbody>
</table>
<div class="section-title">Day-by-Day Record — ${monthLabel}</div>
${monthRecs.length === 0
            ? '<p style="color:#94a3b8;font-style:italic;font-size:12px">No attendance records found for this month.</p>'
            : `<table><thead><tr><th>#</th><th>Date</th><th>Day</th><th>Status</th></tr></thead><tbody>${recRows}</tbody></table>`}`;
}

/* ══════════════════════════════════════════ */

const AttendanceTab = ({
    students, selectedClass, setSelectedClass, sectionClasses,
    attDateFilter, setAttDateFilter,
    markAttendance, removeAttendanceRecord, exportAttendanceExcel,
    fetchData, showSaveMessage, openConfirm,
    schoolName,
}) => {
    const [genderTab, setGenderTab] = useState('all');
    const [showPrintMenu, setShowPrintMenu] = useState(false);
    const [printMode, setPrintMode] = useState(null); // 'daily-class'|'monthly-class'|'student-daily'|'student-monthly'
    const [printMonth, setPrintMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');

    const today = new Date().toISOString().split('T')[0];
    const filterDate = attDateFilter || today;

    const allClassStudents = students
        .filter(s => s.grade === selectedClass)
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    const classStudents = allClassStudents.filter(s => {
        if (genderTab === 'boys') return s.admissions?.[0]?.gender === 'Male';
        if (genderTab === 'girls') return s.admissions?.[0]?.gender === 'Female';
        return true;
    });

    const boysCount = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Male').length;
    const girlsCount = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Female').length;

    const totalDays = [...new Set(
        allClassStudents.flatMap(s => (s.attendance?.records || []).map(r => r.date))
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

    const unmarkAll = async () => {
        for (const s of classStudents) {
            const oldAtt = s.attendance || {};
            const records = [...(oldAtt.records || [])].filter(r => r.date !== filterDate);
            const present = records.filter(r => r.status === 'present').length;
            const absent = records.length - present;
            const percentage = records.length > 0 ? parseFloat(((present / records.length) * 100).toFixed(1)) : 0;
            await supabase.from('students').update({ attendance: { records, total: records.length, present, absent, percentage } }).eq('id', s.id);
        }
        fetchData();
        showSaveMessage(`All ${classStudents.length} students unmarked for ${filterDate}!`);
    };

    const genderTabs = [
        { id: 'boys', label: '👦 Boys', count: boysCount, color: '#0369a1', bg: '#e0f2fe' },
        { id: 'girls', label: '👧 Girls', count: girlsCount, color: '#be185d', bg: '#fce7f3' },
        { id: 'all', label: '👥 All Students', count: allClassStudents.length, color: '#475569', bg: '#f1f5f9' },
    ];

    const presentToday = classStudents.filter(s => (s.attendance?.records || []).some(r => r.date === filterDate && r.status === 'present')).length;
    const absentToday = classStudents.filter(s => (s.attendance?.records || []).some(r => r.date === filterDate && r.status === 'absent')).length;
    const unmarkedToday = classStudents.length - presentToday - absentToday;

    // ── Print actions ──
    const doPrint = () => {
        const sName = schoolName || 'School';
        const [yr, mo] = printMonth.split('-').map(Number);

        if (printMode === 'daily-class') {
            openPrintWindow(buildDailyClassHTML(students, selectedClass, filterDate, sName, genderTab), 'Daily Attendance Report');
        } else if (printMode === 'monthly-class') {
            openPrintWindow(buildMonthlyClassHTML(students, selectedClass, yr, mo, sName, genderTab), 'Monthly Attendance Report');
        } else if (printMode === 'student-daily') {
            const st = students.find(s => s.id === selectedStudentId);
            if (!st) return alert('Please select a student.');
            openPrintWindow(buildStudentDailyHTML(st, filterDate, sName), `${st.name} - Daily Report`);
        } else if (printMode === 'student-monthly') {
            const st = students.find(s => s.id === selectedStudentId);
            if (!st) return alert('Please select a student.');
            openPrintWindow(buildStudentMonthlyHTML(st, yr, mo, sName), `${st.name} - Monthly Report`);
        }
        setPrintMode(null);
    };

    const filteredStudentsForSearch = allClassStudents.filter(s =>
        s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );

    const isStudentMode = printMode === 'student-daily' || printMode === 'student-monthly';
    const isMonthMode = printMode === 'monthly-class' || printMode === 'student-monthly';

    return (
        <div className="animate-fade-in">

            {/* ── Print Modal ── */}
            {printMode && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card animate-fade-in" style={{ maxWidth: 480, width: '100%', padding: '1.75rem', borderTop: '4px solid #2563eb', position: 'relative' }}>
                        <button onClick={() => setPrintMode(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#1e293b', marginBottom: 4 }}>🖨 Print Attendance Report</div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                            {printMode === 'daily-class' && `Daily report for Class ${selectedClass} on ${filterDate}`}
                            {printMode === 'monthly-class' && `Monthly report for Class ${selectedClass}`}
                            {printMode === 'student-daily' && `Individual daily report for ${filterDate}`}
                            {printMode === 'student-monthly' && `Individual monthly report`}
                        </div>

                        {/* Month picker (monthly modes) */}
                        {isMonthMode && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, color: '#475569', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Select Month</label>
                                <input type="month" value={printMonth} onChange={e => setPrintMonth(e.target.value)}
                                    className="form-input" style={{ width: '100%' }} />
                            </div>
                        )}

                        {/* Student picker (individual modes) */}
                        {isStudentMode && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, color: '#475569', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Search & Select Student</label>
                                <input
                                    type="text"
                                    placeholder="Type name or ID..."
                                    className="form-input"
                                    value={studentSearchQuery}
                                    onChange={e => { setStudentSearchQuery(e.target.value); setSelectedStudentId(''); }}
                                    style={{ width: '100%', marginBottom: '0.5rem' }}
                                />
                                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                                    {filteredStudentsForSearch.length === 0 && (
                                        <div style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>No students found</div>
                                    )}
                                    {filteredStudentsForSearch.map(s => (
                                        <div key={s.id} onClick={() => { setSelectedStudentId(s.id); setStudentSearchQuery(s.name); }}
                                            style={{ padding: '0.6rem 0.9rem', cursor: 'pointer', background: selectedStudentId === s.id ? '#eff6ff' : 'transparent', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                                            onMouseEnter={e => { if (selectedStudentId !== s.id) e.currentTarget.style.background = '#f8fafc'; }}
                                            onMouseLeave={e => { if (selectedStudentId !== s.id) e.currentTarget.style.background = 'transparent'; }}>
                                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.id} · {s.admissions?.[0]?.gender || '—'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Day picker for daily modes */}
                        {(printMode === 'daily-class' || printMode === 'student-daily') && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontWeight: 600, color: '#475569', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Date</label>
                                <input type="date" value={filterDate} onChange={e => setAttDateFilter(e.target.value)} className="form-input" style={{ width: '100%' }} />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button onClick={() => setPrintMode(null)} style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={doPrint} style={{ padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Printer size={16} /> Print Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b' }}>📅 Attendance</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Day-by-day attendance tracking — {totalDays} school day{totalDays !== 1 ? 's' : ''} recorded</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select className="form-input" style={{ padding: '0.5rem 0.8rem', minWidth: '150px' }} value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setGenderTab('all'); }}>
                        {sectionClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="date" value={attDateFilter} onChange={e => setAttDateFilter(e.target.value)} className="form-input" style={{ padding: '0.5rem 0.8rem' }} />
                    <button onClick={exportAttendanceExcel} style={{ ...excelBtnStyle, background: '#217346', color: 'white', borderColor: '#217346' }}>
                        <Download size={16} /> Export
                    </button>

                    {/* Print dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowPrintMenu(p => !p)}
                            style={{ ...excelBtnStyle, background: '#1e3a5f', color: 'white', borderColor: '#1e3a5f' }}>
                            <Printer size={16} /> Print <ChevronDown size={14} />
                        </button>
                        {showPrintMenu && (
                            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 230, overflow: 'hidden' }}>
                                <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Class Reports</div>
                                {[
                                    { id: 'daily-class', label: '📋 Daily Class Report', sub: `${filterDate}` },
                                    { id: 'monthly-class', label: '📆 Monthly Class Report', sub: 'Choose month' },
                                ].map(opt => (
                                    <button key={opt.id} onClick={() => { setPrintMode(opt.id); setShowPrintMenu(false); }}
                                        style={{ display: 'block', width: '100%', padding: '0.6rem 0.9rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>{opt.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{opt.sub}</div>
                                    </button>
                                ))}
                                <div style={{ borderTop: '1px solid #f1f5f9', padding: '0.5rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#f8fafc' }}>Individual Student</div>
                                {[
                                    { id: 'student-daily', label: '👤 Student Daily Report', sub: `${filterDate}` },
                                    { id: 'student-monthly', label: '👤 Student Monthly Report', sub: 'Choose month' },
                                ].map(opt => (
                                    <button key={opt.id} onClick={() => { setPrintMode(opt.id); setStudentSearchQuery(''); setSelectedStudentId(''); setShowPrintMenu(false); }}
                                        style={{ display: 'block', width: '100%', padding: '0.6rem 0.9rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.88rem' }}>{opt.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{opt.sub}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Gender Tabs ── */}
            <div style={{ display: 'flex', marginBottom: '1.5rem', borderRadius: '12px 12px 0 0', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {genderTabs.map(tab => (
                    <button key={tab.id} onClick={() => setGenderTab(tab.id)} style={{
                        flex: 1, padding: '0.85rem 1rem', fontWeight: genderTab === tab.id ? 800 : 600, fontSize: '0.95rem',
                        color: genderTab === tab.id ? tab.color : '#94a3b8',
                        background: genderTab === tab.id ? tab.bg : 'transparent', border: 'none',
                        borderBottom: genderTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
                        cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}>
                        {tab.label}
                        <span style={{ background: genderTab === tab.id ? tab.color : '#cbd5e1', color: 'white', borderRadius: '999px', padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Date Stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Students', val: classStudents.length, color: '#2563eb', bg: '#eff6ff' },
                    { label: `Present (${filterDate})`, val: presentToday, color: '#16a34a', bg: '#f0fdf4' },
                    { label: `Absent (${filterDate})`, val: absentToday, color: '#dc2626', bg: '#fef2f2' },
                    { label: 'Not Marked', val: unmarkedToday, color: '#b45309', bg: '#fffbeb' },
                    { label: 'School Days', val: totalDays, color: '#7c3aed', bg: '#f5f3ff' },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22`, borderRadius: '12px', padding: '0.85rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginTop: '0.1rem' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Mark All ── */}
            <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>Mark <span style={{ color: '#7c3aed' }}>{genderTab === 'all' ? 'All Students' : genderTab === 'boys' ? 'Boys' : 'Girls'}</span> for: <span style={{ color: '#2563eb' }}>{filterDate}</span></div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Click to mark all {classStudents.length} students at once</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => markAll('present')} style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>✓ All Present</button>
                    <button onClick={() => markAll('absent')} style={{ padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>✗ All Absent</button>
                    <button onClick={() => openConfirm('Unmark All', `Remove attendance records for all ${classStudents.length} students on ${filterDate}?`, unmarkAll, true)} style={{ padding: '0.5rem 1rem', background: '#b45309', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>↩ Unmark All</button>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead>
                            <tr style={{ background: '#0f172a', color: 'white' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'white', fontSize: '0.85rem', fontWeight: 700, position: 'sticky', top: 0, left: 0, background: '#0f172a', zIndex: 20, minWidth: '180px' }}>Student</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'white', fontSize: '0.85rem', fontWeight: 700, position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>Today ({filterDate})</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'white', fontSize: '0.85rem', fontWeight: 700, position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>Overall %</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'white', fontSize: '0.85rem', fontWeight: 700, position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>Recent Records</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'white', fontSize: '0.85rem', fontWeight: 700, position: 'sticky', top: 0, background: '#0f172a', zIndex: 10 }}>Print</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classStudents.map((student, rowIdx) => {
                                const records = (student.attendance?.records || []).sort((a, b) => b.date.localeCompare(a.date));
                                const todayRecord = records.find(r => r.date === filterDate);
                                const pct = student.attendance?.percentage || 0;
                                const pctColor = pct >= 90 ? '#16a34a' : pct >= 75 ? '#2563eb' : pct >= 60 ? '#d97706' : '#dc2626';
                                return (
                                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', background: rowIdx % 2 === 0 ? 'white' : '#f8fafc' }}>
                                        <td style={{ padding: '0.85rem 1rem', position: 'sticky', left: 0, background: rowIdx % 2 === 0 ? 'white' : '#f8fafc', zIndex: 1, borderRight: '1px solid #e2e8f0' }}>
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
                                        {/* Per-row print buttons */}
                                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', minWidth: 120 }}>
                                            <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                <button
                                                    title="Print daily report for this student"
                                                    onClick={() => {
                                                        const sName = schoolName || 'School';
                                                        openPrintWindow(buildStudentDailyHTML(student, filterDate, sName), `${student.name} - Daily`);
                                                    }}
                                                    style={{ padding: '0.3rem 0.5rem', borderRadius: 6, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>
                                                    📋 Daily
                                                </button>
                                                <button
                                                    title="Print monthly report for this student"
                                                    onClick={() => { setSelectedStudentId(student.id); setStudentSearchQuery(student.name); setPrintMode('student-monthly'); }}
                                                    style={{ padding: '0.3rem 0.5rem', borderRadius: 6, background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}>
                                                    📆 Monthly
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {classStudents.length === 0 && (
                                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No students found for selected filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendanceTab;
