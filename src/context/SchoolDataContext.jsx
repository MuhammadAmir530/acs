import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CLASSES as LOCAL_CLASSES } from '../data/schoolData';

const SchoolDataContext = createContext();

export const useSchoolData = () => {
    const context = useContext(SchoolDataContext);
    if (!context) {
        throw new Error('useSchoolData must be used within a SchoolDataProvider');
    }
    return context;
};

export const SchoolDataProvider = ({ children }) => {
    const [data, setData] = useState({
        name: '',
        tagline: '',
        description: '',
        about: {},
        contact: {},
        statistics: [],
        faculty: [],
        facilities: [],
        students: [],
        announcements: [],
        testimonials: [],
        blogs: []
    });
    const [classes, setClasses] = useState(LOCAL_CLASSES);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Get School Info
            const { data: info } = await supabase.from('school_info').select('*').single();

            // 2. Get Faculty
            const { data: faculty } = await supabase.from('faculty').select('*').order('id');

            // 3. Get Facilities
            const { data: facilities } = await supabase.from('facilities').select('*').order('id');

            // 4. Get Testimonials
            const { data: testimonials } = await supabase.from('testimonials').select('*');

            // 5. Get Metadata (Classes)
            const { data: meta } = await supabase.from('metadata').select('*').eq('key', 'CLASSES').single();

            // 6. Get Announcements
            const { data: announcements } = await supabase.from('announcements').select('*').order('id', { ascending: false });

            // 7. Get Students
            const { data: students } = await supabase.from('students').select('*');

            // 8. Get Blogs
            const { data: blogs } = await supabase.from('blogs').select('*').order('date', { ascending: false });

            setData(prev => ({
                ...prev,
                ...(info || {}),
                faculty: faculty || [],
                facilities: facilities || [],
                testimonials: testimonials || [],
                announcements: announcements || [],
                blogs: blogs || [],
                students: (students || []).map(s => ({
                    ...s,
                    photo: s.image,
                    feeStatus: s.fee_status,
                    previous_results: s.previous_results,
                    previousResults: s.previous_results // Fallback for camelCase
                }))
            }));

            if (meta) setClasses(meta.value);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Database Update Wrappers
    const updateSchoolInfo = async (updates) => {
        const { error } = await supabase.from('school_info').update(updates).eq('id', 'info');
        if (!error) fetchData();
    };

    const setFaculty = async (facultyList) => {
        const { error } = await supabase.from('faculty').upsert(facultyList);
        if (!error) fetchData();
    };

    const setFacilities = async (facilitiesList) => {
        const { error } = await supabase.from('facilities').upsert(facilitiesList);
        if (!error) fetchData();
    };

    const setStudents = async (studentsList) => {
        // Map back to snake_case for DB
        const dbStudents = studentsList.map(s => ({
            ...s,
            fee_status: s.feeStatus,
            previous_results: s.previousResults
        }));

        const { error } = await supabase.from('students').upsert(dbStudents);
        if (!error) fetchData();
    };

    const setAnnouncements = async (announcementsList) => {
        const { error } = await supabase.from('announcements').upsert(announcementsList);
        if (!error) fetchData();
    };

    const setBlogs = async (blogsList) => {
        const { error } = await supabase.from('blogs').upsert(blogsList);
        if (!error) fetchData();
    };

    const updateClasses = async (newClassesList) => {
        const { error } = await supabase.from('metadata').upsert({ key: 'CLASSES', value: newClassesList });
        if (!error) {
            setClasses(newClassesList);
        }
    };

    return (
        <SchoolDataContext.Provider value={{
            schoolData: data,
            CLASSES: classes,
            loading,
            fetchData,
            updateSchoolInfo,
            setFaculty,
            setFacilities,
            setStudents,
            setAnnouncements,
            setBlogs,
            updateClasses
        }}>
            {children}
        </SchoolDataContext.Provider>
    );
};
