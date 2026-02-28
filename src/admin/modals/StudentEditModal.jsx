import React, { useRef } from 'react';
import { Save, User, Users, Award, Camera } from 'lucide-react';

/**
 * StudentEditModal
 * Full-screen overlay modal for editing all student details.
 * Mirrors the Admission Form layout with sections for photo,
 * student info, health & medical, and parent info.
 */
const StudentEditModal = ({
    editStudentData,
    setEditStudentData,
    editingStudentId,
    setEditingStudentId,
    students,
    setStudents,
    showSaveMessage,
    handleStudentPhotoUpload,
    sectionClasses,
}) => {
    const photoRef = useRef(null);

    if (!editingStudentId || !editStudentData) return null;

    const adm = (prev, key, val) => ({
        ...prev,
        admissions: [{ ...(prev.admissions?.[0] || {}), [key]: val }]
    });

    const onClose = () => {
        setEditingStudentId(null);
        setEditStudentData(null);
    };

    // Wrap handleStudentPhotoUpload to use internal ref
    const handlePhotoChange = (e) => {
        handleStudentPhotoUpload(e, setEditStudentData);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            overflowY: 'auto', padding: '2rem 1rem'
        }}>
            <div style={{
                background: 'white', borderRadius: '16px',
                width: '100%', maxWidth: '860px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
                overflow: 'hidden', marginBottom: '2rem'
            }}>
                {/* ── Header ── */}
                <div style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: 'white', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.3rem' }}>✏️ Edit Student</h2>
                        <p style={{ margin: '0.25rem 0 0', opacity: 0.8, fontSize: '0.85rem' }}>
                            {editStudentData.id} — {editStudentData.grade}
                        </p>
                    </div>
                    <button onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}>
                        ✕
                    </button>
                </div>

                <div style={{ padding: '2rem' }}>

                    {/* ── Photo + Class ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '120px', height: '140px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {(editStudentData.photo || editStudentData.image)
                                    ? <img src={editStudentData.photo || editStudentData.image} alt={editStudentData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <Camera size={32} color="#94a3b8" />}
                            </div>
                            <button onClick={() => photoRef.current?.click()}
                                className="btn btn-sm" style={{ background: 'var(--color-primary)', color: 'white', fontSize: '0.8rem' }}>
                                <Camera size={13} /> Upload Photo
                            </button>
                            {(editStudentData.photo || editStudentData.image) && (
                                <button onClick={() => setEditStudentData(p => ({ ...p, photo: '', image: '' }))}
                                    style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.78rem', cursor: 'pointer' }}>
                                    Remove photo
                                </button>
                            )}
                            <input type="file" ref={photoRef} accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="form-label">Applying For (Class)</label>
                                <select className="form-input" value={editStudentData.grade || ''}
                                    onChange={e => setEditStudentData(p => ({ ...p, grade: e.target.value }))}>
                                    {sectionClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Serial Number (Optional)</label>
                                <input className="form-input" placeholder="Unique serial number"
                                    value={editStudentData.serial_number || ''}
                                    onChange={e => setEditStudentData(p => ({ ...p, serial_number: e.target.value }))} />
                            </div>
                        </div>
                    </div>

                    {/* ── Student Info ── */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} /> Student's Information
                        </h3>
                        <div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
                            <div>
                                <label className="form-label">Student's Name (Capital Letters)</label>
                                <input className="form-input" value={editStudentData.name || ''}
                                    onChange={e => setEditStudentData(p => ({ ...p, name: e.target.value.toUpperCase() }))} />
                            </div>
                            <div>
                                <label className="form-label">B-Form Number</label>
                                <input className="form-input" placeholder="35202-0000000-0"
                                    value={editStudentData.admissions?.[0]?.bForm || ''}
                                    onChange={e => setEditStudentData(p => adm(p, 'bForm', e.target.value))} />
                            </div>
                            <div>
                                <label className="form-label">Date of Birth</label>
                                <input type="date" className="form-input"
                                    value={editStudentData.admissions?.[0]?.dob || ''}
                                    onChange={e => setEditStudentData(p => adm(p, 'dob', e.target.value))} />
                            </div>
                            <div>
                                <label className="form-label">Nationality</label>
                                <input className="form-input" placeholder="e.g. Pakistani"
                                    value={editStudentData.admissions?.[0]?.nationality || ''}
                                    onChange={e => setEditStudentData(p => adm(p, 'nationality', e.target.value))} />
                            </div>
                            <div>
                                <label className="form-label">Gender</label>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.35rem' }}>
                                    {['Male', 'Female', 'Others'].map(g => (
                                        <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input type="radio" name="edit_gender"
                                                checked={editStudentData.admissions?.[0]?.gender === g}
                                                onChange={() => setEditStudentData(p => adm(p, 'gender', g))} /> {g}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Religion</label>
                                <input className="form-input" placeholder="e.g. Islam"
                                    value={editStudentData.admissions?.[0]?.religion || ''}
                                    onChange={e => setEditStudentData(p => adm(p, 'religion', e.target.value))} />
                            </div>
                        </div>
                    </div>

                    {/* ── Health & Medical ── */}
                    <div style={{ marginBottom: '2rem', background: '#f8fafc', borderRadius: '10px', padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Award size={16} /> Health & Medical
                        </h3>
                        <div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
                            <div>
                                <label className="form-label">Any Allergies?</label>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.35rem' }}>
                                    {['Yes', 'No'].map(o => (
                                        <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input type="radio" name="edit_allergy"
                                                checked={(editStudentData.admissions?.[0]?.allergies || 'No') === o}
                                                onChange={() => setEditStudentData(p => adm(p, 'allergies', o))} /> {o}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Allergy Details</label>
                                <input className="form-input"
                                    value={editStudentData.admissions?.[0]?.allergiesDetails || ''}
                                    onChange={e => setEditStudentData(p => adm(p, 'allergiesDetails', e.target.value))} />
                            </div>
                            <div>
                                <label className="form-label">Chronic Medical Condition?</label>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.35rem' }}>
                                    {['Yes', 'No'].map(o => (
                                        <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input type="radio" name="edit_chronic"
                                                checked={(editStudentData.admissions?.[0]?.chronicCondition || 'No') === o}
                                                onChange={() => setEditStudentData(p => adm(p, 'chronicCondition', o))} /> {o}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Condition Details</label>
                                <input className="form-input"
                                    value={editStudentData.admissions?.[0]?.chronicConditionDetails || ''}
                                    onChange={e => setEditStudentData(p => adm(p, 'chronicConditionDetails', e.target.value))} />
                            </div>
                        </div>
                    </div>

                    {/* ── Parent Info ── */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={16} /> Parent's Information
                        </h3>
                        <div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
                            <div className="col-span-2">
                                <label className="form-label">Father's Name (Capital Letters)</label>
                                <input className="form-input"
                                    value={editStudentData.admissions?.[0]?.fatherName || ''}
                                    onChange={e => setEditStudentData(p => adm(p, 'fatherName', e.target.value.toUpperCase()))} />
                            </div>
                            <div>
                                <label className="form-label">Father's CNIC</label>
                                <input className="form-input" placeholder="35202-0000000-0"
                                    value={editStudentData.admissions?.[0]?.fatherCnic || ''}
                                    onChange={e => setEditStudentData(p => adm(p, 'fatherCnic', e.target.value))} />
                            </div>
                            <div>
                                <label className="form-label">Contact Number</label>
                                <input className="form-input"
                                    value={editStudentData.admissions?.[0]?.contact || ''}
                                    onChange={e => setEditStudentData(p => adm(p, 'contact', e.target.value))} />
                            </div>
                            <div>
                                <label className="form-label">WhatsApp Number</label>
                                <input className="form-input"
                                    value={editStudentData.admissions?.[0]?.whatsapp || ''}
                                    onChange={e => setEditStudentData(p => adm(p, 'whatsapp', e.target.value))} />
                            </div>
                            <div className="col-span-2">
                                <label className="form-label">Home Address</label>
                                <textarea className="form-input" style={{ height: '80px' }}
                                    value={editStudentData.admissions?.[0]?.address || ''}
                                    onChange={e => setEditStudentData(p => adm(p, 'address', e.target.value))} />
                            </div>
                        </div>
                    </div>

                    {/* ── Actions ── */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                        <button onClick={onClose}
                            className="btn" style={{ background: '#f1f5f9', color: '#64748b', padding: '0.6rem 1.5rem' }}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" style={{ padding: '0.6rem 2rem', fontWeight: 700 }}
                            onClick={async () => {
                                const updated = students.map(s => s.id === editingStudentId ? editStudentData : s);
                                await setStudents(updated);
                                showSaveMessage(`✅ ${editStudentData.name} updated successfully!`);
                                onClose();
                            }}>
                            <Save size={16} /> Update Student
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentEditModal;
