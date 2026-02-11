import React, { useState } from 'react';
import {
    Settings, Edit3, Save, LogOut, BookOpen,
    Users, Building, Info
} from 'lucide-react';

const AdminPanel = ({ setIsAdmin, setCurrentPage }) => {
    const [activeSection, setActiveSection] = useState('info');
    const [isEditing, setIsEditing] = useState(false);

    const handleLogout = () => {
        setIsAdmin(false);
        setCurrentPage('home');
    };

    return (
        <div style={{ background: 'var(--color-gray-50)', minHeight: 'calc(100vh - 80px)' }}>
            {/* Header */}
            <section style={{
                background: 'var(--gradient-primary)',
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
                                Admin Dashboard
                            </h1>
                            <p style={{ opacity: 0.95 }}>Manage website content and settings</p>
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

            <section className="section">
                <div className="container">
                    <div className="grid grid-cols-4" style={{ gap: '2rem', alignItems: 'start' }}>
                        {/* Sidebar */}
                        <div>
                            <div className="card" style={{ position: 'sticky', top: '100px' }}>
                                <h3 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: 'var(--font-weight-bold)',
                                    marginBottom: '1rem',
                                    color: 'var(--color-gray-900)'
                                }}>
                                    Sections
                                </h3>

                                <div className="flex-col gap-1">
                                    {[
                                        { id: 'info', label: 'School Info', icon: Info },
                                        { id: 'faculty', label: 'Faculty', icon: Users },
                                        { id: 'facilities', label: 'Facilities', icon: Building },
                                        { id: 'content', label: 'Content', icon: BookOpen }
                                    ].map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className="flex gap-2"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                textAlign: 'left',
                                                fontWeight: 'var(--font-weight-medium)',
                                                color: activeSection === section.id ? 'var(--color-primary)' : 'var(--color-gray-700)',
                                                background: activeSection === section.id ? 'var(--color-gray-50)' : 'transparent',
                                                borderRadius: 'var(--radius-md)',
                                                border: activeSection === section.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                                transition: 'all var(--transition-base)',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <section.icon size={18} />
                                            {section.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div style={{ gridColumn: 'span 3' }}>
                            <div className="card">
                                <div className="flex-between" style={{ marginBottom: '2rem' }}>
                                    <h2 style={{
                                        fontSize: '1.75rem',
                                        fontWeight: 'var(--font-weight-bold)',
                                        color: 'var(--color-gray-900)'
                                    }}>
                                        {activeSection === 'info' && 'School Information'}
                                        {activeSection === 'faculty' && 'Manage Faculty'}
                                        {activeSection === 'facilities' && 'Manage Facilities'}
                                        {activeSection === 'content' && 'Website Content'}
                                    </h2>

                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="btn btn-primary"
                                        >
                                            <Edit3 size={18} />
                                            Edit
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="btn btn-primary"
                                        >
                                            <Save size={18} />
                                            Save Changes
                                        </button>
                                    )}
                                </div>

                                {/* School Info Section */}
                                {activeSection === 'info' && (
                                    <div className="flex-col gap-3 animate-fade-in">
                                        <div>
                                            <label className="form-label">School Name</label>
                                            <input
                                                type="text"
                                                defaultValue="ACS Higher Secondary School"
                                                className="form-input"
                                                disabled={!isEditing}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label">Tagline</label>
                                            <input
                                                type="text"
                                                defaultValue="Ready to Lead. Ready to Inspire."
                                                className="form-input"
                                                disabled={!isEditing}
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label">Description</label>
                                            <textarea
                                                defaultValue="A world-class education that empowers students to reach their full potential."
                                                className="form-input form-textarea"
                                                disabled={!isEditing}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                                            <div>
                                                <label className="form-label">Phone</label>
                                                <input
                                                    type="tel"
                                                    defaultValue="0300 1333275"
                                                    className="form-input"
                                                    disabled={!isEditing}
                                                />
                                            </div>

                                            <div>
                                                <label className="form-label">Email</label>
                                                <input
                                                    type="email"
                                                    defaultValue="Infoacspainsra@gmail.com"
                                                    className="form-input"
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="form-label">Address</label>
                                            <input
                                                type="text"
                                                defaultValue="ACS Higher Secondary School, Jhang Road Painsra, Pakistan"
                                                className="form-input"
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Faculty Section */}
                                {activeSection === 'faculty' && (
                                    <div className="animate-fade-in">
                                        <div style={{
                                            padding: '2rem',
                                            textAlign: 'center',
                                            color: 'var(--color-gray-600)'
                                        }}>
                                            <Users size={48} style={{
                                                color: 'var(--color-gray-400)',
                                                margin: '0 auto 1rem'
                                            }} />
                                            <p>Faculty management interface</p>
                                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                                Add, edit, or remove faculty members
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Facilities Section */}
                                {activeSection === 'facilities' && (
                                    <div className="animate-fade-in">
                                        <div style={{
                                            padding: '2rem',
                                            textAlign: 'center',
                                            color: 'var(--color-gray-600)'
                                        }}>
                                            <Building size={48} style={{
                                                color: 'var(--color-gray-400)',
                                                margin: '0 auto 1rem'
                                            }} />
                                            <p>Facilities management interface</p>
                                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                                Update facility information and images
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Content Section */}
                                {activeSection === 'content' && (
                                    <div className="animate-fade-in">
                                        <div style={{
                                            padding: '2rem',
                                            textAlign: 'center',
                                            color: 'var(--color-gray-600)'
                                        }}>
                                            <BookOpen size={48} style={{
                                                color: 'var(--color-gray-400)',
                                                margin: '0 auto 1rem'
                                            }} />
                                            <p>Content management interface</p>
                                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                                Edit website pages and content
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AdminPanel;
