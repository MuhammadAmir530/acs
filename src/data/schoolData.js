export const schoolData = {
    name: "ACS Higher Secondary School",
    tagline: "Ready to Lead.  Ready to Inspire.",
    description: "A world-class education that empowers students to reach their full potential.",

    contact: {
        phone: "0300 1333275",
        email: "Infoacspainsra@gmail.com",
        address: "ACS Higher Secondary School, Jhang Road Painsra, Pakistan",
        hours: "Monday - Saturday: 7:30 AM - 2:30 PM"
    },

    about: {
        mission: "To inspire the world's next global thinkers through a challenging, innovative curriculum that develops critical thinking, creativity, and leadership skills.",
        vision: "Creating a caring, inclusive community where every individual is empowered to reach their full potential and become a responsible global citizen.",
        values: [
            "Excellence in Education",
            "Integrity and Respect",
            "Innovation and Creativity",
            "Community and Collaboration",
            "Global Citizenship"
        ],
        history: "Founded on excellence, ACS Higher Secondary School has grown to become a premier educational institution, providing quality education and fostering academic excellence.",
        accreditations: [
            "Council of International Schools (CIS)",
            "New England Association of Schools and Colleges (NEASC)",
            "International Baccalaureate (IB) World School"
        ]
    },

    statistics: [
        { value: "0+", label: "Students" },
        { value: "0+", label: "Alumni" },
        { value: "0", label: "Expert Staff" },
        { value: "100%", label: "University Acceptance" }
    ],

    faculty: [
        {
            id: 1,
            name: "Dr. Robert Mitchell",
            role: "Head of School",
            department: "Administration",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
            bio: "20+ years of educational leadership experience"
        },
        {
            id: 2,
            name: "Sarah Jenkins",
            role: "Dean of Academics",
            department: "Academic Leadership",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
            bio: "Former IB coordinator with expertise in curriculum development"
        },
        {
            id: 3,
            name: "Ahmed Al-Mansouri",
            role: "Head of Science Department",
            department: "Science",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
            bio: "PhD in Chemistry, published researcher"
        },
        {
            id: 4,
            name: "Emily Chen",
            role: "Head of Mathematics",
            department: "Mathematics",
            image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
            bio: "International Math Olympiad coach"
        },
        {
            id: 5,
            name: "James O'Connor",
            role: "Director of Sports",
            department: "Athletics",
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
            bio: "Former professional athlete and certified sports coach"
        },
        {
            id: 6,
            name: "Fatima Hassan",
            role: "Head of Arts Department",
            department: "Fine Arts",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
            bio: "Award-winning artist and art educator"
        }
    ],

    facilities: [
        {
            id: 1,
            name: "Modern Library",
            description: "State-of-the-art library with over 20,000 books and digital resources",
            image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=600&fit=crop",
            category: "Academic"
        },
        {
            id: 2,
            name: "Science Laboratories",
            description: "Fully equipped physics, chemistry, and biology labs with cutting-edge technology",
            image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
            category: "Academic"
        },
        {
            id: 3,
            name: "Sports Complex",
            description: "Olympic-size swimming pool, indoor courts, and athletics track",
            image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop",
            category: "Sports"
        },
        {
            id: 4,
            name: "Performing Arts Theater",
            description: "Professional 500-seat theater with advanced sound and lighting systems",
            image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop",
            category: "Arts"
        },
        {
            id: 5,
            name: "Computer Labs",
            description: "High-tech computer labs with the latest software and programming tools",
            image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop",
            category: "Technology"
        },
        {
            id: 6,
            name: "Cafeteria",
            description: "Spacious dining hall serving nutritious, international cuisine",
            image: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&h=600&fit=crop",
            category: "Facilities"
        }
    ],

    testimonials: [
        {
            id: 1,
            name: "Muhammad Amir",
            role: "Alumni",
            text: "ACS has transformed my education. The teachers are dedicated and the facilities are world-class.",
            rating: 5
        },
        {
            id: 2,
            name: "Muhammad Ali",
            role: "Alumni, Class of 2023",
            text: "The IB program here prepared me perfectly for university. I'm now studying at Cambridge thanks to ACS.",
            rating: 5
        },
        {
            id: 3,
            name: "Hafiz Muhammad Usman",
            role: "Current Student",
            text: "I love the diversity here. I've made friends from all over the world and learned so much about different cultures.",
            rating: 5
        }
    ],

    // Demo student data for portal
    students: [
        {
            id: "STU001",
            password: "demo123",
            name: "John Smith",
            grade: "Grade 11",
            results: [
                { subject: "Mathematics", grade: "A", percentage: 92 },
                { subject: "Physics", grade: "A-", percentage: 88 },
                { subject: "English Literature", grade: "B+", percentage: 85 },
                { subject: "History", grade: "A", percentage: 90 },
                { subject: "Chemistry", grade: "A-", percentage: 87 }
            ],
            attendance: {
                present: 172,
                absent: 3,
                total: 175,
                percentage: 98.3
            },
            schedule: [
                { day: "Sunday", periods: ["Math", "Physics", "English", "History", "Break", "Chemistry"] },
                { day: "Monday", periods: ["English", "Math", "PE", "Chemistry", "Break", "Physics"] },
                { day: "Tuesday", periods: ["History", "Chemistry", "Math", "English", "Break", "Art"] },
                { day: "Wednesday", periods: ["Physics", "English", "History", "Math", "Break", "Music"] },
                { day: "Thursday", periods: ["Chemistry", "Math", "Physics", "English", "Break", "Study Hall"] }
            ]
        }
    ]
};

// Admin credentials
export const adminCredentials = {
    username: "admin",
    password: "admin123"
};
