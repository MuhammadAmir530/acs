import React from 'react';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { schoolData } from '../data/schoolData';

const Footer = () => {
    return (
        <footer style={{
            background: 'var(--color-gray-900)',
            color: 'var(--color-gray-400)',
            padding: '3rem 0 1.5rem'
        }}>
            <div className="container">
                <div className="grid grid-cols-3" style={{
                    gap: '2rem',
                    paddingBottom: '2rem',
                    borderBottom: '1px solid var(--color-gray-800)'
                }}>
                    {/* About */}
                    <div>
                        <h3 style={{
                            color: 'var(--color-white)',
                            fontSize: '1.25rem',
                            fontWeight: 'var(--font-weight-bold)',
                            marginBottom: '1rem'
                        }}>
                            {schoolData.name}
                        </h3>
                        <p style={{ lineHeight: '1.8', marginBottom: '1rem' }}>
                            {schoolData.description}
                        </p>
                        <div className="flex gap-2" style={{ marginTop: '1.5rem' }}>
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
                                <a
                                    key={idx}
                                    href="#"
                                    className="flex-center"
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        background: 'var(--color-gray-800)',
                                        borderRadius: '50%',
                                        color: 'var(--color-gray-400)',
                                        transition: 'all var(--transition-base)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--color-primary)';
                                        e.currentTarget.style.color = 'var(--color-white)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'var(--color-gray-800)';
                                        e.currentTarget.style.color = 'var(--color-gray-400)';
                                    }}
                                >
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 style={{
                            color: 'var(--color-white)',
                            fontSize: '1.125rem',
                            fontWeight: 'var(--font-weight-bold)',
                            marginBottom: '1rem'
                        }}>
                            Quick Links
                        </h3>
                        <ul style={{ listStyle: 'none' }}>
                            {['Home', 'About Us', 'Faculty', 'Facilities', 'Contact Us', 'Admissions'].map((link, idx) => (
                                <li key={idx} style={{ marginBottom: '0.5rem' }}>
                                    <a
                                        href="#"
                                        style={{
                                            color: 'var(--color-gray-400)',
                                            transition: 'color var(--transition-base)'
                                        }}
                                        onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
                                        onMouseLeave={(e) => e.target.style.color = 'var(--color-gray-400)'}
                                    >
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 style={{
                            color: 'var(--color-white)',
                            fontSize: '1.125rem',
                            fontWeight: 'var(--font-weight-bold)',
                            marginBottom: '1rem'
                        }}>
                            Contact Us
                        </h3>
                        <div className="flex-col gap-2">
                            <div className="flex gap-2" style={{ alignItems: 'flex-start' }}>
                                <MapPin size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span>{schoolData.contact.address}</span>
                            </div>
                            <div className="flex gap-2" style={{ alignItems: 'center' }}>
                                <Phone size={18} style={{ flexShrink: 0 }} />
                                <span>{schoolData.contact.phone}</span>
                            </div>
                            <div className="flex gap-2" style={{ alignItems: 'center' }}>
                                <Mail size={18} style={{ flexShrink: 0 }} />
                                <span>{schoolData.contact.email}</span>
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                            <strong style={{ color: 'var(--color-white)' }}>Office Hours:</strong><br />
                            {schoolData.contact.hours}
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div style={{
                    textAlign: 'center',
                    paddingTop: '1.5rem',
                    fontSize: '0.875rem'
                }}>
                    &copy; {new Date().getFullYear()} {schoolData.name}. All Rights Reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
