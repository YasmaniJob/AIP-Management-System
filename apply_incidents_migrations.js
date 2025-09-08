require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixIncidentsTable() {
  try {
    console.log('Fixing incidents table structure...');
    
    // 1. Verificar estructura actual
    console.log('\n1. Checking current table structure...');
    const { data: testSelect, error: selectError } = await supabase
      .from('incidents')
      .select('*')
      .limit(1);
      
    if (selectError) {
      console.error('Error accessing incidents table:', selectError);
      return;
    }
    
    console.log('Incidents table is accessible');
    
    // 2. Intentar insertar con estructura mínima para identificar columnas faltantes
    console.log('\n2. Testing minimal insert...');
    
    // Obtener un usuario y recurso válidos
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const { data: resources } = await supabase.from('resources').select('id').limit(1);
    
    if (!users || users.length === 0) {
      console.log('No users found, cannot test');
      return;
    }
    
    if (!resources || resources.length === 0) {
      console.log('No resources found, cannot test');
      return;
    }
    
    // Probar inserción con todos los campos requeridos
    const testIncident = {
      resource_id: resources[0].id,
      title: 'Test incident - Structure check',
      description: 'Test description',
      type: 'Daño',
      reported_by: users[0].id,
      status: 'Reportado'
    };
    
    console.log('Attempting to insert test incident...');
    const { data: insertResult, error: insertError } = await supabase
      .from('incidents')
      .insert(testIncident)
      .select();
      
    if (insertError) {
      console.error('Insert failed:', insertError);
      
      // Analizar el error para determinar qué columnas faltan
      if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
        console.log('\n❌ The incidents table is missing required columns.');
        console.log('\n📋 Required SQL to fix the table:');
        console.log('\n-- Copy and paste this SQL into Supabase SQL Editor:');
        console.log('\n-- 1. Drop the existing incomplete table');
        console.log('DROP TABLE IF EXISTS public.incidents CASCADE;');
        console.log('\n-- 2. Create the complete incidents table');
        console.log(`
CREATE TABLE public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Reportado' CHECK (status IN ('Reportado', 'En Revisión', 'Resuelto')),
    type TEXT NOT NULL DEFAULT 'Daño' CHECK (type IN ('Daño', 'Sugerencia', 'Mantenimiento', 'Hardware', 'Software', 'Otro')),
    reporter_grade_id UUID REFERENCES public.grades(id),
    reporter_section_id UUID REFERENCES public.sections(id),
    reporter_area_id UUID REFERENCES public.areas(id),
    booking_context JSONB,
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`);
        console.log('\n-- 3. Create indexes');
        console.log(`
CREATE INDEX idx_incidents_resource_id ON public.incidents(resource_id);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_type ON public.incidents(type);
CREATE INDEX idx_incidents_reporter_grade ON public.incidents(reporter_grade_id);
CREATE INDEX idx_incidents_reporter_section ON public.incidents(reporter_section_id);
CREATE INDEX idx_incidents_reporter_area ON public.incidents(reporter_area_id);
CREATE INDEX idx_incidents_booking_context ON public.incidents USING GIN(booking_context);`);
        console.log('\n-- 4. Enable RLS and create policies');
        console.log(`
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage incidents" ON public.incidents FOR ALL USING (true);`);
        console.log('\n-- 5. Add triggers');
        console.log(`
-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`);
        
        console.log('\n\n🔧 After running the SQL above, test the incidents creation again.');
      } else if (insertError.message.includes('violates not-null constraint')) {
        console.log('\n❌ Missing required fields in insert');
        console.log('Error details:', insertError);
      } else {
        console.log('\n❌ Unknown insert error:', insertError);
      }
    } else {
      console.log('\n✅ Test incident created successfully!');
      console.log('Incident ID:', insertResult[0].id);
      
      // Limpiar el registro de prueba
      await supabase.from('incidents').delete().eq('id', insertResult[0].id);
      console.log('Test incident cleaned up');
      
      console.log('\n🎉 Incidents table is working correctly!');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixIncidentsTable();