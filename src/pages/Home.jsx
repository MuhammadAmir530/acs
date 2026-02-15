import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Users, Globe, Award, TrendingUp, BookOpen, Heart, ChevronDown, Star, Sparkles, GraduationCap, Trophy, Megaphone } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';

// ── Scroll reveal hook ──
const useScrollReveal = (threshold = 0.15) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
            { threshold }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [threshold]);
    return [ref, isVisible];
};

// ── Animated counter with easing ──
const AnimatedCounter = ({ target, suffix = '', duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const [ref, isVisible] = useScrollReveal(0.3);
    const num = parseInt(target.replace(/[^0-9]/g, ''), 10) || 0;

    useEffect(() => {
        if (!isVisible || num === 0) return;
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo for snappy feel
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(eased * num));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [isVisible, num, duration]);

    return <span ref={ref}>{count}{suffix}</span>;
};

// ── Reveal wrapper with multiple directions ──
const Reveal = ({ children, delay = 0, direction = 'up', style = {}, scale = false }) => {
    const [ref, isVisible] = useScrollReveal(0.1);
    const transforms = {
        up: 'translateY(50px)',
        down: 'translateY(-50px)',
        left: 'translateX(-50px)',
        right: 'translateX(50px)',
        none: 'none'
    };
    const scaleVal = scale ? ' scale(0.95)' : '';
    return (
        <div
            ref={ref}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'none' : transforms[direction] + scaleVal,
                transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
                ...style
            }}
        >
            {children}
        </div>
    );
};

// ── Typing effect hook ──
const useTypingEffect = (texts, typingSpeed = 80, deletingSpeed = 40, pauseTime = 2000) => {
    const [displayText, setDisplayText] = useState('');
    const [textIndex, setTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentText = texts[textIndex];
        let timeout;

        if (!isDeleting && charIndex < currentText.length) {
            timeout = setTimeout(() => setCharIndex(c => c + 1), typingSpeed);
        } else if (!isDeleting && charIndex === currentText.length) {
            timeout = setTimeout(() => setIsDeleting(true), pauseTime);
        } else if (isDeleting && charIndex > 0) {
            timeout = setTimeout(() => setCharIndex(c => c - 1), deletingSpeed);
        } else if (isDeleting && charIndex === 0) {
            setIsDeleting(false);
            setTextIndex((i) => (i + 1) % texts.length);
        }

        setDisplayText(currentText.substring(0, charIndex));
        return () => clearTimeout(timeout);
    }, [charIndex, isDeleting, textIndex, texts, typingSpeed, deletingSpeed, pauseTime]);

    return displayText;
};

// ── Tilt card component ──
const TiltCard = ({ children, style = {}, className = '' }) => {
    const cardRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        const card = cardRef.current;
        if (card) card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)';
    }, []);

    return (
        <div
            ref={cardRef}
            className={className}
            style={{ transition: 'transform 0.4s ease', transformStyle: 'preserve-3d', ...style }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </div>
    );
};

// ── Particle field for hero ──
const ParticleField = () => {
    const particles = useRef(
        Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            dur: Math.random() * 10 + 8,
            delay: Math.random() * 5
        }))
    ).current;

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            {particles.map(p => (
                <div key={p.id} style={{
                    position: 'absolute',
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: p.size,
                    height: p.size,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.5)',
                    animation: `particleFloat ${p.dur}s ease-in-out ${p.delay}s infinite`,
                    opacity: 0.4
                }} />
            ))}
        </div>
    );
};

