import React from 'react';
import { Search, Download } from 'lucide-react';

const ReportsTab = ({ students, reportSearch, setReportSearch, downloadStudentReport }) => (
    <div className="animate-fade-in">
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'var(--font-weight-bold)', marginBottom: '1.5rem' }}>Student Reports</h2>
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
            <div className="card" style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label" style={{ textAlign: 'left' }}>Search Student</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }} />
                        <input type="text" placeholder="Enter Name or ID..." className="form-input"
                            style={{ paddingLeft: '3rem' }} value={reportSearch} onChange={e => setReportSearch(e.target.value)} />
                    </div>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', textAlign: 'left' }}>
                    {students.filter(s =>
                        s.name.toLowerCase().includes(reportSearch.toLowerCase()) ||
                        s.id.toLowerCase().includes(reportSearch.toLowerCase())
                    ).map(s => (
                        <div key={s.id} className="flex-between" style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-gray-100)' }}>
                            <div>
                                <div style={{ fontWeight: '600' }}>{s.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>{s.id}</div>
                            </div>
                            <button onClick={() => downloadStudentReport(s.id)} className="btn btn-sm btn-primary">
                                <Download size={14} /> Download
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default ReportsTab;
