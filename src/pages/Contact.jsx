import React, { useState } from 'react';
import { Send, MapPin, Phone, Mail, Clock, CheckCircle } from 'lucide-react';
import { schoolData } from '../data/schoolData';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate form submission
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        }, 3000);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

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
                        Contact Us
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.95 }}>
                        Get in touch with us for inquiries and admissions
                    </p>
                </div>
            </section>

            {/* Contact Form & Info */}
            <section className="section bg-white">
                <div className="container">
                    <div className="grid grid-cols-2" style={{ gap: '3rem', alignItems: 'start' }}>
                        {/* Contact Form */}
                        <div>
                            <h2 style={{
                                fontSize: '2rem',
                                fontWeight: 'var(--font-weight-bold)',
                                marginBottom: '1.5rem',
                                color: 'var(--color-gray-900)'
                            }}>
                                Send us a Message
                            </h2>

                            {submitted ? (
                                <div
                                    className="card animate-fade-in"
                                    style={{
                                        background: 'var(--color-success)',
                                        color: 'white',
                                        textAlign: 'center',
                                        padding: '3rem'
                                    }}
                                >
                                    <div className="flex-center" style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'white',
                                        borderRadius: '50%',
                                        color: 'var(--color-success)',
                                        margin: '0 auto 1rem'
                                    }}>
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                        Message Sent!
                                    </h3>
                                    <p>We'll get back to you soon.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label className="form-label">Full Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="form-input"
                                            required
                                            placeholder="Muhammad Amir"
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label className="form-label">Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="form-input"
                                            required
                                            placeholder="amir@gmail.com"
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label className="form-label">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="form-input"
                                            placeholder="03XX XXXXXXX"
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label className="form-label">Subject *</label>
                                        <input
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            className="form-input"
                                            required
                                            placeholder="Admission Inquiry"
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label className="form-label">Message *</label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            className="form-input form-textarea"
                                            required
                                            placeholder="Tell us more about your inquiry..."
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                        <Send size={20} />
                                        Send Message
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h2 style={{
                                fontSize: '2rem',
                                fontWeight: 'var(--font-weight-bold)',
                                marginBottom: '1.5rem',
                                color: 'var(--color-gray-900)'
                            }}>
                                Get in Touch
                            </h2>

                            <div className="flex-col gap-3">
                                <div className="card" style={{ background: 'var(--color-gray-50)' }}>
                                    <div className="flex gap-3">
                                        <div className="flex-center" style={{
                                            width: '48px',
                                            height: '48px',
                                            background: 'var(--gradient-primary)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'white',
                                            flexShrink: 0
                                        }}>
                                            <MapPin size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{
                                                fontWeight: 'var(--font-weight-bold)',
                                                marginBottom: '0.25rem',
                                                color: 'var(--color-gray-900)'
                                            }}>
                                                Address
                                            </h3>
                                            <p style={{ color: 'var(--color-gray-700)' }}>
                                                {schoolData.contact.address}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="card" style={{ background: 'var(--color-gray-50)' }}>
                                    <div className="flex gap-3">
                                        <div className="flex-center" style={{
                                            width: '48px',
                                            height: '48px',
                                            background: 'var(--gradient-primary)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'white',
                                            flexShrink: 0
                                        }}>
                                            <Phone size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{
                                                fontWeight: 'var(--font-weight-bold)',
                                                marginBottom: '0.25rem',
                                                color: 'var(--color-gray-900)'
                                            }}>
                                                Phone
                                            </h3>
                                            <p style={{ color: 'var(--color-gray-700)' }}>
                                                {schoolData.contact.phone}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="card" style={{ background: 'var(--color-gray-50)' }}>
                                    <div className="flex gap-3">
                                        <div className="flex-center" style={{
                                            width: '48px',
                                            height: '48px',
                                            background: 'var(--gradient-primary)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'white',
                                            flexShrink: 0
                                        }}>
                                            <Mail size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{
                                                fontWeight: 'var(--font-weight-bold)',
                                                marginBottom: '0.25rem',
                                                color: 'var(--color-gray-900)'
                                            }}>
                                                Email
                                            </h3>
                                            <p style={{ color: 'var(--color-gray-700)' }}>
                                                {schoolData.contact.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="card" style={{ background: 'var(--color-gray-50)' }}>
                                    <div className="flex gap-3">
                                        <div className="flex-center" style={{
                                            width: '48px',
                                            height: '48px',
                                            background: 'var(--gradient-primary)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'white',
                                            flexShrink: 0
                                        }}>
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{
                                                fontWeight: 'var(--font-weight-bold)',
                                                marginBottom: '0.25rem',
                                                color: 'var(--color-gray-900)'
                                            }}>
                                                Office Hours
                                            </h3>
                                            <p style={{ color: 'var(--color-gray-700)' }}>
                                                {schoolData.contact.hours}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section style={{ height: '400px', background: 'var(--color-gray-200)' }}>
                <iframe
                    src="https://www.google.com/maps?q=8RXP%2BGXF,+Jhang+Rd,+Faisalabad,+36000&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    title="ACS Higher Secondary School - 8RXP+GXF, Jhang Rd, Faisalabad"
                />
            </section>
        </div>
    );
};

export default Contact;
