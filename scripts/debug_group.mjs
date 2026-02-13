
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkqtzvvvrbdzhxepsiox.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXR6dnZ2cmJkemh4ZXBzaW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTE0NDIsImV4cCI6MjA4NDc2NzQ0Mn0.BqDs0LkZr4oVKbXZZ754W86Jegm9eVGPiTSHTH28AqI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching a project...');
    const { data: projects, error: pError } = await supabase.from('proyectos').select('id').limit(1);
    if (pError) {
        console.error('Error fetching project:', pError);
        return;
    }
    if (!projects || projects.length === 0) {
        console.error('No projects found');
        return;
    }
    const projectId = projects[0].id;
    console.log('Using project ID:', projectId);

    console.log('Attempting to create group without departamento...');
    const { data, error } = await supabase.from('grupos').insert([{
        nombre: 'Grupo Test Debug No Desc',
        // descripcion: 'Test from script',
        proyecto_id: projectId,
        estado: 'En progreso',
        miembros: ['Test User'],
        progreso: 0,
        interacciones_ia: 0
    }]).select();

    if (error) {
        console.error('INSERT FAILED:', error);
    } else {
        console.log('INSERT SUCCESS:', data);
    }
}

run();
