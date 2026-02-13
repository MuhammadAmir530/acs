import React, { useState } from 'react';
import { Menu, X, School, LogIn } from 'lucide-react';

const Navbar = ({ currentPage, setCurrentPage, isLoggedIn, isAdmin, isTeacher }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'about', label: 'About Us' },
        { id: 'faculty', label: 'Faculty' },
        { id: 'facilities', label: 'Facilities' },
        { id: 'contact', label: 'Contact Us' }
    ];

    const handleNavClick = (page) => {
        setCurrentPage(page);
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="container">
                <div className="flex-between" style={{ height: '80px' }}>
                    {/* Logo */}
                    <div
                        className="flex gap-2"
                        style={{ cursor: 'pointer', alignItems: 'center' }}
                        onClick={() => handleNavClick('home')}
                    >
                        <div className="flex-center" style={{
                            width: '48px',
                            height: '48px',
                            background: 'var(--gradient-primary)',
                            borderRadius: '50%',
                            color: 'white'
                        }}>
                            <School size={28} />
                        </div>
                        <span style={{
                            fontSize: '1.25rem',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-gray-900)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            ACS School
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="flex gap-3" style={{
                        display: 'none',
                        alignItems: 'center'
                    }} id="desktop-menu">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: currentPage === item.id ? 'var(--color-primary)' : 'var(--color-gray-600)',
                                    transition: 'color var(--transition-base)',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
                                onMouseLeave={(e) => {
                                    if (currentPage !== item.id) e.target.style.color = 'var(--color-gray-600)';
                                }}
                            >
                                {item.label}
                                {currentPage === item.id && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '30px',
                                        height: '3px',
                                        background: 'var(--gradient-primary)',
                                        borderRadius: '2px'
                                    }} />
                                )}
                            </button>
                        ))}

                        <button
                            onClick={() => handleNavClick(
                                isLoggedIn ? 'portal' : isAdmin ? 'admin' : isTeacher ? 'teacher' : 'login'
                            )}
                            className="btn btn-primary btn-sm"
                            style={{ marginLeft: '0.5rem' }}
                        >
                            <LogIn size={18} />
                            {isLoggedIn ? 'Student Portal' : isAdmin ? 'Admin Panel' : isTeacher ? 'Teacher Portal' : 'Login'}
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{
                            display: 'none',
                            padding: '0.5rem',
                            color: 'var(--color-primary)'
                        }}
                        id="mobile-menu-btn"
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div
                    className="bg-white animate-fade-in"
                    style={{
                        display: 'none',
                        borderTop: '1px solid var(--color-gray-200)',
                        padding: '1rem 0'
                    }}
                    id="mobile-menu"
                >
                    <div className="container flex-col gap-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    textAlign: 'left',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: currentPage === item.id ? 'var(--color-primary)' : 'var(--color-gray-700)',
                                    background: currentPage === item.id ? 'var(--color-gray-50)' : 'transparent',
                                    borderRadius: 'var(--radius-md)',
                                    transition: 'all var(--transition-base)'
                                }}
                            >
                                {item.label}
                            </button>
                        ))}

                        <button
                            onClick={() => handleNavClick(
                                isLoggedIn ? 'portal' : isAdmin ? 'admin' : isTeacher ? 'teacher' : 'login'
                            )}
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '0.5rem' }}
                        >
                            <LogIn size={18} />
                            {isLoggedIn ? 'Student Portal' : isAdmin ? 'Admin Panel' : isTeacher ? 'Teacher Portal' : 'Login'}
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
        @media (min-width: 769px) {
          #desktop-menu {
            display: flex !important;
          }
        }
        
        @media (max-width: 768px) {
          #mobile-menu-btn {
            display: block !important;
          }
          
          #mobile-menu {
            display: block !important;
          }
        }
      `}</style>
        </nav>
    );
};

export default Navbar;
