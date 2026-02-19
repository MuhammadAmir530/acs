import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CLASSES as LOCAL_CLASSES } from '../data/schoolData';

const DEFAULT_SUBJECTS = ['Urdu', 'English', 'Mathematics', 'Science', 'Social Studies', 'Islamiyat', 'Computer'];
const DEFAULT_TERMS = ['Term 1', 'Term 2', 'Final Exam'];
// SUBJECT_TOTALS stored as WEIGHTS key: { subject: totalMarks } e.g. { "Mathematics": 100, "Physics": 85 }
// If a subject has no entry, falls back to DEFAULT_SUBJECT_TOTAL (100).
const DEFAULT_WEIGHTS = {};
const DEFAULT_SUBJECT_TOTAL = 100;

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
    const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
    const [terms, setTerms] = useState(DEFAULT_TERMS);
    const [sections, setSections] = useState([]); // New state for sections
    const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
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

            // 5. Get Metadata
            const { data: metaRows } = await supabase.from('metadata').select('*');
            const metaMap = {};
            (metaRows || []).forEach(r => { metaMap[r.key] = r.value; });

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

            if (metaMap['CLASSES']) setClasses(metaMap['CLASSES']);
            if (metaMap['SUBJECTS']) setSubjects(metaMap['SUBJECTS']);
            if (metaMap['TERMS']) setTerms(metaMap['TERMS']);
            if (metaMap['SECTIONS']) setSections(metaMap['SECTIONS']); // Load SECTIONS
            if (metaMap['WEIGHTS']) setWeights(metaMap['WEIGHTS']);

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
        if (!error) setClasses(newClassesList);
    };

    const updateSubjects = async (newSubjectsList) => {
        const { error } = await supabase.from('metadata').upsert({ key: 'SUBJECTS', value: newSubjectsList });
        if (!error) setSubjects(newSubjectsList);
    };

    const updateTerms = async (newTermsList) => {
        const { error } = await supabase.from('metadata').upsert({ key: 'TERMS', value: newTermsList });
        if (!error) setTerms(newTermsList);
    };

    const updateSections = async (newSectionsList) => {
        const { error } = await supabase.from('metadata').upsert({ key: 'SECTIONS', value: newSectionsList });
        if (!error) {
            setSections(newSectionsList);
            // fetchData(); // Optional: ensure sync
        }
        return { error };
    };

    const updateWeights = async (newWeights) => {
        const { error } = await supabase.from('metadata').upsert({ key: 'WEIGHTS', value: newWeights });
        if (!error) setWeights(newWeights);
    };

    return (
        <SchoolDataContext.Provider value={{
            schoolData: data,
            CLASSES: classes,
            SUBJECTS: subjects,
            TERMS: terms,
            SECTIONS: sections,
            WEIGHTS: weights,
            loading,
            fetchData,
            updateSchoolInfo,
            setFaculty,
            setFacilities,
            setStudents,
            setAnnouncements,
            setBlogs,
            updateClasses,
            updateSubjects,
            updateTerms,
            updateSections,
            updateWeights
        }}>
            {children}
        </SchoolDataContext.Provider>
    );
};
