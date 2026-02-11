import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { schoolData, adminCredentials } from '../data/schoolData';

const Login = ({ setIsLoggedIn, setIsAdmin, setCurrentPage, setLoggedInStudent }) => {
    const [loginType, setLoginType] = useState('student'); // 'student' or 'admin'
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (loginType === 'admin') {
            // Admin login
            if (credentials.username === adminCredentials.username &&
                credentials.password === adminCredentials.password) {
                setIsAdmin(true);
                setCurrentPage('admin');
            } else {
                setError('Invalid admin credentials');
            }
        } else {
            // Student login
            const student = schoolData.students.find(
                s => s.id === credentials.username && s.password === credentials.password
            );

            if (student) {
                setIsLoggedIn(true);
                setLoggedInStudent(student);
                setCurrentPage('portal');
            } else {
                setError('Invalid student credentials');
            }
        }
    };

    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
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
                    maxWidth: '480px',
                    background: 'white',
                    padding: '3rem'
                }}
            >
                <div className="flex-center" style={{
                    width: '70px',
                    height: '70px',
                    background: 'var(--gradient-primary)',
                    borderRadius: '50%',
                    color: 'white',
                    margin: '0 auto 2rem'
                }}>
                    <LogIn size={36} />
                </div>

                <h2 style={{
                    fontSize: '2rem',
                    fontWeight: 'var(--font-weight-bold)',
                    textAlign: 'center',
                    marginBottom: '0.5rem',
                    color: 'var(--color-gray-900)'
                }}>
                    Portal Login
                </h2>

                <p style={{
                    textAlign: 'center',
                    color: 'var(--color-gray-600)',
                    marginBottom: '2rem'
                }}>
                    Access your student portal or admin dashboard
                </p>

                {/* Login Type Toggle */}
                <div className="flex gap-2" style={{ marginBottom: '2rem' }}>
                    <button
                        onClick={() => {
                            setLoginType('student');
                            setError('');
                            setCredentials({ username: '', password: '' });
                        }}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            border: '2px solid',
                            borderColor: loginType === 'student' ? 'var(--color-primary)' : 'var(--color-gray-300)',
                            background: loginType === 'student' ? 'var(--color-primary)' : 'white',
                            color: loginType === 'student' ? 'white' : 'var(--color-gray-700)',
                            transition: 'all var(--transition-base)'
                        }}
                    >
                        Student
                    </button>
                    <button
                        onClick={() => {
                            setLoginType('admin');
                            setError('');
                            setCredentials({ username: '', password: '' });
                        }}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            border: '2px solid',
                            borderColor: loginType === 'admin' ? 'var(--color-primary)' : 'var(--color-gray-300)',
                            background: loginType === 'admin' ? 'var(--color-primary)' : 'white',
                            color: loginType === 'admin' ? 'white' : 'var(--color-gray-700)',
                            transition: 'all var(--transition-base)'
                        }}
                    >
                        Admin
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label">
                            {loginType === 'student' ? 'Student ID' : 'Username'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <User
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--color-gray-400)'
                                }}
                            />
                            <input
                                type="text"
                                name="username"
                                value={credentials.username}
                                onChange={handleChange}
                                className="form-input"
                                style={{ paddingLeft: '3rem' }}
                                required
                                placeholder={loginType === 'student' ? 'STU001' : 'admin'}
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--color-gray-400)'
                                }}
                            />
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

                    {error && (
                        <div
                            className="animate-fade-in"
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid var(--color-danger)',
                                borderRadius: 'var(--radius-md)',
                                padding: '0.75rem 1rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                color: 'var(--color-danger)'
                            }}
                        >
                            <AlertCircle size={18} />
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

                {/* Demo Credentials */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    background: 'var(--color-gray-50)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    color: 'var(--color-gray-600)'
                }}>
                    <strong style={{ color: 'var(--color-gray-900)', display: 'block', marginBottom: '0.5rem' }}>
                        Demo Credentials:
                    </strong>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Student:</strong> STU001 / demo123
                    </div>
                    <div>
                        <strong>Admin:</strong> admin / admin123
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
