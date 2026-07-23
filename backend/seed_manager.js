require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function seedManager() {
  const email = 'manager@taskpilot.com';
  const password = 'manager@123';
  
  try {
    console.log(`Checking if ${email} exists...`);
    
    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { name: 'System Manager' }
    });

    let userId = null;

    if (authError) {
      if (authError.message.includes('already exists')) {
        console.log('Auth user already exists. Fetching ID...');
        // We can't fetch easily without listing users, but let's try to update the password if it exists
        // Wait, if it exists, let's just create a new unique admin email or instruct the user.
        // Actually, let's list users to find it.
        const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = usersData.users.find(u => u.email === email);
        if (existingUser) {
          userId = existingUser.id;
          // Update password just in case
          await supabaseAdmin.auth.admin.updateUserById(userId, { password: password });
          console.log(`Updated existing auth user password.`);
        } else {
           throw new Error('User exists but cannot be found in list.');
        }
      } else {
        throw authError;
      }
    } else {
      userId = authData.user.id;
      console.log(`Successfully created auth user: ${userId}`);
    }

    // 2. Upsert into public.employees
    console.log(`Upserting profile into public.employees...`);
    const { error: empError } = await supabaseAdmin
      .from('employees')
      .upsert({
        id: userId,
        name: 'System Manager',
        email: email,
        designation: 'General Manager',
        department: 'Management',
        status: 'Active',
        requires_password_change: false // Manager doesn't need force reset for this demo
      });

    if (empError) throw empError;

    console.log(`\n✅ Manager Account Ready!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error seeding manager:', error.message);
    process.exit(1);
  }
}

seedManager();
