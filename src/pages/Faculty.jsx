import React, { useState } from 'react';
import { Mail, Briefcase } from 'lucide-react';
import { schoolData } from '../data/schoolData';

const Faculty = ({ isAdmin }) => {
    const [selectedDept, setSelectedDept] = useState('All');

    const departments = ['All', 'Administration', 'Academic Leadership', 'Science', 'Mathematics', 'Athletics', 'Fine Arts'];

    const filteredFaculty = selectedDept === 'All'
        ? schoolData.faculty
        : schoolData.faculty.filter(f => f.department === selectedDept);

    return (
        <div>
            {/* Header */}
            <section style={{
                background: 'var(--gradient-primary)',
                color: 'white',
                padding: '5rem 0 3rem',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                        fontWeight: 'var(--font-weight-bold)',
                        marginBottom: '1rem'
                    }}>
                        Our Faculty
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.95 }}>
                        Meet our dedicated team of world-class educators
                    </p>
                </div>
            </section>

            {/* Department Filter */}
            <section className="section-sm bg-white">
                <div className="container">
                    <div className="flex gap-2" style={{
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {departments.map((dept) => (
                            <button
                                key={dept}
                                onClick={() => setSelectedDept(dept)}
                                className={selectedDept === dept ? 'badge badge-primary' : 'badge'}
                                style={{
                                    padding: '0.5rem 1.25rem',
                                    fontSize: '0.9375rem',
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-base)',
                                    border: selectedDept === dept ? 'none' : '2px solid var(--color-gray-300)'
                                }}
                            >
                                {dept}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Faculty Grid */}
            <section className="section" style={{ background: 'var(--color-gray-50)', paddingTop: '2rem' }}>
                <div className="container">
                    <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
                        {filteredFaculty.map((member) => (
                            <div key={member.id} className="card animate-fade-in">
                                <div style={{
                                    width: '100%',
                                    height: '280px',
                                    overflow: 'hidden',
                                    borderRadius: 'var(--radius-lg)',
                                    marginBottom: '1.5rem',
                                    background: 'var(--color-gray-100)'
                                }}>
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform var(--transition-slow)'
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                    />
                                </div>

                                <h3 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 'var(--font-weight-bold)',
                                    marginBottom: '0.5rem',
                                    color: 'var(--color-gray-900)'
                                }}>
                                    {member.name}
                                </h3>

                                <div className="flex gap-1" style={{
                                    alignItems: 'center',
                                    marginBottom: '0.5rem',
                                    color: 'var(--color-primary)',
                                    fontWeight: 'var(--font-weight-semibold)'
                                }}>
                                    <Briefcase size={16} />
                                    <span>{member.role}</span>
                                </div>

                                <div style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--color-gray-600)',
                                    marginBottom: '1rem'
                                }}>
                                    {member.department}
                                </div>

                                <p style={{
                                    color: 'var(--color-gray-700)',
                                    lineHeight: '1.6',
                                    fontSize: '0.9375rem'
                                }}>
                                    {member.bio}
                                </p>

                                {isAdmin && (
                                    <button
                                        className="btn btn-outline btn-sm"
                                        style={{ marginTop: '1rem', width: '100%' }}
                                    >
                                        <Mail size={16} />
                                        Contact
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Faculty;
