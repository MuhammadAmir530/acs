import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Award, Calendar, DollarSign, LogOut,
    Save, CheckCircle, XCircle, Edit3, User,
    Download, Upload, FileText, Search
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
    const [reportSearch, setReportSearch] = useState('');
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
        const gradeColor = (pct) => pct >= 90 ? '#0d7c52' : pct >= 75 ? '#1a5fb4' : pct >= 60 ? '#c4841d' : '#c0392b';
        const gradeBg = (pct) => pct >= 90 ? '#e6f9f0' : pct >= 75 ? '#e8f0fc' : pct >= 60 ? '#fef5e7' : '#fce8e6';
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const schoolName = schoolData.name || 'ACS Higher Secondary School';
        const schoolAddress = schoolData.contact?.address || '';
        const schoolPhone = schoolData.contact?.phone || '';
        const schoolEmail = schoolData.contact?.email || '';

        const resultsRows = student.results.map((r, i) => `
            <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding:12px 16px;border-bottom:1px solid #edf2f7;font-size:13px;font-weight:500;color:#2d3748;">${r.subject}</td>
                <td style="padding:12px 16px;border-bottom:1px solid #edf2f7;text-align:center;">
                    <span style="display:inline-block;padding:4px 14px;border-radius:20px;font-weight:700;font-size:13px;background:${gradeBg(r.percentage)};color:${gradeColor(r.percentage)};">${r.percentage}%</span>
                </td>
                <td style="padding:12px 16px;border-bottom:1px solid #edf2f7;text-align:center;">
                    <span style="display:inline-block;width:36px;height:36px;line-height:36px;border-radius:50%;font-weight:800;font-size:14px;background:${gradeBg(r.percentage)};color:${gradeColor(r.percentage)};text-align:center;">${r.grade}</span>
                </td>
                <td style="padding:12px 16px;border-bottom:1px solid #edf2f7;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="flex:1;background:#edf2f7;border-radius:20px;height:8px;overflow:hidden;">
                            <div style="background:linear-gradient(90deg,${gradeColor(r.percentage)},${gradeColor(r.percentage)}cc);height:100%;width:${r.percentage}%;border-radius:20px;transition:width 0.5s;"></div>
                        </div>
                        <span style="font-size:11px;color:#a0aec0;font-weight:600;min-width:28px;">${r.percentage}</span>
                    </div>
                </td>
            </tr>
        `).join('');

        let previousSection = '';
        if (student.previousResults && student.previousResults.length > 0) {
            const prevTerms = student.previousResults.map(term => {
                const termAvg = (term.results.reduce((s, r) => s + r.percentage, 0) / term.results.length).toFixed(1);
                const rows = term.results.map((r, i) => `
                    <tr style="background:${i % 2 === 0 ? '#fff' : '#fafbfc'};">
                        <td style="padding:8px 14px;border-bottom:1px solid #edf2f7;font-size:12px;color:#4a5568;">${r.subject}</td>
                        <td style="padding:8px 14px;border-bottom:1px solid #edf2f7;text-align:center;font-weight:700;font-size:12px;color:${gradeColor(r.percentage)};">${r.percentage}%</td>
                        <td style="padding:8px 14px;border-bottom:1px solid #edf2f7;text-align:center;font-weight:700;font-size:12px;color:${gradeColor(r.percentage)};">${r.grade}</td>
                    </tr>
                `).join('');
                return `
                    <div style="margin-bottom:20px;background:#fafbfc;border-radius:10px;padding:16px;border:1px solid #edf2f7;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                            <span style="font-family:'Playfair Display',Georgia,serif;font-size:14px;font-weight:700;color:#1a3a6b;">${term.term}</span>
                            <span style="font-size:12px;font-weight:700;color:${gradeColor(parseFloat(termAvg))};background:${gradeBg(parseFloat(termAvg))};padding:3px 12px;border-radius:20px;">Avg: ${termAvg}%</span>
                        </div>
                        <table style="width:100%;border-collapse:collapse;">
                            <thead><tr>
                                <th style="padding:7px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#a0aec0;border-bottom:2px solid #edf2f7;">Subject</th>
                                <th style="padding:7px 14px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#a0aec0;border-bottom:2px solid #edf2f7;">Score</th>
                                <th style="padding:7px 14px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#a0aec0;border-bottom:2px solid #edf2f7;">Grade</th>
                            </tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                `;
            }).join('');
            previousSection = `
                <div style="margin-top:32px;page-break-inside:avoid;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                        <div style="width:4px;height:24px;background:#1a3a6b;border-radius:2px;"></div>
                        <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:17px;font-weight:700;color:#1a3a6b;margin:0;">Previous Academic Records</h3>
                    </div>
                    ${prevTerms}
                </div>
            `;
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Report Card \u2014 ${student.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                @media print {
                    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .page { box-shadow: none !important; }
                }
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    color: #2d3748;
                    background: #f1f5f9;
                }
                .page {
                    max-width: 820px;
                    margin: 24px auto;
                    background: #ffffff;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                    border-radius: 8px;
                    overflow: hidden;
                }
            </style>
        </head>
        <body>
            <!-- Print Button -->
            <div class="no-print" style="text-align:center;padding:20px;">
                <button onclick="window.print()" style="padding:12px 32px;background:linear-gradient(135deg,#1a3a6b,#2563eb);color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(37,99,235,0.3);">
                    \ud83d\udda8\ufe0f Print / Save as PDF
                </button>
            </div>

            <div class="page">
                <!-- Top Blue Accent Bar -->
                <div style="height:6px;background:linear-gradient(90deg,#0f2b52,#1a3a6b,#2563eb,#1a3a6b,#0f2b52);"></div>

                <!-- School Header -->
                <div style="text-align:center;padding:36px 40px 28px;border-bottom:3px double #1a3a6b;">
                    <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:30px;font-weight:800;color:#1a3a6b;letter-spacing:1px;margin-bottom:6px;">
                        ${schoolName}
                    </h1>
                    <p style="font-size:12px;color:#64748b;letter-spacing:0.8px;margin-bottom:4px;">${schoolAddress}</p>
                    ${schoolPhone || schoolEmail ? `<p style="font-size:11px;color:#94a3b8;letter-spacing:0.5px;">${schoolPhone}${schoolPhone && schoolEmail ? ' \u2022 ' : ''}${schoolEmail}</p>` : ''}
                    
                    <!-- Decorative divider -->
                    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:18px 0 0;">
                        <div style="flex:1;max-width:120px;height:1px;background:linear-gradient(90deg,transparent,#1a3a6b);"></div>
                        <div style="padding:8px 28px;border:2px solid #1a3a6b;border-radius:4px;">
                            <span style="font-family:'Playfair Display',Georgia,serif;font-size:15px;font-weight:700;color:#1a3a6b;letter-spacing:2px;">REPORT CARD</span>
                        </div>
                        <div style="flex:1;max-width:120px;height:1px;background:linear-gradient(90deg,#1a3a6b,transparent);"></div>
                    </div>
                </div>

                <!-- Student Info -->
                <div style="padding:24px 40px;">
                    <div style="display:flex;flex-wrap:wrap;gap:0;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                        <div style="flex:1;min-width:180px;padding:16px 20px;background:#f8fafc;border-right:1px solid #e2e8f0;">
                            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:4px;">Student Name</div>
                            <div style="font-size:16px;font-weight:700;color:#1a3a6b;">${student.name}</div>
                        </div>
                        <div style="flex:1;min-width:120px;padding:16px 20px;background:#f8fafc;border-right:1px solid #e2e8f0;">
                            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:4px;">Student ID</div>
                            <div style="font-size:16px;font-weight:700;color:#2d3748;">${student.id}</div>
                        </div>
                        <div style="flex:1;min-width:100px;padding:16px 20px;background:#f8fafc;border-right:1px solid #e2e8f0;">
                            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:4px;">Class</div>
                            <div style="font-size:16px;font-weight:700;color:#2d3748;">${student.grade}</div>
                        </div>
                        <div style="flex:1;min-width:140px;padding:16px 20px;background:#f8fafc;">
                            <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:4px;">Report Date</div>
                            <div style="font-size:16px;font-weight:700;color:#2d3748;">${today}</div>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div style="padding:0 40px 32px;">

                    <!-- Current Term Results -->
                    <div style="margin-bottom:32px;">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                            <div style="width:4px;height:24px;background:#1a3a6b;border-radius:2px;"></div>
                            <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:17px;font-weight:700;color:#1a3a6b;margin:0;">Current Term Results</h3>
                        </div>
                        <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
                            <thead>
                                <tr style="background:linear-gradient(135deg,#1a3a6b,#1e4d8a);">
                                    <th style="padding:12px 16px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#ffffff;font-weight:700;">Subject</th>
                                    <th style="padding:12px 16px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#ffffff;font-weight:700;">Score</th>
                                    <th style="padding:12px 16px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#ffffff;font-weight:700;">Grade</th>
                                    <th style="padding:12px 16px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#ffffff;font-weight:700;">Performance</th>
                                </tr>
                            </thead>
                            <tbody>${resultsRows}</tbody>
                            <tfoot>
                                <tr style="background:linear-gradient(135deg,#f0f7ff,#e8f0fc);border-top:2px solid #1a3a6b;">
                                    <td style="padding:14px 16px;font-size:14px;font-weight:800;color:#1a3a6b;">Overall Average</td>
                                    <td style="padding:14px 16px;text-align:center;">
                                        <span style="font-size:18px;font-weight:800;color:#1a3a6b;">${avg}%</span>
                                    </td>
                                    <td style="padding:14px 16px;text-align:center;">
                                        <span style="display:inline-block;width:42px;height:42px;line-height:42px;border-radius:50%;font-weight:800;font-size:16px;background:#1a3a6b;color:white;text-align:center;">${overallGrade}</span>
                                    </td>
                                    <td style="padding:14px 16px;text-align:center;">
                                        <span style="font-size:12px;font-weight:700;color:${gradeColor(parseFloat(avg))};">${parseFloat(avg) >= 85 ? 'Excellent' : parseFloat(avg) >= 70 ? 'Good' : parseFloat(avg) >= 50 ? 'Satisfactory' : 'Needs Improvement'}</span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <!-- Attendance & Fee Status side by side -->
                    <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:32px;">
                        <!-- Attendance -->
                        <div style="flex:2;min-width:300px;page-break-inside:avoid;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                                <div style="width:4px;height:24px;background:#1a3a6b;border-radius:2px;"></div>
                                <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:17px;font-weight:700;color:#1a3a6b;margin:0;">Attendance Record</h3>
                            </div>
                            <div style="border:1px solid #edf2f7;border-radius:12px;overflow:hidden;">
                                <div style="display:flex;text-align:center;">
                                    <div style="flex:1;padding:18px 10px;background:#f0fdf4;border-right:1px solid #edf2f7;">
                                        <div style="font-size:26px;font-weight:800;color:#0d7c52;">${student.attendance.present}</div>
                                        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;margin-top:3px;">Present</div>
                                    </div>
                                    <div style="flex:1;padding:18px 10px;background:#fef2f2;border-right:1px solid #edf2f7;">
                                        <div style="font-size:26px;font-weight:800;color:#c0392b;">${student.attendance.absent}</div>
                                        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;margin-top:3px;">Absent</div>
                                    </div>
                                    <div style="flex:1;padding:18px 10px;background:#eff6ff;border-right:1px solid #edf2f7;">
                                        <div style="font-size:26px;font-weight:800;color:#1a5fb4;">${student.attendance.total}</div>
                                        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;margin-top:3px;">Total</div>
                                    </div>
                                    <div style="flex:1;padding:18px 10px;background:linear-gradient(135deg,#0f2b52,#1a3a6b);color:white;">
                                        <div style="font-size:26px;font-weight:800;">${student.attendance.percentage}%</div>
                                        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.8px;opacity:0.8;font-weight:600;margin-top:3px;">Rate</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Fee Status -->
                        <div style="flex:1;min-width:180px;page-break-inside:avoid;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                                <div style="width:4px;height:24px;background:#1a3a6b;border-radius:2px;"></div>
                                <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:17px;font-weight:700;color:#1a3a6b;margin:0;">Fee Status</h3>
                            </div>
                            <div style="border:1px solid #edf2f7;border-radius:12px;overflow:hidden;text-align:center;padding:24px 16px;background:${student.feeStatus === 'paid' ? 'linear-gradient(135deg,#f0fdf4,#e6f9f0)' : 'linear-gradient(135deg,#fef2f2,#fce8e6)'};">
                                <div style="font-size:40px;margin-bottom:8px;">${student.feeStatus === 'paid' ? '\u2705' : '\u274c'}</div>
                                <div style="font-size:18px;font-weight:800;color:${student.feeStatus === 'paid' ? '#0d7c52' : '#c0392b'};text-transform:uppercase;letter-spacing:1px;">${student.feeStatus === 'paid' ? 'Paid' : 'Unpaid'}</div>
                                <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Tuition Fees</div>
                            </div>
                        </div>
                    </div>

                    ${previousSection}

                    <!-- Signature Section -->
                    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #edf2f7;display:flex;justify-content:space-between;flex-wrap:wrap;gap:24px;">
                        <div style="text-align:center;">
                            <div style="width:180px;border-bottom:2px solid #1a3a6b;margin-bottom:8px;height:40px;"></div>
                            <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Class Teacher</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="width:180px;border-bottom:2px solid #1a3a6b;margin-bottom:8px;height:40px;"></div>
                            <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Principal</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="width:180px;border-bottom:2px solid #1a3a6b;margin-bottom:8px;height:40px;"></div>
                            <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Parent / Guardian</div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background:#f8fafc;border-top:1px solid #edf2f7;padding:16px 40px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                    <div style="font-size:10px;color:#94a3b8;font-weight:500;">Generated on ${today}</div>
                    <div style="font-size:10px;color:#1a3a6b;font-weight:700;letter-spacing:0.5px;">${schoolName}</div>
                    <div style="font-size:10px;color:#94a3b8;font-style:italic;">This is a computer-generated document</div>
                </div>

                <!-- Bottom Blue Accent Bar -->
                <div style="height:6px;background:linear-gradient(90deg,#0f2b52,#1a3a6b,#2563eb,#1a3a6b,#0f2b52);"></div>
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
                                <div>
                                    <h2 style={{
                                        fontSize: '1.75rem',
                                        fontWeight: 'var(--font-weight-bold)'
                                    }}>
                                        Student Reports
                                    </h2>
                                    <p style={{ color: 'var(--color-gray-600)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                                        Generate and download comprehensive report cards for each student
                                    </p>
                                </div>
                                <div style={{ position: 'relative', minWidth: '280px' }}>
                                    <Search size={18} style={{
                                        position: 'absolute', left: '14px', top: '50%',
                                        transform: 'translateY(-50%)', color: 'var(--color-gray-400)',
                                        pointerEvents: 'none'
                                    }} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or ID..."
                                        value={reportSearch}
                                        onChange={(e) => setReportSearch(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem 0.75rem 2.75rem',
                                            borderRadius: '12px',
                                            border: '2px solid var(--color-gray-200)',
                                            fontSize: '0.95rem',
                                            outline: 'none',
                                            background: 'white',
                                            transition: 'border-color 0.2s, box-shadow 0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                        }}
                                        onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                                        onBlur={(e) => { e.target.style.borderColor = 'var(--color-gray-200)'; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
                                    />
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '1.25rem'
                            }}>
                                {students.filter(s => {
                                    if (!reportSearch.trim()) return true;
                                    const q = reportSearch.toLowerCase();
                                    return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.grade.toLowerCase().includes(q);
                                }).map((student) => {
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
