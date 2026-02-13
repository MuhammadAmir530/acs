import React from 'react';
import { ArrowRight, Users, Globe, Award, TrendingUp, BookOpen, Heart } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';

const Home = ({ setCurrentPage }) => {
    const { schoolData } = useSchoolData();
    return (
        <div>
            {/* Hero Section */}
            <section style={{
                position: 'relative',
                height: '75vh',
                minHeight: '600px',
                background: 'var(--gradient-hero)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}>
                {/* Animated Background Pattern */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.1,
                    background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                }} />

                <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
                    <h1 className="animate-fade-in" style={{
                        fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                        fontWeight: 'var(--font-weight-black)',
                        color: 'white',
                        marginBottom: '1.5rem',
                        lineHeight: 1.1,
                        textShadow: '0 4px 6px rgba(0,0,0,0.2)'
                    }}>
                        {schoolData.tagline.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                                {line}
                                {i === 0 && <br />}
                            </React.Fragment>
                        ))}
                    </h1>
                    <p className="animate-fade-in" style={{
                        fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
                        color: 'rgba(255,255,255,0.9)',
                        marginBottom: '2.5rem',
                        maxWidth: '700px',
                        margin: '0 auto 2.5rem',
                        animation: 'fadeIn 0.6s ease-out 0.3s both'
                    }}>
                        {schoolData.description}
                    </p>
                    <div className="flex gap-3" style={{
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        animation: 'fadeIn 0.6s ease-out 0.6s both'
                    }}>
                        <button
                            onClick={() => setCurrentPage('contact')}
                            className="btn btn-lg"
                            style={{
                                background: 'white',
                                color: 'var(--color-primary)',
                                fontWeight: 'var(--font-weight-bold)'
                            }}
                        >
                            Inquire Now
                            <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => setCurrentPage('about')}
                            className="btn btn-outline btn-lg"
                            style={{
                                borderColor: 'white',
                                color: 'white'
                            }}
                        >
                            Learn More
                        </button>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="section bg-white">
                <div className="container">
                    <div className="grid grid-cols-4" style={{ gap: '2rem', textAlign: 'center' }}>
                        {schoolData.statistics.map((stat, idx) => (
                            <div
                                key={idx}
                                className="animate-fade-in"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                <div style={{
                                    fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                                    fontWeight: 'var(--font-weight-extrabold)',
                                    background: 'var(--gradient-primary)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    marginBottom: '0.5rem'
                                }}>
                                    {stat.value}
                                </div>
                                <p style={{
                                    color: 'var(--color-gray-600)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    fontSize: '1.125rem'
                                }}>
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="section" style={{ background: 'var(--color-gray-50)' }}>
                <div className="container">
                    <h2 style={{
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        fontWeight: 'var(--font-weight-bold)',
                        textAlign: 'center',
                        marginBottom: '3rem',
                        color: 'var(--color-gray-900)'
                    }}>
                        Why Choose ACS?
                    </h2>

                    <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
                        {[
                            {
                                icon: BookOpen,
                                title: 'World-Class Curriculum',
                                description: 'World-Class comprehensive programs from playgroup to intermediate'
                            },
                            {
                                icon: Users,
                                title: 'Expert Faculty',
                                description: 'Highly qualified teachers with years of teaching experience'
                            },
                            {
                                icon: Globe,
                                title: 'World-Wide Community',
                                description: 'Exposure to a truly diverse learning environment'
                            },
                            {
                                icon: Award,
                                title: 'Academic Excellence',
                                description: '100% university acceptance rate with graduates at top institutions'
                            },
                            {
                                icon: Heart,
                                title: 'Holistic Development',
                                description: 'Focus on emotional, social, and physical growth alongside academics'
                            },
                            {
                                icon: TrendingUp,
                                title: 'Future Ready',
                                description: 'Preparing students for success in an ever-changing global landscape'
                            }
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="card"
                                style={{
                                    textAlign: 'center',
                                    animationDelay: `${idx * 0.1}s`
                                }}
                            >
                                <div className="flex-center" style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'var(--gradient-primary)',
                                    borderRadius: '50%',
                                    margin: '0 auto 1.5rem',
                                    color: 'white'
                                }}>
                                    <feature.icon size={36} />
                                </div>
                                <h3 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 'var(--font-weight-bold)',
                                    marginBottom: '0.75rem',
                                    color: 'var(--color-gray-900)'
                                }}>
                                    {feature.title}
                                </h3>
                                <p style={{
                                    color: 'var(--color-gray-600)',
                                    lineHeight: '1.7'
                                }}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="section bg-white">
                <div className="container">
                    <h2 style={{
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        fontWeight: 'var(--font-weight-bold)',
                        textAlign: 'center',
                        marginBottom: '3rem',
                        color: 'var(--color-gray-900)'
                    }}>
                        What Our Community Says
                    </h2>

                    <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
                        {schoolData.testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="card"
                                style={{
                                    borderLeft: '4px solid var(--color-primary)'
                                }}
                            >
                                <div style={{ marginBottom: '1rem', color: 'var(--color-accent)' }}>
                                    {'★'.repeat(testimonial.rating)}
                                </div>
                                <p style={{
                                    fontSize: '1.125rem',
                                    lineHeight: '1.7',
                                    color: 'var(--color-gray-700)',
                                    marginBottom: '1.5rem',
                                    fontStyle: 'italic'
                                }}>
                                    "{testimonial.text}"
                                </p>
                                <div>
                                    <div style={{
                                        fontWeight: 'var(--font-weight-bold)',
                                        color: 'var(--color-gray-900)'
                                    }}>
                                        {testimonial.name}
                                    </div>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--color-gray-600)'
                                    }}>
                                        {testimonial.role}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                background: 'var(--gradient-primary)',
                color: 'white',
                padding: '5rem 0',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h2 style={{
                        fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                        fontWeight: 'var(--font-weight-bold)',
                        marginBottom: '1rem'
                    }}>
                        Ready to Join Our Community?
                    </h2>
                    <p style={{
                        fontSize: '1.25rem',
                        marginBottom: '2rem',
                        opacity: 0.95
                    }}>
                        Schedule a campus tour or learn more about our admissions process
                    </p>
                    <button
                        onClick={() => setCurrentPage('contact')}
                        className="btn btn-lg"
                        style={{
                            background: 'white',
                            color: 'var(--color-primary)'
                        }}
                    >
                        Get in Touch
                        <ArrowRight size={20} />
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Home;
