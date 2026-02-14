import React, { createContext, useContext, useState } from 'react';
import { schoolData as initialData } from '../data/schoolData';

const SchoolDataContext = createContext();

export const useSchoolData = () => {
    const context = useContext(SchoolDataContext);
    if (!context) {
        throw new Error('useSchoolData must be used within a SchoolDataProvider');
    }
    return context;
};

export const SchoolDataProvider = ({ children }) => {
    const [data, setData] = useState({ ...initialData });

    // Update specific fields
    const updateSchoolInfo = (updates) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const updateAbout = (aboutUpdates) => {
        setData(prev => ({
            ...prev,
            about: { ...prev.about, ...aboutUpdates }
        }));
    };

    const updateContact = (contactUpdates) => {
        setData(prev => ({
            ...prev,
            contact: { ...prev.contact, ...contactUpdates }
        }));
    };

    const setFaculty = (facultyList) => {
        setData(prev => ({ ...prev, faculty: facultyList }));
    };

    const setFacilities = (facilitiesList) => {
        setData(prev => ({ ...prev, facilities: facilitiesList }));
    };

    const setStudents = (studentsList) => {
        setData(prev => ({ ...prev, students: studentsList }));
    };

    const setAnnouncements = (announcementsList) => {
        setData(prev => ({ ...prev, announcements: announcementsList }));
    };

    return (
        <SchoolDataContext.Provider value={{
            schoolData: data,
            updateSchoolInfo,
            updateAbout,
            updateContact,
            setFaculty,
            setFacilities,
            setStudents,
            setAnnouncements
        }}>
            {children}
        </SchoolDataContext.Provider>
    );
};
