import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// All tables to back up
const TABLES = [
    'students',
    'faculty',
    'facilities',
    'testimonials',
    'announcements',
    'blogs',
    'school_info',
    'metadata',
    'admins'
];

const backupDatabase = async () => {
    try {
        console.log('🔄 Starting database backup...\n');

        const backup = {
            timestamp: new Date().toISOString(),
            tables: {}
        };

        for (const table of TABLES) {
            const { data, error } = await supabase
                .from(table)
                .select('*');

            if (error) {
                console.error(`  ❌ Error backing up ${table}:`, error.message);
                backup.tables[table] = { error: error.message, data: [] };
            } else {
                backup.tables[table] = data;
                console.log(`  ✅ ${table}: ${data.length} rows`);
            }
        }

        // Create backups directory if it doesn't exist
        const backupDir = path.resolve('backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Generate timestamped filename
        const timestamp = new Date().toISOString()
            .replace(/:/g, '-')
            .replace(/\..+/, '');
        const filename = `backup_${timestamp}.json`;
        const filepath = path.join(backupDir, filename);

        // Write backup file
        fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf-8');

        console.log(`\n🎉 Backup saved to: ${filepath}`);
        console.log(`   File size: ${(fs.statSync(filepath).size / 1024).toFixed(1)} KB`);

        // Keep only last 30 backups (auto-cleanup)
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
            .sort();

        if (files.length > 30) {
            const toDelete = files.slice(0, files.length - 30);
            toDelete.forEach(f => {
                fs.unlinkSync(path.join(backupDir, f));
                console.log(`   🗑️  Deleted old backup: ${f}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Backup failed:', err.message);
        process.exit(1);
    }
};

backupDatabase();
