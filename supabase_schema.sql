-- CLEAN START: Drop existing tables if they exist
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS faculty;
DROP TABLE IF EXISTS facilities;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS school_info;
DROP TABLE IF EXISTS metadata;
DROP TABLE IF EXISTS announcements;

-- 1. School Info Table
CREATE TABLE school_info (
    id TEXT PRIMARY KEY DEFAULT 'info',
    name TEXT,
    tagline TEXT,
    description TEXT,
    contact JSONB,
    about JSONB,
    statistics JSONB
);

-- 2. Faculty Table
CREATE TABLE faculty (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    department TEXT,
    image TEXT,
    bio TEXT
);

-- 3. Facilities Table
CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    category TEXT
);

-- 4. Testimonials Table
CREATE TABLE testimonials (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    text TEXT,
    rating INTEGER
);

-- 5. Students Table
CREATE TABLE students (
    id TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    grade TEXT,
    image TEXT,
    fee_status TEXT,
    results JSONB DEFAULT '[]',
    attendance JSONB DEFAULT '{}',
    previous_results JSONB DEFAULT '[]',
    admissions JSONB DEFAULT '[]'
);

-- 6. Metadata Table (for classes, etc.)
CREATE TABLE metadata (
    key TEXT PRIMARY KEY,
    value JSONB
);

-- 7. Announcements Table
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    date TEXT,
    type TEXT,
    active BOOLEAN DEFAULT true
);
