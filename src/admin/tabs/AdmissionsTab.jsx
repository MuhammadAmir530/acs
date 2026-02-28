import React from 'react';
import { Save, Trash2, Camera, User, Users, Award, CheckCircle } from 'lucide-react';

const AdmissionsTab = ({
    admissionData, setAdmissionData, admissionInitialState,
    printAdmissionForm, handleAdmissionPhotoUpload, photoFileRef,
    sectionClasses,
}) => {
    const update = (key, value) => setAdmissionData(prev => ({ ...prev, [key]: value }));

    return (
        <div className="animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)' }}>Admission Form</h2>
                <div className="flex gap-2">
                    <button onClick={() => setAdmissionData(admissionInitialState)} className="btn" style={{ background: 'white', border: '1px solid var(--color-gray-300)', color: 'var(--color-gray-600)' }}>
                        <Trash2 size={16} /> Reset Form
                    </button>
                    <button onClick={printAdmissionForm} className="btn btn-primary" style={{ background: '#4d7c0f', borderColor: '#4d7c0f' }}>
                        <Save size={18} /> Save &amp; Print Form
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                {/* Top Meta */}
                <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-gray-100)', paddingBottom: '1.5rem' }}>
                    <div>
                        <label className="form-label">Applying For (class)</label>
                        <select className="form-input" value={admissionData.applyingFor} onChange={e => update('applyingFor', e.target.value)}>
                            {sectionClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Application Date</label>
                        <input type="date" className="form-input" value={admissionData.applicationDate} onChange={e => update('applicationDate', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                        <label className="form-label">Serial Number (Optional)</label>
                        <input type="text" className="form-input" placeholder="Enter manual serial number (must be unique)" value={admissionData.serialNumber} onChange={e => update('serialNumber', e.target.value)} />
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
                            <input type="text" className="form-input" placeholder="Enter full name" value={admissionData.studentName} onChange={e => update('studentName', e.target.value.toUpperCase())} />
                        </div>
                        <div>
                            <label className="form-label">B-Form Number</label>
                            <input type="text" className="form-input" placeholder="35202-0000000-0" value={admissionData.bForm} onChange={e => update('bForm', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">Date of Birth</label>
                            <input type="date" className="form-input" value={admissionData.dob} onChange={e => update('dob', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">Nationality</label>
                            <input type="text" className="form-input" placeholder="e.g. Pakistani" value={admissionData.nationality} onChange={e => update('nationality', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">Gender</label>
                            <div className="flex gap-4">
                                {['Male', 'Female', 'Others'].map(g => (
                                    <label key={g} className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                                        <input type="radio" name="gender" checked={admissionData.gender === g} onChange={() => update('gender', g)} /> {g}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="form-label">Religion</label>
                            <input type="text" className="form-input" placeholder="e.g. Islam" value={admissionData.religion} onChange={e => update('religion', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">Student Photograph</label>
                            <div className="flex gap-4" style={{ alignItems: 'center' }}>
                                <div style={{ width: '60px', height: '80px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                        <Award size={18} /> Health &amp; Medical Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {[
                            { key: 'allergies', label: 'Any Allergies?' },
                            { key: 'chronicCondition', label: 'Chronic Medical Condition?' },
                            { key: 'medication', label: 'Take Regular Medication?' },
                        ].map(({ key, label }) => (
                            <div className="grid grid-cols-2" style={{ gap: '2rem' }} key={key}>
                                <div>
                                    <label className="form-label">{label}</label>
                                    <div className="flex gap-4">
                                        {['Yes', 'No'].map(o => (
                                            <label key={o} className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                                                <input type="radio" checked={admissionData[key] === o} onChange={() => update(key, o)} /> {o}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">Details (If any)</label>
                                    <input type="text" className="form-input" value={admissionData[`${key}Details`] || ''} onChange={e => update(`${key}Details`, e.target.value)} />
                                </div>
                            </div>
                        ))}
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
                            <input type="text" className="form-input" value={admissionData.fatherName} onChange={e => update('fatherName', e.target.value.toUpperCase())} />
                        </div>
                        <div>
                            <label className="form-label">CNIC Number</label>
                            <input type="text" className="form-input" placeholder="35202-0000000-0" value={admissionData.fatherCnic} onChange={e => update('fatherCnic', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">Contact Number</label>
                            <input type="text" className="form-input" value={admissionData.contact} onChange={e => update('contact', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">WhatsApp Number</label>
                            <input type="text" className="form-input" value={admissionData.whatsapp} onChange={e => update('whatsapp', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                            <label className="form-label">Home Address</label>
                            <textarea className="form-input" style={{ height: '80px' }} value={admissionData.address} onChange={e => update('address', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Documents Required */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={18} /> Documents Required
                    </h3>
                    <div className="flex flex-col gap-3">
                        {[
                            { key: 'photos', label: '4 Passport size photographs' },
                            { key: 'bform', label: 'A Copy of B-Form' },
                            { key: 'cnic', label: 'A Copy of CNIC of Parents/Guardian' },
                        ].map(({ key, label }) => (
                            <label key={key} className="flex gap-2" style={{ alignItems: 'center', cursor: 'pointer' }}>
                                <input type="checkbox" checked={admissionData.docs[key]} onChange={e => update('docs', { ...admissionData.docs, [key]: e.target.checked })} /> {label}
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdmissionsTab;
