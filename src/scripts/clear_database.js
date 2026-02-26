import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tables with integer id columns — use gt(0) to match all rows
const INT_ID_TABLES = ['faculty', 'facilities', 'testimonials', 'announcements', 'blogs', 'admins'];
// Tables with text id columns — use neq('') to match all rows
const TEXT_ID_TABLES = ['students', 'school_info'];
// Tables with 'key' as primary key instead of 'id'
const KEY_TABLES = ['metadata'];

const clearDatabase = async () => {
    try {
        console.log('🧹 Clearing all demo data from database...\n');

        // Clear integer-id tables
        for (const table of INT_ID_TABLES) {
            const { error } = await supabase
                .from(table)
                .delete()
                .gt('id', 0);

            if (error) {
                console.error(`  ❌ ${table}: ${error.message}`);
            } else {
                console.log(`  ✅ ${table}: cleared`);
            }
        }

        // Clear text-id tables
        for (const table of TEXT_ID_TABLES) {
            const { error } = await supabase
                .from(table)
                .delete()
                .neq('id', '');

            if (error) {
                console.error(`  ❌ ${table}: ${error.message}`);
            } else {
                console.log(`  ✅ ${table}: cleared`);
            }
        }

        // Clear key-based tables
        for (const table of KEY_TABLES) {
            const { error } = await supabase
                .from(table)
                .delete()
                .neq('key', '');

            if (error) {
                console.error(`  ❌ ${table}: ${error.message}`);
            } else {
                console.log(`  ✅ ${table}: cleared`);
            }
        }

        // Re-insert default admin so you can still log in
        const { error: adminErr } = await supabase
            .from('admins')
            .upsert({ username: 'admin', password: 'admin123', role: 'admin' }, { onConflict: 'username' });

        if (adminErr) {
            console.error('\n  ❌ Failed to re-insert default admin:', adminErr.message);
        } else {
            console.log('\n  🔑 Default admin re-inserted (admin / admin123)');
        }

        console.log('\n🎉 Database is now empty and ready for actual data!');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Clear failed:', err.message);
        process.exit(1);
    }
};

clearDatabase();
