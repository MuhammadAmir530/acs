import React, { useState } from 'react';
import { Calendar, User, ArrowRight, Tag, Clock, Search } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';

const blogPosts = [
    {
        id: 1,
        title: 'Annual Sports Day 2025: A Grand Celebration of Athletic Excellence',
        excerpt: 'Our students showcased their athletic prowess in a day filled with exciting competitions, team spirit, and unforgettable moments on the field.',
        content: 'The Annual Sports Day 2025 was a grand celebration of athletic talent and sportsmanship...',
        author: 'Admin',
        date: '2025-12-15',
        category: 'Events',
        readTime: '4 min read',
        image: '🏆'
    },
    {
        id: 2,
        title: 'ACS Students Achieve Outstanding Results in Board Exams',
        excerpt: 'We are proud to announce that our students have achieved remarkable results in the 2025 board examinations with a 98% pass rate.',
        content: 'ACS School & College celebrates the outstanding academic achievements of its students...',
        author: 'Principal',
        date: '2025-11-20',
        category: 'Achievements',
        readTime: '3 min read',
        image: '🎓'
    },
    {
        id: 3,
        title: 'New Science Laboratory Inaugurated with State-of-the-Art Equipment',
        excerpt: 'Our brand new science laboratory features modern equipment and technology to provide students with hands-on learning experiences.',
        content: 'ACS School & College is proud to inaugurate its new state-of-the-art science laboratory...',
        author: 'Admin',
        date: '2025-10-05',
        category: 'Campus',
        readTime: '5 min read',
        image: '🔬'
    },
    {
        id: 4,
        title: 'Inter-School Debate Competition: ACS Team Brings Home the Trophy',
        excerpt: 'Our talented debate team won first place at the regional inter-school debate competition, demonstrating exceptional public speaking skills.',
        content: 'The ACS debate team has once again proven their mettle by securing first place...',
        author: 'Admin',
        date: '2025-09-18',
        category: 'Achievements',
        readTime: '3 min read',
        image: '🎤'
    },
    {
        id: 5,
        title: 'Parent-Teacher Conference: Building Stronger Partnerships',
        excerpt: 'The annual parent-teacher conference brought together families and educators to discuss student progress and academic goals for the year.',
        content: 'ACS School & College hosted its annual Parent-Teacher Conference...',
        author: 'Principal',
        date: '2025-08-25',
        category: 'Events',
        readTime: '4 min read',
        image: '🤝'
    },
    {
        id: 6,
        title: 'Tips for Effective Study Habits: A Guide for Students',
        excerpt: 'Discover proven study techniques and habits that can help you improve your academic performance and make learning more enjoyable.',
        content: 'Developing effective study habits is crucial for academic success...',
        author: 'Admin',
        date: '2025-07-10',
        category: 'Education',
        readTime: '6 min read',
        image: '📚'
    }
];

const categories = ['All', 'Events', 'Achievements', 'Campus', 'Education'];

