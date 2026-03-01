import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import {
    Users, Award, Calendar, DollarSign, LogOut,
    Save, CheckCircle, XCircle, Edit3, User,
    Download, Upload, FileText, Search, Camera,
    BellPlus, Trash2, Megaphone, PlusCircle, Lock,
    Building, School, Check, X, ChevronRight, Layout,
    GripVertical, ChevronUp, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSchoolData } from '../context/SchoolDataContext';
import { supabase } from '../supabaseClient';

// ── Lazily-loaded tab components (module-level so references are stable) ──
const GradebookTab = lazy(() => import('../admin/tabs/GradebookTab'));
const AttendanceTab = lazy(() => import('../admin/tabs/AttendanceTab'));
const FeeTab = lazy(() => import('../admin/tabs/FeeTab'));
const AdmissionsTab = lazy(() => import('../admin/tabs/AdmissionsTab'));
const ReportsTab = lazy(() => import('../admin/tabs/ReportsTab'));
const AnnouncementsTab = lazy(() => import('../admin/tabs/AnnouncementsTab'));
const FacultyTab = lazy(() => import('../admin/tabs/FacultyTab'));
const FacilitiesTab = lazy(() => import('../admin/tabs/FacilitiesTab'));
const BlogTab = lazy(() => import('../admin/tabs/BlogTab'));
const ClassListsTab = lazy(() => import('../admin/tabs/ClassListsTab'));
const StudentEditModal = lazy(() => import('../admin/modals/StudentEditModal'));

