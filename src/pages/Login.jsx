import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { developerCredentials } from '../data/schoolData';
import { useSchoolData } from '../context/SchoolDataContext';

const Login = ({ setIsLoggedIn, setIsAdmin, setIsDeveloper, setCurrentPage, setLoggedInStudent }) => {
    const { schoolData, adminCredentials } = useSchoolData();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const { username, password } = credentials;

        // 1. Check Developer
        if (username === developerCredentials.username && password === developerCredentials.password) {
            setIsDeveloper(true);
            setCurrentPage('developer');
            return;
        }

        // 2. Check Admin (from database)
        if (
            adminCredentials.username &&
            username === adminCredentials.username &&
            password === adminCredentials.password
        ) {
            setIsAdmin(true);
            setCurrentPage('admin');
            return;
        }

        // 3. Check Student
        const student = schoolData.students.find(
            s => s.id === username && s.password === password
        );
        if (student) {
            setIsLoggedIn(true);
            setLoggedInStudent(student);
            setCurrentPage('portal');
            return;
        }

        // Nothing matched
        setError('Invalid credentials. Please check your ID and password.');
    };

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 80px)',
            background: 'var(--gradient-hero)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem'
        }}>
            <div
                className="card animate-fade-in"
                style={{
                    width: '100%',
                    maxWidth: '460px',
                    background: 'white',
                    padding: '3rem'
                }}
            >
                {/* Icon */}
                <div className="flex-center" style={{
                    width: '72px',
                    height: '72px',
                    background: 'var(--gradient-primary)',
                    borderRadius: '50%',
                    color: 'white',
                    margin: '0 auto 1.75rem'
                }}>
                    <LogIn size={34} />
                </div>

                <h2 style={{
                    fontSize: '1.9rem',
                    fontWeight: 'var(--font-weight-bold)',
                    textAlign: 'center',
                    marginBottom: '0.4rem',
                    color: 'var(--color-gray-900)'
                }}>
                    Welcome Back
                </h2>
                <p style={{
                    textAlign: 'center',
                    color: 'var(--color-gray-500)',
                    marginBottom: '2rem',
                    fontSize: '0.95rem'
                }}>
                    Enter your credentials to access your portal
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Username */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label">Username / Student ID</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{
                                position: 'absolute', left: '1rem', top: '50%',
                                transform: 'translateY(-50%)', color: 'var(--color-gray-400)'
                            }} />
                            <input
                                type="text"
                                name="username"
                                value={credentials.username}
                                onChange={handleChange}
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                                required
                                placeholder="Enter your ID or username"
                                autoComplete="username"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{
                                position: 'absolute', left: '1rem', top: '50%',
                                transform: 'translateY(-50%)', color: 'var(--color-gray-400)'
                            }} />
                            <input
                                type="password"
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                                required
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="animate-fade-in" style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid var(--color-danger)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.75rem 1rem',
                            marginBottom: '1.25rem',
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                            color: 'var(--color-danger)',
                            fontSize: '0.9rem'
                        }}>
                            <AlertCircle size={17} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                    >
                        <LogIn size={20} />
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