const Blog = () => {
    const { schoolData } = useSchoolData();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPost, setSelectedPost] = useState(null);

    const filteredPosts = blogPosts.filter(post => {
        const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const categoryColors = {
        Events: { bg: '#eff6ff', color: '#2563eb' },
        Achievements: { bg: '#fef3c7', color: '#d97706' },
        Campus: { bg: '#ecfdf5', color: '#059669' },
        Education: { bg: '#f5f3ff', color: '#7c3aed' }
    };

    // ── Full Post View ──
    if (selectedPost) {
        return (
            <div>
                <section style={{
                    background: 'var(--gradient-primary)',
                    color: 'white',
                    padding: '4rem 0 3rem',
                    textAlign: 'center'
                }}>
                    <div className="container">
                        <button
                            onClick={() => setSelectedPost(null)}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.5rem 1.2rem', borderRadius: '999px',
                                background: 'rgba(255,255,255,0.15)', color: 'white',
                                fontSize: '0.9rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                                marginBottom: '1.5rem', transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
                            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                        >
                            ← Back to Blog
                        </button>
                        <h1 style={{
                            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                            fontWeight: 800, marginBottom: '1rem',
                            maxWidth: '800px', margin: '0 auto 1rem'
                        }}>
                            {selectedPost.title}
                        </h1>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', opacity: 0.85, fontSize: '0.95rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={16} /> {selectedPost.author}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={16} /> {formatDate(selectedPost.date)}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={16} /> {selectedPost.readTime}</span>
                        </div>
                    </div>
                </section>

                <section className="section bg-white">
                    <div className="container" style={{ maxWidth: '800px' }}>
                        <div style={{
                            fontSize: '4rem', textAlign: 'center', marginBottom: '2rem',
                            background: '#f8fafc', borderRadius: '16px', padding: '2rem'
                        }}>
                            {selectedPost.image}
                        </div>
                        <div style={{ fontSize: '1.15rem', lineHeight: '1.9', color: 'var(--color-gray-700)' }}>
                            <p style={{ marginBottom: '1.5rem' }}>{selectedPost.excerpt}</p>
                            <p style={{ marginBottom: '1.5rem' }}>{selectedPost.content}</p>
                            <p>For more details, please contact the school administration or visit us during office hours. We look forward to sharing more updates and stories with our community.</p>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    // ── Blog Listing ──
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
                        School Blog
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.95, maxWidth: '600px', margin: '0 auto' }}>
                        Latest news, events, and stories from our school community
                    </p>
                </div>
            </section>

            {/* Filters & Posts */}
            <section className="section bg-white">
                <div className="container">
                    {/* Search & Category Filters */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2.5rem'
                    }}>
                        {/* Categories */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        padding: '0.5rem 1.25rem',
                                        borderRadius: '999px',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        border: '2px solid',
                                        borderColor: selectedCategory === cat ? 'var(--color-primary)' : '#e2e8f0',
                                        background: selectedCategory === cat ? 'var(--color-primary)' : 'white',
                                        color: selectedCategory === cat ? 'white' : 'var(--color-gray-600)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div style={{ position: 'relative', minWidth: '260px' }}>
                            <Search size={18} style={{
                                position: 'absolute', left: '14px', top: '50%',
                                transform: 'translateY(-50%)', color: '#94a3b8',
                                pointerEvents: 'none'
                            }} />
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.7rem 1rem 0.7rem 2.6rem',
                                    borderRadius: '12px',
                                    border: '2px solid #e2e8f0',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    background: '#f8fafc',
                                    transition: 'border-color 0.2s, box-shadow 0.2s'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; e.target.style.background = 'white'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                            />
                        </div>
                    </div>

                    {/* Posts Grid */}
                    {filteredPosts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-gray-400)' }}>
                            <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>No posts found</p>
                            <p style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>Try adjusting your search or category filter</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                            gap: '2rem'
                        }}>
                            {filteredPosts.map(post => {
                                const catColor = categoryColors[post.category] || { bg: '#f1f5f9', color: '#475569' };
                                return (
                                    <div
                                        key={post.id}
                                        className="card"
                                        style={{
                                            display: 'flex', flexDirection: 'column',
                                            transition: 'all 0.35s ease', cursor: 'pointer',
                                            border: '1px solid #f1f5f9', overflow: 'hidden',
                                            padding: 0
                                        }}
                                        onClick={() => setSelectedPost(post)}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = ''; }}
                                    >
                                        {/* Image placeholder */}
                                        <div style={{
                                            background: 'linear-gradient(135deg, #f0f7ff, #e8f0fc)',
                                            padding: '2rem', textAlign: 'center', fontSize: '3rem'
                                        }}>
                                            {post.image}
                                        </div>

                                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            {/* Category & Date */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem', borderRadius: '999px',
                                                    fontSize: '0.78rem', fontWeight: 700,
                                                    background: catColor.bg, color: catColor.color
                                                }}>
                                                    {post.category}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Clock size={13} /> {post.readTime}
                                                </span>
                                            </div>

                                            <h3 style={{
                                                fontSize: '1.15rem', fontWeight: 700,
                                                color: 'var(--color-gray-900)',
                                                marginBottom: '0.6rem', lineHeight: 1.4
                                            }}>
                                                {post.title}
                                            </h3>

                                            <p style={{
                                                color: 'var(--color-gray-600)',
                                                fontSize: '0.92rem', lineHeight: 1.65,
                                                flex: 1, marginBottom: '1rem'
                                            }}>
                                                {post.excerpt}
                                            </p>

                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between',
                                                alignItems: 'center', borderTop: '1px solid #f1f5f9',
                                                paddingTop: '0.75rem'
                                            }}>
                                                <span style={{ fontSize: '0.82rem', color: 'var(--color-gray-500)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Calendar size={13} /> {formatDate(post.date)}
                                                </span>
                                                <span style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                    color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem'
                                                }}>
                                                    Read More <ArrowRight size={14} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Blog;
