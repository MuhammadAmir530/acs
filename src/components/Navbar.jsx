import React, { useState } from 'react';
import { Menu, X, School, LogIn } from 'lucide-react';
import { useSchoolData } from '../context/SchoolDataContext';

const Navbar = ({ currentPage, setCurrentPage, isLoggedIn, isAdmin, isDeveloper }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { schoolData } = useSchoolData(); // Get school name/logo from context

    const navItems = [
        { id: 'home', label: 'Home' },
        { id: 'about', label: 'About' },
        { id: 'faculty', label: 'Faculty' },
        { id: 'facilities', label: 'Facilities' },
        { id: 'blog', label: 'Blog' },
        { id: 'contact', label: 'Contact' }
    ];

    return (
        <nav style={{
            background: 'linear-gradient(90deg, #0f172a 0%, #1e3a5f 100%)',
            color: 'white',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>
                {/* Logo & Name */}
                <div
                    onClick={() => setCurrentPage('home')}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                >
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        <img
                            src="/logo.png"
                            alt="ACS Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div style={{
                            display: 'none',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>🎓</span>
                        </div>
                    </div>
                    <div style={{ lineHeight: 1.2 }}>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>ACS</h1>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 300, letterSpacing: '1px' }}>SCHOOL & COLLEGE</span>
                    </div>
                </div>

                {/* Right Side Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Desktop Login Button */}
                    <div className="hidden md:flex">
                        <button
                            onClick={() => setCurrentPage(isLoggedIn ? 'portal' : isAdmin ? 'admin' : isDeveloper ? 'developer' : 'login')}
                            className="btn btn-primary"
                            style={{
                                padding: '0.6rem 1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                borderRadius: '50px',
                                fontWeight: 600
                            }}
                        >
                            {isLoggedIn ? <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%' }} /> : <LogIn size={18} />}
                            {isLoggedIn ? 'Student Portal' : isAdmin ? 'Admin Portal' : isDeveloper ? 'Developer Panel' : 'Login'}
                        </button>
                    </div>

                    {/* Menu Button (Always Visible) */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        style={{ color: 'white', display: 'flex', alignItems: 'center' }}
                    >
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Navigation Menu Dropdown (All Screens) */}
            {isOpen && (
                <div className="animate-fade-in" style={{
                    position: 'absolute',
                    top: '80px',
                    left: 0,
                    width: '100%',
                    background: '#1e3a5f',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    padding: '1rem'
                }}>
                    <div className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setCurrentPage(item.id);
                                    setIsOpen(false);
                                }}
                                style={{
                                    padding: '1rem',
                                    textAlign: 'left',
                                    borderRadius: '8px',
                                    background: currentPage === item.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: currentPage === item.id ? '#fbbf24' : 'white',
                                    fontWeight: currentPage === item.id ? 600 : 400
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
                        <button
                            onClick={() => {
                                setCurrentPage(isLoggedIn ? 'portal' : isAdmin ? 'admin' : isDeveloper ? 'developer' : 'login');
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '1rem',
                                textAlign: 'left',
                                borderRadius: '8px',
                                background: 'rgba(37,99,235,0.2)',
                                color: '#60a5fa',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <LogIn size={18} />
                            {isLoggedIn ? 'Student Portal' : isAdmin ? 'Admin Portal' : isDeveloper ? 'Developer Panel' : 'Login'}
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
