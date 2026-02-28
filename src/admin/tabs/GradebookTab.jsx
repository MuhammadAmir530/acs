import React from 'react';
import { Save, Download, Upload, Users, PlusCircle, X } from 'lucide-react';
import { calcGrade, gradeColor, calcOverallPct, getTermResults, filterByGender } from '../utils/gradeUtils';

const GradebookTab = ({
    students, selectedClass, setSelectedClass, sectionClasses,
    TERMS, SUBJECTS, WEIGHTS,
    gbTerm, setGbTerm, gbGenderTab, setGbGenderTab,
    gbEdits, setGbEdits, gbSaving, showGbStats, setShowGbStats,
    showGbSettings, setShowGbSettings,
    newSubjectInput, setNewSubjectInput, newTermInput, setNewTermInput,
    updateClassSubjects, updateTerms, updateWeights,
    saveGradebook, downloadGradebookTemplate, exportGradebookExcel,
    archiveTerm, exportResultPDF, importGradebookExcel,
    gbImportFileRef, getCellValue, handleCellEdit, saveRemarks,
}) => {
    const classSubjects = (SUBJECTS && !Array.isArray(SUBJECTS) ? (SUBJECTS[selectedClass] || []) : []);
    const getSubjectTotal = (sub) => (WEIGHTS && WEIGHTS[sub]) ? WEIGHTS[sub] : 100;

    const allClassStudents = students.filter(s => s.grade === selectedClass);
    const classStudents = filterByGender(allClassStudents, gbGenderTab)
        .slice().sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    const termLabel = gbTerm || TERMS[0] || 'Current';

    const subjectStats = classSubjects.map(sub => {
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
            return sum + calcOverallPct(res, getSubjectTotal);
        }, 0) / classStudents.length
    ) : 0;

    const passCount = classStudents.filter(s => {
        const res = getTermResults(s, termLabel);
        return calcOverallPct(res, getSubjectTotal) >= 40;
    }).length;

    const boysCount = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Male').length;
    const girlsCount = allClassStudents.filter(s => s.admissions?.[0]?.gender === 'Female').length;

    return (
        <div className="animate-fade-in">
            <input type="file" ref={gbImportFileRef} onChange={importGradebookExcel} accept=".xlsx,.xls" style={{ display: 'none' }} />

            {/* Header Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>📊 Gradebook</h2>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Spreadsheet-style marks entry — separated by term and gender</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select className="form-input" style={{ padding: '0.4rem 0.75rem' }} value={selectedClass}
                        onChange={e => { setSelectedClass(e.target.value); setGbEdits({}); }}>
                        {sectionClasses.map(c => <option key={c}>{c}</option>)}
                    </select>
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
                    <button onClick={() => setShowGbSettings(s => !s)} className="btn" style={{ padding: '0.45rem 0.9rem' }}>⚙️ Settings</button>
                    <button onClick={exportResultPDF} className="btn" style={{ background: '#dc2626', color: 'white', borderColor: '#dc2626', padding: '0.45rem 0.9rem' }}>📄 PDF Report</button>
                </div>
            </div>

            {/* Settings Panel */}
            {showGbSettings && (
                <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>⚙️ Gradebook Settings</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {/* Subjects */}
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                Subjects <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 400 }}>— for "{selectedClass}" only</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                                <input className="form-input" placeholder="Add subject…" value={newSubjectInput}
                                    onChange={e => setNewSubjectInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && newSubjectInput.trim()) { updateClassSubjects([...classSubjects, newSubjectInput.trim()]); setNewSubjectInput(''); } }}
                                    style={{ flex: 1, padding: '0.35rem 0.6rem' }} />
                                <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem' }}
                                    onClick={() => { if (newSubjectInput.trim()) { updateClassSubjects([...classSubjects, newSubjectInput.trim()]); setNewSubjectInput(''); } }}>
                                    <PlusCircle size={14} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {classSubjects.map(s => (
                                    <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '999px', padding: '0.2rem 0.7rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                        {s}
                                        <button onClick={() => updateClassSubjects(classSubjects.filter(x => x !== s))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0369a1', display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                                    </span>
                                ))}
                                {classSubjects.length === 0 && <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No subjects yet. Add one above.</span>}
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
                    {/* Subject Totals */}
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>📝 Subject Total Marks</div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', borderRadius: '999px', padding: '0.15rem 0.6rem' }}>
                                Grand Total: {classSubjects.reduce((s, sub) => s + getSubjectTotal(sub), 0)} marks
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.5rem' }}>
                            {classSubjects.map(sub => (
                                <div key={sub} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 0.6rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>
                                    <input type="number" min="1" max="9999" value={WEIGHTS[sub] || ''} placeholder="100"
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
                </div>
            )}

            {/* Gender Tabs */}
            <div style={{ display: 'flex', marginBottom: '1.25rem', borderRadius: '12px 12px 0 0', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {[
                    { id: 'boys', label: '👦 Boys', count: boysCount, color: '#0369a1', bg: '#e0f2fe' },
                    { id: 'girls', label: '👧 Girls', count: girlsCount, color: '#be185d', bg: '#fce7f3' },
                    { id: 'all', label: '👥 All Students', count: allClassStudents.length, color: '#475569', bg: '#f1f5f9' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setGbGenderTab(tab.id)} style={{
                        flex: 1, padding: '0.85rem 1rem', fontWeight: gbGenderTab === tab.id ? 800 : 600, fontSize: '0.9rem',
                        color: gbGenderTab === tab.id ? tab.color : '#94a3b8',
                        background: gbGenderTab === tab.id ? tab.bg : 'transparent', border: 'none',
                        borderBottom: gbGenderTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
                        cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                    }}>
                        {tab.label}
                        <span style={{ background: gbGenderTab === tab.id ? tab.color : '#cbd5e1', color: 'white', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.72rem', fontWeight: 700 }}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Class Statistics */}
            <div style={{ marginBottom: '1.25rem' }}>
                <button onClick={() => setShowGbStats(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    📈 Class Statistics {showGbStats ? '▲' : '▼'}
                </button>
                {showGbStats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
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

            {/* Gradebook Table */}
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
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${300 + classSubjects.length * 110}px` }}>
                            <thead>
                                <tr style={{ background: '#1e293b', color: 'white' }}>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, fontSize: '0.82rem', position: 'sticky', left: 0, background: '#1e293b', zIndex: 2, minWidth: '180px' }}>Student</th>
                                    {classSubjects.map(sub => (
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
                                    const subResults = classSubjects.map(sub => {
                                        const val = getCellValue(student, sub);
                                        return val !== '' ? { subject: sub, obtained: Number(val), percentage: Math.round((Number(val) / getSubjectTotal(sub)) * 100) } : null;
                                    }).filter(Boolean);
                                    const rowAvg = subResults.length ? calcOverallPct(subResults, getSubjectTotal) : null;
                                    const rowGrade = rowAvg !== null ? calcGrade(rowAvg) : '—';
                                    const rowGc = rowAvg !== null ? gradeColor(rowAvg) : { bg: '#f8fafc', text: '#94a3b8' };
                                    const existingRemark = (student.results || [])[0]?.remarks || '';
                                    return (
                                        <tr key={student.id} style={{ borderTop: '1px solid #f1f5f9', background: rowIdx % 2 === 0 ? 'white' : '#fafafa' }}>
                                            <td style={{ padding: '0.6rem 1rem', position: 'sticky', left: 0, background: rowIdx % 2 === 0 ? 'white' : '#fafafa', zIndex: 1, borderRight: '1px solid #e2e8f0' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>{student.name}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{student.id}</div>
                                            </td>
                                            {classSubjects.map(sub => {
                                                const subTotal = getSubjectTotal(sub);
                                                const val = getCellValue(student, sub);
                                                const pct = val !== '' ? Math.round((Number(val) / subTotal) * 100) : null;
                                                const gc = pct !== null ? gradeColor(pct) : { bg: 'transparent', text: '#94a3b8' };
                                                const isDirty = gbEdits[student.id]?.[sub] !== undefined;
                                                return (
                                                    <td key={sub} style={{ padding: '0.4rem 0.3rem', textAlign: 'center' }}>
                                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                                            <input type="number" min="0" max={subTotal} value={val}
                                                                onChange={e => handleCellEdit(student.id, sub, e.target.value)}
                                                                style={{ width: '70px', padding: '0.35rem 0.4rem', textAlign: 'center', borderRadius: '6px', border: isDirty ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: gc.bg, color: gc.text, fontWeight: 700, fontSize: '0.88rem', outline: 'none' }} />
                                                            {pct !== null && (
                                                                <div style={{ fontSize: '0.65rem', color: gc.text, fontWeight: 600, marginTop: '1px' }}>{pct}% · {calcGrade(pct)}</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', background: rowGc.bg }}>
                                                <div style={{ fontWeight: 800, fontSize: '1rem', color: rowGc.text }}>{rowAvg !== null ? `${rowAvg}%` : '—'}</div>
                                            </td>
                                            <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', background: rowGc.bg }}>
                                                <span style={{ display: 'inline-block', background: rowGc.text, color: 'white', borderRadius: '6px', padding: '0.2rem 0.5rem', fontWeight: 800, fontSize: '0.85rem' }}>{rowGrade}</span>
                                            </td>
                                            <td style={{ padding: '0.4rem 0.5rem' }}>
                                                <input type="text" defaultValue={existingRemark} placeholder="Teacher remarks…"
                                                    onBlur={e => saveRemarks(student.id, classSubjects[0], e.target.value)}
                                                    style={{ width: '100%', padding: '0.3rem 0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.78rem', color: '#475569' }} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
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
};

export default GradebookTab;
