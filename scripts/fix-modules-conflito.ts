import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://itdjkfubfzmvmuxxjoae.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyOTAsImV4cCI6MjA3Njc0MTI5MH0.j9Kfff56O2cWs5ocInVHaUFcaNTS7lrUNwsKBh2KIFM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const targetCourseId = 'e1771364-ba76-4ba6-b92a-7eacd2dcea9c';

async function scan() {
    console.log('--- SCANNING FOR COURSE:', targetCourseId, '---');

    console.log('\n[1] Checking "course_modules" table...');
    const { data: cm, error: e1 } = await supabase
        .from('course_modules')
        .select('id, title')
        .eq('course_id', targetCourseId);
    console.log('Found in course_modules:', cm?.length || 0);
    if (cm) cm.forEach(m => console.log(` - ID: ${m.id} | Title: ${m.title}`));

    console.log('\n[2] Checking "modules" table...');
    const { data: m, error: e2 } = await supabase
        .from('modules')
        .select('id, title')
        .eq('course_id', targetCourseId);
    console.log('Found in modules:', m?.length || 0);
    if (m) m.forEach(mod => console.log(` - ID: ${mod.id} | Title: ${mod.title}`));

    console.log('\n[3] Checking all lessons to see who they belong to...');
    const { data: l, error: e3 } = await supabase
        .from('lessons')
        .select('id, title, module_id')
        .limit(5);
    console.log('Sample Lessons:', l?.length || 0);
    if (l) l.forEach(lesson => console.log(` - Lesson: ${lesson.title} | ModuleID: ${lesson.module_id}`));
}

scan();
