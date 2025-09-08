require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReferenceData() {
  try {
    console.log('=== VERIFICANDO DATOS DE REFERENCIA ===\n');
    
    // 1. Verificar recursos
    console.log('1. Verificando tabla resources...');
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .limit(5);
    
    if (resourcesError) {
      console.log('❌ Error al acceder a resources:', resourcesError);
    } else {
      console.log('✅ Tabla resources accesible');
      console.log('- Total de recursos encontrados:', resources.length);
      if (resources.length > 0) {
        console.log('- Primer recurso:', resources[0].name || resources[0].id);
      } else {
        console.log('⚠️ No hay recursos en la base de datos');
      }
    }
    
    // 2. Verificar usuarios
    console.log('\n2. Verificando tabla users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Error al acceder a users:', usersError);
    } else {
      console.log('✅ Tabla users accesible');
      console.log('- Total de usuarios encontrados:', users.length);
      if (users.length > 0) {
        console.log('- Primer usuario:', users[0].name || users[0].email || users[0].id);
      } else {
        console.log('⚠️ No hay usuarios en la base de datos');
      }
    }
    
    // 3. Verificar otras tablas relacionadas
    console.log('\n3. Verificando otras tablas relacionadas...');
    
    const tables = ['grades', 'sections', 'areas', 'categories'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(3);
        
        if (error) {
          console.log(`❌ Error al acceder a ${table}:`, error.message);
        } else {
          console.log(`✅ Tabla ${table}: ${data.length} registros`);
        }
      } catch (err) {
        console.log(`❌ Error al verificar ${table}:`, err.message);
      }
    }
    
    // 4. Crear datos de prueba si no existen
    if (resources.length === 0 || users.length === 0) {
      console.log('\n4. Creando datos de prueba...');
      
      // Crear categoría si no existe
      let category;
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('*')
        .limit(1);
      
      if (existingCategories && existingCategories.length > 0) {
        category = existingCategories[0];
        console.log('✅ Usando categoría existente:', category.name);
      } else {
        const { data: newCategory, error: categoryError } = await supabase
          .from('categories')
          .insert({
            name: 'Electrónicos',
            description: 'Dispositivos electrónicos y tecnológicos'
          })
          .select()
          .single();
        
        if (categoryError) {
          console.log('❌ Error al crear categoría:', categoryError);
          return;
        } else {
          category = newCategory;
          console.log('✅ Categoría creada:', category.name);
        }
      }
      
      // Crear usuario de prueba si no existe
      if (users.length === 0) {
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            name: 'Usuario de Prueba',
            email: 'prueba@test.com',
            role: 'user'
          })
          .select()
          .single();
        
        if (userError) {
          console.log('❌ Error al crear usuario:', userError);
        } else {
          console.log('✅ Usuario de prueba creado:', newUser.name);
        }
      }
      
      // Crear recurso de prueba si no existe
      if (resources.length === 0) {
        const { data: newResource, error: resourceError } = await supabase
          .from('resources')
          .insert({
            name: 'Laptop de Prueba',
            category_id: category.id,
            status: 'Disponible',
            location: 'Laboratorio 1',
            description: 'Laptop para pruebas del sistema'
          })
          .select()
          .single();
        
        if (resourceError) {
          console.log('❌ Error al crear recurso:', resourceError);
        } else {
          console.log('✅ Recurso de prueba creado:', newResource.name);
        }
      }
    }
    
    // 5. Verificación final
    console.log('\n5. Verificación final de datos...');
    
    const { data: finalResources } = await supabase
      .from('resources')
      .select('*')
      .limit(1);
    
    const { data: finalUsers } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (finalResources && finalResources.length > 0 && finalUsers && finalUsers.length > 0) {
      console.log('✅ Datos de referencia disponibles:');
      console.log('- Recurso:', finalResources[0].name || finalResources[0].id);
      console.log('- Usuario:', finalUsers[0].name || finalUsers[0].email || finalUsers[0].id);
      console.log('\n🎉 Listo para probar incidencias!');
    } else {
      console.log('❌ Aún faltan datos de referencia');
      console.log('\n📋 ACCIONES REQUERIDAS:');
      
      if (!finalResources || finalResources.length === 0) {
        console.log('\n🔧 SQL para crear recursos de prueba:');
        console.log('```sql');
        console.log('-- Crear categoría si no existe');
        console.log("INSERT INTO categories (name, description) VALUES ('Electrónicos', 'Dispositivos electrónicos') ON CONFLICT DO NOTHING;");
        console.log('');
        console.log('-- Crear recurso de prueba');
        console.log("INSERT INTO resources (name, category_id, status, location, description)");
        console.log("VALUES ('Laptop de Prueba', (SELECT id FROM categories WHERE name = 'Electrónicos' LIMIT 1), 'Disponible', 'Laboratorio 1', 'Laptop para pruebas');");
        console.log('```');
      }
      
      if (!finalUsers || finalUsers.length === 0) {
        console.log('\n🔧 SQL para crear usuarios de prueba:');
        console.log('```sql');
        console.log('-- Crear usuario de prueba');
        console.log("INSERT INTO users (name, email, role) VALUES ('Usuario de Prueba', 'prueba@test.com', 'user');");
        console.log('```');
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkReferenceData();