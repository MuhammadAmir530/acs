import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Faculty from './pages/Faculty';
import Facilities from './pages/Facilities';
import Contact from './pages/Contact';
import Login from './pages/Login';
import StudentPortal from './pages/StudentPortal';
import AdminPanel from './pages/AdminPanel';

function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loggedInStudent, setLoggedInStudent] = useState(null);

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <Home setCurrentPage={setCurrentPage} />;
            case 'about':
                return <About />;
            case 'faculty':
                return <Faculty isAdmin={isAdmin} />;
            case 'facilities':
                return <Facilities />;
            case 'contact':
                return <Contact />;
            case 'login':
                return (
                    <Login
                        setIsLoggedIn={setIsLoggedIn}
                        setIsAdmin={setIsAdmin}
                        setCurrentPage={setCurrentPage}
                        setLoggedInStudent={setLoggedInStudent}
                    />
                );
            case 'portal':
                return (
                    <StudentPortal
                        student={loggedInStudent}
                        setIsLoggedIn={setIsLoggedIn}
                        setCurrentPage={setCurrentPage}
                        setLoggedInStudent={setLoggedInStudent}
                    />
                );
            case 'admin':
                return (
                    <AdminPanel
                        setIsAdmin={setIsAdmin}
                        setCurrentPage={setCurrentPage}
                    />
                );
            default:
                return <Home setCurrentPage={setCurrentPage} />;
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
            />
            <main style={{ flex: 1 }}>
                {renderPage()}
            </main>
            <Footer />
        </div>
    );
}

export default App;