const AdminPortal = ({ setIsAdmin, setCurrentPage }) => {
    const { schoolData, CLASSES, SUBJECTS, TERMS, SECTIONS, WEIGHTS, fetchData, setStudents, setFaculty, updateSchoolInfo, setAnnouncements, updateClasses, updateSubjects, updateTerms, updateSections, updateWeights, adminCredentials, changeAdminPassword } = useSchoolData();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [saveMessage, setSaveMessage] = useState('');
    const sectionClasses = (SECTIONS || []).flatMap(s => s.classes || []);
    const [selectedClass, setSelectedClass] = useState(sectionClasses[0] || '');
    // Per-class subjects: SUBJECTS is now { className: [subject,...] }
    const classSubjects = (SUBJECTS && !Array.isArray(SUBJECTS) ? (SUBJECTS[selectedClass] || []) : []);
    const updateClassSubjects = (newList) => updateSubjects({ ...SUBJECTS, [selectedClass]: newList });
    const [reportSearch, setReportSearch] = useState('');

    // ── Gradebook State ──
    // ── Class Management State ──
    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const [viewingClass, setViewingClass] = useState(null);
    const [classDetailTab, setClassDetailTab] = useState('boys');
    const [newSectionName, setNewSectionName] = useState('');

    // ── Confirm Modal State ──
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null, danger: true });
    const openConfirm = (title, message, onConfirm, danger = true) => setConfirmModal({ open: true, title, message, onConfirm, danger });
    const closeConfirm = () => setConfirmModal({ open: false, title: '', message: '', onConfirm: null, danger: true });

    // ── Change Admin Password State ──
    const [showChangePwd, setShowChangePwd] = useState(false);
    const [newAdminUser, setNewAdminUser] = useState('');
    const [newAdminPwd, setNewAdminPwd] = useState('');
    const [newAdminPwdConfirm, setNewAdminPwdConfirm] = useState('');

    // ── Attendance date filter ──
    const [attDateFilter, setAttDateFilter] = useState('');

    // Initialize selected section
    useEffect(() => {
        if (!selectedSectionId && SECTIONS && SECTIONS.length > 0) {
            setSelectedSectionId(SECTIONS[0].id);
        }
    }, [SECTIONS, selectedSectionId]);

    // ── Gradebook State ──
    const [gbTerm, setGbTerm] = useState(TERMS[0] || '');
    const [gbGenderTab, setGbGenderTab] = useState('boys'); // 'boys', 'girls', 'all'
    const [gbEdits, setGbEdits] = useState({});       // { studentId: { subject: obtained } }
    const [gbSaving, setGbSaving] = useState(false);
    const [showGbStats, setShowGbStats] = useState(true);
    const [newSubjectInput, setNewSubjectInput] = useState('');
    const [newTermInput, setNewTermInput] = useState('');
    const [showGbSettings, setShowGbSettings] = useState(false);

    const getSubjectTotal = (sub, term) => {
        const t = term || gbTerm || TERMS[0] || 'Current';
        if (WEIGHTS) {
            if (WEIGHTS[t] && typeof WEIGHTS[t] === 'object' && WEIGHTS[t][sub] !== undefined && WEIGHTS[t][sub] !== '') return Number(WEIGHTS[t][sub]);
            if (typeof WEIGHTS[sub] === 'number') return Number(WEIGHTS[sub]);
        }
        return 100;
    };

    // ── Overall Percentage Calculation ──
    // Uses per-subject totals from WEIGHTS: sum(obtained) / sum(totals) × 100
    // Falls back to 100 per subject if not configured.
    const calcOverallPct = (results) => {
        if (!results || results.length === 0) return 0;
        let totalObtained = 0, totalMax = 0;
        results.forEach(r => {
            const subTotal = getSubjectTotal(r.subject, r.term);
            const obtained = r.obtained !== undefined ? r.obtained : Math.round((r.percentage / 100) * subTotal);
            totalObtained += obtained;
            totalMax += subTotal;
        });
        return totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    };

    // Alias for backward compat in export functions
    const calcWeightedAvg = calcOverallPct;

    // ── Grade Calculation (Pakistani Scale) ──
    const calcGrade = (pct) => {
        if (pct >= 90) return 'A+';
        if (pct >= 80) return 'A';
        if (pct >= 70) return 'B+';
        if (pct >= 60) return 'B';
        if (pct >= 50) return 'C';
        if (pct >= 40) return 'D';
        return 'F';
    };

    const gradeColor = (pct) => {
        if (pct >= 80) return { bg: '#dcfce7', text: '#15803d' };
        if (pct >= 60) return { bg: '#dbeafe', text: '#1d4ed8' };
        if (pct >= 50) return { bg: '#fef9c3', text: '#a16207' };
        if (pct >= 40) return { bg: '#ffedd5', text: '#c2410c' };
        return { bg: '#fee2e2', text: '#dc2626' };
    };

    // Helper: get results for a specific term from a student's results array
    const getTermResults = (student, termLabel) => {
        return (student.results || []).filter(r => r.term === termLabel);
    };

    // Get the obtained value for a student/subject from edits or saved data (filtered by selected term)
    const getCellValue = (student, subject) => {
        if (gbEdits[student.id] && gbEdits[student.id][subject] !== undefined)
            return gbEdits[student.id][subject];
        const termLabel = gbTerm || TERMS[0] || 'Current';
        const termResults = getTermResults(student, termLabel);
        const r = termResults.find(r => r.subject === subject);
        return r ? (r.obtained !== undefined ? r.obtained : '') : '';
    };

    // Helper: filter students by gender for gradebook
    const filterByGender = (studentsList, genderTab) => {
        if (genderTab === 'all') return studentsList;
        const genderVal = genderTab === 'boys' ? 'Male' : 'Female';
        return studentsList.filter(s => s.admissions?.[0]?.gender === genderVal);
    };

    const handleCellEdit = (studentId, subject, value) => {
        setGbEdits(prev => ({
            ...prev,
            [studentId]: { ...(prev[studentId] || {}), [subject]: value === '' ? '' : Number(value) }
        }));
    };

    const saveGradebook = async () => {
        if (Object.keys(gbEdits).length === 0) { showSaveMessage('No changes to save.'); return; }
        setGbSaving(true);
        const termLabel = gbTerm || TERMS[0] || 'Current';
        const classStudents = students.filter(s => s.grade === selectedClass);
        const updatedStudents = classStudents.map(s => {
            if (!gbEdits[s.id]) return s;
            // Build new results for this term only
            const newTermResults = classSubjects.map(subject => {
                const subTotal = getSubjectTotal(subject, termLabel);
                const obtained = gbEdits[s.id]?.[subject] !== undefined
                    ? Number(gbEdits[s.id][subject])
                    : (getTermResults(s, termLabel).find(r => r.subject === subject)?.obtained ?? 0);
                const pct = Math.round((obtained / subTotal) * 100);
                const existing = getTermResults(s, termLabel).find(r => r.subject === subject);
                return { subject, total: subTotal, obtained, percentage: pct, grade: calcGrade(pct), remarks: existing?.remarks || '', term: termLabel };
            });
            // Merge: keep results from OTHER terms, replace results for THIS term
            const otherTermResults = (s.results || []).filter(r => r.term !== termLabel);
            return { ...s, results: [...otherTermResults, ...newTermResults] };
        });
        const allStudents = students.map(s => updatedStudents.find(u => u.id === s.id) || s);
        await setStudents(allStudents);
        setGbEdits({});
        setGbSaving(false);
        showSaveMessage(`Gradebook saved for ${termLabel}!`);
    };

    const saveRemarks = async (studentId, subject, remarks) => {
        const termLabel = gbTerm || TERMS[0] || 'Current';
        const updatedStudents = students.map(s => {
            if (s.id !== studentId) return s;
            const newResults = (s.results || []).map(r =>
                (r.subject === subject && r.term === termLabel) ? { ...r, remarks } : r
            );
            return { ...s, results: newResults };
        });
        await setStudents(updatedStudents);
    };

    const archiveTerm = async () => {
        const termLabel = gbTerm || TERMS[0];
        if (!window.confirm(`Archive "${termLabel}" marks for ${selectedClass}? This will move this term's results to history.`)) return;
        const classStudents = students.filter(s => s.grade === selectedClass);
        const updatedStudents = classStudents.map(s => {
            const termResults = getTermResults(s, termLabel);
            const historyEntry = { term: termLabel, results: [...termResults] };
            // Remove this term's results, keep other terms
            const remainingResults = (s.results || []).filter(r => r.term !== termLabel);
            return {
                ...s,
                previousResults: [...(s.previousResults || []), historyEntry],
                results: remainingResults
            };
        });
        const allStudents = students.map(s => updatedStudents.find(u => u.id === s.id) || s);
        await setStudents(allStudents);
        showSaveMessage(`Term "${termLabel}" archived!`);
    };

    // ── Cumulative Excel Export ──
    // Exports one workbook with:
    //   - One sheet per archived term (from previousResults)
    //   - One "Current" sheet for active results
    //   - One "Summary" sheet showing all terms side-by-side
    const exportGradebookExcel = () => {
        const classStudents = students.filter(s => s.grade === selectedClass);
        const wb = XLSX.utils.book_new();

        // Collect all term names (archived + current)
        const archivedTermNames = [];
        classStudents.forEach(s => {
            (s.previousResults || []).forEach(h => {
                if (!archivedTermNames.includes(h.term)) archivedTermNames.push(h.term);
            });
        });

        const buildSheet = (termResults) => {
            // termResults: { studentId -> results[] }
            return classStudents.map(s => {
                const results = termResults[s.id] || [];
                const row = { 'Student ID': s.id, 'Student Name': s.name };
                SUBJECTS[selectedClass] && SUBJECTS[selectedClass].forEach(sub => {
                    const r = results.find(r => r.subject === sub);
                    row[`${sub} (Marks)`] = r ? r.obtained : '';
                    row[`${sub} (%)`] = r ? r.percentage : '';
                    row[`${sub} (Grade)`] = r ? r.grade : '';
                    const tLabel = r ? r.term : null;
                    const w = tLabel ? getSubjectTotal(sub, tLabel) : getSubjectTotal(sub);
                    if (w !== 100) row[`${sub} (Weight)`] = w;
                });
                const avg = results.length ? calcWeightedAvg(results) : '';
                row['Weighted Avg %'] = avg;
                row['Overall Grade'] = avg !== '' ? calcGrade(avg) : '';
                return row;
            });
        };

        // Sheet per archived term
        archivedTermNames.forEach(termName => {
            const termResults = {};
            classStudents.forEach(s => {
                const hist = (s.previousResults || []).find(h => h.term === termName);
                termResults[s.id] = hist ? hist.results : [];
            });
            const ws = XLSX.utils.json_to_sheet(buildSheet(termResults));
            XLSX.utils.book_append_sheet(wb, ws, termName.substring(0, 31));
        });

        // Per-term sheets for currently active terms (not archived)
        TERMS.forEach(termName => {
            if (archivedTermNames.includes(termName)) return; // already exported via archived
            const termResults = {};
            classStudents.forEach(s => {
                termResults[s.id] = getTermResults(s, termName);
            });
            // Only add sheet if there's data
            const hasData = Object.values(termResults).some(r => r.length > 0);
            if (hasData) {
                const ws = XLSX.utils.json_to_sheet(buildSheet(termResults));
                XLSX.utils.book_append_sheet(wb, ws, termName.substring(0, 31));
            }
        });

        // Summary sheet: student | Term1 Avg | Term2 Avg | ... | Overall
        const allTermNames = [...archivedTermNames, ...TERMS.filter(t => !archivedTermNames.includes(t))];
        const summaryRows = classStudents.map(s => {
            const row = { 'Student ID': s.id, 'Student Name': s.name, 'Gender': s.admissions?.[0]?.gender || '' };
            allTermNames.forEach(termName => {
                // Check archived first, then active
                const hist = (s.previousResults || []).find(h => h.term === termName);
                const res = hist ? hist.results : getTermResults(s, termName);
                row[`${termName} Avg%`] = res.length ? calcWeightedAvg(res) : '';
                row[`${termName} Grade`] = res.length ? calcGrade(calcWeightedAvg(res)) : '';
            });
            // Grand average across all terms
            const allAvgs = allTermNames.map(t => {
                const hist = (s.previousResults || []).find(h => h.term === t);
                const res = hist ? hist.results : getTermResults(s, t);
                return res.length ? calcWeightedAvg(res) : null;
            }).filter(v => v !== null);
            row['Grand Avg%'] = allAvgs.length ? Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) : '';
            row['Grand Grade'] = row['Grand Avg%'] !== '' ? calcGrade(row['Grand Avg%']) : '';
            return row;
        });
        const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        XLSX.writeFile(wb, `Gradebook_${selectedClass}_AllTerms.xlsx`);
    };

    const importGradebookExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const wb = XLSX.read(evt.target.result, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws);
            const newEdits = {};
            rows.forEach(row => {
                const studentId = row['Student ID'];
                if (!studentId) return;
                newEdits[studentId] = {};
                classSubjects.forEach(sub => {
                    if (row[sub] !== undefined) newEdits[studentId][sub] = Number(row[sub]);
                });
            });
            setGbEdits(newEdits);
            const termLabel = gbTerm || TERMS[0] || 'Current';
            showSaveMessage(`Imported marks for ${Object.keys(newEdits).length} students into ${termLabel}. Click Save All to apply.`);
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const downloadGradebookTemplate = () => {
        const allClassStudents = students.filter(s => s.grade === selectedClass);
        const classStudents = filterByGender(allClassStudents, gbGenderTab);
        const termLabel = gbTerm || TERMS[0] || 'Current';
        const genderLabel = gbGenderTab === 'all' ? 'All' : (gbGenderTab === 'boys' ? 'Boys' : 'Girls');
        const rows = classStudents.map(s => {
            const row = { 'Student ID': s.id, 'Student Name': s.name, 'Gender': s.admissions?.[0]?.gender || '' };
            classSubjects.forEach(sub => { row[sub] = ''; });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Marks Template');
        XLSX.writeFile(wb, `Marks_Template_${selectedClass}_${termLabel}_${genderLabel}.xlsx`);
    };

    // ── PDF Result Report ──
    const exportResultPDF = () => {
        const termLabel = gbTerm || TERMS[0] || 'Current';
        const allClassStudents = students.filter(s => s.grade === selectedClass);
        const classStudents = allClassStudents
            .slice()
            .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        const subs = classSubjects;
        const schoolName = schoolData.name || 'ACS School & College';
        const printDate = new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
        const sectionName = (SECTIONS || []).find(s => s.classes.includes(selectedClass))?.name || '';

        const gradeColors = (pct) => {
            if (pct >= 90) return { bg: '#d1fae5', text: '#065f46', border: '#34d399' };
            if (pct >= 80) return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
            if (pct >= 70) return { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' };
            if (pct >= 60) return { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' };
            if (pct >= 50) return { bg: '#fef9c3', text: '#a16207', border: '#fde047' };
            if (pct >= 40) return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' };
            return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
        };

        // Build rows
        const rows = classStudents.map((s, idx) => {
            const res = getTermResults(s, termLabel);
            const overall = res.length ? calcOverallPct(res) : null;
            const gc = overall !== null ? gradeColors(overall) : { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' };
            const subCells = subs.map(sub => {
                const r = res.find(r => r.subject === sub);
                const ob = r ? r.obtained : null;
                const total = getSubjectTotal(sub, termLabel);
                const pct = ob !== null ? Math.round((ob / total) * 100) : null;
                const sc = pct !== null ? gradeColors(pct) : { bg: '#f8fafc', text: '#94a3b8', border: '#e2e8f0' };
                return `<td style="text-align:center; padding:6px 4px; border:1px solid #e2e8f0; background:${sc.bg}; color:${sc.text}; font-weight:600; font-size:12px;">${ob !== null ? `${ob}<br/><span style='font-size:10px;font-weight:400'>${calcGrade(pct)}</span>` : '—'}</td>`;
            }).join('');
            return `
                <tr style="background:${idx % 2 === 0 ? '#fff' : '#f8fafc'}">
                    <td style="padding:8px 10px; border:1px solid #e2e8f0; font-weight:600; font-size:12px; color:#475569;">${idx + 1}</td>
                    <td style="padding:8px 10px; border:1px solid #e2e8f0; font-weight:700; font-size:12px; color:#1e293b;">${s.name}</td>
                    <td style="padding:8px 4px; border:1px solid #e2e8f0; font-size:11px; color:#64748b; text-align:center">${s.id}</td>
                    ${subCells}
                    <td style="text-align:center; padding:6px 8px; border:1px solid ${gc.border}; background:${gc.bg}; color:${gc.text}; font-weight:800; font-size:13px;">
                        ${overall !== null ? `${overall}%<br/><span style='font-size:11px'>${calcGrade(overall)}</span>` : '—'}
                    </td>
                    <td style="text-align:center; padding:6px 8px; border:1px solid #e2e8f0; font-weight:700; font-size:12px; color:${overall !== null && overall >= 40 ? '#15803d' : '#dc2626'}">
                        ${overall !== null ? (overall >= 40 ? 'PASS' : 'FAIL') : '—'}
                    </td>
                </tr>`;
        }).join('');

        // Stats
        const withResults = classStudents.filter(s => getTermResults(s, termLabel).length > 0);
        const passCount = withResults.filter(s => calcOverallPct(getTermResults(s, termLabel)) >= 40).length;
        const avgPct = withResults.length ? Math.round(withResults.reduce((sum, s) => sum + calcOverallPct(getTermResults(s, termLabel)), 0) / withResults.length) : 0;
        const topStudent = withResults.sort((a, b) => calcOverallPct(getTermResults(b, termLabel)) - calcOverallPct(getTermResults(a, termLabel)))[0];

        const subHeaders = subs.map(sub =>
            `<th style="padding:8px 4px; background:#1e3a5f; color:white; font-size:11px; text-align:center; min-width:80px; border:1px solid #2d4f7c">${sub}<br/><span style='font-weight:400;font-size:10px'>/${getSubjectTotal(sub, termLabel)}</span></th>`
        ).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Result Report - ${selectedClass} - ${termLabel}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; }
  @page { size: A4 landscape; margin: 12mm; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 20px 28px; border-radius: 8px 8px 0 0; }
  .header h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
  .header p { font-size: 12px; opacity: 0.85; }
  .meta-bar { display: flex; gap: 24px; background: #f1f5f9; padding: 12px 28px; border-bottom: 2px solid #e2e8f0; flex-wrap: wrap; }
  .meta-item { display: flex; flex-direction: column; }
  .meta-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em; }
  .meta-value { font-size: 14px; font-weight: 700; color: #1e293b; }
  .stats-bar { display: flex; gap: 16px; padding: 14px 28px; background: #fff; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; }
  .stat-card { flex: 1; min-width: 100px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; text-align: center; }
  .stat-num { font-size: 22px; font-weight: 800; color: #1e3a5f; }
  .stat-lbl { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 2px; }
  .table-wrap { overflow-x: auto; padding: 0 28px 28px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
  thead tr th { position: sticky; top: 0; }
  .footer { text-align: center; padding: 16px 28px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  .print-btn { position: fixed; bottom: 24px; right: 24px; background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.4); }
  .print-btn:hover { background: #1d4ed8; }
</style>
</head>
<body>
<div class="header">
  <h1>📊 ${schoolName}</h1>
  <p>Result Report &nbsp;|&nbsp; ${sectionName ? sectionName + ' — ' : ''}${selectedClass} &nbsp;|&nbsp; ${termLabel} &nbsp;|&nbsp; Generated: ${printDate}</p>
</div>
<div class="meta-bar">
  <div class="meta-item"><span class="meta-label">Class</span><span class="meta-value">${selectedClass}</span></div>
  ${sectionName ? `<div class="meta-item"><span class="meta-label">Section</span><span class="meta-value">${sectionName}</span></div>` : ''}
  <div class="meta-item"><span class="meta-label">Term</span><span class="meta-value">${termLabel}</span></div>
  <div class="meta-item"><span class="meta-label">Total Students</span><span class="meta-value">${classStudents.length}</span></div>
  <div class="meta-item"><span class="meta-label">Appeared</span><span class="meta-value">${withResults.length}</span></div>
  <div class="meta-item"><span class="meta-label">Date</span><span class="meta-value">${printDate}</span></div>
</div>
<div class="stats-bar">
  <div class="stat-card"><div class="stat-num" style="color:#15803d">${passCount}</div><div class="stat-lbl">Passed</div></div>
  <div class="stat-card"><div class="stat-num" style="color:#dc2626">${withResults.length - passCount}</div><div class="stat-lbl">Failed</div></div>
  <div class="stat-card"><div class="stat-num" style="color:#1d4ed8">${withResults.length ? Math.round((passCount / withResults.length) * 100) : 0}%</div><div class="stat-lbl">Pass Rate</div></div>
  <div class="stat-card"><div class="stat-num">${avgPct}%</div><div class="stat-lbl">Class Average</div></div>
  ${topStudent ? `<div class="stat-card" style="flex:2;"><div class="stat-num" style="font-size:16px;color:#7c3aed">${topStudent.name}</div><div class="stat-lbl">🏆 Top Student — ${calcOverallPct(getTermResults(topStudent, termLabel))}%</div></div>` : ''}
</div>
<div class="table-wrap">
<table>
  <thead>
    <tr>
      <th style="padding:8px 10px; background:#1e3a5f; color:white; text-align:left; font-size:11px; border:1px solid #2d4f7c">#</th>
      <th style="padding:8px 10px; background:#1e3a5f; color:white; text-align:left; font-size:11px; min-width:160px; border:1px solid #2d4f7c">Student Name</th>
      <th style="padding:8px 4px; background:#1e3a5f; color:white; text-align:center; font-size:11px; min-width:90px; border:1px solid #2d4f7c">ID</th>
      ${subHeaders}
      <th style="padding:8px 8px; background:#0f2744; color:#fbbf24; text-align:center; font-size:11px; min-width:70px; border:1px solid #2d4f7c">Overall</th>
      <th style="padding:8px 8px; background:#0f2744; color:#fbbf24; text-align:center; font-size:11px; min-width:55px; border:1px solid #2d4f7c">Result</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
</div>
<div class="footer">
  ${schoolName} &nbsp;|&nbsp; ${selectedClass} &nbsp;|&nbsp; ${termLabel} &nbsp;|&nbsp; Printed: ${printDate} &nbsp;|&nbsp; Total Students: ${classStudents.length}
</div>
<button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save PDF</button>
</body>
</html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 600);
    };


    const attendanceFileRef = useRef(null);
    const marksFileRef = useRef(null);
    const feeFileRef = useRef(null);
    const photoFileRef = useRef(null);
    const facultyFileRef = useRef(null);
    const facilityFileRef = useRef(null);
    const blogImageRef = useRef(null);
    const gbImportFileRef = useRef(null);


    // Announcement state
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', date: new Date().toISOString().split('T')[0] });

    // Admission Form State
    const admissionInitialState = {
        applyingFor: sectionClasses[0] || '', applicationDate: new Date().toISOString().split('T')[0],
        serialNumber: '', // Added Serial Number field
        studentName: '', bForm: '', dob: '', nationality: '', gender: '', religion: '',
        allergies: 'No', allergiesDetails: '', chronicCondition: 'No', chronicConditionDetails: '',
        medication: 'No', medicationDetails: '', fatherName: '', fatherCnic: '',
        contact: '', whatsapp: '', address: '', docs: { photos: false, bform: false, cnic: false }, photo: ''
    };
    const [admissionData, setAdmissionData] = useState(admissionInitialState);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const [editingFacultyId, setEditingFacultyId] = useState(null);
    const [editingFacilityId, setEditingFacilityId] = useState(null);
    const [tempFacultyMember, setTempFacultyMember] = useState(null);
    const [tempFacility, setTempFacility] = useState(null);
    const [editingBlogId, setEditingBlogId] = useState(null);
    const [tempBlog, setTempBlog] = useState(null);

    // Class Management State
    const [selectedClassForList, setSelectedClassForList] = useState(sectionClasses[0] || '');
    const [classListSearch, setClassListSearch] = useState('');
    const [newClassName, setNewClassName] = useState('');
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [editingSectionName, setEditingSectionName] = useState('');
    const classImportFileRef = useRef(null);
    const studentPhotoUploadRef = useRef(null);
    const [editingStudentId, setEditingStudentId] = useState(null);
    const [editStudentData, setEditStudentData] = useState(null);

    const students = schoolData.students || [];

    const handleFacultyPhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const publicUrl = await uploadImage(file, 'Faculty');
        if (publicUrl) {
            if (editingFacultyId === 'new') {
                setTempFacultyMember(prev => ({ ...prev, image: publicUrl }));
            } else {
                const { error } = await supabase.from('faculty').update({ image: publicUrl }).eq('id', editingFacultyId);
                if (error) {
                    alert('Error updating database: ' + error.message);
                } else {
                    // Update state FIRST so UI doesn't revert while fetching
                    setTempFacultyMember(prev => ({ ...prev, image: publicUrl }));
                    await fetchData();
                    showSaveMessage('Faculty photo updated!');
                }
            }
        }
    };

    const handleFacilityPhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const publicUrl = await uploadImage(file, 'Facilities');
        if (publicUrl) {
            if (editingFacilityId === 'new') {
                setTempFacility(prev => ({ ...prev, image: publicUrl }));
            } else {
                const { error } = await supabase.from('facilities').update({ image: publicUrl }).eq('id', editingFacilityId);
                if (error) {
                    alert('Error updating database: ' + error.message);
                } else {
                    // Update state FIRST so UI doesn't revert while fetching
                    setTempFacility(prev => ({ ...prev, image: publicUrl }));
                    await fetchData();
                    showSaveMessage('Facility photo updated!');
                }
            }
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAdmin(false);
        setCurrentPage('home');
    };

    const showSaveMessage = (msg) => {
        setSaveMessage(msg);
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const uploadImage = async (file, bucket) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error.message);
            alert('Error uploading image: ' + error.message);
            return null;
        }
    };

    const handleStudentPhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        showSaveMessage('Uploading photo…');
        const publicUrl = await uploadImage(file, 'students');
        if (publicUrl) {
            setEditStudentData(prev => ({ ...prev, photo: publicUrl, image: publicUrl }));
            showSaveMessage('Photo uploaded! Click Save Changes to apply.');
        }
        e.target.value = '';
    };

    const handleAdmissionPhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const publicUrl = await uploadImage(file, 'students');
        if (publicUrl) {
            setAdmissionData(prev => ({ ...prev, photo: publicUrl }));
            showSaveMessage('Admission photo uploaded!');
        }
    };

    // --- ADMISSION FORM PRINTING & SAVING ---
    const printAdmissionForm = async () => {
        const d = admissionData;

        if (!d.studentName.trim()) {
            alert("Please enter Student Name first!");
            return;
        }

        // 1. Save to Supabase
        try {
            const year = new Date().getFullYear();
            // Find the max existing ID number to avoid duplicates after deletions
            const maxNum = students.reduce((max, s) => {
                const match = s.id?.match(/ACS-\d{4}-(\d+)/);
                return match ? Math.max(max, parseInt(match[1], 10)) : max;
            }, 0);
            const nextIdNum = maxNum + 1;
            const studentId = `ACS-${year}-${nextIdNum.toString().padStart(3, '0')}`;

            const newStudentRecord = {
                id: studentId,
                serial_number: d.serialNumber ? d.serialNumber : null,
                name: d.studentName,
                password: 'acs' + Math.floor(1000 + Math.random() * 9000),
                grade: d.applyingFor,
                image: d.photo,
                fee_history: [],
                admissions: [d],
                results: [],
                attendance: { present: 0, absent: 0, total: 0, percentage: 0 },
                previous_results: []
            };

            const { error } = await supabase.from('students').insert([newStudentRecord]);

            if (error) throw error;

            await fetchData(); // Refresh local state
            showSaveMessage(`Student ${d.studentName} saved with ID: ${studentId}`);
        } catch (error) {
            console.error("Error saving admission:", error.message);
            alert("Error saving to database, but printing will continue: " + error.message);
        }

        // 2. Print Logic

        // Helper to create boxed character spans
        const boxChars = (str, length, spacing = 0) => {
            const chars = str.replace(/[^A-Z0-9]/gi, '').toUpperCase().split('');
            let html = '';
            for (let i = 0; i < length; i++) {
                html += `<span style="display:inline-block;width:20px;height:20px;border:1px solid #000;text-align:center;line-height:20px;font-weight:700;margin-right:${spacing}px;font-size:11px;">${chars[i] || ''}</span>`;
            }
            return html;
        };

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admission Form - ${d.studentName || 'New Student'}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
                * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
                body { margin: 0; padding: 0; background: #f0f0f0; }
                .page { 
                    width: 210mm; 
                    height: 297mm; 
                    margin: 0 auto; 
                    background: #fff; 
                    padding: 12mm 15mm; 
                    position: relative; 
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .header-container {
                    display: flex;
                    align-items: center;
                    border: 2.5px solid #1e3a8a;
                    padding: 15px 25px;
                    border-radius: 12px;
                    margin-bottom: 25px;
                    position: relative;
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                }
                .header-logo {
                    width: 100px;
                    height: auto;
                    margin-right: 25px;
                }
                .header-text {
                    flex: 1;
                    text-align: center;
                }
                .header-text h1 {
                    margin: 0;
                    font-size: 32px;
                    color: #1e3a8a;
                    font-weight: 800;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                .header-text p {
                    margin: 4px 0;
                    font-size: 13px;
                    color: #1e40af;
                    font-weight: 600;
                }
                .header-contact {
                    font-size: 16px;
                    font-weight: 800;
                    color: #1e3a8a;
                    margin-top: 5px;
                }
                .section-title { 
                    background: #f97316; 
                    color: #fff; 
                    display: inline-block; 
                    padding: 4px 15px; 
                    font-weight: 800; 
                    border-radius: 4px; 
                    margin: 22px 0 12px; 
                    font-size: 14px; 
                    text-transform: uppercase;
                }
                .field-row { display: flex; align-items: center; margin-bottom: 11px; font-size: 12px; }
                .field-label { width: 130px; font-weight: 700; font-size: 10px; text-transform: uppercase; color: #334155; }
                .boxed-row { display: flex; gap: 1px; }
                .photo-box { 
                    position: absolute; 
                    top: 195px; 
                    right: 15mm; 
                    width: 35mm; 
                    height: 44mm; 
                    border: 2px dashed #64748b; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    text-align: center; 
                    padding: 5px;
                    background: #f8fafc;
                }
                .photo-box b { font-size: 12px; color: #64748b; }
                .photo-box span { font-size: 9px; color: #94a3b8; }
                .checkbox-group { display: flex; gap: 12px; }
                .checkbox { display: flex; align-items: center; gap: 4px; font-weight: 600; }
                .box { width: 13px; height: 13px; border: 1.5px solid #000; }
                .underline { border-bottom: 1.5px solid #e2e8f0; flex: 1; padding: 0 5px; min-height: 18px; font-weight: 700; color: #1e293b; }
                .meta-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 20px; }
                
                @media print {
                    @page { size: A4; margin: 0; }
                    body { 
                        background: #fff; 
                        padding: 0; 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    .page { border: none; box-shadow: none; width: 100%; height: 100vh; padding: 10mm 15mm; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="text-align:center; padding: 20px; background: #fff; border-bottom: 1px solid #ddd;">
                <button onclick="window.print()" style="padding: 12px 30px; background: #1e3a8a; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 800; font-size: 15px; box-shadow: 0 4px 6px rgba(30,58,138,0.2);">🖨️ PRINT ADMISSION FORM</button>
            </div>
            <div class="page">
                <div class="header-container">
                    <img src="/logo.png" class="header-logo" onerror="this.style.display='none'" />
                    <div class="header-text">
                        <h1>ACS School & College</h1>
                        <p>Main Jhang Road Near Attock Petrol Pump, Painsra, Faisalabad</p>
                        <div class="header-contact">📞 0300-1333275</div>
                    </div>
                </div>

                <div class="meta-header">
                    <div>APPLYING FOR: <span style="color:#1e3a8a; border-bottom:1px solid #1e3a8a; min-width:80px; display:inline-block">${d.applyingFor}</span></div>
                    <div>DATE: <span style="color:#1e3a8a; border-bottom:1px solid #1e3a8a; min-width:80px; display:inline-block">${d.applicationDate}</span></div>
                </div>

                <div style="text-align:center; margin: 10px 0;">
                    <span style="background:#1e3a8a; color:#fff; padding:6px 40px; border-radius:6px; font-weight:900; font-size:18px; letter-spacing:1px; border:2px solid #1e3a8a; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">ADMISSION FORM</span>
                </div>

                <div class="photo-box">
                    ${d.photo ? `<img src="${d.photo}" style="width:100%;height:100%;object-fit:cover;" />` : `
                    <b>Photograph</b>
                    <span>(Passport Size)</span>
                    `}
                </div>

                <div class="section-title" style="background:#1e3a8a">Student's Information</div>
                <p style="font-size:9px; color:#64748b; margin:-4px 0 8px; font-weight:600;">USE CAPITAL LETTERS ONLY</p>

                <div class="field-row">
                    <div class="field-label">Student Name:</div>
                    <div class="boxed-row">${boxChars(d.studentName, 25)}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">B-Form No:</div>
                    <div class="boxed-row">
                        ${boxChars(d.bForm.substring(0, 5), 5)}
                        <span style="margin:0 2px; font-weight:bold;">-</span>
                        ${boxChars(d.bForm.substring(5, 12), 7)}
                        <span style="margin:0 2px; font-weight:bold;">-</span>
                        ${boxChars(d.bForm.substring(12, 13), 1)}
                    </div>
                </div>

                <div class="field-row">
                    <div class="field-label">Date of Birth:</div>
                    <div class="boxed-row">
                        ${boxChars(d.dob.split('-')[2] || '', 2)}
                        <span style="margin:0 2px; font-weight:bold;">-</span>
                        ${boxChars(d.dob.split('-')[1] || '', 2)}
                        <span style="margin:0 2px; font-weight:bold;">-</span>
                        ${boxChars(d.dob.split('-')[0] || '', 4)}
                    </div>
                    <div style="margin-left: 15px; font-weight:800; font-size:10px; color:#475569;">NATIONALITY: <span class="underline" style="min-width:100px; display:inline-block">${d.nationality || 'PAKISTANI'}</span></div>
                </div>

                <div class="field-row" style="margin-top:2px;">
                    <div class="field-label">Gender:</div>
                    <div class="checkbox-group">
                        <div class="checkbox"><div class="box" style="${d.gender === 'Male' ? 'background:#1e3a8a' : ''}"></div> MALE</div>
                        <div class="checkbox"><div class="box" style="${d.gender === 'Female' ? 'background:#1e3a8a' : ''}"></div> FEMALE</div>
                    </div>
                    <div style="margin-left: 30px; font-weight:800; font-size:10px; color:#475569;">RELIGION: <span class="underline" style="min-width:130px; display:inline-block">${d.religion || 'ISLAM'}</span></div>
                </div>

                <div class="section-title" style="background:#0f766e">Health & Medical Info</div>
                <div class="field-row">
                    <div class="field-label" style="width:100px;">Allergies:</div>
                    <div class="checkbox-group">
                        <div class="checkbox"><div class="box" style="${d.allergies === 'Yes' ? 'background:#0f766e' : ''}"></div> YES</div>
                        <div class="checkbox"><div class="box" style="${d.allergies === 'No' ? 'background:#0f766e' : ''}"></div> NO</div>
                    </div>
                    <div style="margin-left:20px; font-weight:700; font-size:10px;">DETAILS: <span class="underline">${d.allergiesDetails}</span></div>
                </div>
                <div class="field-row">
                    <div class="field-label" style="width:160px;">Chronic Condition:</div>
                    <div class="checkbox-group">
                        <div class="checkbox"><div class="box" style="${d.chronicCondition === 'Yes' ? 'background:#0f766e' : ''}"></div> YES</div>
                        <div class="checkbox"><div class="box" style="${d.chronicCondition === 'No' ? 'background:#0f766e' : ''}"></div> NO</div>
                    </div>
                    <div style="margin-left:20px; font-weight:700; font-size:10px;">DETAILS: <span class="underline">${d.chronicConditionDetails}</span></div>
                </div>
                <div class="field-row">
                    <div class="field-label" style="width:220px;">Regular Medication:</div>
                    <div class="checkbox-group">
                        <div class="checkbox"><div class="box" style="${d.medication === 'Yes' ? 'background:#0f766e' : ''}"></div> YES</div>
                        <div class="checkbox"><div class="box" style="${d.medication === 'No' ? 'background:#0f766e' : ''}"></div> NO</div>
                    </div>
                    <div style="margin-left:20px; font-weight:700; font-size:10px; flex:1;">DETAILS: <span class="underline">${d.medicationDetails}</span></div>
                </div>

                <div class="section-title" style="background:#b91c1c">Parents Information</div>
                <div class="field-row">
                    <div class="field-label">Father Name:</div>
                    <div class="boxed-row">${boxChars(d.fatherName, 25)}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Father CNIC:</div>
                    <div class="boxed-row">
                        ${boxChars(d.fatherCnic.substring(0, 5), 5)}
                        <span style="margin:0 2px; font-weight:bold;">-</span>
                        ${boxChars(d.fatherCnic.substring(5, 12), 7)}
                        <span style="margin:0 2px; font-weight:bold;">-</span>
                        ${boxChars(d.fatherCnic.substring(12, 13), 1)}
                    </div>
                    <div style="margin-left:15px; font-weight:800; font-size:10px; color:#475569;">CONTACT: <span class="underline" style="min-width:130px; display:inline-block">${d.contact}</span></div>
                </div>
                <div class="field-row" style="margin-top:5px;">
                    <div class="field-label">Address:</div>
                    <span class="underline">${d.address}</span>
                    <div style="margin-left:15px; font-weight:800; font-size:10px; color:#475569;">WHATSAPP: <span class="underline" style="min-width:120px; display:inline-block">${d.whatsapp}</span></div>
                </div>

                <div class="section-title" style="background:#1e293b; padding: 3px 20px;">UNDERTAKING</div>
                <div style="font-size:10px; line-height:1.5; color:#334155; padding: 0 10px;">
                    <b>I solemnly declare that:</b>
                    <div style="margin-left:15px;">
                        • I will abide by all rules and regulations of the school.<br>
                        • I will pay all dues/fees promptly as per schedule.<br>
                        • <span style="color:#b91c1c; font-weight:700;">All information provided above is correct and true.</span><br>
                        • Fees once paid are <span style="font-weight:700;">non-refundable</span> in any situation.<br>
                        • Admission is provisional until all required documents are submitted.
                    </div>
                </div>
                
                <div style="display:flex; justify-content:flex-end; margin-top:20px;">
                    <div style="text-align:center; width:180px; border-top:1.5px solid #1e293b; padding-top:5px; font-size:11px; font-weight:800; color:#1e293b;">PARENT'S SIGNATURE</div>
                </div>

                <div class="section-title" style="background:#4338ca">Required Documents</div>
                <div style="display:flex; gap:30px; font-size:10px; font-weight:700; margin-left:10px; color:#4338ca;">
                    <div class="checkbox"><div class="box" style="${d.docs.photos ? 'background:#4338ca' : ''}"></div> 4 PASSPORT PHOTOS</div>
                    <div class="checkbox"><div class="box" style="${d.docs.bform ? 'background:#4338ca' : ''}"></div> COPY OF B-FORM</div>
                    <div class="checkbox"><div class="box" style="${d.docs.cnic ? 'background:#4338ca' : ''}"></div> COPY OF PARENT CNIC</div>
                </div>

                <div style="display:flex; justify-content:flex-end; margin-top:15px;">
                    <div style="text-align:center; width:180px; border-top:1.5px solid #1e293b; padding-top:5px; font-size:11px; font-weight:800; color:#b91c1c;">PRINCIPAL'S SIGNATURE</div>
                </div>

                <!-- Footer Line -->
                <div style="position:absolute; bottom:15mm; left:20mm; right:20mm; height:1px; background:#e2e8f0;"></div>
            </div>
        </body>
        </html>`;

        const printWin = window.open('', '_blank');
        printWin.document.write(html);
        printWin.document.close();
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
    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedStudent) return;

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showSaveMessage('File too large! Max 2MB.');
            return;
        }

        const publicUrl = await uploadImage(file, 'Student');
        if (publicUrl) {
            const { error } = await supabase
                .from('students')
                .update({ image: publicUrl }) // Update 'image' column in DB
                .eq('id', selectedStudent);

            if (error) {
                alert('Error updating student: ' + error.message);
            } else {
                await fetchData();
                showSaveMessage('Student photo updated!');
            }
        }
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
        if (field === 'percentage' || field === 'obtained') {
            const num = parseInt(value) || 0;
            const total = updated[index].total || 100;
            updated[index].obtained = Math.min(total, Math.max(0, num));
            const pct = Math.round((updated[index].obtained / total) * 100);
            updated[index].percentage = pct;
            updated[index].grade = percentageToGrade(pct);
        }
        setTempMarks(updated);
    };

    const saveMarks = async () => {
        const student = students.find(s => s.id === selectedStudent);
        if (!student) return;

        const { error } = await supabase
            .from('students')
            .update({ results: [...tempMarks] })
            .eq('id', selectedStudent);

        if (!error) {
            fetchData();
            setEditingMarks(false);
            showSaveMessage('Marks saved successfully!');
        }
    };

    // --- MARKS EXCEL EXPORT ---
    const exportMarksExcel = (overrideName = null, overrideSubjects = null) => {
        const filteredStudents = students.filter(s => s.grade === selectedClass);
        if (filteredStudents.length === 0) {
            alert('No students found in this class.');
            return;
        }

        const nameToUse = overrideName || assessmentName || 'Assessment';
        const subjectsList = overrideSubjects || (filteredStudents[0].results.length > 0 ? filteredStudents[0].results.map(r => ({ name: r.subject, total: r.total || 100 })) : []);

        const rows = filteredStudents.map(student => {
            const row = {
                'Student ID': student.id,
                'Student Name': student.name,
                'Class': student.grade
            };

            subjectsList.forEach(sub => {
                const res = student.results.find(r => r.subject === sub.name);
                row[`${sub.name} (Total: ${sub.total})`] = res ? (res.obtained !== undefined ? res.obtained : res.percentage) : 0;
            });

            return row;
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Marks');

        const fileName = `Marks_${selectedClass.replace(/ /g, '_')}_${nameToUse.replace(/ /g, '_')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showSaveMessage(`Marks template for ${nameToUse} exported!`);
    };

    // --- MARKS EXCEL IMPORT ---
    const importMarksExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (!data || data.length === 0) {
                    alert("No data found in Excel sheet.");
                    return;
                }

                const headers = Object.keys(data[0]);
                const subjectCols = headers.filter(h => h.includes('(Total:'));

                const subjectsInfo = subjectCols.map(col => {
                    const match = col.match(/(.*) \(Total: (\d+)\)/);
                    return {
                        column: col,
                        name: match ? match[1].trim() : col,
                        total: match ? parseInt(match[2]) : 100
                    };
                });

                let invalidCount = 0;
                const updatedStudents = students.map(s => {
                    const excelRow = data.find(row => row['Student ID'] === s.id);
                    if (excelRow) {
                        const updatedResults = s.results.map(res => {
                            const subInfo = subjectsInfo.find(info => info.name === res.subject);
                            if (subInfo) {
                                const obtainedValue = excelRow[subInfo.column];
                                const obtained = parseInt(obtainedValue);

                                if (!isNaN(obtained)) {
                                    if (obtained > subInfo.total) {
                                        invalidCount++;
                                        return res;
                                    }
                                    const pct = Math.round((obtained / subInfo.total) * 100);
                                    return {
                                        ...res,
                                        obtained: obtained,
                                        percentage: pct,
                                        grade: percentageToGrade(pct)
                                    };
                                }
                            }
                            return res;
                        });
                        return { ...s, results: updatedResults };
                    }
                    return s;
                });

                if (invalidCount > 0) {
                    alert(`Import finished with ${invalidCount} entries skipped because obtained marks exceeded total marks.`);
                }

                setStudents(updatedStudents);
                showSaveMessage(`Marks imported for ${data.length} students.`);
            } catch (err) {
                console.error(err);
                alert('Error processing file. Please ensure it follows the exported template format.');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };


    // --- ATTENDANCE FUNCTIONS ---
    // Stores day-by-day records: attendance = { records: [{date, status}], total, present, absent, percentage }
    const markAttendance = async (studentId, status) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const oldAtt = student.attendance || {};
        const records = [...(oldAtt.records || [])];

        // Prevent duplicate entry for same day
        const existingIdx = records.findIndex(r => r.date === today);
        if (existingIdx >= 0) {
            records[existingIdx] = { date: today, status }; // overwrite today's entry
        } else {
            records.push({ date: today, status });
        }

        // Recompute totals from records
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const total = records.length;
        const percentage = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0;

        const newAttendance = { records, total, present, absent, percentage };

        const { error } = await supabase
            .from('students')
            .update({ attendance: newAttendance })
            .eq('id', studentId);

        if (!error) {
            fetchData();
            showSaveMessage(`${status === 'present' ? '✓ Present' : '✗ Absent'} marked for ${student.name} on ${today}!`);
        }
    };

    // Undo/remove a specific date record for a student
    const removeAttendanceRecord = async (studentId, dateStr) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;
        const oldAtt = student.attendance || {};
        const records = (oldAtt.records || []).filter(r => r.date !== dateStr);
        const present = records.filter(r => r.status === 'present').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const total = records.length;
        const percentage = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0;
        const newAttendance = { records, total, present, absent, percentage };
        await supabase.from('students').update({ attendance: newAttendance }).eq('id', studentId);
        fetchData();
        showSaveMessage(`Record for ${dateStr} removed.`);
    };

    // --- ATTENDANCE EXCEL EXPORT ---
    const exportAttendanceExcel = () => {
        const filteredStudents = students.filter(s => s.grade === selectedClass);
        const today = new Date().toLocaleDateString();
        const rows = filteredStudents.map(s => ({
            'Student ID': s.id,
            'Student Name': s.name,
            'Grade': s.grade,
            'Date': today,
            'Status (Present/Absent)': '',
            'Instructions': 'Enter P or A in the Status column'
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 10 },
            { wch: 14 }, { wch: 22 }, { wch: 30 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
        XLSX.writeFile(wb, `Attendance_${selectedClass.replace(/ /g, '_')}_${today.replace(/\//g, '-')}.xlsx`);
        showSaveMessage(`Attendance for ${selectedClass} exported!`);
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

    // --- FEE FUNCTIONS (month-by-month history) ---

    // Open a new month for all students in the selected class
    const openNewFeeMonth = async () => {
        const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const classStudents = students.filter(s => s.grade === selectedClass);
        if (classStudents.length === 0) { alert('No students in this class!'); return; }

        // Check if month already open for any student in this class
        const alreadyOpen = classStudents.some(s =>
            (s.feeHistory || []).some(h => h.month === monthLabel)
        );
        if (alreadyOpen) {
            alert(`${monthLabel} is already open for this class!`);
            return;
        }

        const updatedStudents = students.map(s => {
            if (s.grade !== selectedClass) return s;
            const existing = s.feeHistory || [];
            return { ...s, feeHistory: [...existing, { month: monthLabel, status: 'unpaid', paidOn: null }] };
        });
        await setStudents(updatedStudents);
        showSaveMessage(`Fee month "${monthLabel}" opened for ${selectedClass}!`);
    };

    // Toggle a specific month's fee status for a student
    const toggleMonthFeeStatus = async (studentId, monthLabel) => {
        const updatedStudents = students.map(s => {
            if (s.id !== studentId) return s;
            const history = s.feeHistory || [];
            const updated = history.map(h => {
                if (h.month !== monthLabel) return h;
                const newStatus = h.status === 'paid' ? 'unpaid' : 'paid';
                return { ...h, status: newStatus, paidOn: newStatus === 'paid' ? new Date().toLocaleDateString() : null };
            });
            return { ...s, feeHistory: updated };
        });
        await setStudents(updatedStudents);
        showSaveMessage('Fee status updated!');
    };

    // Mark all students in selected class as paid for a given month
    const markAllPaidForMonth = async (monthLabel) => {
        const updatedStudents = students.map(s => {
            if (s.grade !== selectedClass) return s;
            const history = (s.feeHistory || []).map(h =>
                h.month === monthLabel
                    ? { ...h, status: 'paid', paidOn: h.paidOn || new Date().toLocaleDateString() }
                    : h
            );
            return { ...s, feeHistory: history };
        });
        await setStudents(updatedStudents);
        showSaveMessage(`All students marked Paid for ${monthLabel}!`);
    };

    // Reset all students in selected class as unpaid for a given month
    const markAllUnpaidForMonth = async (monthLabel) => {
        const updatedStudents = students.map(s => {
            if (s.grade !== selectedClass) return s;
            const history = (s.feeHistory || []).map(h =>
                h.month === monthLabel ? { ...h, status: 'unpaid', paidOn: null } : h
            );
            return { ...s, feeHistory: history };
        });
        await setStudents(updatedStudents);
        showSaveMessage(`All students reset to Unpaid for ${monthLabel}!`);
    };

    // Delete a month from all students in the selected class
    const deleteFeeMonth = async (monthLabel) => {
        if (!window.confirm(`Remove "${monthLabel}" from all students in ${selectedClass}? This cannot be undone.`)) return;
        const updatedStudents = students.map(s => {
            if (s.grade !== selectedClass) return s;
            return { ...s, feeHistory: (s.feeHistory || []).filter(h => h.month !== monthLabel) };
        });
        await setStudents(updatedStudents);
        showSaveMessage(`Month "${monthLabel}" removed!`);
    };



    // --- FEE EXCEL EXPORT ---
    const exportFeeExcel = () => {
        const filteredStudents = students.filter(s => s.grade === selectedClass);
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const rows = filteredStudents.map(s => ({
            'Student ID': s.id,
            'Student Name': s.name,
            'Grade': s.grade,
            'Billing Month': currentMonth,
            'Fee Status (Paid/Unpaid)': s.feeStatus === 'paid' ? 'Paid' : 'Unpaid',
            'Instructions': 'Change status to Paid or Unpaid'
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 20 }, { wch: 24 }, { wch: 30 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Fee Status');
        XLSX.writeFile(wb, `Fees_${selectedClass.replace(/ /g, '_')}_${currentMonth.replace(/ /g, '_')}.xlsx`);
        showSaveMessage(`Fees for ${selectedClass} exported!`);
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

        const allResults = student.results || [];
        const avg = allResults.length > 0
            ? (allResults.reduce((sum, r) => sum + r.percentage, 0) / allResults.length).toFixed(1)
            : '0.0';
        const overallGrade = percentageToGrade(parseFloat(avg));
        const gradeColor = (pct) => pct >= 90 ? '#0d7c52' : pct >= 75 ? '#1a5fb4' : pct >= 60 ? '#c4841d' : '#c0392b';
        const gradeBg = (pct) => pct >= 90 ? '#e6f9f0' : pct >= 75 ? '#e8f0fc' : pct >= 60 ? '#fef5e7' : '#fce8e6';
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const schoolName = schoolData.name || 'ACS School & College';
        const schoolAddress = schoolData.contact?.address || '';
        const schoolPhone = schoolData.contact?.phone || '';
        const schoolEmail = schoolData.contact?.email || '';

        // Group results by term
        const termGroups = {};
        allResults.forEach(r => {
            const term = r.term || 'Current';
            if (!termGroups[term]) termGroups[term] = [];
            termGroups[term].push(r);
        });

        const resultsRows = Object.entries(termGroups).map(([termName, termResults]) => {
            const termHeader = `
                <tr style="background:linear-gradient(135deg,#1e3a5f,#2563eb);">
                    <td colspan="4" style="padding:10px 16px;font-size:13px;font-weight:800;color:#fff;letter-spacing:0.5px;">📋 ${termName}</td>
                </tr>
            `;
            const rows = termResults.map((r, i) => `
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
            return termHeader + rows;
        }).join('');

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
                    margin: 10px auto;
                    background: #ffffff;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                    border-radius: 8px;
                    overflow: hidden;
                }
                @page { margin: 0; size: auto; }
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
                <div style="text-align:center;padding:24px 40px 18px;border-bottom:3px double #1a3a6b;page-break-inside:avoid;">
                    <!-- School Logo and Name Info -->
                    <div style="display:flex;align-items:center;justify-content:center;gap:15px;margin-bottom:10px;">
                        <img src="/logo.png" style="width:105px;height:auto;border-radius:0;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
                        <div style="display:none;width:105px;height:105px;background:#f1f5f9;border-radius:10px;align-items:center;justify-content:center;font-size:40px;">🏫</div>
                        <div style="text-align:left;">
                            <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:800;color:#1a3a6b;letter-spacing:1px;margin:0;">
                                ${schoolName}
                            </h1>
                            <p style="font-size:11px;color:#64748b;letter-spacing:0.8px;margin-top:2px;">${schoolAddress}</p>
                            ${schoolPhone || schoolEmail ? `<p style="font-size:10px;color:#94a3b8;letter-spacing:0.5px;margin-top:1px;">${schoolPhone}${schoolPhone && schoolEmail ? ' • ' : ''}${schoolEmail}</p>` : ''}
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
                <div style="padding:15px 40px;">
                    <div style="display:flex;align-items:center;gap:20px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                        <!-- Student Photo -->
                        <div style="width:75px;height:75px;flex-shrink:0;background:linear-gradient(135deg,#1a3a6b,#2563eb);display:flex;align-items:center;justify-content:center;margin:12px 0 12px 20px;border-radius:10px;overflow:hidden;">
                            ${(student.photo || student.image) ? `<img src="${student.photo || student.image}" style="width:100%;height:100%;object-fit:cover;" alt="${student.name}" />` : `<span style="font-size:28px;font-weight:800;color:white;font-family:'Playfair Display',Georgia,serif;">${student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>`}
                        </div>
                        <div style="display:flex;flex-wrap:wrap;flex:1;gap:0;">
                            <div style="flex:1;min-width:150px;padding:10px 18px;background:#f8fafc;border-right:1px solid #e2e8f0;">
                                <div style="font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:2px;">Student Name</div>
                                <div style="font-size:14px;font-weight:700;color:#1a3a6b;">${student.name}</div>
                            </div>
                            <div style="flex:1;min-width:100px;padding:10px 18px;background:#f8fafc;border-right:1px solid #e2e8f0;">
                                <div style="font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:2px;">Student ID</div>
                                <div style="font-size:14px;font-weight:700;color:#2d3748;">${student.id}</div>
                            </div>
                            <div style="flex:1;min-width:80px;padding:10px 18px;background:#f8fafc;border-right:1px solid #e2e8f0;">
                                <div style="font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:2px;">Class</div>
                                <div style="font-size:14px;font-weight:700;color:#2d3748;">${student.grade}</div>
                            </div>
                            <div style="flex:1;min-width:110px;padding:10px 18px;background:#f8fafc;">
                                <div style="font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:2px;">Report Date</div>
                                <div style="font-size:14px;font-weight:700;color:#2d3748;">${today}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Main Content -->
                <div style="padding:0 40px 16px;">
                
                    <!-- Current Term Results -->
                    <div style="margin-bottom:16px;">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:4px;height:24px;background:#1a3a6b;border-radius:2px;"></div>
                            <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:16px;font-weight:700;color:#1a3a6b;margin:0;">Current Term Results</h3>
                        </div>
                        <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.04);">
                            <thead>
                                <tr style="background:linear-gradient(135deg,#1a3a6b,#1e4d8a);">
                                    <th style="padding:10px 16px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#ffffff;font-weight:700;">Subject</th>
                                    <th style="padding:10px 16px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#ffffff;font-weight:700;">Score</th>
                                    <th style="padding:10px 16px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#ffffff;font-weight:700;">Grade</th>
                                    <th style="padding:10px 16px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;color:#ffffff;font-weight:700;">Performance</th>
                                </tr>
                            </thead>
                            <tbody>${resultsRows}</tbody>
                            <tfoot>
                                <tr style="background:linear-gradient(135deg,#f0f7ff,#e8f0fc);border-top:2px solid #1a3a6b;">
                                    <td style="padding:12px 16px;font-size:13px;font-weight:800;color:#1a3a6b;">Overall Average</td>
                                    <td style="padding:12px 16px;text-align:center;">
                                        <span style="font-size:16px;font-weight:800;color:#1a3a6b;">${avg}%</span>
                                    </td>
                                    <td style="padding:12px 16px;text-align:center;">
                                        <span style="display:inline-block;width:38px;height:38px;line-height:38px;border-radius:50%;font-weight:800;font-size:15px;background:#1a3a6b;color:white;text-align:center;">${overallGrade}</span>
                                    </td>
                                    <td style="padding:12px 16px;text-align:center;">
                                        <span style="font-size:11px;font-weight:700;color:${gradeColor(parseFloat(avg))};">${parseFloat(avg) >= 85 ? 'Excellent' : parseFloat(avg) >= 70 ? 'Good' : parseFloat(avg) >= 50 ? 'Satisfactory' : 'Needs Improvement'}</span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                
                    <!-- Attendance -->
                    <div style="margin-bottom:16px;page-break-inside:avoid;">
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                            <div style="width:4px;height:20px;background:#1a3a6b;border-radius:2px;"></div>
                            <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:14px;font-weight:700;color:#1a3a6b;margin:0;">Attendance Record</h3>
                        </div>
                        <div style="border:1px solid #edf2f7;border-radius:10px;overflow:hidden;">
                            <div style="display:flex;text-align:center;">
                                <div style="flex:1;padding:10px 10px;background:#f0fdf4;border-right:1px solid #edf2f7;">
                                    <div style="font-size:18px;font-weight:800;color:#0d7c52;">${student.attendance.present}</div>
                                    <div style="font-size:8px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;margin-top:2px;">Present</div>
                                </div>
                                <div style="flex:1;padding:10px 10px;background:#fef2f2;border-right:1px solid #edf2f7;">
                                    <div style="font-size:18px;font-weight:800;color:#c0392b;">${student.attendance.absent}</div>
                                    <div style="font-size:8px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;margin-top:2px;">Absent</div>
                                </div>
                                <div style="flex:1;padding:10px 10px;background:#eff6ff;border-right:1px solid #edf2f7;">
                                    <div style="font-size:18px;font-weight:800;color:#1a5fb4;">${student.attendance.total}</div>
                                    <div style="font-size:8px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;margin-top:2px;">Total</div>
                                </div>
                                <div style="flex:1;padding:10px 10px;background:linear-gradient(135deg,#0f2b52,#1a3a6b);color:white;">
                                    <div style="font-size:18px;font-weight:800;">${student.attendance.percentage}%</div>
                                    <div style="font-size:8px;text-transform:uppercase;letter-spacing:0.8px;opacity:0.8;font-weight:600;margin-top:2px;">Rate</div>
                                </div>
                            </div>
                        </div>
                    </div>
                
                    ${previousSection}
                
                    <!-- Signature Section -->
                    <div style="margin-top:20px;padding-top:12px;border-top:1px solid #edf2f7;display:flex;justify-content:space-between;flex-wrap:wrap;gap:15px;page-break-inside:avoid;">
                        <div style="text-align:center;flex:1;min-width:120px;">
                            <div style="width:100%;max-width:160px;border-bottom:1.5px solid #1a3a6b;margin:0 auto 6px;height:25px;"></div>
                            <div style="font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Class Teacher</div>
                        </div>
                        <div style="text-align:center;flex:1;min-width:120px;">
                            <div style="width:100%;max-width:160px;border-bottom:1.5px solid #1a3a6b;margin:0 auto 6px;height:25px;"></div>
                            <div style="font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Principal</div>
                        </div>
                        <div style="text-align:center;flex:1;min-width:120px;">
                            <div style="width:100%;max-width:160px;border-bottom:1.5px solid #1a3a6b;margin:0 auto 6px;height:25px;"></div>
                            <div style="font-size:10px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Parent / Guardian</div>
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
    const addAnnouncement = async () => {
        if (!newAnnouncement.title || !newAnnouncement.content) {
            showSaveMessage('Title and content are required!');
            return;
        }

        const { error } = await supabase.from('announcements').insert([newAnnouncement]);
        if (error) {
            alert('Error posting announcement: ' + error.message);
        } else {
            setNewAnnouncement({ title: '', content: '', date: new Date().toISOString().split('T')[0] });
            await fetchData();
            showSaveMessage('Announcement posted!');
        }
    };

    const deleteAnnouncement = async (id) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (error) {
                alert('Error deleting announcement: ' + error.message);
            } else {
                await fetchData();
                showSaveMessage('Announcement deleted!');
            }
        }
    };

    // --- FACULTY MANAGEMENT ---
    const addFaculty = () => {
        setEditingFacultyId('new');
        setTempFacultyMember({
            name: '',
            role: '',
            department: '',
            bio: '',
            image: ''
        });
    };

    const saveFaculty = async () => {
        if (editingFacultyId === 'new') {
            const { error } = await supabase.from('faculty').insert([tempFacultyMember]);
            if (error) {
                alert('Error adding faculty: ' + error.message);
                return;
            }
            showSaveMessage('Faculty member added!');
        } else {
            // Strip ID from payload for updates
            const { id, ...payload } = tempFacultyMember;
            const { error } = await supabase.from('faculty').update(payload).eq('id', editingFacultyId);
            if (error) {
                alert('Error updating faculty: ' + error.message);
                return;
            }
            showSaveMessage('Faculty updated!');
        }
        setEditingFacultyId(null);
        setTempFacultyMember(null);
        await fetchData();
    };

    const deleteFaculty = async (id) => {
        if (window.confirm('Are you sure you want to remove this faculty member?')) {
            const { error } = await supabase.from('faculty').delete().eq('id', id);
            if (error) {
                alert('Error deleting faculty: ' + error.message);
            } else {
                await fetchData();
                showSaveMessage('Faculty member removed');
            }
        }
    };

    // --- FACILITIES MANAGEMENT ---
    const addFacility = () => {
        setEditingFacilityId('new');
        setTempFacility({
            name: '',
            description: '',
            category: '',
            image: ''
        });
    };

    const saveFacility = async () => {
        if (editingFacilityId === 'new') {
            const { error } = await supabase.from('facilities').insert([tempFacility]);
            if (error) {
                alert('Error adding facility: ' + error.message);
                return;
            }
            showSaveMessage('Facility added!');
        } else {
            // Strip ID from payload for updates
            const { id, ...payload } = tempFacility;
            const { error } = await supabase.from('facilities').update(payload).eq('id', editingFacilityId);
            if (error) {
                alert('Error updating facility: ' + error.message);
                return;
            }
            showSaveMessage('Facility updated!');
        }
        setEditingFacilityId(null);
        setTempFacility(null);
        await fetchData();
    };

    const deleteFacility = async (id) => {
        if (window.confirm('Are you sure you want to remove this facility?')) {
            const { error } = await supabase.from('facilities').delete().eq('id', id);
            if (error) {
                alert('Error deleting facility: ' + error.message);
            } else {
                await fetchData();
                showSaveMessage('Facility removed');
            }
        }
    };

    // --- BLOG MANAGEMENT ---
    const addBlog = () => {
        setEditingBlogId('new');
        setTempBlog({
            title: '',
            excerpt: '',
            content: '',
            author: 'Admin',
            date: new Date().toISOString().split('T')[0],
            category: 'Events',
            read_time: '3 min read',
            image: ''
        });
    };

    const saveBlog = async () => {
        if (!tempBlog.title || !tempBlog.excerpt || !tempBlog.content) {
            showSaveMessage('Title, excerpt, and content are required!');
            return;
        }

        if (editingBlogId === 'new') {
            const { error } = await supabase.from('blogs').insert([tempBlog]);
            if (error) {
                alert('Error adding blog: ' + error.message);
                return;
            }
            showSaveMessage('Blog post added!');
        } else {
            const { id, created_at, updated_at, ...payload } = tempBlog;
            const { error } = await supabase.from('blogs').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingBlogId);
            if (error) {
                alert('Error updating blog: ' + error.message);
                return;
            }
            showSaveMessage('Blog post updated!');
        }
        setEditingBlogId(null);
        setTempBlog(null);
        await fetchData();
    };

    const deleteBlog = async (id) => {
        if (window.confirm('Are you sure you want to delete this blog post?')) {
            const { error } = await supabase.from('blogs').delete().eq('id', id);
            if (error) {
                alert('Error deleting blog: ' + error.message);
            } else {
                await fetchData();
                showSaveMessage('Blog post deleted!');
            }
        }
    };

    const handleBlogImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const publicUrl = await uploadImage(file, 'blogs');
        if (publicUrl) {
            setTempBlog(prev => ({ ...prev, image: publicUrl }));
            showSaveMessage('Blog image uploaded!');
        }
        e.target.value = '';
    };

    // --- CLASS MANAGEMENT FUNCTIONS ---
    const downloadClassTemplate = () => {
        const templateData = [{
            'Student Name': 'Ali Ahmed', 'B-Form Number': '12345-1234567-1', 'Date of Birth': '2010-01-15',
            'Gender': 'Male', 'Religion': 'Islam', 'Nationality': 'Pakistani', 'Father Name': 'Ahmed Khan',
            'Father CNIC': '12345-1234567-1', 'Contact Number': '03001234567', 'WhatsApp Number': '03001234567',
            'Address': '123 Street, City', 'Allergies': 'No', 'Allergies Details': '',
            'Chronic Condition': 'No', 'Chronic Condition Details': '', 'Medication': 'No',
            'Medication Details': '', 'Fee Status': 'Pending'
        }];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        ws['!cols'] = Array(18).fill({ wch: 15 });
        XLSX.writeFile(wb, `Class_${selectedClassForList}_Template.xlsx`);
        showSaveMessage('Template downloaded!');
    };

    const importStudentsExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                // Use ArrayBuffer for better compatibility with different Excel formats
                const arrayBuffer = evt.target.result;
                const wb = XLSX.read(arrayBuffer, { type: 'array' });

                if (!wb.SheetNames || wb.SheetNames.length === 0) {
                    alert("Invalid Excel file: No sheets found.");
                    return;
                }

                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (!data || data.length === 0) {
                    alert("No data found in the first sheet of the Excel file. Please check if the sheet is empty or headers are missing.");
                    return;
                }

                // Debugging: Log headers found
                console.log("Excel Headers Found:", Object.keys(data[0]));

                let successCount = 0;
                let updateCount = 0;
                const errors = [];
                const newStudents = [];
                const updatedStudents = [];
                const processedSerials = new Set();
                const processedIds = new Set();

                // Get existing serials to check for duplicates
                const existingSerialsMap = new Map();
                students.forEach(s => {
                    if (s.serialNumber) {
                        existingSerialsMap.set(String(s.serialNumber).trim().toLowerCase(), s.id);
                    }
                });

                data.forEach((row, index) => {
                    const rowNum = index + 2; // Excel row (1-header)

                    // Flexible Header Matching
                    const name = row['Student Name'] || row['Name'] || row['name'] || row['Student Name*'];
                    const serial = row['Serial No'] || row['Serial Number'] || row['Serial'] || row['S.No'];
                    const providedId = row['Student ID'] || row['Member ID'] || row['ID'];
                    const grade = row['Class'] || row['Grade'] || selectedClassForList || '';
                    const password = row['Password'] || '';

                    // 1. Validate Name (Critical)
                    if (!name) {
                        // Only log error if row has *some* content (avoid processing empty trailing rows)
                        if (Object.keys(row).length > 0) {
                            errors.push(`Row ${rowNum}: Missing 'Student Name' column. Found columns: ${Object.keys(row).join(', ')}`);
                        }
                        return;
                    }

                    // Check if this row refers to an existing student
                    let existingStudent = null;
                    if (providedId) {
                        existingStudent = students.find(s => s.id === providedId);
                    } else if (serial) {
                        const existingId = existingSerialsMap.get(String(serial).trim().toLowerCase());
                        if (existingId) existingStudent = students.find(s => s.id === existingId);
                    }

                    if (existingStudent) {
                        // UPDATE PATH
                        if (processedIds.has(existingStudent.id)) {
                            errors.push(`Row ${rowNum}: Duplicate entry for student ID '${existingStudent.id}' in this file.`);
                            return;
                        }

                        // Check serial conflict if they are changing serial
                        if (serial) {
                            const newSerial = String(serial).trim().toLowerCase();
                            const conflictId = existingSerialsMap.get(newSerial);
                            if (conflictId && conflictId !== existingStudent.id) {
                                errors.push(`Row ${rowNum}: Serial Number '${serial}' belongs to another student.`);
                                return;
                            }
                            if (processedSerials.has(newSerial)) {
                                errors.push(`Row ${rowNum}: Duplicate Serial Number '${serial}' in strictly this import file.`);
                                return;
                            }
                            processedSerials.add(newSerial);
                        }

                        processedIds.add(existingStudent.id);

                        // Merge admissions info safely
                        let admissions = [...(existingStudent.admissions || [])];
                        if (admissions.length === 0) admissions.push({});

                        // update provided fields
                        if (row['Gender'] !== undefined) admissions[0].gender = row['Gender'];
                        if (row['Father Name'] !== undefined) admissions[0].fatherName = row['Father Name'];
                        if (row['Contact Number'] !== undefined || row['Contact'] !== undefined) admissions[0].contact = row['Contact Number'] || row['Contact'] || '';
                        if (row['B-Form Number'] !== undefined) admissions[0].bForm = row['B-Form Number'];
                        if (row['Date of Birth'] !== undefined) admissions[0].dob = row['Date of Birth'];
                        if (row['Religion'] !== undefined) admissions[0].religion = row['Religion'];
                        if (row['Nationality'] !== undefined) admissions[0].nationality = row['Nationality'];
                        if (row['Father CNIC'] !== undefined) admissions[0].fatherCnic = row['Father CNIC'];
                        if (row['WhatsApp Number'] !== undefined) admissions[0].whatsapp = row['WhatsApp Number'];
                        if (row['Address'] !== undefined) admissions[0].address = row['Address'];

                        const updatedStudent = {
                            ...existingStudent,
                            name: name,
                            grade: grade || existingStudent.grade,
                            password: password || existingStudent.password,
                            serialNumber: serial ? String(serial).trim() : existingStudent.serialNumber,
                            admissions: admissions
                        };

                        updatedStudents.push(updatedStudent);
                        updateCount++;
                    } else {
                        // CREATE PATH
                        // 2. Validate Serial Number for new
                        if (serial) {
                            const serialStr = String(serial).trim();
                            if (existingSerialsMap.has(serialStr.toLowerCase())) {
                                errors.push(`Row ${rowNum}: Serial Number '${serial}' already exists in system.`);
                                return;
                            }
                            if (processedSerials.has(serialStr.toLowerCase())) {
                                errors.push(`Row ${rowNum}: Duplicate Serial Number '${serial}' in strictly this import file.`);
                                return;
                            }
                            processedSerials.add(serialStr.toLowerCase());
                        }

                        // 3. Generate or Validate ID
                        let studentId = providedId;
                        if (!studentId) {
                            const year = new Date().getFullYear();
                            // Find the max existing ID number to avoid duplicates after deletions
                            const maxNum = [...students, ...newStudents].reduce((max, s) => {
                                const match = s.id?.match(/ACS-\d{4}-(\d+)/);
                                return match ? Math.max(max, parseInt(match[1], 10)) : max;
                            }, 0);
                            const seq = String(maxNum + 1).padStart(3, '0');
                            studentId = `ACS-${year}-${seq}`;
                        } else {
                            if (students.some(s => s.id === studentId) || newStudents.some(s => s.id === studentId)) {
                                errors.push(`Row ${rowNum}: Student ID '${studentId}' already exists.`);
                                return;
                            }
                        }

                        processedIds.add(studentId);

                        const newStudent = {
                            id: studentId,
                            serialNumber: serial ? String(serial).trim() : null,
                            name: name,
                            password: password || ('acs' + Math.floor(1000 + Math.random() * 9000)),
                            grade: grade,
                            image: '',
                            feeHistory: [],
                            results: [],
                            attendance: { present: 0, absent: 0, total: 0, percentage: 0 },
                            previous_results: [],
                            previousResults: [],
                            admissions: [{
                                date: new Date().toISOString(),
                                gender: row['Gender'] || '',
                                fatherName: row['Father Name'] || '',
                                contact: row['Contact Number'] || row['Contact'] || '',
                                bForm: row['B-Form Number'] || '',
                                dob: row['Date of Birth'] || '',
                                religion: row['Religion'] || '',
                                nationality: row['Nationality'] || '',
                                fatherCnic: row['Father CNIC'] || '',
                                whatsapp: row['WhatsApp Number'] || '',
                                address: row['Address'] || ''
                            }]
                        };

                        newStudents.push(newStudent);
                        successCount++;
                    }
                });

                if (newStudents.length > 0 || updatedStudents.length > 0) {
                    const totalStudentsToUpsert = [...newStudents, ...updatedStudents];
                    const { error } = await setStudents(totalStudentsToUpsert);
                    if (error) {
                        alert("Database Error: " + error.message);
                    } else {
                        let msg = `Successfully imported ${successCount} new and updated ${updateCount} students.`;
                        if (errors.length > 0) {
                            msg += `\n\n${errors.length} rows failed:\n` + errors.slice(0, 10).join('\n') + (errors.length > 10 ? '\n...' : '');
                        }
                        alert(msg);
                        showSaveMessage(`${successCount + updateCount} students processed!`);
                        if (classImportFileRef.current) classImportFileRef.current.value = '';
                    }
                } else {
                    alert("No valid students were extracted from the file.\n\nDetails:\n" + (errors.length > 0 ? errors.join('\n') : "Ensure your Excel has a 'Student Name' column."));
                }

            } catch (err) {
                console.error("Import Error:", err);
                alert("Failed to process Excel file. Please ensure it is a valid .xlsx file.");
            }
        };
        // Use readAsArrayBuffer for better binary support
        reader.readAsArrayBuffer(file);
    };


    const exportClassRoster = () => {
        const classStudents = students.filter(s =>
            s.grade === selectedClassForList &&
            (classDetailTab === 'all' || s.admissions?.[0]?.gender === (classDetailTab === 'boys' ? 'Male' : 'Female'))
        );
        const suffix = classDetailTab === 'all' ? 'All' : (classDetailTab === 'boys' ? 'Boys' : 'Girls');

        if (classStudents.length === 0) {
            alert(`No ${suffix.toLowerCase()} in this class!`);
            return;
        }

        const exportData = classStudents.map(s => {
            const adm = s.admissions?.[0] || {};
            return {
                'Serial No': s.serialNumber || '', // Added Serial No
                'Student ID': s.id, 'Student Name': s.name, 'B-Form Number': adm.bForm || '',
                'Date of Birth': adm.dob || '', 'Gender': adm.gender || '', 'Religion': adm.religion || '',
                'Nationality': adm.nationality || '', 'Father Name': adm.fatherName || '',
                'Father CNIC': adm.fatherCnic || '', 'Contact Number': adm.contact || '',
                'WhatsApp Number': adm.whatsapp || '', 'Address': adm.address || '',
                'Fee Dues': (s.feeHistory || []).filter(h => h.status === 'unpaid').length + ' unpaid month(s)', 'Password': s.password
            };
        });
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        // Sheet names have a max limit of 31 chars in Excel
        XLSX.utils.book_append_sheet(wb, ws, `${selectedClassForList} ${suffix}`.substring(0, 31));
        XLSX.writeFile(wb, `Class_${selectedClassForList}_${suffix}_Roster_${new Date().toISOString().split('T')[0]}.xlsx`);
        showSaveMessage(`Exported ${classStudents.length} ${suffix.toLowerCase()}!`);
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

    const adminTabs = [
        { id: 'admissions', label: 'Admissions Desk', icon: PlusCircle, desc: 'Handle new enrollments and student applications.' },
        { id: 'classes', label: 'Classes & Sections', icon: Users, desc: 'Configure classrooms and manage student rosters.' },
        { id: 'marks', label: 'Manage Exams', icon: Award, desc: 'Input exam marks and configure subject weights.' },
        { id: 'attendance', label: 'Attendance', icon: Calendar, desc: 'Track daily attendance and absentees.' },
        { id: 'fees', label: 'Fee Management', icon: DollarSign, desc: 'Record tuition fees and payments.' },
        { id: 'reports', label: 'Report Cards', icon: FileText, desc: 'View analysis and print student report cards.' },
        { id: 'faculty', label: 'Faculty & Teachers', icon: User, desc: 'Manage your teaching staff profiles.' },
        { id: 'announcements', label: 'Noticeboard', icon: Megaphone, desc: 'Broadcast notices to portals.' },
        { id: 'facilities', label: 'School Facilities', icon: Building, desc: 'List and update school infrastructure.' },
        { id: 'blog', label: 'Website Blog', icon: Layout, desc: 'Post stories and news to the public website.' }
    ];

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', background: 'var(--color-gray-50)', overflowX: 'hidden' }}>
            {/* ── Confirm Modal ── */}
            {confirmModal.open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card animate-fade-in" style={{ maxWidth: '460px', width: '100%', padding: '2rem', textAlign: 'center', borderTop: `4px solid ${confirmModal.danger ? '#ef4444' : '#2563eb'}` }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>{confirmModal.title}</div>
                        <div style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>{confirmModal.message}</div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button onClick={closeConfirm} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => { confirmModal.onConfirm?.(); closeConfirm(); }} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', background: confirmModal.danger ? '#ef4444' : '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                                {confirmModal.danger ? 'Yes, Delete' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Change Admin Password Modal ── */}
            {showChangePwd && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card animate-fade-in" style={{ maxWidth: '420px', width: '100%', padding: '2rem', borderTop: '4px solid #2563eb' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e293b', marginBottom: '0.25rem' }}>🔐 Change Admin Credentials</div>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Update the admin username and password stored in the database.</p>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, color: '#475569', fontSize: '0.85rem', marginBottom: '0.4rem' }}>New Username</label>
                            <input className="form-input" value={newAdminUser} onChange={e => setNewAdminUser(e.target.value)} placeholder={adminCredentials.username || 'admin'} style={{ width: '100%' }} />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, color: '#475569', fontSize: '0.85rem', marginBottom: '0.4rem' }}>New Password</label>
                            <input className="form-input" type="password" value={newAdminPwd} onChange={e => setNewAdminPwd(e.target.value)} placeholder="New password" style={{ width: '100%' }} />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, color: '#475569', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Confirm Password</label>
                            <input className="form-input" type="password" value={newAdminPwdConfirm} onChange={e => setNewAdminPwdConfirm(e.target.value)} placeholder="Confirm password" style={{ width: '100%' }} />
                            {newAdminPwd && newAdminPwdConfirm && newAdminPwd !== newAdminPwdConfirm && (
                                <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.4rem' }}>⚠ Passwords do not match</div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setShowChangePwd(false); setNewAdminUser(''); setNewAdminPwd(''); setNewAdminPwdConfirm(''); }} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={async () => {
                                if (!newAdminUser.trim() || !newAdminPwd.trim()) { alert('Username and password cannot be empty.'); return; }
                                if (newAdminPwd !== newAdminPwdConfirm) { alert('Passwords do not match.'); return; }
                                const { error } = await changeAdminPassword(newAdminUser.trim(), newAdminPwd.trim());
                                if (!error) { showSaveMessage('✅ Admin credentials updated!'); setShowChangePwd(false); setNewAdminUser(''); setNewAdminPwd(''); setNewAdminPwdConfirm(''); }
                                else alert('Error updating: ' + error.message);
                            }} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                disabled={newAdminPwd !== newAdminPwdConfirm && !!newAdminPwdConfirm}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Student Edit Modal ── */}
            {editingStudentId && editStudentData && (
                <Suspense fallback={null}>
                    <StudentEditModal
                        editStudentData={editStudentData}
                        setEditStudentData={setEditStudentData}
                        sectionClasses={sectionClasses}
                        studentPhotoUploadRef={studentPhotoUploadRef}
                        handleStudentPhotoUpload={handleStudentPhotoUpload}
                        students={students}
                        setStudents={setStudents}
                        showSaveMessage={showSaveMessage}
                        onClose={() => { setEditingStudentId(null); setEditStudentData(null); }}
                    />
                </Suspense>
            )}

            {/* ── Hidden File Inputs ── */}
            <input type="file" ref={attendanceFileRef} onChange={importAttendanceExcel} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />
            <input type="file" ref={marksFileRef} onChange={importMarksExcel} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />
            <input type="file" ref={feeFileRef} onChange={importFeeExcel} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} />
            <input type="file" ref={photoFileRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
            <input type="file" ref={facultyFileRef} onChange={handleFacultyPhotoUpload} accept="image/*" style={{ display: 'none' }} />
            <input type="file" ref={facilityFileRef} onChange={handleFacilityPhotoUpload} accept="image/*" style={{ display: 'none' }} />
            <input type="file" ref={blogImageRef} onChange={handleBlogImageUpload} accept="image/*" style={{ display: 'none' }} />
            <input type="file" ref={classImportFileRef} onChange={importStudentsExcel} accept=".xlsx,.xls" style={{ display: 'none' }} />

            {/* ── Save Toast ── */}
            {saveMessage && (
                <div className="animate-fade-in" style={{ position: 'fixed', top: '20px', right: '20px', background: 'var(--color-success)', color: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', zIndex: 1000, display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 'var(--font-weight-semibold)' }}>
                    <CheckCircle size={20} /> {saveMessage}
                </div>
            )}

            {/* ── LEFT SIDEBAR ── */}
            <aside style={{
                width: '280px',
                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                borderRight: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: '80px',
                height: 'calc(100vh - 80px)',
                overflowY: 'auto',
                boxShadow: '4px 0 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ padding: '1.75rem 1.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', borderBottom: '1px solid #334155' }}>
                    <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: 'white', padding: '0.6rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}>
                        <School size={22} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#f8fafc', letterSpacing: '0.5px' }}>Control Panel</span>
                </div>

                <nav style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <button onClick={() => setActiveTab('dashboard')} className="btn hover-scale" style={{
                        justifyContent: 'flex-start',
                        padding: '0.85rem 1.25rem',
                        background: activeTab === 'dashboard' ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                        color: activeTab === 'dashboard' ? 'white' : '#94a3b8',
                        fontWeight: activeTab === 'dashboard' ? 700 : 500,
                        border: 'none',
                        boxShadow: activeTab === 'dashboard' ? '0 4px 12px -3px rgba(37, 99, 235, 0.4)' : 'none',
                        borderRadius: '12px',
                        width: '100%',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                    }}>
                        <Layout size={20} style={{ marginRight: '0.75rem', opacity: activeTab === 'dashboard' ? 1 : 0.7 }} /> Dashboard
                    </button>

                    <div style={{ margin: '1.5rem 0 0.5rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Modules</div>

                    {adminTabs.map((tab, idx) => {
                        const tabColors = [
                            { bg: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)', shadow: 'rgba(37, 99, 235, 0.4)' },
                            { bg: 'linear-gradient(90deg, #d946ef 0%, #c026d3 100%)', shadow: 'rgba(217, 70, 239, 0.4)' },
                            { bg: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', shadow: 'rgba(16, 185, 129, 0.4)' },
                            { bg: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)', shadow: 'rgba(249, 115, 22, 0.4)' },
                            { bg: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)', shadow: 'rgba(139, 92, 246, 0.4)' },
                            { bg: 'linear-gradient(90deg, #14b8a6 0%, #0d9488 100%)', shadow: 'rgba(20, 184, 166, 0.4)' },
                            { bg: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)', shadow: 'rgba(239, 68, 68, 0.4)' },
                            { bg: 'linear-gradient(90deg, #eab308 0%, #ca8a04 100%)', shadow: 'rgba(234, 179, 8, 0.4)' },
                            { bg: 'linear-gradient(90deg, #64748b 0%, #475569 100%)', shadow: 'rgba(100, 116, 139, 0.4)' },
                            { bg: 'linear-gradient(90deg, #ec4899 0%, #db2777 100%)', shadow: 'rgba(236, 72, 153, 0.4)' }
                        ];
                        const c = tabColors[idx % tabColors.length];
                        const isActive = activeTab === tab.id;

                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn hover-scale" style={{
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
                    <button onClick={() => { setNewAdminUser(adminCredentials.username || ''); setShowChangePwd(true); }} className="btn hover-scale" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                        <Lock size={16} /> Admin Config
                    </button>
                    <button onClick={handleLogout} className="btn hover-scale" style={{ width: '100%', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

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
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {activeTab === 'dashboard' ? <><Layout size={28} color="#2563eb" /> Overview</> :
                                <><span style={{ color: '#2563eb' }}>{adminTabs.find(t => t.id === activeTab)?.label}</span></>}
                        </h1>
                        <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
                            {activeTab === 'dashboard' ? 'Welcome to your administration control center.' : adminTabs.find(t => t.id === activeTab)?.desc}
                        </p>
                    </div>
                </header>

                <div style={{ padding: '2.5rem', width: '100%', maxWidth: '1400px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* ── Dashboard Grid Menu ── */}
                    {activeTab === 'dashboard' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* Welcome Banner */}
                            <div style={{
                                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                borderRadius: '24px',
                                padding: '3rem 2.5rem',
                                color: 'white',
                                boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.25), 0 10px 10px -5px rgba(59, 130, 246, 0.1)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
                                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem', lineHeight: 1.1 }}>Good Morning, Admin!</h2>
                                    <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: 0 }}>Here is what's happening at your school today. Select a module below to manage operations.</p>
                                </div>
                                {/* Decorative Circles */}
                                <div style={{ position: 'absolute', right: '-5%', top: '-20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: 1 }}></div>
                                <div style={{ position: 'absolute', right: '15%', bottom: '-40%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: 1 }}></div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {adminTabs.map((tab, idx) => {
                                    // Assign distinct colors based on index to make the grid pop
                                    const colors = [
                                        { bg: '#eff6ff', icon: '#3b82f6', border: '#bfdbfe', grad: 'linear-gradient(135deg, white 0%, #eff6ff 100%)' }, // Blue
                                        { bg: '#fdf4ff', icon: '#d946ef', border: '#fbcfe8', grad: 'linear-gradient(135deg, white 0%, #fae8ff 100%)' }, // Fuchsia
                                        { bg: '#ecfdf5', icon: '#10b981', border: '#a7f3d0', grad: 'linear-gradient(135deg, white 0%, #d1fae5 100%)' }, // Emerald
                                        { bg: '#fff7ed', icon: '#f97316', border: '#fed7aa', grad: 'linear-gradient(135deg, white 0%, #ffedd5 100%)' }, // Orange
                                        { bg: '#f5f3ff', icon: '#8b5cf6', border: '#ddd6fe', grad: 'linear-gradient(135deg, white 0%, #ede9fe 100%)' }, // Violet
                                        { bg: '#f0fdfa', icon: '#14b8a6', border: '#99f6e4', grad: 'linear-gradient(135deg, white 0%, #ccfbf1 100%)' }, // Teal
                                        { bg: '#fef2f2', icon: '#ef4444', border: '#fecaca', grad: 'linear-gradient(135deg, white 0%, #fee2e2 100%)' }, // Red
                                        { bg: '#fefce8', icon: '#eab308', border: '#fef08a', grad: 'linear-gradient(135deg, white 0%, #fef9c3 100%)' }, // Yellow
                                        { bg: '#f8fafc', icon: '#64748b', border: '#e2e8f0', grad: 'linear-gradient(135deg, white 0%, #f1f5f9 100%)' }, // Slate
                                        { bg: '#fdf2f8', icon: '#ec4899', border: '#fbcfe8', grad: 'linear-gradient(135deg, white 0%, #fce7f3 100%)' }  // Pink
                                    ];
                                    const c = colors[idx % colors.length];

                                    return (
                                        <div
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className="card"
                                            style={{
                                                padding: '2rem 1.75rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                textAlign: 'left',
                                                gap: '1.25rem',
                                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                border: '1px solid #e2e8f0',
                                                borderTop: `5px solid ${c.icon}`,
                                                background: c.grad,
                                                borderRadius: '20px',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                                                e.currentTarget.style.boxShadow = `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px ${c.icon}40`;
                                                e.currentTarget.style.borderColor = c.border;
                                                const iconBg = e.currentTarget.querySelector('.icon-bg');
                                                if (iconBg) iconBg.style.transform = 'scale(1.15) rotate(5deg)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                const iconBg = e.currentTarget.querySelector('.icon-bg');
                                                if (iconBg) iconBg.style.transform = 'scale(1) rotate(0deg)';
                                            }}
                                        >
                                            <div className="icon-bg" style={{
                                                background: c.bg,
                                                padding: '1.25rem',
                                                borderRadius: '16px',
                                                color: c.icon,
                                                boxShadow: `inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 6px -1px ${c.icon}20`,
                                                transition: 'transform 0.3s ease'
                                            }}>
                                                <tab.icon size={36} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '-0.3px' }}>{tab.label}</h3>
                                                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>{tab.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Tab Content ── */}
                    {activeTab !== 'dashboard' && (
                        <div className="animate-fade-in">
                            <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading Module…</div>}>
                                {/* Gradebook */}
                                {activeTab === 'marks' && (
                                    <GradebookTab
                                        students={students} selectedClass={selectedClass} setSelectedClass={setSelectedClass} sectionClasses={sectionClasses}
                                        TERMS={TERMS} SUBJECTS={SUBJECTS} WEIGHTS={WEIGHTS}
                                        gbTerm={gbTerm} setGbTerm={setGbTerm} gbGenderTab={gbGenderTab} setGbGenderTab={setGbGenderTab}
                                        gbEdits={gbEdits} setGbEdits={setGbEdits} gbSaving={gbSaving}
                                        showGbStats={showGbStats} setShowGbStats={setShowGbStats}
                                        showGbSettings={showGbSettings} setShowGbSettings={setShowGbSettings}
                                        newSubjectInput={newSubjectInput} setNewSubjectInput={setNewSubjectInput}
                                        newTermInput={newTermInput} setNewTermInput={setNewTermInput}
                                        updateClassSubjects={updateClassSubjects} updateTerms={updateTerms} updateWeights={updateWeights}
                                        saveGradebook={saveGradebook} downloadGradebookTemplate={downloadGradebookTemplate}
                                        exportGradebookExcel={exportGradebookExcel} archiveTerm={archiveTerm}
                                        exportResultPDF={exportResultPDF} importGradebookExcel={importGradebookExcel}
                                        gbImportFileRef={gbImportFileRef} getCellValue={getCellValue}
                                        handleCellEdit={handleCellEdit} saveRemarks={saveRemarks}
                                    />
                                )}

                                {/* Attendance */}
                                {activeTab === 'attendance' && (
                                    <AttendanceTab
                                        students={students} selectedClass={selectedClass} setSelectedClass={setSelectedClass} sectionClasses={sectionClasses}
                                        attDateFilter={attDateFilter} setAttDateFilter={setAttDateFilter}
                                        markAttendance={markAttendance} removeAttendanceRecord={removeAttendanceRecord}
                                        exportAttendanceExcel={exportAttendanceExcel} fetchData={fetchData}
                                        showSaveMessage={showSaveMessage} openConfirm={openConfirm}
                                    />
                                )}

                                {/* Fee */}
                                {activeTab === 'fees' && (
                                    <FeeTab
                                        students={students} selectedClass={selectedClass} setSelectedClass={setSelectedClass} sectionClasses={sectionClasses}
                                        openNewFeeMonth={openNewFeeMonth} toggleMonthFeeStatus={toggleMonthFeeStatus}
                                        markAllPaidForMonth={markAllPaidForMonth} markAllUnpaidForMonth={markAllUnpaidForMonth}
                                        deleteFeeMonth={deleteFeeMonth}
                                    />
                                )}

                                {/* Admissions */}
                                {activeTab === 'admissions' && (
                                    <AdmissionsTab
                                        admissionData={admissionData} setAdmissionData={setAdmissionData}
                                        admissionInitialState={admissionInitialState}
                                        printAdmissionForm={printAdmissionForm}
                                        handleAdmissionPhotoUpload={handleAdmissionPhotoUpload}
                                        photoFileRef={photoFileRef} sectionClasses={sectionClasses}
                                    />
                                )}

                                {/* Reports */}
                                {activeTab === 'reports' && (
                                    <ReportsTab
                                        students={students} reportSearch={reportSearch} setReportSearch={setReportSearch}
                                        downloadStudentReport={downloadStudentReport}
                                    />
                                )}

                                {/* Announcements */}
                                {activeTab === 'announcements' && (
                                    <AnnouncementsTab
                                        schoolData={schoolData}
                                        newAnnouncement={newAnnouncement} setNewAnnouncement={setNewAnnouncement}
                                        addAnnouncement={addAnnouncement} deleteAnnouncement={deleteAnnouncement}
                                    />
                                )}

                                {/* Faculty */}
                                {activeTab === 'faculty' && (
                                    <FacultyTab
                                        schoolData={schoolData}
                                        editingFacultyId={editingFacultyId} setEditingFacultyId={setEditingFacultyId}
                                        tempFacultyMember={tempFacultyMember} setTempFacultyMember={setTempFacultyMember}
                                        addFaculty={addFaculty} saveFaculty={saveFaculty} deleteFaculty={deleteFaculty}
                                        facultyFileRef={facultyFileRef}
                                    />
                                )}

                                {/* Facilities */}
                                {activeTab === 'facilities' && (
                                    <FacilitiesTab
                                        schoolData={schoolData}
                                        editingFacilityId={editingFacilityId} setEditingFacilityId={setEditingFacilityId}
                                        tempFacility={tempFacility} setTempFacility={setTempFacility}
                                        addFacility={addFacility} saveFacility={saveFacility} deleteFacility={deleteFacility}
                                        facilityFileRef={facilityFileRef}
                                    />
                                )}

                                {/* Blog */}
                                {activeTab === 'blog' && (
                                    <BlogTab
                                        schoolData={schoolData}
                                        editingBlogId={editingBlogId} setEditingBlogId={setEditingBlogId}
                                        tempBlog={tempBlog} setTempBlog={setTempBlog}
                                        addBlog={addBlog} saveBlog={saveBlog} deleteBlog={deleteBlog}
                                        blogImageRef={blogImageRef}
                                    />
                                )}

                                {/* Class Lists */}
                                {activeTab === 'classes' && (
                                    <ClassListsTab
                                        students={students} setStudents={setStudents}
                                        SECTIONS={SECTIONS} CLASSES={CLASSES}
                                        updateSections={updateSections} updateClasses={updateClasses}
                                        sectionClasses={sectionClasses}
                                        selectedClassForList={selectedClassForList} setSelectedClassForList={setSelectedClassForList}
                                        viewingClass={viewingClass} setViewingClass={setViewingClass}
                                        classDetailTab={classDetailTab} setClassDetailTab={setClassDetailTab}
                                        newSectionName={newSectionName} setNewSectionName={setNewSectionName}
                                        newClassName={newClassName} setNewClassName={setNewClassName}
                                        editingSectionId={editingSectionId} setEditingSectionId={setEditingSectionId}
                                        editingSectionName={editingSectionName} setEditingSectionName={setEditingSectionName}
                                        selectedSectionId={selectedSectionId} setSelectedSectionId={setSelectedSectionId}
                                        editingStudentId={editingStudentId} setEditingStudentId={setEditingStudentId}
                                        editStudentData={editStudentData} setEditStudentData={setEditStudentData}
                                        classImportFileRef={classImportFileRef} importStudentsExcel={importStudentsExcel}
                                        exportClassRoster={exportClassRoster}
                                        setActiveTab={setActiveTab} setAdmissionData={setAdmissionData}
                                        showSaveMessage={showSaveMessage} openConfirm={openConfirm}
                                    />
                                )}
                            </Suspense>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminPortal;
