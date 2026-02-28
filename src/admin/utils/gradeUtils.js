// ── Grade & Result Utility Functions ──
// Used across Gradebook, PDF Report, Student Report tabs.

export const calcGrade = (pct) => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
};

export const gradeColor = (pct) => {
    if (pct >= 80) return { bg: '#dcfce7', text: '#15803d' };
    if (pct >= 60) return { bg: '#dbeafe', text: '#1d4ed8' };
    if (pct >= 50) return { bg: '#fef9c3', text: '#a16207' };
    if (pct >= 40) return { bg: '#ffedd5', text: '#c2410c' };
    return { bg: '#fee2e2', text: '#dc2626' };
};

export const calcOverallPct = (results, getSubjectTotal) => {
    if (!results || results.length === 0) return 0;
    let totalObtained = 0, totalMax = 0;
    results.forEach(r => {
        const subTotal = getSubjectTotal(r.subject);
        const obtained = r.obtained !== undefined ? r.obtained : Math.round((r.percentage / 100) * subTotal);
        totalObtained += obtained;
        totalMax += subTotal;
    });
    return totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
};

export const getTermResults = (student, termLabel) =>
    (student.results || []).filter(r => r.term === termLabel);

export const filterByGender = (studentsList, genderTab) => {
    if (genderTab === 'all') return studentsList;
    const genderVal = genderTab === 'boys' ? 'Male' : 'Female';
    return studentsList.filter(s => s.admissions?.[0]?.gender === genderVal);
};
