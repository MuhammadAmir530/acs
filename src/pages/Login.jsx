import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { adminCredentials, developerCredentials } from '../data/schoolData';
import { useSchoolData } from '../context/SchoolDataContext';

const Login = ({ setIsLoggedIn, setIsAdmin, setIsDeveloper, setCurrentPage, setLoggedInStudent }) => {
    const { schoolData } = useSchoolData();
    const [loginType, setLoginType] = useState('student'); // 'student', 'admin', or 'developer'
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (loginType === 'developer') {
            if (credentials.username === developerCredentials.username &&
                credentials.password === developerCredentials.password) {
                setIsDeveloper(true);
                setCurrentPage('developer');
            } else {
                setError('Invalid developer credentials');
            }
        } else if (loginType === 'admin') {
            if (credentials.username === adminCredentials.username &&
                credentials.password === adminCredentials.password) {
                setIsAdmin(true);
                setCurrentPage('admin');
            } else {
                setError('Invalid admin credentials');
            }
        } else {
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

    const loginTypes = [
        { id: 'student', label: 'Student' },
        { id: 'admin', label: 'Admin' },
        { id: 'developer', label: 'Developer' }
    ];

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
                    Access your student, admin, or developer portal
                </p>

                {/* Login Type Toggle - 3 way */}
                <div className="flex gap-2" style={{ marginBottom: '2rem' }}>
                    {loginTypes.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => {
                                setLoginType(type.id);
                                setError('');
                                setCredentials({ username: '', password: '' });
                            }}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-lg)',
                                fontWeight: 'var(--font-weight-semibold)',
                                border: '2px solid',
                                borderColor: loginType === type.id ? 'var(--color-primary)' : 'var(--color-gray-300)',
                                background: loginType === type.id ? 'var(--color-primary)' : 'white',
                                color: loginType === type.id ? 'white' : 'var(--color-gray-700)',
                                transition: 'all var(--transition-base)',
                                fontSize: '0.9rem'
                            }}
                        >
                            {type.label}
                        </button>
                    ))}
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
                                placeholder={loginType === 'student' ? 'STU001' : loginType === 'admin' ? 'admin' : 'developer'}
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
                    <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Admin:</strong> admin / admin123
                    </div>
                    <div>
                        <strong>Developer:</strong> ****** / ******
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
