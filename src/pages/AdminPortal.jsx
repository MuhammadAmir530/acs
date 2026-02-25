import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Award, Calendar, DollarSign, LogOut,
    Save, CheckCircle, XCircle, Edit3, User,
    Download, Upload, FileText, Search, Camera,
    BellPlus, Trash2, Megaphone, PlusCircle, Lock,
    Building, School, Check, X, ChevronRight, Layout
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSchoolData } from '../context/SchoolDataContext';
import { supabase } from '../supabaseClient';

const AdminPortal = ({ setIsAdmin, setCurrentPage }) => {
    const { schoolData, CLASSES, SUBJECTS, TERMS, SECTIONS, WEIGHTS, fetchData, setStudents, setFaculty, updateSchoolInfo, setAnnouncements, updateClasses, updateSubjects, updateTerms, updateSections, updateWeights } = useSchoolData();
    const [activeTab, setActiveTab] = useState('admissions');
    const [saveMessage, setSaveMessage] = useState('');
    const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
    const [reportSearch, setReportSearch] = useState('');

    // ── Gradebook State ──
    // ── Class Management State ──
    const [selectedSectionId, setSelectedSectionId] = useState(null);
    const [viewingClass, setViewingClass] = useState(null);
    const [classDetailTab, setClassDetailTab] = useState('boys'); // 'boys', 'girls', 'all'
    const [newSectionName, setNewSectionName] = useState('');

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

    // Helper: get total marks for a subject (from WEIGHTS map, fallback 100)
    const getSubjectTotal = (sub) => Number(WEIGHTS[sub]) || 100;

    // ── Overall Percentage Calculation ──
    // Uses per-subject totals from WEIGHTS: sum(obtained) / sum(totals) × 100
    // Falls back to 100 per subject if not configured.
    const calcOverallPct = (results) => {
        if (!results || results.length === 0) return 0;
        let totalObtained = 0, totalMax = 0;
        results.forEach(r => {
            const subTotal = getSubjectTotal(r.subject);
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
            const newTermResults = SUBJECTS.map(subject => {
                const subTotal = getSubjectTotal(subject);
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
                SUBJECTS.forEach(sub => {
                    const r = results.find(r => r.subject === sub);
                    row[`${sub} (Marks)`] = r ? r.obtained : '';
                    row[`${sub} (%)`] = r ? r.percentage : '';
                    row[`${sub} (Grade)`] = r ? r.grade : '';
                    if (WEIGHTS[sub]) row[`${sub} (Weight%)`] = WEIGHTS[sub];
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
                SUBJECTS.forEach(sub => {
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
            SUBJECTS.forEach(sub => { row[sub] = ''; });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Marks Template');
        XLSX.writeFile(wb, `Marks_Template_${selectedClass}_${termLabel}_${genderLabel}.xlsx`);
    };


    // File refs
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
        applyingFor: CLASSES[0], applicationDate: new Date().toISOString().split('T')[0],
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
    const [selectedClassForList, setSelectedClassForList] = useState(CLASSES[0]);
    const [classListSearch, setClassListSearch] = useState('');
    const [newClassName, setNewClassName] = useState('');
    const classImportFileRef = useRef(null);

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
            const nextIdNum = students.length + 1;
            const year = new Date().getFullYear();
            const studentId = `ACS-${year}-${nextIdNum.toString().padStart(3, '0')}`;

            const newStudentRecord = {
                id: studentId,
                serial_number: d.serialNumber ? d.serialNumber : null,
                name: d.studentName,
                password: 'acs' + Math.floor(1000 + Math.random() * 9000), // Random temporary password
                grade: d.applyingFor,
                image: d.photo,
                fee_status: 'unpaid',
                admissions: [d], // Store form history
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
    const markAttendance = async (studentId, status) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const newAttendance = { ...student.attendance };
        newAttendance.total += 1;
        if (status === 'present') {
            newAttendance.present += 1;
        } else {
            newAttendance.absent += 1;
        }
        newAttendance.percentage = parseFloat(
            ((newAttendance.present / newAttendance.total) * 100).toFixed(1)
        );

        const { error } = await supabase
            .from('students')
            .update({ attendance: newAttendance })
            .eq('id', studentId);

        if (!error) {
            fetchData();
            showSaveMessage(`Attendance marked for ${student.name}!`);
        }
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

    // --- FEE FUNCTIONS ---
    const toggleFeeStatus = async (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const newStatus = student.feeStatus === 'paid' ? 'unpaid' : 'paid';
        const { error } = await supabase
            .from('students')
            .update({ fee_status: newStatus })
            .eq('id', studentId);

        if (!error) {
            fetchData();
            showSaveMessage(`Fee status updated to ${newStatus.toUpperCase()} for ${student.name}!`);
        }
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
                            feeStatus: row['Fee Status'] ? String(row['Fee Status']).toLowerCase() : existingStudent.feeStatus || existingStudent.fee_status,
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
                            const count = students.length + newStudents.length + 1;
                            const seq = String(count).padStart(3, '0');
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
                            feeStatus: row['Fee Status'] ? String(row['Fee Status']).toLowerCase() : 'unpaid',
                            fee_status: row['Fee Status'] ? String(row['Fee Status']).toLowerCase() : 'unpaid',
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
        const classStudents = students.filter(s => s.grade === selectedClassForList);
        if (classStudents.length === 0) { alert('No students in this class!'); return; }
        const exportData = classStudents.map(s => {
            const adm = s.admissions?.[0] || {};
            return {
                'Serial No': s.serialNumber || '', // Added Serial No
                'Student ID': s.id, 'Student Name': s.name, 'B-Form Number': adm.bForm || '',
                'Date of Birth': adm.dob || '', 'Gender': adm.gender || '', 'Religion': adm.religion || '',
                'Nationality': adm.nationality || '', 'Father Name': adm.fatherName || '',
                'Father CNIC': adm.fatherCnic || '', 'Contact Number': adm.contact || '',
                'WhatsApp Number': adm.whatsapp || '', 'Address': adm.address || '',
                'Fee Status': s.fee_status || 'Pending', 'Password': s.password
            };
        });
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, selectedClassForList);
        XLSX.writeFile(wb, `Class_${selectedClassForList}_Roster_${new Date().toISOString().split('T')[0]}.xlsx`);
        showSaveMessage(`Exported ${classStudents.length} students!`);
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
            <input
                type="file"
                ref={facultyFileRef}
                onChange={(e) => handleFacultyPhotoUpload(e)}
                accept="image/*"
                style={{ display: 'none' }}
            />
            <input
                type="file"
                ref={facilityFileRef}
                onChange={(e) => handleFacilityPhotoUpload(e)}
                accept="image/*"
                style={{ display: 'none' }}
            />
            <input
                type="file"
                ref={blogImageRef}
                onChange={(e) => handleBlogImageUpload(e)}
                accept="image/*"
                style={{ display: 'none' }}
            />
            <input
                type="file"
                ref={classImportFileRef}
                onChange={importStudentsExcel}
                accept=".xlsx,.xls"
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
                            { id: 'admissions', label: 'Admissions', icon: PlusCircle },
                            { id: 'marks', label: 'Student Marks', icon: Award },
                            { id: 'reports', label: 'Student Reports', icon: FileText },
                            { id: 'attendance', label: 'Attendance Sheet', icon: Calendar },
                            { id: 'fees', label: 'Fee Status', icon: DollarSign },
                            { id: 'classes', label: 'Class Lists', icon: Users },
                            { id: 'announcements', label: 'Announcements', icon: Megaphone },
                            { id: 'faculty', label: 'Faculty', icon: Users },
                            { id: 'facilities', label: 'Facilities', icon: Building },
                            { id: 'blog', label: 'Blog Posts', icon: FileText }
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

                    {/* ========== GRADEBOOK TAB ========== */}
                    {activeTab === 'marks' && (() => {
                        const allClassStudents = students.filter(s => s.grade === selectedClass);
                        const classStudents = filterByGender(allClassStudents, gbGenderTab);
                        const termLabel = gbTerm || TERMS[0] || 'Current';
                        // Compute stats using term-specific results
                        const subjectStats = SUBJECTS.map(sub => {
                            const subTotal = getSubjectTotal(sub);
                            const vals = classStudents.map(s => {
                                const termResults = getTermResults(s, termLabel);
                                const r = termResults.find(r => r.subject === sub);
                                const edited = gbEdits[s.id]?.[sub];
                                const obtained = edited !== undefined ? Number(edited) : (r?.obtained ?? null);
                                return obtained !== null ? Math.round((obtained / subTotal) * 100) : null;
                            }).filter(v => v !== null);
                            const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
                            const high = vals.length ? Math.max(...vals) : 0;
                            const pass = vals.filter(v => v >= 40).length;
                            return { sub, avg, high, pass, total: vals.length };
                        });
                        const overallAvg = classStudents.length ? Math.round(
                            classStudents.reduce((sum, s) => {
                                const res = getTermResults(s, termLabel);
                                const pct = calcOverallPct(res);
                                return sum + pct;
                            }, 0) / classStudents.length
                        ) : 0;
                        const passCount = classStudents.filter(s => {
                            const res = getTermResults(s, termLabel);
                            const pct = calcOverallPct(res);
                            return pct >= 40;
                        }).length;

                        // Gender counts for tabs
                        const boysCount = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Male').length;
                        const girlsCount = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Female').length;

                        return (
                            <div className="animate-fade-in">
                                {/* Hidden import input */}
                                <input type="file" ref={gbImportFileRef} onChange={importGradebookExcel} accept=".xlsx,.xls" style={{ display: 'none' }} />

                                {/* ── Header Bar ── */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>📊 Gradebook</h2>
                                        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Spreadsheet-style marks entry — separated by term and gender</p>
                                    </div>
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {/* Class */}
                                        <select className="form-input" style={{ padding: '0.4rem 0.75rem' }} value={selectedClass}
                                            onChange={e => { setSelectedClass(e.target.value); setGbEdits({}); }}>
                                            {CLASSES.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                        {/* Term label */}
                                        <select className="form-input" style={{ padding: '0.4rem 0.75rem', fontWeight: 700 }} value={gbTerm}
                                            onChange={e => { setGbTerm(e.target.value); setGbEdits({}); }}>
                                            {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>

                                        <button onClick={saveGradebook} disabled={gbSaving} className="btn btn-primary" style={{ padding: '0.45rem 1rem' }}>
                                            <Save size={15} /> {gbSaving ? 'Saving…' : 'Save All'}
                                        </button>
                                        <button onClick={downloadGradebookTemplate} className="btn" style={{ background: '#10b981', color: 'white', borderColor: '#10b981', padding: '0.45rem 0.9rem' }}>
                                            <Download size={15} /> Template
                                        </button>
                                        <button onClick={() => gbImportFileRef.current.click()} className="btn" style={{ background: '#3b82f6', color: 'white', borderColor: '#3b82f6', padding: '0.45rem 0.9rem' }}>
                                            <Upload size={15} /> Import
                                        </button>
                                        <button onClick={exportGradebookExcel} className="btn" style={{ background: '#217346', color: 'white', borderColor: '#217346', padding: '0.45rem 0.9rem' }}>
                                            <Download size={15} /> Export All Terms
                                        </button>
                                        <button onClick={archiveTerm} className="btn" style={{ background: '#7c3aed', color: 'white', borderColor: '#7c3aed', padding: '0.45rem 0.9rem' }}>
                                            <Save size={15} /> Archive Term
                                        </button>
                                        <button onClick={() => setShowGbSettings(s => !s)} className="btn" style={{ padding: '0.45rem 0.9rem' }}>
                                            ⚙️ Settings
                                        </button>
                                    </div>
                                </div>

                                {/* ── Settings Panel ── */}
                                {showGbSettings && (
                                    <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>⚙️ Gradebook Settings</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                            {/* Subjects */}
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Subjects</div>
                                                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                                    <input className="form-input" placeholder="Add subject…" value={newSubjectInput}
                                                        onChange={e => setNewSubjectInput(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter' && newSubjectInput.trim()) { updateSubjects([...SUBJECTS, newSubjectInput.trim()]); setNewSubjectInput(''); } }}
                                                        style={{ flex: 1, padding: '0.35rem 0.6rem' }} />
                                                    <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem' }}
                                                        onClick={() => { if (newSubjectInput.trim()) { updateSubjects([...SUBJECTS, newSubjectInput.trim()]); setNewSubjectInput(''); } }}>
                                                        <PlusCircle size={14} />
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                    {SUBJECTS.map(s => (
                                                        <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '999px', padding: '0.2rem 0.7rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                                            {s}
                                                            <button onClick={() => updateSubjects(SUBJECTS.filter(x => x !== s))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0369a1', display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Terms */}
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Terms</div>
                                                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                                    <input className="form-input" placeholder="Add term…" value={newTermInput}
                                                        onChange={e => setNewTermInput(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter' && newTermInput.trim()) { updateTerms([...TERMS, newTermInput.trim()]); setNewTermInput(''); } }}
                                                        style={{ flex: 1, padding: '0.35rem 0.6rem' }} />
                                                    <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem' }}
                                                        onClick={() => { if (newTermInput.trim()) { updateTerms([...TERMS, newTermInput.trim()]); setNewTermInput(''); } }}>
                                                        <PlusCircle size={14} />
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                    {TERMS.map(t => (
                                                        <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f3e8ff', color: '#7c3aed', borderRadius: '999px', padding: '0.2rem 0.7rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                                            {t}
                                                            <button onClick={() => updateTerms(TERMS.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Subject Total Marks */}
                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>📝 Subject Total Marks</div>
                                                {(() => {
                                                    const grandTotal = SUBJECTS.reduce((s, sub) => s + getSubjectTotal(sub), 0);
                                                    return (
                                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', borderRadius: '999px', padding: '0.15rem 0.6rem' }}>
                                                            Grand Total: {grandTotal} marks
                                                        </span>
                                                    );
                                                })()}
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Leave blank to use 100 per subject</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.5rem' }}>
                                                {SUBJECTS.map(sub => (
                                                    <div key={sub} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.6rem' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>
                                                        <input
                                                            type="number" min="1" max="9999"
                                                            value={WEIGHTS[sub] || ''}
                                                            placeholder="100"
                                                            onChange={e => {
                                                                const val = e.target.value === '' ? undefined : Number(e.target.value);
                                                                const newW = { ...WEIGHTS };
                                                                if (val === undefined || val <= 0) delete newW[sub]; else newW[sub] = val;
                                                                updateWeights(newW);
                                                            }}
                                                            style={{ width: '60px', padding: '0.25rem 0.35rem', border: '1px solid #d1d5db', borderRadius: '6px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}
                                                        />
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>pts</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Grading Scale Reference */}
                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Grading Scale (Pakistani Standard)</div>
                                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                {[['A+', '90-100', '#dcfce7', '#15803d'], ['A', '80-89', '#dcfce7', '#15803d'], ['B+', '70-79', '#dbeafe', '#1d4ed8'], ['B', '60-69', '#dbeafe', '#1d4ed8'], ['C', '50-59', '#fef9c3', '#a16207'], ['D', '40-49', '#ffedd5', '#c2410c'], ['F', '<40', '#fee2e2', '#dc2626']].map(([g, r, bg, col]) => (
                                                    <span key={g} style={{ background: bg, color: col, borderRadius: '6px', padding: '0.2rem 0.6rem', fontSize: '0.78rem', fontWeight: 700 }}>{g}: {r}%</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── Gender Tabs ── */}
                                <div style={{
                                    display: 'flex',
                                    gap: '0',
                                    marginBottom: '1.25rem',
                                    borderBottom: '2px solid #e2e8f0',
                                    background: 'white',
                                    borderRadius: '12px 12px 0 0',
                                    overflow: 'hidden',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    {[
                                        { id: 'boys', label: '👦 Boys', count: boysCount, color: '#0369a1', bg: '#e0f2fe' },
                                        { id: 'girls', label: '👧 Girls', count: girlsCount, color: '#be185d', bg: '#fce7f3' },
                                        { id: 'all', label: '👥 All Students', count: allClassStudents.length, color: '#475569', bg: '#f1f5f9' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setGbGenderTab(tab.id)}
                                            style={{
                                                flex: 1,
                                                padding: '0.85rem 1rem',
                                                fontWeight: gbGenderTab === tab.id ? 800 : 600,
                                                fontSize: '0.9rem',
                                                color: gbGenderTab === tab.id ? tab.color : '#94a3b8',
                                                background: gbGenderTab === tab.id ? tab.bg : 'transparent',
                                                border: 'none',
                                                borderBottom: gbGenderTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.4rem'
                                            }}
                                        >
                                            {tab.label}
                                            <span style={{
                                                background: gbGenderTab === tab.id ? tab.color : '#cbd5e1',
                                                color: 'white',
                                                borderRadius: '999px',
                                                padding: '0.1rem 0.5rem',
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                minWidth: '22px',
                                                textAlign: 'center'
                                            }}>
                                                {tab.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* ── Class Statistics ── */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <button onClick={() => setShowGbStats(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                        📈 Class Statistics {showGbStats ? '▲' : '▼'}
                                    </button>
                                    {showGbStats && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                            {/* Overall */}
                                            <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: 'white', borderRadius: '12px', padding: '1rem' }}>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.2rem' }}>Class Average</div>
                                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{overallAvg}%</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{classStudents.length} students • {calcGrade(overallAvg)} overall</div>
                                            </div>
                                            <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', borderRadius: '12px', padding: '1rem' }}>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.2rem' }}>Pass Rate</div>
                                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{classStudents.length ? Math.round((passCount / classStudents.length) * 100) : 0}%</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{passCount} / {classStudents.length} passed (≥40%)</div>
                                            </div>
                                            {/* Per-subject stats */}
                                            {subjectStats.map(({ sub, avg, high, pass, total }) => {
                                                const gc = gradeColor(avg);
                                                return (
                                                    <div key={sub} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#1e293b' }}>{sub}</div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                                                            <span>Avg: <b style={{ color: gc.text }}>{avg}%</b></span>
                                                            <span>High: <b style={{ color: '#15803d' }}>{high}%</b></span>
                                                            <span>Pass: <b>{pass}/{total}</b></span>
                                                        </div>
                                                        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', marginTop: '0.5rem' }}>
                                                            <div style={{ width: `${avg}%`, height: '100%', background: gc.text, borderRadius: '999px', transition: 'width 0.8s ease' }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* ── Gradebook Table ── */}
                                {classStudents.length === 0 ? (
                                    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                        <Users size={48} style={{ margin: '0 auto 1rem', color: '#cbd5e1' }} />
                                        <p>No students in {selectedClass} yet.</p>
                                    </div>
                                ) : (
                                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        {Object.keys(gbEdits).length > 0 && (
                                            <div style={{ padding: '0.6rem 1rem', background: '#fef9c3', borderBottom: '1px solid #fef08a', color: '#854d0e', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                ✏️ You have unsaved changes. Click <b>Save All</b> to apply.
                                            </div>
                                        )}
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${300 + SUBJECTS.length * 110}px` }}>
                                                <thead>
                                                    <tr style={{ background: '#1e293b', color: 'white' }}>
                                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.82rem', position: 'sticky', left: 0, background: '#1e293b', zIndex: 2, minWidth: '180px' }}>Student</th>
                                                        {SUBJECTS.map(sub => (
                                                            <th key={sub} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', minWidth: '100px' }}>
                                                                {sub}<br /><span style={{ opacity: 0.6, fontWeight: 400 }}>/{getSubjectTotal(sub)}</span>
                                                            </th>
                                                        ))}
                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', minWidth: '80px', background: '#0f172a' }}>Wtd Avg%</th>
                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', minWidth: '60px', background: '#0f172a' }}>Grade</th>
                                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontWeight: 700, fontSize: '0.78rem', minWidth: '160px' }}>Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {classStudents.map((student, rowIdx) => {
                                                        // Compute overall % using per-subject totals
                                                        const subResults = SUBJECTS.map(sub => {
                                                            const val = getCellValue(student, sub);
                                                            return val !== '' ? { subject: sub, obtained: Number(val), percentage: Math.round((Number(val) / getSubjectTotal(sub)) * 100) } : null;
                                                        }).filter(Boolean);
                                                        const rowAvg = subResults.length ? calcOverallPct(subResults) : null;
                                                        const rowGrade = rowAvg !== null ? calcGrade(rowAvg) : '—';
                                                        const rowGc = rowAvg !== null ? gradeColor(rowAvg) : { bg: '#f8fafc', text: '#94a3b8' };
                                                        const existingRemark = (student.results || [])[0]?.remarks || '';

                                                        return (
                                                            <tr key={student.id} style={{ borderTop: '1px solid #f1f5f9', background: rowIdx % 2 === 0 ? 'white' : '#fafafa' }}>
                                                                {/* Student name cell */}
                                                                <td style={{ padding: '0.6rem 1rem', position: 'sticky', left: 0, background: rowIdx % 2 === 0 ? 'white' : '#fafafa', zIndex: 1, borderRight: '1px solid #e2e8f0' }}>
                                                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>{student.name}</div>
                                                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{student.id}</div>
                                                                </td>
                                                                {/* Subject cells */}
                                                                {SUBJECTS.map(sub => {
                                                                    const subTotal = getSubjectTotal(sub);
                                                                    const val = getCellValue(student, sub);
                                                                    const pct = val !== '' ? Math.round((Number(val) / subTotal) * 100) : null;
                                                                    const gc = pct !== null ? gradeColor(pct) : { bg: 'transparent', text: '#94a3b8' };
                                                                    const isDirty = gbEdits[student.id]?.[sub] !== undefined;
                                                                    return (
                                                                        <td key={sub} style={{ padding: '0.4rem 0.3rem', textAlign: 'center' }}>
                                                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    max={subTotal}
                                                                                    value={val}
                                                                                    onChange={e => handleCellEdit(student.id, sub, e.target.value)}
                                                                                    style={{
                                                                                        width: '70px', padding: '0.35rem 0.4rem',
                                                                                        textAlign: 'center', borderRadius: '6px',
                                                                                        border: isDirty ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                                                                        background: gc.bg, color: gc.text,
                                                                                        fontWeight: 700, fontSize: '0.88rem',
                                                                                        outline: 'none'
                                                                                    }}
                                                                                />
                                                                                {pct !== null && (
                                                                                    <div style={{ fontSize: '0.65rem', color: gc.text, fontWeight: 600, marginTop: '1px' }}>
                                                                                        {pct}% · {calcGrade(pct)}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    );
                                                                })}
                                                                {/* Average */}
                                                                <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', background: rowGc.bg }}>
                                                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: rowGc.text }}>{rowAvg !== null ? `${rowAvg}%` : '—'}</div>
                                                                </td>
                                                                {/* Grade badge */}
                                                                <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', background: rowGc.bg }}>
                                                                    <span style={{ display: 'inline-block', background: rowGc.text, color: 'white', borderRadius: '6px', padding: '0.2rem 0.5rem', fontWeight: 800, fontSize: '0.85rem' }}>{rowGrade}</span>
                                                                </td>
                                                                {/* Remarks */}
                                                                <td style={{ padding: '0.4rem 0.5rem' }}>
                                                                    <input
                                                                        type="text"
                                                                        defaultValue={existingRemark}
                                                                        placeholder="Teacher remarks…"
                                                                        onBlur={e => saveRemarks(student.id, SUBJECTS[0], e.target.value)}
                                                                        style={{ width: '100%', padding: '0.3rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', color: '#475569' }}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* Footer legend */}
                                        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Grade Scale:</span>
                                            {[['A+', '≥90', '#dcfce7', '#15803d'], ['A', '≥80', '#dcfce7', '#15803d'], ['B+', '≥70', '#dbeafe', '#1d4ed8'], ['B', '≥60', '#dbeafe', '#1d4ed8'], ['C', '≥50', '#fef9c3', '#a16207'], ['D', '≥40', '#ffedd5', '#c2410c'], ['F', '<40', '#fee2e2', '#dc2626']].map(([g, r, bg, col]) => (
                                                <span key={g} style={{ background: bg, color: col, borderRadius: '4px', padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 700 }}>{g} {r}%</span>
                                            ))}
                                            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94a3b8' }}>Blue border = unsaved edit</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* ========== ATTENDANCE TAB ========== */}
                    {activeTab === 'attendance' && (
                        <div className="animate-fade-in">
                            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Attendance Sheet</h2>
                                <div className="flex gap-4" style={{ alignItems: 'center' }}>
                                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-500)' }}>Filter Class:</span>
                                        <select
                                            className="form-input"
                                            style={{ padding: '0.4rem 0.8rem', minWidth: '180px' }}
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                        >
                                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                        <button onClick={exportAttendanceExcel} style={{ ...excelBtnStyle, background: '#217346', color: 'white', borderColor: '#217346' }}>
                                            <Download size={16} /> Export Excel
                                        </button>
                                        <button onClick={() => attendanceFileRef.current.click()} style={{ ...excelBtnStyle, background: 'white', color: '#217346', borderColor: '#217346' }}>
                                            <Upload size={16} /> Import Excel
                                        </button>
                                    </div>
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
                                        {students.filter(s => s.grade === selectedClass).map((student) => (
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

                    {/* ========== FEES TAB ========== */}
                    {activeTab === 'fees' && (
                        <div className="animate-fade-in">
                            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Fee Status</h2>
                                <div className="flex gap-4" style={{ alignItems: 'center' }}>
                                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-500)' }}>Filter Class:</span>
                                        <select
                                            className="form-input"
                                            style={{ padding: '0.4rem 0.8rem', minWidth: '180px' }}
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                        >
                                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                        <button onClick={exportFeeExcel} style={{ ...excelBtnStyle, background: '#217346', color: 'white', borderColor: '#217346' }}>
                                            <Download size={16} /> Export Excel
                                        </button>
                                        <button onClick={() => feeFileRef.current.click()} style={{ ...excelBtnStyle, background: 'white', color: '#217346', borderColor: '#217346' }}>
                                            <Upload size={16} /> Import Excel
                                        </button>
                                    </div>
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
                                        {students.filter(s => s.grade === selectedClass).map((student) => (
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

                    {/* ========== ADMISSIONS TAB ========== */}
                    {activeTab === 'admissions' && (

                        <div className="animate-fade-in">
                            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Admission Form</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setAdmissionData(admissionInitialState)}
                                        className="btn"
                                        style={{ background: 'white', border: '1px solid var(--color-gray-300)', color: 'var(--color-gray-600)' }}
                                    >
                                        <Trash2 size={16} /> Reset Form
                                    </button>
                                    <button
                                        onClick={printAdmissionForm}
                                        className="btn btn-primary"
                                        style={{ background: '#4d7c0f', borderColor: '#4d7c0f' }}
                                    >
                                        <Save size={18} /> Save & Print Form
                                    </button>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '2rem' }}>
                                {/* Top Meta Info */}
                                <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-gray-100)', paddingBottom: '1.5rem' }}>
                                    <div>
                                        <label className="form-label">Applying For (class)</label>
                                        <select
                                            className="form-input"
                                            value={admissionData.applyingFor}
                                            onChange={(e) => setAdmissionData({ ...admissionData, applyingFor: e.target.value })}
                                        >
                                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Application Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={admissionData.applicationDate}
                                            onChange={(e) => setAdmissionData({ ...admissionData, applicationDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="form-label">Serial Number (Optional)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Enter manual serial number (must be unique)"
                                            value={admissionData.serialNumber}
                                            onChange={(e) => setAdmissionData({ ...admissionData, serialNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Student Information */}
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <User size={18} /> Student's Information
                                    </h3>
                                    <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                                        <div>
                                            <label className="form-label">Student's Name (Capital Letters)</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Enter full name"
                                                value={admissionData.studentName}
                                                onChange={(e) => setAdmissionData({ ...admissionData, studentName: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">B-Form Number</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="35202-0000000-0"
                                                value={admissionData.bForm}
                                                onChange={(e) => setAdmissionData({ ...admissionData, bForm: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Date of Birth</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={admissionData.dob}
                                                onChange={(e) => setAdmissionData({ ...admissionData, dob: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Nationality</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g. Pakistani"
                                                value={admissionData.nationality}
                                                onChange={(e) => setAdmissionData({ ...admissionData, nationality: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Gender</label>
                                            <div className="flex gap-4">
                                                {['Male', 'Female', 'Others'].map(g => (
                                                    <label key={g} className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                                                        <input
                                                            type="radio"
                                                            name="gender"
                                                            checked={admissionData.gender === g}
                                                            onChange={() => setAdmissionData({ ...admissionData, gender: g })}
                                                        /> {g}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="form-label">Religion</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="e.g. Islam"
                                                value={admissionData.religion}
                                                onChange={(e) => setAdmissionData({ ...admissionData, religion: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Student Photograph</label>
                                            <div className="flex gap-4" style={{ alignItems: 'center' }}>
                                                <div style={{ width: '60px', height: '80px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                                                    {admissionData.photo ? <img src={admissionData.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={20} style={{ margin: 'auto', color: '#94a3b8' }} />}
                                                </div>
                                                <button onClick={() => photoFileRef.current.click()} className="btn btn-sm" style={{ background: 'var(--color-primary)', color: 'white' }}>
                                                    <Camera size={14} /> Upload Photo
                                                </button>
                                            </div>
                                            <input type="file" ref={photoFileRef} style={{ display: 'none' }} accept="image/*" onChange={handleAdmissionPhotoUpload} />
                                        </div>
                                    </div>
                                </div>

                                {/* Health & Medical */}
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Award size={18} /> Health & Medical Information
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
                                            <div>
                                                <label className="form-label">Any Allergies?</label>
                                                <div className="flex gap-4">
                                                    {['Yes', 'No'].map(o => (
                                                        <label key={o} className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                                                            <input type="radio" checked={admissionData.allergies === o} onChange={() => setAdmissionData({ ...admissionData, allergies: o })} /> {o}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="form-label">Allergy Details (If any)</label>
                                                <input type="text" className="form-input" value={admissionData.allergiesDetails} onChange={(e) => setAdmissionData({ ...admissionData, allergiesDetails: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
                                            <div>
                                                <label className="form-label">Chronic Medical Condition?</label>
                                                <div className="flex gap-4">
                                                    {['Yes', 'No'].map(o => (
                                                        <label key={o} className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                                                            <input type="radio" checked={admissionData.chronicCondition === o} onChange={() => setAdmissionData({ ...admissionData, chronicCondition: o })} /> {o}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="form-label">Condition Details (If any)</label>
                                                <input type="text" className="form-input" value={admissionData.chronicConditionDetails} onChange={(e) => setAdmissionData({ ...admissionData, chronicConditionDetails: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
                                            <div>
                                                <label className="form-label">Take Regular Medication?</label>
                                                <div className="flex gap-4">
                                                    {['Yes', 'No'].map(o => (
                                                        <label key={o} className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                                                            <input type="radio" checked={admissionData.medication === o} onChange={() => setAdmissionData({ ...admissionData, medication: o })} /> {o}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="form-label">Medication Details (If any)</label>
                                                <input type="text" className="form-input" value={admissionData.medicationDetails} onChange={(e) => setAdmissionData({ ...admissionData, medicationDetails: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Parent Information */}
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={18} /> Parents Information
                                    </h3>
                                    <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                                        <div className="col-span-2">
                                            <label className="form-label">Father's Name (Capital Letters)</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={admissionData.fatherName}
                                                onChange={(e) => setAdmissionData({ ...admissionData, fatherName: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">CNIC Number</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="35202-0000000-0"
                                                value={admissionData.fatherCnic}
                                                onChange={(e) => setAdmissionData({ ...admissionData, fatherCnic: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Contact Number</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={admissionData.contact}
                                                onChange={(e) => setAdmissionData({ ...admissionData, contact: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">WhatsApp Number</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={admissionData.whatsapp}
                                                onChange={(e) => setAdmissionData({ ...admissionData, whatsapp: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="form-label">Home Address</label>
                                            <textarea
                                                className="form-input"
                                                style={{ height: '80px' }}
                                                value={admissionData.address}
                                                onChange={(e) => setAdmissionData({ ...admissionData, address: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Documents Required */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={18} /> Documents Required
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        <label className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={admissionData.docs.photos} onChange={(e) => setAdmissionData({ ...admissionData, docs: { ...admissionData.docs, photos: e.target.checked } })} /> 4 Passport size photographs
                                        </label>
                                        <label className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={admissionData.docs.bform} onChange={(e) => setAdmissionData({ ...admissionData, docs: { ...admissionData.docs, bform: e.target.checked } })} /> A Copy of B-Form
                                        </label>
                                        <label className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={admissionData.docs.cnic} onChange={(e) => setAdmissionData({ ...admissionData, docs: { ...admissionData.docs, cnic: e.target.checked } })} /> A Copy of CNIC of Parents/Guardian
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="animate-fade-in">
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)', marginBottom: '1.5rem' }}>Student Reports</h2>
                            <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
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
                                <div className="card" style={{ padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--color-primary)' }}>Post New Announcement</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <div>
                                            <label className="form-label">Announcement Title</label>
                                            <input type="text" className="form-input" placeholder="e.g., Summer Vacation Notice" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="form-label">Publication Date</label>
                                            <input type="date" className="form-input" value={newAnnouncement.date} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="form-label">Content / Details</label>
                                            <textarea className="form-input" style={{ height: '120px', resize: 'vertical' }} placeholder="Provide detailed information here..." value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}></textarea>
                                        </div>
                                        <button onClick={addAnnouncement} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                                            <BellPlus size={18} /> Post Announcement
                                        </button>
                                    </div>
                                </div>
                                <div className="card" style={{ padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Active Announcements</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {(!schoolData.announcements || schoolData.announcements.length === 0) ? (
                                            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-gray-400)' }}>
                                                <Megaphone size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                                <p>No active announcements.</p>
                                            </div>
                                        ) : (
                                            (schoolData.announcements || []).map((ann) => (
                                                <div key={ann.id} style={{ padding: '1rem', border: '1px solid var(--color-gray-100)', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>{ann.date}</div>
                                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>{ann.title}</div>
                                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-600)', lineHeight: 1.5, margin: 0 }}>{ann.content}</p>
                                                        </div>
                                                        <button onClick={() => deleteAnnouncement(ann.id)} style={{ padding: '0.4rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
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

                    {/* ========== FACULTY TAB ========== */}
                    {activeTab === 'faculty' && (
                        <div className="animate-fade-in">
                            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Manage Faculty</h2>
                                <button onClick={addFaculty} className="btn btn-primary">
                                    <PlusCircle size={18} /> Add Faculty Member
                                </button>
                            </div>

                            {editingFacultyId && (
                                <div className="card" style={{ padding: '2rem', marginBottom: '2rem', border: '2px solid var(--color-primary-100)' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
                                        {editingFacultyId === 'new' ? 'New Faculty Member' : 'Edit Faculty Member'}
                                    </h3>
                                    <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '150px', height: '150px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {tempFacultyMember?.image ? (
                                                    <img src={tempFacultyMember.image} alt="Faculty" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <Camera size={40} color="#94a3b8" />
                                                )}
                                            </div>
                                            <button onClick={() => facultyFileRef.current.click()} className="btn btn-sm" style={{ background: 'var(--color-primary)', color: 'white' }}>
                                                Upload Photo
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <label className="form-label">Full Name</label>
                                                <input type="text" className="form-input" value={tempFacultyMember.name} onChange={(e) => setTempFacultyMember({ ...tempFacultyMember, name: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="form-label">Role / Designation</label>
                                                <input type="text" className="form-input" value={tempFacultyMember.role} onChange={(e) => setTempFacultyMember({ ...tempFacultyMember, role: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="form-label">Department</label>
                                                <input type="text" className="form-input" value={tempFacultyMember.department} onChange={(e) => setTempFacultyMember({ ...tempFacultyMember, department: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="form-label">Short Bio</label>
                                                <textarea className="form-input" style={{ height: '80px' }} value={tempFacultyMember.bio} onChange={(e) => setTempFacultyMember({ ...tempFacultyMember, bio: e.target.value })}></textarea>
                                            </div>
                                            <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                                                <button onClick={saveFaculty} className="btn btn-success" style={{ flex: 1 }}>
                                                    <Save size={18} /> Save Member
                                                </button>
                                                <button onClick={() => { setEditingFacultyId(null); setTempFacultyMember(null); }} className="btn" style={{ background: '#f1f5f9', color: '#64748b' }}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                                {(schoolData.faculty || []).map((member) => (
                                    <div key={member.id} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                                            <img src={member.image} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{member.name}</div>
                                            <div style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{member.role}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{member.department}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingFacultyId(member.id); setTempFacultyMember(member); }} className="btn btn-sm btn-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => deleteFaculty(member.id)} className="btn btn-sm btn-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========== FACILITIES TAB ========== */}
                    {activeTab === 'facilities' && (
                        <div className="animate-fade-in">
                            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Manage Facilities</h2>
                                <button onClick={addFacility} className="btn btn-primary">
                                    <PlusCircle size={18} /> Add Facility
                                </button>
                            </div>

                            {editingFacilityId && (
                                <div className="card" style={{ padding: '2rem', marginBottom: '2rem', border: '2px solid var(--color-primary-100)' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
                                        {editingFacilityId === 'new' ? 'New Facility' : 'Edit Facility'}
                                    </h3>
                                    <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {tempFacility?.image ? (
                                                    <img src={tempFacility.image} alt="Facility" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <Camera size={40} color="#94a3b8" />
                                                )}
                                            </div>
                                            <button onClick={() => facilityFileRef.current.click()} className="btn btn-sm" style={{ background: 'var(--color-primary)', color: 'white' }}>
                                                Upload Photo
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <label className="form-label">Facility Name</label>
                                                <input type="text" className="form-input" value={tempFacility.name} onChange={(e) => setTempFacility({ ...tempFacility, name: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="form-label">Category</label>
                                                <input type="text" className="form-input" value={tempFacility.category} onChange={(e) => setTempFacility({ ...tempFacility, category: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="form-label">Description</label>
                                                <textarea className="form-input" style={{ height: '100px' }} value={tempFacility.description} onChange={(e) => setTempFacility({ ...tempFacility, description: e.target.value })}></textarea>
                                            </div>
                                            <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                                                <button onClick={saveFacility} className="btn btn-success" style={{ flex: 1 }}>
                                                    <Save size={18} /> Save Facility
                                                </button>
                                                <button onClick={() => { setEditingFacilityId(null); setTempFacility(null); }} className="btn" style={{ background: '#f1f5f9', color: '#64748b' }}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
                                {(schoolData.facilities || []).map((fac) => (
                                    <div key={fac.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                        <div style={{ height: '160px', width: '100%', position: 'relative' }}>
                                            <img src={fac.image} alt={fac.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                                                <button onClick={() => { setEditingFacilityId(fac.id); setTempFacility(fac); }} className="btn btn-sm btn-icon" style={{ background: 'white', color: '#2563eb', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                    <Edit3 size={14} />
                                                </button>
                                                <button onClick={() => deleteFacility(fac.id)} className="btn btn-sm btn-icon" style={{ background: 'white', color: '#dc2626', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ padding: '1.25rem' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{fac.category}</div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{fac.name}</div>
                                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{fac.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========== BLOG TAB ========== */}
                    {activeTab === 'blog' && (
                        <div className="animate-fade-in">
                            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Manage Blog Posts</h2>
                                <button onClick={addBlog} className="btn btn-primary">
                                    <PlusCircle size={18} /> Add Blog Post
                                </button>
                            </div>

                            {editingBlogId && (
                                <div className="card" style={{ padding: '2rem', marginBottom: '2rem', border: '2px solid var(--color-primary-100)' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
                                        {editingBlogId === 'new' ? 'New Blog Post' : 'Edit Blog Post'}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                                            <div>
                                                <label className="form-label">Title *</label>
                                                <input type="text" className="form-input" value={tempBlog.title} onChange={(e) => setTempBlog({ ...tempBlog, title: e.target.value })} placeholder="Enter blog title" />
                                            </div>
                                            <div>
                                                <label className="form-label">Category</label>
                                                <select className="form-input" value={tempBlog.category} onChange={(e) => setTempBlog({ ...tempBlog, category: e.target.value })}>
                                                    <option value="Events">Events</option>
                                                    <option value="Achievements">Achievements</option>
                                                    <option value="Campus">Campus</option>
                                                    <option value="Education">Education</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
                                            <div>
                                                <label className="form-label">Author</label>
                                                <input type="text" className="form-input" value={tempBlog.author} onChange={(e) => setTempBlog({ ...tempBlog, author: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="form-label">Date</label>
                                                <input type="date" className="form-input" value={tempBlog.date} onChange={(e) => setTempBlog({ ...tempBlog, date: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="form-label">Read Time</label>
                                                <input type="text" className="form-input" value={tempBlog.read_time} onChange={(e) => setTempBlog({ ...tempBlog, read_time: e.target.value })} placeholder="e.g., 5 min read" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="form-label">Excerpt *</label>
                                            <textarea className="form-input" style={{ height: '80px' }} value={tempBlog.excerpt} onChange={(e) => setTempBlog({ ...tempBlog, excerpt: e.target.value })} placeholder="Brief summary of the blog post"></textarea>
                                        </div>
                                        <div>
                                            <label className="form-label">Content *</label>
                                            <textarea className="form-input" style={{ height: '200px' }} value={tempBlog.content} onChange={(e) => setTempBlog({ ...tempBlog, content: e.target.value })} placeholder="Full blog post content"></textarea>
                                        </div>
                                        <div>
                                            <label className="form-label">Cover Image</label>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                {tempBlog?.image && (
                                                    <div style={{ width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                                                        <img src={tempBlog.image} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                )}
                                                <button onClick={() => blogImageRef.current.click()} className="btn btn-sm" style={{ background: 'var(--color-primary)', color: 'white' }}>
                                                    <Camera size={16} /> {tempBlog?.image ? 'Change Image' : 'Upload Image'}
                                                </button>
                                                {tempBlog?.image && (
                                                    <button onClick={() => setTempBlog({ ...tempBlog, image: '' })} className="btn btn-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>
                                                        Remove Image
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                                            <button onClick={saveBlog} className="btn btn-success" style={{ flex: 1 }}>
                                                <Save size={18} /> Save Blog Post
                                            </button>
                                            <button onClick={() => { setEditingBlogId(null); setTempBlog(null); }} className="btn" style={{ background: '#f1f5f9', color: '#64748b' }}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                                {(schoolData.blogs || []).map((blog) => (
                                    <div key={blog.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                        {blog.image && (
                                            <div style={{ height: '180px', width: '100%', position: 'relative' }}>
                                                <img src={blog.image} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        <div style={{ padding: '1.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: blog.category === 'Events' ? '#eff6ff' : blog.category === 'Achievements' ? '#fef3c7' : blog.category === 'Campus' ? '#ecfdf5' : '#f5f3ff', color: blog.category === 'Events' ? '#2563eb' : blog.category === 'Achievements' ? '#d97706' : blog.category === 'Campus' ? '#059669' : '#7c3aed' }}>
                                                    {blog.category}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(blog.date).toLocaleDateString()}</span>
                                            </div>
                                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.4 }}>{blog.title}</h3>
                                            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.6 }}>{blog.excerpt}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                    By {blog.author} • {blog.read_time}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditingBlogId(blog.id); setTempBlog(blog); }} className="btn btn-sm btn-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button onClick={() => deleteBlog(blog.id)} className="btn btn-sm btn-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {(schoolData.blogs || []).length === 0 && !editingBlogId && (
                                <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8' }}>
                                    <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No blog posts yet</p>
                                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Click "Add Blog Post" to create your first post</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== CLASS LISTS TAB ========== */}
                    {activeTab === 'classes' && (
                        <div className="animate-fade-in">
                            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Class Lists</h2>
                                <div className="flex gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                    <select
                                        className="form-input"
                                        style={{ padding: '0.5rem 1rem', minWidth: '180px' }}
                                        value={selectedClassForList}
                                        onChange={(e) => setSelectedClassForList(e.target.value)}
                                    >
                                        {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            {/* --- Classes Section (Restructured) --- */}
                            {/* If viewing class details */}
                            {viewingClass ? (
                                <div className="card animate-fade-in" style={{ padding: '0', overflow: 'hidden' }}>
                                    {/* Class Detail Header */}
                                    <div style={{
                                        background: 'linear-gradient(to right, #f8fafc, #edf2f7)',
                                        borderBottom: '1px solid #e2e8f0',
                                        padding: '1.5rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <button onClick={() => setViewingClass(null)} className="btn" style={{ padding: '0.4rem 0.6rem', color: '#64748b' }}>
                                                <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back
                                            </button>
                                            <div>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{viewingClass}</h3>
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                                                    <span>{SECTIONS.find(s => s.classes.includes(viewingClass))?.name || 'Unassigned'}</span>
                                                    <span>•</span>
                                                    <span>{students.filter(s => s.grade === viewingClass).length} Students</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => { setSelectedClassForList(viewingClass); classImportFileRef.current.click(); }} className="btn btn-secondary">
                                                <Upload size={16} /> Import Excel
                                            </button>
                                            <button onClick={() => { setSelectedClassForList(viewingClass); setTimeout(exportClassRoster, 100); }} className="btn btn-secondary">
                                                <Download size={16} /> Export
                                            </button>
                                            <button onClick={() => { setSelectedClassForList(viewingClass); setAdmissionData(prev => ({ ...prev, applyingFor: viewingClass })); setActiveTab('admissions'); }} className="btn btn-primary">
                                                <PlusCircle size={16} /> Add Student
                                            </button>
                                        </div>
                                    </div>

                                    {/* Gender Tabs */}
                                    <div style={{ padding: '0 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1.5rem' }}>
                                        {['boys', 'girls', 'all'].map(tab => {
                                            const label = tab === 'all' ? 'All Students' : (tab === 'boys' ? 'Boys' : 'Girls');
                                            const count = students.filter(s => s.grade === viewingClass && (tab === 'all' || s.admissions?.[0]?.gender === (tab === 'boys' ? 'Male' : 'Female'))).length;
                                            return (
                                                <button
                                                    key={tab}
                                                    onClick={() => setClassDetailTab(tab)}
                                                    style={{
                                                        padding: '1rem 0',
                                                        borderBottom: classDetailTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                                                        color: classDetailTab === tab ? 'var(--color-primary)' : '#64748b',
                                                        fontWeight: 600,
                                                        background: 'none',
                                                        border: 'nones',
                                                        borderBottomStyle: 'solid',
                                                        borderBottomWidth: classDetailTab === tab ? '2px' : '0',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {label} <span style={{ background: '#e2e8f0', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.7rem', color: '#475569', marginLeft: '0.2rem' }}>{count}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Student List */}
                                    <div style={{ padding: '1.5rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                                    <th style={{ padding: '0.75rem' }}>ID</th>
                                                    <th style={{ padding: '0.75rem' }}>Name</th>
                                                    <th style={{ padding: '0.75rem' }}>Father Name</th>
                                                    <th style={{ padding: '0.75rem' }}>Gender</th>
                                                    <th style={{ padding: '0.75rem' }}>Contact</th>
                                                    <th style={{ padding: '0.75rem' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students
                                                    .filter(s => s.grade === viewingClass && (classDetailTab === 'all' || s.admissions?.[0]?.gender === (classDetailTab === 'boys' ? 'Male' : 'Female')))
                                                    .map(student => (
                                                        <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{student.id}</td>
                                                            <td style={{ padding: '0.75rem' }}>
                                                                <div style={{ fontWeight: 600 }}>{student.name}</div>
                                                            </td>
                                                            <td style={{ padding: '0.75rem', color: '#64748b' }}>{student.admissions?.[0]?.fatherName || '—'}</td>
                                                            <td style={{ padding: '0.75rem' }}>
                                                                <span style={{
                                                                    padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                                                                    background: student.admissions?.[0]?.gender === 'Male' ? '#e0f2fe' : '#fce7f3',
                                                                    color: student.admissions?.[0]?.gender === 'Male' ? '#0369a1' : '#be185d'
                                                                }}>
                                                                    {student.admissions?.[0]?.gender || '—'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '0.75rem', color: '#64748b' }}>{student.admissions?.[0]?.contact || '—'}</td>
                                                            <td style={{ padding: '0.75rem' }}>
                                                                <button onClick={() => {
                                                                    if (window.confirm(`Delete ${student.name}? This cannot be undone.`)) {
                                                                        const newStudents = students.filter(s => s.id !== student.id);
                                                                        setStudents(newStudents);
                                                                    }
                                                                }} className="btn icon-btn" style={{ color: '#ef4444' }} title="Delete Student">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                        {students.filter(s => s.grade === viewingClass).length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                                <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                                <p>No students found in this list.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // SECTIONS & CLASSES OVERVIEW
                                <div className="animate-fade-in">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Class Management</h3>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                placeholder="New Section Name"
                                                className="form-input"
                                                value={newSectionName}
                                                onChange={e => setNewSectionName(e.target.value)}
                                                style={{ width: '200px' }}
                                            />
                                            <button onClick={async () => {
                                                if (!newSectionName.trim()) return;
                                                const id = `sec_${Date.now()}`;
                                                const newSec = { id, name: newSectionName.trim(), classes: [] };
                                                const currentSections = Array.isArray(SECTIONS) ? SECTIONS : [];
                                                const updated = [...currentSections, newSec];

                                                try {
                                                    const { error } = await updateSections(updated);
                                                    if (error) {
                                                        alert("Failed to add section: " + error.message);
                                                    } else {
                                                        setNewSectionName('');
                                                        // Explicitly select the new section 
                                                        setSelectedSectionId(id);
                                                        showSaveMessage(`Section "${newSec.name}" added!`);
                                                    }
                                                } catch (err) {
                                                    alert("An unexpected error occurred: " + err.message);
                                                }
                                            }} className="btn btn-primary">
                                                <PlusCircle size={16} /> Add Section
                                            </button>
                                        </div>
                                    </div>

                                    {/* Section Tabs */}
                                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                                        {(SECTIONS || []).map(sec => (
                                            <button
                                                key={sec.id}
                                                onClick={() => setSelectedSectionId(sec.id)}
                                                style={{
                                                    padding: '0.6rem 1.2rem',
                                                    borderRadius: '8px',
                                                    fontWeight: 600,
                                                    background: selectedSectionId === sec.id ? 'var(--color-primary)' : 'white',
                                                    color: selectedSectionId === sec.id ? 'white' : '#64748b',
                                                    border: '1px solid',
                                                    borderColor: selectedSectionId === sec.id ? 'var(--color-primary)' : '#e2e8f0',
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {sec.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Selected Section Content */}
                                    {selectedSectionId && (() => {
                                        const currentSection = (SECTIONS || []).find(s => s.id === selectedSectionId);
                                        if (!currentSection) return <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Select a section to manage classes.</div>;

                                        return (
                                            <div className="card">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{currentSection.name} Classes</h4>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="New Class Name"
                                                            className="form-input"
                                                            value={newClassName}
                                                            onChange={e => setNewClassName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && newClassName.trim()) {
                                                                    const trimmed = newClassName.trim();
                                                                    if (currentSection.classes.includes(trimmed)) { alert('Class already exists in this section!'); return; }
                                                                    // Update Section
                                                                    const updatedSections = SECTIONS.map(s => s.id === selectedSectionId ? { ...s, classes: [...s.classes, trimmed] } : s);
                                                                    updateSections(updatedSections);
                                                                    // Update Global Classes List
                                                                    if (!CLASSES.includes(trimmed)) updateClasses([...CLASSES, trimmed]);
                                                                    setNewClassName('');
                                                                    showSaveMessage(`Class "${trimmed}" added to ${currentSection.name}!`);
                                                                }
                                                            }}
                                                            style={{ width: '200px' }}
                                                        />
                                                        <button onClick={() => {
                                                            const trimmed = newClassName.trim();
                                                            if (!trimmed) return;
                                                            if (currentSection.classes.includes(trimmed)) { alert('Class already exists in this section!'); return; }
                                                            const updatedSections = SECTIONS.map(s => s.id === selectedSectionId ? { ...s, classes: [...s.classes, trimmed] } : s);
                                                            updateSections(updatedSections);
                                                            if (!CLASSES.includes(trimmed)) updateClasses([...CLASSES, trimmed]);
                                                            setNewClassName('');
                                                            showSaveMessage(`Class "${trimmed}" added!`);
                                                        }} className="btn btn-primary">
                                                            <PlusCircle size={16} /> Add Class
                                                        </button>
                                                        <button onClick={() => {
                                                            if (window.confirm(`Delete Section "${currentSection.name}"? This will NOT delete the classes globally, just grouping.`)) {
                                                                const updated = SECTIONS.filter(s => s.id !== selectedSectionId);
                                                                updateSections(updated);
                                                                setSelectedSectionId(updated[0]?.id || null);
                                                            }
                                                        }} className="btn" style={{ color: '#ef4444', borderColor: '#ef4444', background: 'white' }}>
                                                            <Trash2 size={16} /> Delete Section
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                                    {currentSection.classes.map(cls => {
                                                        const count = students.filter(s => s.grade === cls).length;
                                                        return (
                                                            <div key={cls} onClick={() => setViewingClass(cls)} style={{
                                                                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem',
                                                                cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                                                            }}
                                                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                                                                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                                            >
                                                                <h5 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>{cls}</h5>
                                                                <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                    <Users size={14} /> {count} Students
                                                                </div>
                                                                <button onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm(`Remove "${cls}" from this section?`)) {
                                                                        const updatedSections = SECTIONS.map(s => s.id === selectedSectionId ? { ...s, classes: s.classes.filter(c => c !== cls) } : s);
                                                                        updateSections(updatedSections);
                                                                    }
                                                                }} style={{
                                                                    position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6
                                                                }} title="Remove from section">
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    {currentSection.classes.length === 0 && (
                                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                                                            No classes in this section yet. Add one above!
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* Hidden Input for Student Import */}
                <input
                    type="file"
                    ref={classImportFileRef}
                    style={{ display: 'none' }}
                    accept=".xlsx, .xls"
                    onChange={importStudentsExcel}
                />
            </section>
        </div>
    );
};

export default AdminPortal;
