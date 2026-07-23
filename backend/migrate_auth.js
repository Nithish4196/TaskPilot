require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const targetEmails = [
  'magesh28@gmail.com',
  'sathiya50@gmail.com',
  'ajay06@gmail.com',
  'lokesh25@gmail.com',
  'kit27.cse36+1@gmail.com',
  'kit27.cse36@gmail.com'
];

const defaultPassword = 'password@123';

async function migrateAuth() {
  console.log('Starting authentication creation for existing employees...');

  // 1. Fetch existing employees
  const { data: employees, error: fetchError } = await supabaseAdmin
    .from('employees')
    .select('id, email, name')
    .in('email', targetEmails);

  if (fetchError) {
    console.error('Error fetching employees:', fetchError);
    return;
  }

  console.log(`Found ${employees.length} employees to migrate.`);

  for (const emp of employees) {
    console.log(`\nProcessing ${emp.email} (ID: ${emp.id})...`);
    try {
      // 2. Create the auth user with the EXACT SAME ID as the existing employee row
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        id: emp.id,
        email: emp.email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { name: emp.name }
      });

      if (authError) {
        if (authError.message.includes('already exists')) {
          console.log(`Auth account already exists for ${emp.email}. Updating password...`);
          await supabaseAdmin.auth.admin.updateUserById(emp.id, { password: defaultPassword });
        } else {
          throw authError;
        }
      } else {
        console.log(`Created auth account successfully.`);
      }

      // 3. Ensure requires_password_change is false for testing convenience
      await supabaseAdmin
        .from('employees')
        .update({ requires_password_change: false })
        .eq('id', emp.id);
        
      console.log(`Updated profile flag.`);

    } catch (err) {
      console.error(`Failed to process ${emp.email}:`, err.message);
    }
  }

  console.log('\nMigration complete!');
  process.exit(0);
}

migrateAuth();
