import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Award, Calendar, DollarSign, LogOut,
    Save, CheckCircle, XCircle, Edit3, User,
    Download, Upload, FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSchoolData } from '../context/SchoolDataContext';

const TeacherPortal = ({ setIsTeacher, setCurrentPage }) => {
    const { schoolData, setStudents } = useSchoolData();
    const [activeTab, setActiveTab] = useState('marks');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editingMarks, setEditingMarks] = useState(false);
    const [tempMarks, setTempMarks] = useState([]);
    const [saveMessage, setSaveMessage] = useState('');
    const attendanceFileRef = useRef(null);
    const marksFileRef = useRef(null);
    const feeFileRef = useRef(null);

    const students = schoolData.students || [];

    const handleLogout = () => {
        setIsTeacher(false);
        setCurrentPage('home');
    };

    const showSaveMessage = (msg) => {
        setSaveMessage(msg);
        setTimeout(() => setSaveMessage(''), 2500);
    };

    // --- GRADE HELPER ---
    const percentageToGrade = (num) => {
        if (num >= 90) return 'A';
        if (num >= 85) return 'A-';
        if (num >= 80) return 'B+';
        if (num >= 75) return 'B';
        if (num >= 70) return 'B-';
        if (num >= 65) return 'C+';
        if (num >= 60) return 'C';
        if (num >= 50) return 'D';
        return 'F';
    };

    // --- MARKS FUNCTIONS ---
    const startEditingMarks = () => {
        if (!selectedStudent) return;
        const student = students.find(s => s.id === selectedStudent);
        setTempMarks(student.results.map(r => ({ ...r })));
        setEditingMarks(true);
    };

    const handleMarkChange = (index, field, value) => {
        const updated = [...tempMarks];
        if (field === 'percentage') {
            const num = parseInt(value) || 0;
            updated[index].percentage = Math.min(100, Math.max(0, num));
            updated[index].grade = percentageToGrade(num);
        }
        setTempMarks(updated);
    };

    const saveMarks = () => {
        const updatedStudents = students.map(s => {
            if (s.id === selectedStudent) {
                return { ...s, results: [...tempMarks] };
            }
            return s;
        });
        setStudents(updatedStudents);
        setEditingMarks(false);
        showSaveMessage('Marks saved successfully!');
    };

    // --- MARKS EXCEL EXPORT ---
    const exportMarksExcel = () => {
        const rows = [];
        students.forEach(student => {
            student.results.forEach(result => {
                rows.push({
                    'Student ID': student.id,
                    'Student Name': student.name,
                    'Grade': student.grade,
                    'Subject': result.subject,
                    'Percentage': result.percentage,
                    'Letter Grade': result.grade
                });
            });
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        // Set column widths
        ws['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 10 },
            { wch: 18 }, { wch: 12 }, { wch: 14 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Student Marks');
        XLSX.writeFile(wb, 'Student_Marks.xlsx');
        showSaveMessage('Marks exported to Excel!');
    };

    // --- MARKS EXCEL IMPORT ---
    const importMarksExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);

                const updatedStudents = students.map(s => {
                    const studentRows = data.filter(row => row['Student ID'] === s.id);
                    if (studentRows.length > 0) {
                        const updatedResults = s.results.map(result => {
                            const match = studentRows.find(row => row['Subject'] === result.subject);
                            if (match && match['Percentage'] !== undefined) {
                                const pct = Math.min(100, Math.max(0, parseInt(match['Percentage']) || 0));
                                return {
                                    ...result,
                                    percentage: pct,
                                    grade: percentageToGrade(pct)
                                };
                            }
                            return result;
                        });
                        return { ...s, results: updatedResults };
                    }
                    return s;
                });
                setStudents(updatedStudents);
                showSaveMessage(`Marks imported for ${data.length} entries!`);
            } catch (err) {
                showSaveMessage('Error reading file. Please check the format.');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = ''; // Reset file input
    };

    // --- ATTENDANCE FUNCTIONS ---
    const markAttendance = (studentId, status) => {
        const updatedStudents = students.map(s => {
            if (s.id === studentId) {
                const newAttendance = { ...s.attendance };
                newAttendance.total += 1;
                if (status === 'present') {
                    newAttendance.present += 1;
                } else {
                    newAttendance.absent += 1;
                }
                newAttendance.percentage = parseFloat(
                    ((newAttendance.present / newAttendance.total) * 100).toFixed(1)
                );
                return { ...s, attendance: newAttendance };
            }
            return s;
        });
        setStudents(updatedStudents);
        showSaveMessage(`Attendance marked for ${students.find(s => s.id === studentId).name}!`);
    };

    // --- ATTENDANCE EXCEL EXPORT ---
    const exportAttendanceExcel = () => {
        const rows = students.map(s => ({
            'Student ID': s.id,
            'Student Name': s.name,
            'Grade': s.grade,
            'Date': '',
            'Status (Present/Absent)': ''
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 10 },
            { wch: 14 }, { wch: 22 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
        XLSX.writeFile(wb, 'Attendance_Sheet.xlsx');
        showSaveMessage('Attendance sheet exported!');
    };

    // --- ATTENDANCE EXCEL IMPORT ---
    const importAttendanceExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);

                let updateCount = 0;
                const updatedStudents = students.map(s => {
                    const row = data.find(r => r['Student ID'] === s.id);
                    if (row && row['Status (Present/Absent)']) {
                        const status = row['Status (Present/Absent)'].toString().toLowerCase().trim();
                        if (status === 'present' || status === 'p') {
                            updateCount++;
                            const newAttendance = { ...s.attendance };
                            newAttendance.total += 1;
                            newAttendance.present += 1;
                            newAttendance.percentage = parseFloat(
                                ((newAttendance.present / newAttendance.total) * 100).toFixed(1)
                            );
                            return { ...s, attendance: newAttendance };
                        } else if (status === 'absent' || status === 'a') {
                            updateCount++;
                            const newAttendance = { ...s.attendance };
                            newAttendance.total += 1;
                            newAttendance.absent += 1;
                            newAttendance.percentage = parseFloat(
                                ((newAttendance.present / newAttendance.total) * 100).toFixed(1)
                            );
                            return { ...s, attendance: newAttendance };
                        }
                    }
                    return s;
                });
                setStudents(updatedStudents);
                showSaveMessage(`Attendance imported for ${updateCount} students!`);
            } catch (err) {
                showSaveMessage('Error reading file. Please check the format.');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    // --- FEE FUNCTIONS ---
    const toggleFeeStatus = (studentId) => {
        const updatedStudents = students.map(s => {
            if (s.id === studentId) {
                return {
                    ...s,
                    feeStatus: s.feeStatus === 'paid' ? 'unpaid' : 'paid'
                };
            }
            return s;
        });
        setStudents(updatedStudents);
        const student = students.find(s => s.id === studentId);
        const newStatus = student.feeStatus === 'paid' ? 'Unpaid' : 'Paid';
        showSaveMessage(`Fee status updated to ${newStatus} for ${student.name}!`);
    };

    // --- FEE EXCEL EXPORT ---
    const exportFeeExcel = () => {
        const rows = students.map(s => ({
            'Student ID': s.id,
            'Student Name': s.name,
            'Grade': s.grade,
            'Fee Status (Paid/Unpaid)': s.feeStatus === 'paid' ? 'Paid' : 'Unpaid'
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 24 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Fee Status');
        XLSX.writeFile(wb, 'Fee_Status.xlsx');
        showSaveMessage('Fee status exported to Excel!');
    };

    // --- FEE EXCEL IMPORT ---
    const importFeeExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws);

                let updateCount = 0;
                const updatedStudents = students.map(s => {
                    const row = data.find(r => r['Student ID'] === s.id);
                    if (row && row['Fee Status (Paid/Unpaid)']) {
                        const status = row['Fee Status (Paid/Unpaid)'].toString().toLowerCase().trim();
                        if (status === 'paid' || status === 'p') {
                            updateCount++;
                            return { ...s, feeStatus: 'paid' };
                        } else if (status === 'unpaid' || status === 'u') {
                            updateCount++;
                            return { ...s, feeStatus: 'unpaid' };
                        }
                    }
                    return s;
                });
                setStudents(updatedStudents);
                showSaveMessage(`Fee status imported for ${updateCount} students!`);
            } catch (err) {
                showSaveMessage('Error reading file. Please check the format.');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const getGradeColor = (percentage) => {
        if (percentage >= 90) return 'var(--color-success)';
        if (percentage >= 75) return 'var(--color-primary)';
        if (percentage >= 60) return 'var(--color-accent)';
        return 'var(--color-danger)';
    };

    // --- DOWNLOAD STUDENT REPORT ---
    const downloadStudentReport = (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const avg = (student.results.reduce((sum, r) => sum + r.percentage, 0) / student.results.length).toFixed(1);
        const overallGrade = percentageToGrade(parseFloat(avg));
        const gradeColor = (pct) => pct >= 90 ? '#10b981' : pct >= 75 ? '#3b82f6' : pct >= 60 ? '#f59e0b' : '#ef4444';
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const resultsRows = student.results.map(r => `
            <tr>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;">${r.subject}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;color:${gradeColor(r.percentage)};">${r.percentage}%</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;">${r.grade}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;">
                    <div style="background:#f1f5f9;border-radius:999px;height:10px;width:100%;overflow:hidden;">
                        <div style="background:${gradeColor(r.percentage)};height:100%;width:${r.percentage}%;border-radius:999px;"></div>
                    </div>
                </td>
            </tr>
        `).join('');

        let previousSection = '';
        if (student.previousResults && student.previousResults.length > 0) {
            const prevTerms = student.previousResults.map(term => {
                const termAvg = (term.results.reduce((s, r) => s + r.percentage, 0) / term.results.length).toFixed(1);
                const rows = term.results.map(r => `
                    <tr>
                        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;">${r.subject}</td>
                        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;color:${gradeColor(r.percentage)};">${r.percentage}%</td>
                        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;">${r.grade}</td>
                    </tr>
                `).join('');
                return `
                    <div style="margin-bottom:16px;">
                        <h4 style="font-size:14px;color:#334155;margin-bottom:8px;">${term.term} — Average: <strong style="color:${gradeColor(parseFloat(termAvg))};">${termAvg}%</strong></h4>
                        <table style="width:100%;border-collapse:collapse;">
                            <thead><tr style="background:#f8fafc;">
                                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;">Subject</th>
                                <th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;">Percentage</th>
                                <th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;">Grade</th>
                            </tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                `;
            }).join('');
            previousSection = `
                <div style="margin-top:28px;page-break-inside:avoid;">
                    <h3 style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">📚 Previous Term Results</h3>
                    ${prevTerms}
                </div>
            `;
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Report Card — ${student.name}</title>
            <style>
                @media print {
                    body { margin: 0; }
                    .no-print { display: none !important; }
                }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; color: #1e293b; background: #fff; }
            </style>
        </head>
        <body>
            <div style="max-width:800px;margin:0 auto;padding:40px 30px;">

                <!-- Print Button -->
                <div class="no-print" style="text-align:right;margin-bottom:16px;">
                    <button onclick="window.print()" style="padding:10px 24px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">🖨️ Print / Save as PDF</button>
                </div>

                <!-- Header -->
                <div style="text-align:center;margin-bottom:32px;padding:24px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 50%,#1a7a4f 100%);border-radius:12px;color:white;">
                    <h1 style="font-size:24px;margin:0 0 4px 0;">${schoolData.name || 'ACS Higher Secondary School'}</h1>
                    <p style="font-size:13px;opacity:0.9;margin:0 0 12px 0;">${schoolData.contact?.address || ''}</p>
                    <h2 style="font-size:20px;margin:0;font-weight:700;">STUDENT REPORT CARD</h2>
                </div>

                <!-- Student Info -->
                <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:28px;padding:20px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
                    <div><span style="font-size:12px;color:#64748b;display:block;">Student Name</span><strong style="font-size:16px;">${student.name}</strong></div>
                    <div><span style="font-size:12px;color:#64748b;display:block;">Student ID</span><strong style="font-size:16px;">${student.id}</strong></div>
                    <div><span style="font-size:12px;color:#64748b;display:block;">Class</span><strong style="font-size:16px;">${student.grade}</strong></div>
                    <div><span style="font-size:12px;color:#64748b;display:block;">Report Date</span><strong style="font-size:16px;">${today}</strong></div>
                </div>

                <!-- Current Results -->
                <div style="margin-bottom:28px;">
                    <h3 style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">📝 Current Term Results</h3>
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f1f5f9;">
                                <th style="padding:10px 14px;text-align:left;font-size:13px;color:#64748b;font-weight:600;">Subject</th>
                                <th style="padding:10px 14px;text-align:center;font-size:13px;color:#64748b;font-weight:600;">Percentage</th>
                                <th style="padding:10px 14px;text-align:center;font-size:13px;color:#64748b;font-weight:600;">Grade</th>
                                <th style="padding:10px 14px;text-align:center;font-size:13px;color:#64748b;font-weight:600;">Performance</th>
                            </tr>
                        </thead>
                        <tbody>${resultsRows}</tbody>
                        <tfoot>
                            <tr style="background:#f0fdf4;font-weight:700;">
                                <td style="padding:12px 14px;font-size:14px;">Overall Average</td>
                                <td style="padding:12px 14px;text-align:center;color:${gradeColor(parseFloat(avg))};font-size:16px;">${avg}%</td>
                                <td style="padding:12px 14px;text-align:center;font-size:16px;">${overallGrade}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- Attendance -->
                <div style="margin-bottom:28px;page-break-inside:avoid;">
                    <h3 style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">📅 Attendance Record</h3>
                    <div style="display:flex;gap:16px;flex-wrap:wrap;">
                        <div style="flex:1;min-width:140px;padding:16px;background:#f0fdf4;border-radius:10px;text-align:center;">
                            <div style="font-size:28px;font-weight:800;color:#10b981;">${student.attendance.present}</div>
                            <div style="font-size:12px;color:#64748b;margin-top:4px;">Days Present</div>
                        </div>
                        <div style="flex:1;min-width:140px;padding:16px;background:#fef2f2;border-radius:10px;text-align:center;">
                            <div style="font-size:28px;font-weight:800;color:#ef4444;">${student.attendance.absent}</div>
                            <div style="font-size:12px;color:#64748b;margin-top:4px;">Days Absent</div>
                        </div>
                        <div style="flex:1;min-width:140px;padding:16px;background:#eff6ff;border-radius:10px;text-align:center;">
                            <div style="font-size:28px;font-weight:800;color:#3b82f6;">${student.attendance.total}</div>
                            <div style="font-size:12px;color:#64748b;margin-top:4px;">Total Days</div>
                        </div>
                        <div style="flex:1;min-width:140px;padding:16px;background:linear-gradient(135deg,#1e3a5f,#2d5a87);border-radius:10px;text-align:center;color:white;">
                            <div style="font-size:28px;font-weight:800;">${student.attendance.percentage}%</div>
                            <div style="font-size:12px;opacity:0.85;margin-top:4px;">Attendance Rate</div>
                        </div>
                    </div>
                </div>

                <!-- Fee Status -->
                <div style="margin-bottom:28px;page-break-inside:avoid;">
                    <h3 style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">💰 Fee Status</h3>
                    <div style="padding:16px 20px;border-radius:10px;display:flex;align-items:center;gap:10px;font-size:15px;font-weight:700;background:${student.feeStatus === 'paid' ? '#f0fdf4' : '#fef2f2'};color:${student.feeStatus === 'paid' ? '#059669' : '#dc2626'};border:2px solid ${student.feeStatus === 'paid' ? '#bbf7d0' : '#fecaca'};">
                        ${student.feeStatus === 'paid' ? '✅' : '❌'} Fees ${student.feeStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </div>
                </div>

                ${previousSection}

                <!-- Footer -->
                <div style="margin-top:40px;padding-top:20px;border-top:2px solid #e2e8f0;display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px;font-size:12px;color:#94a3b8;">
                    <div>Generated on ${today}</div>
                    <div>${schoolData.name || 'ACS Higher Secondary School'}</div>
                    <div style="width:200px;border-top:1px solid #94a3b8;padding-top:6px;text-align:center;">Authorized Signature</div>
                </div>
            </div>
        </body>
        </html>
        `;

        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(html);
        reportWindow.document.close();
        showSaveMessage(`Report generated for ${student.name}!`);
    };

    // Common button style for Excel buttons
    const excelBtnStyle = {
        padding: '0.5rem 1rem',
        fontSize: '0.85rem',
        borderRadius: 'var(--radius-md)',
        fontWeight: 'var(--font-weight-semibold)',
        border: '2px solid',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        cursor: 'pointer',
        transition: 'all var(--transition-base)'
    };

    return (
        <div style={{ background: 'var(--color-gray-50)', minHeight: 'calc(100vh - 80px)' }}>
            {/* Hidden file inputs */}
            <input
                type="file"
                ref={attendanceFileRef}
                onChange={importAttendanceExcel}
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
            />
            <input
                type="file"
                ref={marksFileRef}
                onChange={importMarksExcel}
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
            />
            <input
                type="file"
                ref={feeFileRef}
                onChange={importFeeExcel}
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
            />

            {/* Header */}
            <section style={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1a7a4f 100%)',
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
                                Teacher Portal
                            </h1>
                            <p style={{ opacity: 0.95 }}>Manage student marks, attendance & fees</p>
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

            {/* Save Message Toast */}
            {saveMessage && (
                <div className="animate-fade-in" style={{
                    position: 'fixed',
                    top: '100px',
                    right: '20px',
                    background: 'var(--color-success)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    fontWeight: 'var(--font-weight-semibold)'
                }}>
                    <CheckCircle size={20} />
                    {saveMessage}
                </div>
            )}

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
                            { id: 'marks', label: 'Student Marks', icon: Award },
                            { id: 'attendance', label: 'Attendance Sheet', icon: Calendar },
                            { id: 'fees', label: 'Fee Status', icon: DollarSign },
                            { id: 'reports', label: 'Student Reports', icon: FileText }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setEditingMarks(false);
                                }}
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

                    {/* ========== MARKS TAB ========== */}
                    {activeTab === 'marks' && (
                        <div className="animate-fade-in">
                            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{
                                    fontSize: '1.75rem',
                                    fontWeight: 'var(--font-weight-bold)'
                                }}>
                                    Student Marks
                                </h2>
                                <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={exportMarksExcel}
                                        style={{
                                            ...excelBtnStyle,
                                            background: '#217346',
                                            color: 'white',
                                            borderColor: '#217346'
                                        }}
                                    >
                                        <Download size={16} /> Export Excel
                                    </button>
                                    <button
                                        onClick={() => marksFileRef.current.click()}
                                        style={{
                                            ...excelBtnStyle,
                                            background: 'white',
                                            color: '#217346',
                                            borderColor: '#217346'
                                        }}
                                    >
                                        <Upload size={16} /> Import Excel
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2" style={{ alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                <select
                                    value={selectedStudent || ''}
                                    onChange={(e) => {
                                        setSelectedStudent(e.target.value || null);
                                        setEditingMarks(false);
                                    }}
                                    className="form-input"
                                    style={{ minWidth: '220px' }}
                                >
                                    <option value="">Select Student...</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.id}) — {s.grade}
                                        </option>
                                    ))}
                                </select>
                                {selectedStudent && !editingMarks && (
                                    <>
                                        <button onClick={startEditingMarks} className="btn btn-primary btn-sm">
                                            <Edit3 size={16} /> Edit Marks
                                        </button>
                                        <button onClick={() => downloadStudentReport(selectedStudent)} className="btn btn-sm" style={{ background: '#7c3aed', color: 'white' }}>
                                            <FileText size={16} /> Download Report
                                        </button>
                                    </>
                                )}
                                {editingMarks && (
                                    <button onClick={saveMarks} className="btn btn-primary btn-sm">
                                        <Save size={16} /> Save
                                    </button>
                                )}
                            </div>

                            {!selectedStudent ? (
                                <div className="card" style={{
                                    textAlign: 'center',
                                    padding: '3rem',
                                    color: 'var(--color-gray-500)'
                                }}>
                                    <Users size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-gray-400)' }} />
                                    <p style={{ fontSize: '1.125rem' }}>Select a student to view or edit marks</p>
                                </div>
                            ) : (
                                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--color-gray-50)' }}>
                                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                    Subject
                                                </th>
                                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                    Grade
                                                </th>
                                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                    Percentage
                                                </th>
                                                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                    Performance
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(editingMarks ? tempMarks : students.find(s => s.id === selectedStudent)?.results || []).map((result, idx) => (
                                                <tr
                                                    key={idx}
                                                    style={{ borderTop: '1px solid var(--color-gray-200)' }}
                                                >
                                                    <td style={{ padding: '1rem', fontWeight: 'var(--font-weight-medium)' }}>
                                                        {result.subject}
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                        <span className="badge" style={{
                                                            background: getGradeColor(result.percentage),
                                                            color: 'white'
                                                        }}>
                                                            {result.grade}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                        {editingMarks ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={result.percentage}
                                                                onChange={(e) => handleMarkChange(idx, 'percentage', e.target.value)}
                                                                className="form-input"
                                                                style={{
                                                                    width: '80px',
                                                                    textAlign: 'center',
                                                                    padding: '0.4rem',
                                                                    margin: '0 auto',
                                                                    display: 'inline-block'
                                                                }}
                                                            />
                                                        ) : (
                                                            <span style={{
                                                                fontWeight: 'var(--font-weight-bold)',
                                                                color: getGradeColor(result.percentage)
                                                            }}>
                                                                {result.percentage}%
                                                            </span>
                                                        )}
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
                                                                background: getGradeColor(result.percentage),
                                                                transition: 'width 0.5s ease-out'
                                                            }} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {/* Average */}
                                    {(() => {
                                        const results = editingMarks ? tempMarks : students.find(s => s.id === selectedStudent)?.results || [];
                                        const avg = results.length > 0 ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1) : 0;
                                        return (
                                            <div style={{
                                                padding: '1rem',
                                                background: 'var(--color-gray-50)',
                                                borderTop: '2px solid var(--color-gray-200)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <strong style={{ fontSize: '1.1rem' }}>Overall Average</strong>
                                                <span style={{
                                                    fontSize: '1.25rem',
                                                    fontWeight: 'var(--font-weight-bold)',
                                                    color: getGradeColor(parseFloat(avg))
                                                }}>
                                                    {avg}%
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== ATTENDANCE TAB ========== */}
                    {activeTab === 'attendance' && (
                        <div className="animate-fade-in">
                            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{
                                    fontSize: '1.75rem',
                                    fontWeight: 'var(--font-weight-bold)'
                                }}>
                                    Attendance Sheet
                                </h2>
                                <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={exportAttendanceExcel}
                                        style={{
                                            ...excelBtnStyle,
                                            background: '#217346',
                                            color: 'white',
                                            borderColor: '#217346'
                                        }}
                                    >
                                        <Download size={16} /> Export Excel
                                    </button>
                                    <button
                                        onClick={() => attendanceFileRef.current.click()}
                                        style={{
                                            ...excelBtnStyle,
                                            background: 'white',
                                            color: '#217346',
                                            borderColor: '#217346'
                                        }}
                                    >
                                        <Upload size={16} /> Import Excel
                                    </button>
                                </div>
                            </div>

                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-gray-50)' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                Student
                                            </th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                Grade
                                            </th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                Present
                                            </th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                Absent
                                            </th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                Rate
                                            </th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                Mark Today
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => (
                                            <tr
                                                key={student.id}
                                                style={{ borderTop: '1px solid var(--color-gray-200)' }}
                                            >
                                                <td style={{ padding: '1rem' }}>
                                                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                                                        <div className="flex-center" style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            background: 'var(--gradient-primary)',
                                                            borderRadius: '50%',
                                                            color: 'white',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'var(--font-weight-bold)',
                                                            flexShrink: 0
                                                        }}>
                                                            {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                                                {student.name}
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>
                                                                {student.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-gray-700)' }}>
                                                    {student.grade}
                                                </td>
                                                <td style={{
                                                    padding: '1rem',
                                                    textAlign: 'center',
                                                    fontWeight: 'var(--font-weight-bold)',
                                                    color: 'var(--color-success)'
                                                }}>
                                                    {student.attendance.present}
                                                </td>
                                                <td style={{
                                                    padding: '1rem',
                                                    textAlign: 'center',
                                                    fontWeight: 'var(--font-weight-bold)',
                                                    color: 'var(--color-danger)'
                                                }}>
                                                    {student.attendance.absent}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        fontWeight: 'var(--font-weight-bold)',
                                                        color: student.attendance.percentage >= 90 ? 'var(--color-success)' :
                                                            student.attendance.percentage >= 75 ? 'var(--color-accent)' : 'var(--color-danger)'
                                                    }}>
                                                        {student.attendance.percentage}%
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div className="flex gap-1" style={{ justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => markAttendance(student.id, 'present')}
                                                            className="btn btn-sm"
                                                            style={{
                                                                background: 'var(--color-success)',
                                                                color: 'white',
                                                                padding: '0.4rem 0.8rem',
                                                                fontSize: '0.8rem'
                                                            }}
                                                        >
                                                            <CheckCircle size={14} /> P
                                                        </button>
                                                        <button
                                                            onClick={() => markAttendance(student.id, 'absent')}
                                                            className="btn btn-sm"
                                                            style={{
                                                                background: 'var(--color-danger)',
                                                                color: 'white',
                                                                padding: '0.4rem 0.8rem',
                                                                fontSize: '0.8rem'
                                                            }}
                                                        >
                                                            <XCircle size={14} /> A
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Attendance Summary Cards */}
                            <div className="grid grid-cols-3" style={{ gap: '1.5rem', marginTop: '2rem' }}>
                                <div className="card" style={{ background: 'var(--color-success)', color: 'white', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)' }}>
                                        {students.reduce((sum, s) => sum + s.attendance.present, 0)}
                                    </div>
                                    <div style={{ opacity: 0.9 }}>Total Present Days</div>
                                </div>
                                <div className="card" style={{ background: 'var(--color-danger)', color: 'white', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)' }}>
                                        {students.reduce((sum, s) => sum + s.attendance.absent, 0)}
                                    </div>
                                    <div style={{ opacity: 0.9 }}>Total Absent Days</div>
                                </div>
                                <div className="card" style={{ background: 'var(--color-primary)', color: 'white', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 'var(--font-weight-bold)' }}>
                                        {(students.reduce((sum, s) => sum + s.attendance.percentage, 0) / students.length).toFixed(1)}%
                                    </div>
                                    <div style={{ opacity: 0.9 }}>Average Attendance</div>
                                </div>
                            </div>

                            {/* Import Instructions */}
                            <div className="card" style={{ marginTop: '1.5rem', background: 'var(--color-gray-50)', border: '1px dashed var(--color-gray-300)' }}>
                                <h3 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: '0.75rem', color: 'var(--color-gray-900)' }}>
                                    📋 How to use Excel Import/Export
                                </h3>
                                <ol style={{ color: 'var(--color-gray-600)', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
                                    <li>Click <strong>"Export Excel"</strong> to download the attendance template</li>
                                    <li>Open the file in Excel and fill in the <strong>Date</strong> and <strong>Status</strong> columns</li>
                                    <li>In the Status column, type <strong>"Present"</strong> or <strong>"Absent"</strong> (or just <strong>"P"</strong> / <strong>"A"</strong>)</li>
                                    <li>Save the file and click <strong>"Import Excel"</strong> to upload it back</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* ========== FEE STATUS TAB ========== */}
                    {activeTab === 'fees' && (
                        <div className="animate-fade-in">
                            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{
                                    fontSize: '1.75rem',
                                    fontWeight: 'var(--font-weight-bold)'
                                }}>
                                    Fee Status
                                </h2>
                                <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={exportFeeExcel}
                                        style={{
                                            ...excelBtnStyle,
                                            background: '#217346',
                                            color: 'white',
                                            borderColor: '#217346'
                                        }}
                                    >
                                        <Download size={16} /> Export Excel
                                    </button>
                                    <button
                                        onClick={() => feeFileRef.current.click()}
                                        style={{
                                            ...excelBtnStyle,
                                            background: 'white',
                                            color: '#217346',
                                            borderColor: '#217346'
                                        }}
                                    >
                                        <Upload size={16} /> Import Excel
                                    </button>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        fontWeight: 'var(--font-weight-bold)',
                                        color: 'var(--color-primary)'
                                    }}>
                                        {students.length}
                                    </div>
                                    <div style={{ color: 'var(--color-gray-600)' }}>Total Students</div>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        fontWeight: 'var(--font-weight-bold)',
                                        color: 'var(--color-success)'
                                    }}>
                                        {students.filter(s => s.feeStatus === 'paid').length}
                                    </div>
                                    <div style={{ color: 'var(--color-gray-600)' }}>Fees Paid</div>
                                </div>
                                <div className="card" style={{ textAlign: 'center' }}>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        fontWeight: 'var(--font-weight-bold)',
                                        color: 'var(--color-danger)'
                                    }}>
                                        {students.filter(s => s.feeStatus === 'unpaid').length}
                                    </div>
                                    <div style={{ color: 'var(--color-gray-600)' }}>Fees Unpaid</div>
                                </div>
                            </div>

                            {/* Fee Table */}
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-gray-50)' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                Student
                                            </th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                ID
                                            </th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                Grade
                                            </th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                Status
                                            </th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => (
                                            <tr
                                                key={student.id}
                                                style={{ borderTop: '1px solid var(--color-gray-200)' }}
                                            >
                                                <td style={{ padding: '1rem' }}>
                                                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                                                        <div className="flex-center" style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            background: student.feeStatus === 'paid' ? 'var(--color-success)' : 'var(--color-danger)',
                                                            borderRadius: '50%',
                                                            color: 'white',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'var(--font-weight-bold)',
                                                            flexShrink: 0
                                                        }}>
                                                            {student.feeStatus === 'paid' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                                        </div>
                                                        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                                            {student.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-gray-600)' }}>
                                                    {student.id}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-gray-600)' }}>
                                                    {student.grade}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span className="badge" style={{
                                                        background: student.feeStatus === 'paid' ? 'var(--color-success)' : 'var(--color-danger)',
                                                        color: 'white',
                                                        padding: '0.4rem 1rem',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 'var(--font-weight-bold)',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {student.feeStatus}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => toggleFeeStatus(student.id)}
                                                        className="btn btn-sm"
                                                        style={{
                                                            background: student.feeStatus === 'paid' ? 'var(--color-danger)' : 'var(--color-success)',
                                                            color: 'white',
                                                            padding: '0.5rem 1rem',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        {student.feeStatus === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ========== REPORTS TAB ========== */}
                    {activeTab === 'reports' && (
                        <div className="animate-fade-in">
                            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{
                                    fontSize: '1.75rem',
                                    fontWeight: 'var(--font-weight-bold)'
                                }}>
                                    Student Reports
                                </h2>
                                <p style={{ color: 'var(--color-gray-600)', fontSize: '0.95rem' }}>
                                    Generate and download comprehensive report cards for each student
                                </p>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '1.25rem'
                            }}>
                                {students.map((student) => {
                                    const sAvg = (student.results.reduce((sum, r) => sum + r.percentage, 0) / student.results.length).toFixed(1);
                                    return (
                                        <div key={student.id} className="card" style={{
                                            padding: '1.5rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem'
                                        }}>
                                            <div className="flex gap-2" style={{ alignItems: 'center' }}>
                                                <div className="flex-center" style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    background: 'var(--gradient-primary)',
                                                    borderRadius: '50%',
                                                    color: 'white',
                                                    fontWeight: 'var(--font-weight-bold)',
                                                    fontSize: '1.1rem',
                                                    flexShrink: 0
                                                }}>
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{
                                                        fontWeight: 'var(--font-weight-bold)',
                                                        fontSize: '1.1rem',
                                                        color: 'var(--color-gray-900)'
                                                    }}>
                                                        {student.name}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.85rem',
                                                        color: 'var(--color-gray-600)'
                                                    }}>
                                                        {student.id} • {student.grade}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{
                                                display: 'flex',
                                                gap: '0.75rem',
                                                flexWrap: 'wrap'
                                            }}>
                                                <span className="badge" style={{
                                                    background: parseFloat(sAvg) >= 85 ? '#ecfdf5' : parseFloat(sAvg) >= 70 ? '#eff6ff' : '#fef2f2',
                                                    color: parseFloat(sAvg) >= 85 ? '#059669' : parseFloat(sAvg) >= 70 ? '#2563eb' : '#dc2626',
                                                    padding: '0.3rem 0.8rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'var(--font-weight-bold)'
                                                }}>
                                                    Avg: {sAvg}%
                                                </span>
                                                <span className="badge" style={{
                                                    background: student.attendance.percentage >= 90 ? '#ecfdf5' : '#fef2f2',
                                                    color: student.attendance.percentage >= 90 ? '#059669' : '#dc2626',
                                                    padding: '0.3rem 0.8rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'var(--font-weight-bold)'
                                                }}>
                                                    Attendance: {student.attendance.percentage}%
                                                </span>
                                                <span className="badge" style={{
                                                    background: student.feeStatus === 'paid' ? '#ecfdf5' : '#fef2f2',
                                                    color: student.feeStatus === 'paid' ? '#059669' : '#dc2626',
                                                    padding: '0.3rem 0.8rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'var(--font-weight-bold)'
                                                }}>
                                                    Fee: {student.feeStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => downloadStudentReport(student.id)}
                                                className="btn"
                                                style={{
                                                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                                    color: 'white',
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    fontWeight: 'var(--font-weight-bold)',
                                                    fontSize: '0.9rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                <FileText size={16} />
                                                Download Report Card
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default TeacherPortal;
