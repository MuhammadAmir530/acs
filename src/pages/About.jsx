import React from 'react';
import { Target, Eye, Award, CheckCircle } from 'lucide-react';
import { schoolData } from '../data/schoolData';

const About = () => {
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
                        About Us
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.95 }}>
                        Discover our story, mission, and commitment to excellence
                    </p>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="section bg-white">
                <div className="container">
                    <div className="grid grid-cols-2" style={{ gap: '3rem', alignItems: 'stretch' }}>
                        <div className="card" style={{
                            background: 'var(--color-gray-50)',
                            height: '100%'
                        }}>
                            <div className="flex-center" style={{
                                width: '60px',
                                height: '60px',
                                background: 'var(--gradient-primary)',
                                borderRadius: 'var(--radius-lg)',
                                color: 'white',
                                marginBottom: '1.5rem'
                            }}>
                                <Target size={30} />
                            </div>
                            <h2 style={{
                                fontSize: '2rem',
                                fontWeight: 'var(--font-weight-bold)',
                                marginBottom: '1rem',
                                color: 'var(--color-gray-900)'
                            }}>
                                Our Mission
                            </h2>
                            <p style={{
                                fontSize: '1.125rem',
                                lineHeight: '1.8',
                                color: 'var(--color-gray-700)'
                            }}>
                                {schoolData.about.mission}
                            </p>
                        </div>

                        <div className="card" style={{
                            background: 'var(--color-gray-50)',
                            height: '100%'
                        }}>
                            <div className="flex-center" style={{
                                width: '60px',
                                height: '60px',
                                background: 'var(--gradient-primary)',
                                borderRadius: 'var(--radius-lg)',
                                color: 'white',
                                marginBottom: '1.5rem'
                            }}>
                                <Eye size={30} />
                            </div>
                            <h2 style={{
                                fontSize: '2rem',
                                fontWeight: 'var(--font-weight-bold)',
                                marginBottom: '1rem',
                                color: 'var(--color-gray-900)'
                            }}>
                                Our Vision
                            </h2>
                            <p style={{
                                fontSize: '1.125rem',
                                lineHeight: '1.8',
                                color: 'var(--color-gray-700)'
                            }}>
                                {schoolData.about.vision}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* History */}
            <section className="section" style={{ background: 'var(--color-gray-50)' }}>
                <div className="container container-sm">
                    <h2 style={{
                        fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                        fontWeight: 'var(--font-weight-bold)',
                        marginBottom: '2rem',
                        color: 'var(--color-gray-900)',
                        textAlign: 'center'
                    }}>
                        Our Story
                    </h2>
                    <p style={{
                        fontSize: '1.125rem',
                        lineHeight: '1.9',
                        color: 'var(--color-gray-700)',
                        textAlign: 'center'
                    }}>
                        {schoolData.about.history}
                    </p>
                </div>
            </section>

            {/* Core Values */}
            <section className="section bg-white">
                <div className="container">
                    <h2 style={{
                        fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                        fontWeight: 'var(--font-weight-bold)',
                        marginBottom: '3rem',
                        color: 'var(--color-gray-900)',
                        textAlign: 'center'
                    }}>
                        Our Core Values
                    </h2>

                    <div className="grid" style={{
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {schoolData.about.values.map((value, idx) => (
                            <div
                                key={idx}
                                className="card"
                                style={{
                                    background: 'var(--color-gray-50)',
                                    border: '2px solid transparent',
                                    transition: 'all var(--transition-base)',
                                    cursor: 'default'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                                    e.currentTarget.style.background = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.background = 'var(--color-gray-50)';
                                }}
                            >
                                <div className="flex gap-2" style={{ alignItems: 'flex-start' }}>
                                    <CheckCircle
                                        size={24}
                                        style={{
                                            color: 'var(--color-primary)',
                                            flexShrink: 0,
                                            marginTop: '2px'
                                        }}
                                    />
                                    <span style={{
                                        fontSize: '1.125rem',
                                        fontWeight: 'var(--font-weight-semibold)',
                                        color: 'var(--color-gray-900)'
                                    }}>
                                        {value}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Accreditations */}
            <section className="section" style={{ background: 'var(--color-gray-50)' }}>
                <div className="container container-sm">
                    <div className="flex-center" style={{
                        width: '70px',
                        height: '70px',
                        background: 'var(--gradient-primary)',
                        borderRadius: '50%',
                        color: 'white',
                        margin: '0 auto 2rem'
                    }}>
                        <Award size={36} />
                    </div>

                    <h2 style={{
                        fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                        fontWeight: 'var(--font-weight-bold)',
                        marginBottom: '2rem',
                        color: 'var(--color-gray-900)',
                        textAlign: 'center'
                    }}>
                        Accreditations & Affiliations
                    </h2>

                    <div className="flex-col gap-2" style={{ textAlign: 'center' }}>
                        {schoolData.about.accreditations.map((accred, idx) => (
                            <div
                                key={idx}
                                style={{
                                    padding: '1rem',
                                    background: 'white',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '2px solid var(--color-primary)',
                                    fontSize: '1.125rem',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: 'var(--color-gray-900)'
                                }}
                            >
                                {accred}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
