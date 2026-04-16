import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://itdjkfubfzmvmuxxjoae.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyOTAsImV4cCI6MjA3Njc0MTI5MH0.j9Kfff56O2cWs5ocInVHaUFcaNTS7lrUNwsKBh2KIFM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function scan() {
    console.log('--- SCANNING ALL MODULES ---');
    const { data: modules, error } = await supabase
        .from('course_modules')
        .select('id, title, course_id');
    
    if (error) {
        console.error('ERROR:', error);
        return;
    }

    console.log('TOTAL MODULES:', modules.length);
    modules.forEach(m => {
        console.log(`[MODULE] ID: ${m.id} | Title: ${m.title} | CourseID: ${m.course_id}`);
    });

    console.log('--- SCANNING ALL COURSES ---');
    const { data: courses, error: cError } = await supabase
        .from('courses')
        .select('id, title');
    
    if (cError) {
        console.error('ERROR:', cError);
        return;
    }

    courses.forEach(c => {
        console.log(`[COURSE] ID: ${c.id} | Title: ${c.title}`);
    });
}

scan();