const Home = ({ setCurrentPage }) => {
    const { schoolData } = useSchoolData();
    const [heroLoaded, setHeroLoaded] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [scrollY, setScrollY] = useState(0);

    const typingTexts = ['Excellence in Education', 'Building Future Leaders', 'Inspiring Young Minds', 'Shaping Tomorrow\'s World'];
    const typedText = useTypingEffect(typingTexts, 90, 50, 2500);

    useEffect(() => {
        setTimeout(() => setHeroLoaded(true), 100);
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
            y: ((e.clientY - rect.top) / rect.height - 0.5) * 20
        });
    };

    return (
        <div style={{ overflow: 'hidden' }}>
            {/* ═══════ HERO SECTION ═══════ */}
            <section
                onMouseMove={handleMouseMove}
                style={{
                    position: 'relative',
                    height: '90vh',
                    minHeight: '700px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                }}
            >
                {/* Animated gradient background */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(-45deg, #0f172a, #1e3a5f, #1e40af, #0f172a, #1a365d)',
                    backgroundSize: '400% 400%',
                    animation: 'gradientShift 15s ease infinite'
                }} />

                {/* Particle field */}
                <ParticleField />

                {/* Animated floating orbs with glow */}
                {[
                    { size: 320, top: '-12%', left: '-6%', dur: '8s', opacity: 0.07, color: 'rgba(96,165,250,0.4)' },
                    { size: 220, top: '55%', right: '-6%', dur: '10s', opacity: 0.06, color: 'rgba(167,139,250,0.4)' },
                    { size: 160, top: '15%', right: '18%', dur: '12s', opacity: 0.05, color: 'rgba(244,114,182,0.3)' },
                    { size: 120, bottom: '8%', left: '12%', dur: '9s', opacity: 0.08, color: 'rgba(56,189,248,0.4)' },
                    { size: 80, top: '40%', left: '50%', dur: '14s', opacity: 0.04, color: 'rgba(252,211,77,0.3)' }
                ].map((orb, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        width: orb.size, height: orb.size,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${orb.color}, transparent)`,
                        opacity: orb.opacity,
                        top: orb.top, left: orb.left, right: orb.right, bottom: orb.bottom,
                        animation: `float${i} ${orb.dur} ease-in-out infinite`,
                        transform: `translate(${mousePos.x * (i + 1) * 0.12}px, ${mousePos.y * (i + 1) * 0.12}px)`,
                        filter: 'blur(1px)'
                    }} />
                ))}

                {/* Grid pattern overlay */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.025,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                    transform: `translateY(${scrollY * 0.1}px)`
                }} />

                {/* Hero Content */}
                <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
                    {/* Typing effect subtitle */}
                    <div style={{
                        opacity: heroLoaded ? 1 : 0,
                        transform: heroLoaded ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                        marginBottom: '1.5rem'
                    }}>
                        <span style={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                            fontWeight: 600,
                            letterSpacing: '2px',
                            textTransform: 'uppercase'
                        }}>
                            {typedText}
                            <span style={{ animation: 'blink 1s step-end infinite', color: '#60a5fa' }}>|</span>
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 7vw, 5rem)',
                        fontWeight: 'var(--font-weight-black)',
                        color: 'white',
                        marginBottom: '1.5rem',
                        lineHeight: 1.1,
                        textShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        opacity: heroLoaded ? 1 : 0,
                        transform: heroLoaded ? 'translateY(0)' : 'translateY(40px)',
                        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
                    }}>
                        {(schoolData.tagline || '').split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                                {i === 1 ? (
                                    <span style={{
                                        background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6, #60a5fa)',
                                        backgroundSize: '200% auto',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        animation: 'shimmer 3s linear infinite'
                                    }}>{line}</span>
                                ) : line}
                                {i === 0 && <br />}
                            </React.Fragment>
                        ))}
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1.125rem, 2vw, 1.35rem)',
                        color: 'rgba(255,255,255,0.8)',
                        marginBottom: '2.5rem',
                        maxWidth: '680px',
                        margin: '0 auto 2.5rem',
                        opacity: heroLoaded ? 1 : 0,
                        transform: heroLoaded ? 'translateY(0)' : 'translateY(40px)',
                        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
                        lineHeight: 1.7
                    }}>
                        {schoolData.description}
                    </p>

                    <div className="flex gap-3" style={{
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        opacity: heroLoaded ? 1 : 0,
                        transform: heroLoaded ? 'translateY(0)' : 'translateY(40px)',
                        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s'
                    }}>
                        <button
                            onClick={() => setCurrentPage('contact')}
                            className="btn btn-lg"
                            style={{
                                background: 'white',
                                color: 'var(--color-primary)',
                                fontWeight: 'var(--font-weight-bold)',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px) scale(1.04)'; e.target.style.boxShadow = '0 16px 50px rgba(0,0,0,0.35)'; }}
                            onMouseLeave={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)'; }}
                        >
                            <Sparkles size={18} />
                            Inquire Now
                            <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => setCurrentPage('about')}
                            className="btn btn-outline btn-lg"
                            style={{
                                borderColor: 'rgba(255,255,255,0.4)',
                                color: 'white',
                                backdropFilter: 'blur(8px)',
                                background: 'rgba(255,255,255,0.06)',
                                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                            onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.18)'; e.target.style.borderColor = 'white'; e.target.style.transform = 'translateY(-4px)'; }}
                            onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = 'rgba(255,255,255,0.4)'; e.target.style.transform = 'none'; }}
                        >
                            Learn More
                        </button>
                    </div>
                </div>

                {/* Scroll indicator with pulse ring */}
                <div style={{
                    position: 'absolute', bottom: '2.5rem', left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Scroll</span>
                    <div style={{
                        width: '30px', height: '50px', borderRadius: '15px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        display: 'flex', justifyContent: 'center', paddingTop: '8px'
                    }}>
                        <div style={{
                            width: '4px', height: '10px', borderRadius: '2px',
                            background: 'rgba(255,255,255,0.7)',
                            animation: 'scrollWheel 2s ease-in-out infinite'
                        }} />
                    </div>
                </div>
            </section>

            {/* ═══════ SCROLLING TICKER ═══════ */}
            <div style={{
                background: 'linear-gradient(90deg, #1e40af, #1e3a5f)',
                padding: '0.9rem 0',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{
                    display: 'flex',
                    animation: 'ticker 25s linear infinite',
                    whiteSpace: 'nowrap',
                    gap: '3rem'
                }}>
                    {[...Array(2)].map((_, setIdx) => (
                        <div key={setIdx} style={{ display: 'flex', gap: '3rem', flexShrink: 0 }}>
                            {[
                                { icon: '🎓', text: 'Admissions Open 2026' },
                                { icon: '🏆', text: 'Board Exam Results — 98% Pass Rate' },
                                { icon: '📚', text: 'Modern Digital Classrooms' },
                                { icon: '⭐', text: 'Qualified & Experienced Faculty' },
                                { icon: '🌍', text: 'Holistic Education Approach' },
                                { icon: '🎯', text: '100% University Acceptance' }
                            ].map((item, i) => (
                                <span key={i} style={{
                                    color: 'rgba(255,255,255,0.9)',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    letterSpacing: '0.3px'
                                }}>
                                    {item.icon} {item.text}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══════ ANNOUNCEMENTS SECTION ═══════ */}
            {schoolData.announcements && schoolData.announcements.length > 0 && (
                <section className="section bg-white" style={{ padding: '4rem 0' }}>
                    <div className="container">
                        <Reveal>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', justifyContent: 'center' }}>
                                <Megaphone size={24} color="#2563eb" />
                                <p style={{
                                    color: 'var(--color-primary)',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '3px',
                                    margin: 0
                                }}>Stay Updated</p>
                            </div>
                            <h2 style={{
                                textAlign: 'center',
                                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                                fontWeight: 'var(--font-weight-bold)',
                                color: 'var(--color-gray-900)',
                                marginBottom: '2.5rem'
                            }}>Latest Announcements</h2>
                        </Reveal>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {schoolData.announcements.slice(0, 3).map((ann, idx) => (
                                <Reveal key={ann.id} delay={idx * 0.1} direction="up">
                                    <div className="card" style={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        border: '1px solid #f1f5f9',
                                        padding: '1.75rem',
                                        transition: 'all 0.3s ease',
                                        background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            marginBottom: '1rem'
                                        }}>
                                            <div style={{
                                                padding: '4px 12px',
                                                background: '#eff6ff',
                                                color: '#2563eb',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700
                                            }}>
                                                {ann.date}
                                            </div>
                                            <div style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: '#2563eb',
                                                boxShadow: '0 0 8px #2563eb'
                                            }} />
                                        </div>
                                        <h3 style={{
                                            fontSize: '1.2rem',
                                            fontWeight: 700,
                                            color: '#1e3a8a',
                                            marginBottom: '0.75rem',
                                            lineHeight: 1.4
                                        }}>{ann.title}</h3>
                                        <p style={{
                                            color: '#475569',
                                            fontSize: '0.95rem',
                                            lineHeight: 1.6,
                                            flex: 1
                                        }}>{ann.content}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>

                        {schoolData.announcements.length > 3 && (
                            <Reveal delay={0.4} style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                    + {schoolData.announcements.length - 3} more announcements in the notice board.
                                </p>
                            </Reveal>
                        )}
                    </div>
                </section>
            )}

            {/* ═══════ STATISTICS ═══════ */}
            <section className="section bg-white" style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Animated background blob */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '700px', height: '700px',
                    background: 'radial-gradient(circle, rgba(30,58,138,0.04), transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none',
                    animation: 'pulse 6s ease-in-out infinite'
                }} />
                <div className="container">
                    <Reveal>
                        <p style={{
                            textAlign: 'center',
                            color: 'var(--color-primary)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '3px',
                            marginBottom: '0.75rem'
                        }}>Our Impact</p>
                        <h2 style={{
                            textAlign: 'center',
                            fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-gray-900)',
                            marginBottom: '3rem'
                        }}>Numbers That Speak</h2>
                    </Reveal>
                    <div className="grid grid-cols-4" style={{ gap: '2rem', textAlign: 'center' }}>
                        {schoolData.statistics?.map((stat, idx) => {
                            const icons = [GraduationCap, Users, Trophy, Star];
                            const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706'];
                            const IconComp = icons[idx % icons.length];
                            return (
                                <Reveal key={idx} delay={idx * 0.12} scale>
                                    <TiltCard
                                        style={{
                                            padding: '2.5rem 1.5rem',
                                            borderRadius: '20px',
                                            background: 'white',
                                            border: '1px solid #f1f5f9',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                            cursor: 'default'
                                        }}
                                    >
                                        <div style={{
                                            width: '56px', height: '56px',
                                            borderRadius: '14px',
                                            background: colors[idx % colors.length] + '12',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 1rem',
                                            color: colors[idx % colors.length]
                                        }}>
                                            <IconComp size={26} />
                                        </div>
                                        <div style={{
                                            fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                                            fontWeight: 'var(--font-weight-extrabold)',
                                            background: `linear-gradient(135deg, ${colors[idx % colors.length]}, ${colors[(idx + 1) % colors.length]})`,
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                            marginBottom: '0.4rem'
                                        }}>
                                            <AnimatedCounter target={stat.value} suffix={stat.value.includes('+') ? '+' : stat.value.includes('%') ? '%' : ''} />
                                        </div>
                                        <p style={{
                                            color: 'var(--color-gray-500)',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            fontSize: '1rem'
                                        }}>
                                            {stat.label}
                                        </p>
                                    </TiltCard>
                                </Reveal>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════ WHY CHOOSE US ═══════ */}
            <section className="section" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)' }}>
                <div className="container">
                    <Reveal>
                        <p style={{
                            textAlign: 'center',
                            color: 'var(--color-primary)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '3px',
                            marginBottom: '0.75rem'
                        }}>Why Choose Us</p>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: 'var(--font-weight-bold)',
                            textAlign: 'center',
                            marginBottom: '1rem',
                            color: 'var(--color-gray-900)'
                        }}>
                            Why Choose ACS?
                        </h2>
                        <p style={{
                            textAlign: 'center',
                            color: 'var(--color-gray-500)',
                            fontSize: '1.1rem',
                            maxWidth: '600px',
                            margin: '0 auto 3.5rem'
                        }}>
                            We provide an environment where every student thrives
                        </p>
                    </Reveal>

                    <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
                        {[
                            { icon: BookOpen, title: 'World-Class Curriculum', description: 'World-Class comprehensive programs from playgroup to intermediate', color: '#2563eb', bg: '#eff6ff' },
                            { icon: Users, title: 'Expert Faculty', description: 'Highly qualified teachers with years of teaching experience', color: '#7c3aed', bg: '#f5f3ff' },
                            { icon: Globe, title: 'World-Wide Community', description: 'Exposure to a truly diverse learning environment', color: '#0891b2', bg: '#ecfeff' },
                            { icon: Award, title: 'Academic Excellence', description: '100% university acceptance rate with graduates at top institutions', color: '#059669', bg: '#ecfdf5' },
                            { icon: Heart, title: 'Holistic Development', description: 'Focus on emotional, social, and physical growth alongside academics', color: '#db2777', bg: '#fdf2f8' },
                            { icon: TrendingUp, title: 'Future Ready', description: 'Preparing students for success in an ever-changing global landscape', color: '#d97706', bg: '#fffbeb' }
                        ].map((feature, idx) => (
                            <Reveal key={idx} delay={idx * 0.1} direction={idx % 2 === 0 ? 'left' : 'right'} scale>
                                <TiltCard
                                    className="card"
                                    style={{
                                        textAlign: 'center',
                                        border: '1px solid transparent',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        cursor: 'default'
                                    }}
                                >
                                    {/* Animated gradient border on hover — handled by the bg div */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, height: '4px',
                                        background: `linear-gradient(90deg, transparent, ${feature.color}, transparent)`,
                                        opacity: 0,
                                        transition: 'opacity 0.4s ease'
                                    }} className={`card-accent-${idx}`} />

                                    <div className="flex-center" style={{
                                        width: '72px',
                                        height: '72px',
                                        background: feature.bg,
                                        borderRadius: '16px',
                                        margin: '0 auto 1.25rem',
                                        color: feature.color,
                                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                                    }}>
                                        <feature.icon size={32} />
                                    </div>
                                    <h3 style={{
                                        fontSize: '1.3rem',
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
                                </TiltCard>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ TESTIMONIALS ═══════ */}
            <section className="section bg-white" style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Decorative floating shapes */}
                <div style={{ position: 'absolute', top: '10%', left: '5%', width: '60px', height: '60px', borderRadius: '12px', border: '2px solid rgba(37,99,235,0.08)', animation: 'floatSpin 20s linear infinite', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '15%', right: '8%', width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(124,58,237,0.08)', animation: 'floatSpin 15s linear infinite reverse', pointerEvents: 'none' }} />

                <div className="container">
                    <Reveal>
                        <p style={{
                            textAlign: 'center',
                            color: 'var(--color-primary)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            letterSpacing: '3px',
                            marginBottom: '0.75rem'
                        }}>Testimonials</p>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: 'var(--font-weight-bold)',
                            textAlign: 'center',
                            marginBottom: '1rem',
                            color: 'var(--color-gray-900)'
                        }}>
                            What Our Community Says
                        </h2>
                        <p style={{
                            textAlign: 'center',
                            color: 'var(--color-gray-500)',
                            fontSize: '1.1rem',
                            maxWidth: '500px',
                            margin: '0 auto 3rem'
                        }}>
                            Hear from our students, parents, and alumni
                        </p>
                    </Reveal>

                    <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
                        {schoolData.testimonials?.map((testimonial, idx) => (
                            <Reveal key={testimonial.id} delay={idx * 0.15} direction={idx === 0 ? 'left' : idx === 2 ? 'right' : 'up'}>
                                <TiltCard
                                    className="card"
                                    style={{
                                        borderLeft: '4px solid var(--color-primary)',
                                        cursor: 'default',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute', top: '0.75rem', right: '1.25rem',
                                        fontSize: '4rem', lineHeight: 1, opacity: 0.05,
                                        fontFamily: 'Georgia, serif', color: 'var(--color-primary)'
                                    }}>
                                        "
                                    </div>
                                    <div style={{ marginBottom: '1rem', color: 'var(--color-accent)' }}>
                                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                                            <Star key={i} size={16} fill="currentColor" style={{
                                                display: 'inline', marginRight: '2px',
                                                animation: `starPop 0.3s ease ${i * 0.1 + 0.5}s both`
                                            }} />
                                        ))}
                                    </div>
                                    <p style={{
                                        fontSize: '1.05rem',
                                        lineHeight: '1.7',
                                        color: 'var(--color-gray-700)',
                                        marginBottom: '1.5rem',
                                        fontStyle: 'italic'
                                    }}>
                                        "{testimonial.text}"
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '44px', height: '44px',
                                            background: 'var(--gradient-primary)',
                                            borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 700, fontSize: '1rem',
                                            boxShadow: '0 4px 12px rgba(30,64,175,0.3)'
                                        }}>
                                            {testimonial.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{
                                                fontWeight: 'var(--font-weight-bold)',
                                                color: 'var(--color-gray-900)'
                                            }}>
                                                {testimonial.name}
                                            </div>
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: 'var(--color-gray-500)'
                                            }}>
                                                {testimonial.role}
                                            </div>
                                        </div>
                                    </div>
                                </TiltCard>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ CTA SECTION ═══════ */}
            <Reveal>
                <section style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
                    color: 'white',
                    padding: '6rem 0',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Animated decorative rings */}
                    <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '250px', height: '250px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', animation: 'pulse 4s ease-in-out infinite' }} />
                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '170px', height: '170px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', animation: 'pulse 4s ease-in-out infinite 1s' }} />
                    <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', animation: 'pulse 5s ease-in-out infinite 0.5s' }} />

                    <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                        <Sparkles size={40} style={{ margin: '0 auto 1.5rem', opacity: 0.7 }} />
                        <h2 style={{
                            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                            fontWeight: 'var(--font-weight-bold)',
                            marginBottom: '1rem'
                        }}>
                            Ready to Join Our Community?
                        </h2>
                        <p style={{
                            fontSize: '1.2rem',
                            opacity: 0.8,
                            maxWidth: '550px',
                            margin: '0 auto 2.5rem'
                        }}>
                            Schedule a campus tour or learn more about our admissions process
                        </p>
                        <button
                            onClick={() => setCurrentPage('contact')}
                            className="btn btn-lg"
                            style={{
                                background: 'white',
                                color: 'var(--color-primary)',
                                fontWeight: 'var(--font-weight-bold)',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-4px) scale(1.06)'; e.target.style.boxShadow = '0 18px 50px rgba(0,0,0,0.35)'; }}
                            onMouseLeave={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)'; }}
                        >
                            Get in Touch
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </section>
            </Reveal>

            {/* ═══════ KEYFRAMES ═══════ */}
            <style>{`
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes shimmer {
                    0% { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                @keyframes float0 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-25px) scale(1.05); } }
                @keyframes float1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-28px,18px) scale(1.03); } }
                @keyframes float2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(18px,28px); } }
                @keyframes float3 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-22px,-18px); } }
                @keyframes float4 { 0%,100% { transform: translate(0,0); } 33% { transform: translate(15px,-15px); } 66% { transform: translate(-10px,20px); } }
                @keyframes particleFloat {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
                    25% { transform: translateY(-20px) translateX(10px); opacity: 0.7; }
                    50% { transform: translateY(-40px) translateX(-5px); opacity: 0.3; }
                    75% { transform: translateY(-20px) translateX(-10px); opacity: 0.6; }
                }
                @keyframes scrollWheel {
                    0% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(16px); opacity: 0; }
                }
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes pulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.7; }
                }
                @keyframes floatSpin {
                    0% { transform: rotate(0deg) translateY(0); }
                    50% { transform: rotate(180deg) translateY(-20px); }
                    100% { transform: rotate(360deg) translateY(0); }
                }
                @keyframes starPop {
                    0% { transform: scale(0); opacity: 0; }
                    60% { transform: scale(1.3); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Home;
