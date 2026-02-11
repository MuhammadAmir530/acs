import React, { useState } from 'react';
import { X } from 'lucide-react';
import { schoolData } from '../data/schoolData';

const Facilities = () => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [lightboxImage, setLightboxImage] = useState(null);

    const categories = ['All', 'Academic', 'Sports', 'Arts', 'Technology', 'Facilities'];

    const filteredFacilities = selectedCategory === 'All'
        ? schoolData.facilities
        : schoolData.facilities.filter(f => f.category === selectedCategory);

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
                        Our Facilities
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.95 }}>
                        State-of-the-art infrastructure for holistic learning
                    </p>
                </div>
            </section>

            {/* Category Filter */}
            <section className="section-sm bg-white">
                <div className="container">
                    <div className="flex gap-2" style={{
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={selectedCategory === cat ? 'badge badge-primary' : 'badge'}
                                style={{
                                    padding: '0.5rem 1.25rem',
                                    fontSize: '0.9375rem',
                                    cursor: 'pointer',
                                    transition: 'all var(--transition-base)',
                                    border: selectedCategory === cat ? 'none' : '2px solid var(--color-gray-300)'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Facilities Grid */}
            <section className="section" style={{ background: 'var(--color-gray-50)', paddingTop: '2rem' }}>
                <div className="container">
                    <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
                        {filteredFacilities.map((facility) => (
                            <div
                                key={facility.id}
                                className="card animate-fade-in"
                                style={{
                                    padding: 0,
                                    overflow: 'hidden',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setLightboxImage(facility)}
                            >
                                <div style={{
                                    width: '100%',
                                    height: '320px',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    <img
                                        src={facility.image}
                                        alt={facility.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform var(--transition-slow)'
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem'
                                    }}>
                                        <span className="badge badge-primary">
                                            {facility.category}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ padding: '1.5rem' }}>
                                    <h3 style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 'var(--font-weight-bold)',
                                        marginBottom: '0.75rem',
                                        color: 'var(--color-gray-900)'
                                    }}>
                                        {facility.name}
                                    </h3>

                                    <p style={{
                                        color: 'var(--color-gray-700)',
                                        lineHeight: '1.7'
                                    }}>
                                        {facility.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Lightbox */}
            {lightboxImage && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.9)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        animation: 'fadeIn 0.3s ease-out'
                    }}
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        onClick={() => setLightboxImage(null)}
                        style={{
                            position: 'absolute',
                            top: '2rem',
                            right: '2rem',
                            background: 'white',
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-gray-900)',
                            cursor: 'pointer',
                            zIndex: 1001
                        }}
                    >
                        <X size={24} />
                    </button>

                    <div
                        style={{
                            maxWidth: '1200px',
                            width: '100%',
                            background: 'white',
                            borderRadius: 'var(--radius-xl)',
                            overflow: 'hidden'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={lightboxImage.image}
                            alt={lightboxImage.name}
                            style={{
                                width: '100%',
                                maxHeight: '70vh',
                                objectFit: 'cover'
                            }}
                        />
                        <div style={{ padding: '2rem' }}>
                            <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                <h3 style={{
                                    fontSize: '2rem',
                                    fontWeight: 'var(--font-weight-bold)',
                                    color: 'var(--color-gray-900)'
                                }}>
                                    {lightboxImage.name}
                                </h3>
                                <span className="badge badge-primary">
                                    {lightboxImage.category}
                                </span>
                            </div>
                            <p style={{
                                fontSize: '1.125rem',
                                color: 'var(--color-gray-700)',
                                lineHeight: '1.8'
                            }}>
                                {lightboxImage.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Facilities;
