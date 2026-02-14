import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Award, Calendar, DollarSign, LogOut,
    Save, CheckCircle, XCircle, Edit3, User,
    Download, Upload, FileText, Search, Camera,
    BellPlus, Trash2, Megaphone
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSchoolData } from '../context/SchoolDataContext';

const AdminPortal = ({ setIsAdmin, setCurrentPage }) => {
    const { schoolData, setStudents, setFaculty, updateSchoolInfo, setAnnouncements } = useSchoolData();
    const [activeTab, setActiveTab] = useState('marks');
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', date: new Date().toISOString().split('T')[0] });
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editingMarks, setEditingMarks] = useState(false);
    const [tempMarks, setTempMarks] = useState([]);
    const [saveMessage, setSaveMessage] = useState('');
    const [reportSearch, setReportSearch] = useState('');

    // File refs
    const attendanceFileRef = useRef(null);
    const marksFileRef = useRef(null);
    const feeFileRef = useRef(null);
    const photoFileRef = useRef(null);

    const students = schoolData.students || [];

    const handleLogout = () => {
        setIsAdmin(false);
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

    // --- PHOTO UPLOAD FUNCTION ---
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !selectedStudent) return;

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showSaveMessage('File too large! Max 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            const photoUrl = evt.target.result; // Base64 string

            // Update student data
            const updatedStudents = students.map(s => {
                if (s.id === selectedStudent) {
                    return { ...s, photo: photoUrl };
                }
                return s;
            });

            setStudents(updatedStudents);
            showSaveMessage('Student photo updated!');
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
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
        e.target.value = '';
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
        const schoolName = schoolData.name || 'ACS School & College';
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
            const prevRows = student.previousResults.map(term => {
                const termAvg = (term.results.reduce((s, r) => s + r.percentage, 0) / term.results.length).toFixed(1);
                return `
                    <tr style="border-bottom:1px solid #edf2f7;">
                        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#1a3a6b;">${term.term}</td>
                        <td style="padding:10px 16px;text-align:center;">
                            <span style="display:inline-block;padding:4px 16px;border-radius:20px;font-weight:700;font-size:13px;background:${gradeBg(parseFloat(termAvg))};color:${gradeColor(parseFloat(termAvg))};">${termAvg}%</span>
                        </td>
                        <td style="padding:10px 16px;text-align:center;">
                            <span style="font-weight:700;font-size:13px;color:${gradeColor(parseFloat(termAvg))};">${parseFloat(termAvg) >= 85 ? 'Excellent' : parseFloat(termAvg) >= 70 ? 'Good' : parseFloat(termAvg) >= 50 ? 'Satisfactory' : 'Needs Improvement'}</span>
                        </td>
                    </tr>
                `;
            }).join('');
            previousSection = `
                <div style="margin-top:24px;page-break-inside:avoid;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                        <div style="width:4px;height:20px;background:#1a3a6b;border-radius:2px;"></div>
                        <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:15px;font-weight:700;color:#1a3a6b;margin:0;">Previous Academic Records</h3>
                    </div>
                    <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                        <thead>
                            <tr style="background:linear-gradient(135deg,#1a3a6b,#1e4d8a);">
                                <th style="padding:10px 16px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#fff;font-weight:700;">Term</th>
                                <th style="padding:10px 16px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#fff;font-weight:700;">Average</th>
                                <th style="padding:10px 16px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#fff;font-weight:700;">Remark</th>
                            </tr>
                        </thead>
                        <tbody>${prevRows}</tbody>
                    </table>
                </div>
            `;
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Report Card — ${student.name}</title>
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
                    🖨️ Print / Save as PDF
                </button>
            </div>

            <div class="page">
                <!-- Top Blue Accent Bar -->
                <div style="height:6px;background:linear-gradient(90deg,#0f2b52,#1a3a6b,#2563eb,#1a3a6b,#0f2b52);"></div>

                <!-- School Header -->
                <div style="text-align:center;padding:36px 40px 28px;border-bottom:3px double #1a3a6b;">
                    <!-- School Logo and Name Info -->
                    <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:15px;">
                        <img src="/src/assets/logo.png" style="width:100px;height:auto;border-radius:8px;" onerror="this.style.display='none'" />
                        <div style="text-align:left;">
                            <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:32px;font-weight:800;color:#1a3a6b;letter-spacing:1px;margin:0;">
                                ${schoolName}
                            </h1>
                            <p style="font-size:12px;color:#64748b;letter-spacing:0.8px;margin-top:4px;">${schoolAddress}</p>
                            ${schoolPhone || schoolEmail ? `<p style="font-size:11px;color:#94a3b8;letter-spacing:0.5px;margin-top:2px;">${schoolPhone}${schoolPhone && schoolEmail ? ' • ' : ''}${schoolEmail}</p>` : ''}
                        </div>
                    </div>
                    
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
                <div style="padding:20px 40px;">
                    <div style="display:flex;align-items:center;gap:20px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                        <!-- Student Photo -->
                        <div style="width:90px;height:90px;flex-shrink:0;background:linear-gradient(135deg,#1a3a6b,#2563eb);display:flex;align-items:center;justify-content:center;margin:16px 0 16px 20px;border-radius:10px;overflow:hidden;">
                            ${student.photo ? `<img src="${student.photo}" style="width:100%;height:100%;object-fit:cover;" alt="${student.name}" />` : `<span style="font-size:32px;font-weight:800;color:white;font-family:'Playfair Display',Georgia,serif;">${student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>`}
                        </div>
                        <div style="display:flex;flex-wrap:wrap;flex:1;gap:0;">
                            <div style="flex:1;min-width:150px;padding:14px 18px;background:#f8fafc;border-right:1px solid #e2e8f0;">
                                <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:3px;">Student Name</div>
                                <div style="font-size:15px;font-weight:700;color:#1a3a6b;">${student.name}</div>
                            </div>
                            <div style="flex:1;min-width:100px;padding:14px 18px;background:#f8fafc;border-right:1px solid #e2e8f0;">
                                <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:3px;">Student ID</div>
                                <div style="font-size:15px;font-weight:700;color:#2d3748;">${student.id}</div>
                            </div>
                            <div style="flex:1;min-width:80px;padding:14px 18px;background:#f8fafc;border-right:1px solid #e2e8f0;">
                                <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:3px;">Class</div>
                                <div style="font-size:15px;font-weight:700;color:#2d3748;">${student.grade}</div>
                            </div>
                            <div style="flex:1;min-width:110px;padding:14px 18px;background:#f8fafc;">
                                <div style="font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:3px;">Report Date</div>
                                <div style="font-size:15px;font-weight:700;color:#2d3748;">${today}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div style="padding:0 40px 24px;">
                
                    <!-- Current Term Results -->
                    <div style="margin-bottom:24px;">
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
                
                    <!-- Attendance -->
                    <div style="margin-bottom:24px;page-break-inside:avoid;">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:4px;height:20px;background:#1a3a6b;border-radius:2px;"></div>
                            <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:15px;font-weight:700;color:#1a3a6b;margin:0;">Attendance Record</h3>
                        </div>
                        <div style="border:1px solid #edf2f7;border-radius:10px;overflow:hidden;">
                            <div style="display:flex;text-align:center;">
                                <div style="flex:1;padding:14px 10px;background:#f0fdf4;border-right:1px solid #edf2f7;">
                                    <div style="font-size:22px;font-weight:800;color:#0d7c52;">${student.attendance.present}</div>
                                    <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;margin-top:2px;">Present</div>
                                </div>
                                <div style="flex:1;padding:14px 10px;background:#fef2f2;border-right:1px solid #edf2f7;">
                                    <div style="font-size:22px;font-weight:800;color:#c0392b;">${student.attendance.absent}</div>
                                    <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;margin-top:2px;">Absent</div>
                                </div>
                                <div style="flex:1;padding:14px 10px;background:#eff6ff;border-right:1px solid #edf2f7;">
                                    <div style="font-size:22px;font-weight:800;color:#1a5fb4;">${student.attendance.total}</div>
                                    <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;margin-top:2px;">Total</div>
                                </div>
                                <div style="flex:1;padding:14px 10px;background:linear-gradient(135deg,#0f2b52,#1a3a6b);color:white;">
                                    <div style="font-size:22px;font-weight:800;">${student.attendance.percentage}%</div>
                                    <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.8px;opacity:0.8;font-weight:600;margin-top:2px;">Rate</div>
                                </div>
                            </div>
                        </div>
                    </div>
                
                    ${previousSection}
                
                    <!-- Signature Section -->
                    <div style="margin-top:36px;padding-top:18px;border-top:1px solid #edf2f7;display:flex;justify-content:space-between;flex-wrap:wrap;gap:20px;">
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

    // --- ANNOUNCEMENTS FUNCTIONS ---
    const addAnnouncement = () => {
        if (!newAnnouncement.title || !newAnnouncement.content) {
            showSaveMessage('Title and content are required!');
            return;
        }
        const updatedAnnouncements = [
            { id: Date.now(), ...newAnnouncement },
            ...(schoolData.announcements || [])
        ];
        setAnnouncements(updatedAnnouncements);
        setNewAnnouncement({ title: '', content: '', date: new Date().toISOString().split('T')[0] });
        showSaveMessage('Announcement posted!');
    };

    const deleteAnnouncement = (id) => {
        const updatedAnnouncements = schoolData.announcements.filter(a => a.id !== id);
        setAnnouncements(updatedAnnouncements);
        showSaveMessage('Announcement deleted!');
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
            {/* Photo Uploader */}
            <input
                type="file"
                ref={photoFileRef}
                onChange={handlePhotoUpload}
                accept="image/*"
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
                                Admin Portal
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
                            { id: 'reports', label: 'Student Reports', icon: FileText },
                            { id: 'announcements', label: 'Announcements', icon: Megaphone }
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
                                        <button
                                            onClick={() => photoFileRef.current.click()}
                                            className="btn btn-sm"
                                            style={{ background: '#0891b2', color: 'white' }}
                                        >
                                            <Camera size={16} /> Update Photo
                                        </button>
                                    </>
                                )}
                                {editingMarks && (
                                    <button onClick={saveMarks} className="btn btn-primary btn-sm">
                                        <Save size={16} /> Save
                                    </button>
                                )}
                            </div>

                            {selectedStudent && (
                                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden',
                                        background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {students.find(s => s.id === selectedStudent).photo ? (
                                            <img
                                                src={students.find(s => s.id === selectedStudent).photo}
                                                alt="Student"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <User size={30} color="#94a3b8" />
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{students.find(s => s.id === selectedStudent).name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Current Photo</div>
                                    </div>
                                </div>
                            )}

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
                                                    Percentage
                                                </th>
                                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-gray-900)' }}>
                                                    Grade
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(editingMarks ? tempMarks : students.find(s => s.id === selectedStudent).results).map((result, idx) => (
                                                <tr key={idx} style={{ borderTop: '1px solid var(--color-gray-200)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 'var(--font-weight-medium)' }}>
                                                        {result.subject}
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
                                                                style={{ width: '80px', padding: '0.4rem', textAlign: 'center' }}
                                                            />
                                                        ) : (
                                                            <span style={{ fontWeight: 'var(--font-weight-bold)', color: getGradeColor(result.percentage) }}>
                                                                {result.percentage}%
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            width: '32px',
                                                            height: '32px',
                                                            lineHeight: '32px',
                                                            borderRadius: '50%',
                                                            background: getGradeColor(result.percentage),
                                                            color: 'white',
                                                            fontWeight: 'var(--font-weight-bold)',
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            {result.grade}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Other tabs (Attendance, Fees, Reports) reusing existing logic */}
                    {activeTab === 'attendance' && (
                        <div className="animate-fade-in">
                            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Attendance Sheet</h2>
                                <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button onClick={exportAttendanceExcel} style={{ ...excelBtnStyle, background: '#217346', color: 'white', borderColor: '#217346' }}>
                                        <Download size={16} /> Export Excel
                                    </button>
                                    <button onClick={() => attendanceFileRef.current.click()} style={{ ...excelBtnStyle, background: 'white', color: '#217346', borderColor: '#217346' }}>
                                        <Upload size={16} /> Import Excel
                                    </button>
                                </div>
                            </div>
                            <div className="card" style={{ padding: 0, overflow: 'hidden', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-gray-50)', textAlign: 'left' }}>
                                            <th style={{ padding: '1rem' }}>Student ID</th>
                                            <th style={{ padding: '1rem' }}>Name</th>
                                            <th style={{ padding: '1rem' }}>Attendance</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Mark Today</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => (
                                            <tr key={student.id} style={{ borderTop: '1px solid var(--color-gray-200)' }}>
                                                <td style={{ padding: '1rem', color: 'var(--color-gray-600)' }}>{student.id}</td>
                                                <td style={{ padding: '1rem', fontWeight: 'var(--font-weight-medium)' }}>{student.name}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                                                        <div style={{ flex: 1, height: '8px', background: 'var(--color-gray-200)', borderRadius: '4px', maxWidth: '100px' }}>
                                                            <div style={{ width: `${student.attendance.percentage}%`, height: '100%', background: getGradeColor(student.attendance.percentage), borderRadius: '4px' }}></div>
                                                        </div>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 'var(--font-weight-bold)' }}>{student.attendance.percentage}%</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div className="flex gap-1" style={{ justifyContent: 'center' }}>
                                                        <button onClick={() => markAttendance(student.id, 'present')} title="Mark Present" style={{ padding: '0.4rem', borderRadius: '6px', background: '#dcfce7', color: '#16a34a', border: 'none', cursor: 'pointer' }}>
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button onClick={() => markAttendance(student.id, 'absent')} title="Mark Absent" style={{ padding: '0.4rem', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer' }}>
                                                            <XCircle size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fees' && (
                        <div className="animate-fade-in">
                            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Fee Status</h2>
                                <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button onClick={exportFeeExcel} style={{ ...excelBtnStyle, background: '#217346', color: 'white', borderColor: '#217346' }}>
                                        <Download size={16} /> Export Excel
                                    </button>
                                    <button onClick={() => feeFileRef.current.click()} style={{ ...excelBtnStyle, background: 'white', color: '#217346', borderColor: '#217346' }}>
                                        <Upload size={16} /> Import Excel
                                    </button>
                                </div>
                            </div>
                            <div className="card" style={{ padding: 0, overflow: 'hidden', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-gray-50)', textAlign: 'left' }}>
                                            <th style={{ padding: '1rem' }}>Student ID</th>
                                            <th style={{ padding: '1rem' }}>Name</th>
                                            <th style={{ padding: '1rem' }}>Class</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => (
                                            <tr key={student.id} style={{ borderTop: '1px solid var(--color-gray-200)' }}>
                                                <td style={{ padding: '1rem', color: 'var(--color-gray-600)' }}>{student.id}</td>
                                                <td style={{ padding: '1rem', fontWeight: 'var(--font-weight-medium)' }}>{student.name}</td>
                                                <td style={{ padding: '1rem' }}>{student.grade}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'var(--font-weight-bold)',
                                                        background: student.feeStatus === 'paid' ? '#dcfce7' : '#fee2e2',
                                                        color: student.feeStatus === 'paid' ? '#16a34a' : '#dc2626'
                                                    }}>
                                                        {student.feeStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <button onClick={() => toggleFeeStatus(student.id)} style={{
                                                        padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-gray-300)', background: 'white', cursor: 'pointer', fontSize: '0.85rem'
                                                    }}>
                                                        Toggle Status
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)', marginBottom: '1.5rem' }}>Student Reports</h2>
                            < div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
                                <div className="card" style={{ padding: '2rem' }}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label className="form-label" style={{ textAlign: 'left' }}>Search Student</label>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                                            <input
                                                type="text"
                                                placeholder="Enter Name or ID..."
                                                className="form-input"
                                                style={{ paddingLeft: '3rem' }}
                                                value={reportSearch}
                                                onChange={(e) => setReportSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto', textAlign: 'left' }}>
                                        {students.filter(s =>
                                            s.name.toLowerCase().includes(reportSearch.toLowerCase()) ||
                                            s.id.toLowerCase().includes(reportSearch.toLowerCase())
                                        ).map(s => (
                                            <div key={s.id} className="flex-between" style={{
                                                padding: '0.75rem', borderBottom: '1px solid var(--color-gray-100)'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>{s.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>{s.id}</div>
                                                </div>
                                                <button
                                                    onClick={() => downloadStudentReport(s.id)}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    <Download size={14} /> Download
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'announcements' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)', marginBottom: '1.5rem' }}>Manage Announcements</h2>

                            <div className="grid grid-cols-2" style={{ gap: '2rem', alignItems: 'start' }}>
                                {/* Form Column */}
                                <div className="card" style={{ padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--color-primary)' }}>Post New Announcement</h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <div>
                                            <label className="form-label">Announcement Title</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g., Summer Vacation Notice"
                                                value={newAnnouncement.title}
                                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label">Publication Date</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={newAnnouncement.date}
                                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, date: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label">Content / Details</label>
                                            <textarea
                                                className="form-input"
                                                style={{ height: '120px', resize: 'vertical' }}
                                                placeholder="Provide detailed information here..."
                                                value={newAnnouncement.content}
                                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                            ></textarea>
                                        </div>

                                        <button
                                            onClick={addAnnouncement}
                                            className="btn btn-primary"
                                            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                                        >
                                            <BellPlus size={18} />
                                            Post Announcement
                                        </button>
                                    </div>
                                </div>

                                {/* List Column */}
                                <div className="card" style={{ padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Active Announcements</h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {(!schoolData.announcements || schoolData.announcements.length === 0) ? (
                                            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-gray-400)' }}>
                                                <Megaphone size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                                <p>No active announcements.</p>
                                            </div>
                                        ) : (
                                            schoolData.announcements.map((ann) => (
                                                <div key={ann.id} style={{
                                                    padding: '1rem',
                                                    border: '1px solid var(--color-gray-100)',
                                                    borderRadius: 'var(--radius-md)',
                                                    position: 'relative'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>
                                                                {ann.date}
                                                            </div>
                                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                                                                {ann.title}
                                                            </div>
                                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)', lineHeight: 1.5, margin: 0 }}>
                                                                {ann.content}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => deleteAnnouncement(ann.id)}
                                                            style={{
                                                                padding: '0.4rem',
                                                                background: '#fee2e2',
                                                                color: '#ef4444',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </section>
        </div>
    );
};

export default AdminPortal;
