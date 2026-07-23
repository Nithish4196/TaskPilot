require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

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

// ----------------------------------------------------
// Create Employee via Supabase Admin API
// ----------------------------------------------------
app.post('/api/employees/create', async (req, res) => {
  try {
    const data = req.body;
    
    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: { name: data.name }
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        return res.status(400).json({ error: 'An employee with this email already exists.' });
      }
      throw authError;
    }

    const userId = authData.user.id;

    // 2. Insert into public.employees with the exact auth ID
    const { error: empError } = await supabaseAdmin
      .from('employees')
      .insert([{
        id: userId,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        department: data.orgAssignment?.department,
        designation: data.orgAssignment?.designation,
        institution: data.orgAssignment?.institution,
        team: data.orgAssignment?.team,
        reporting_manager: data.orgAssignment?.reportingManager,
        employment_type: data.orgAssignment?.employmentType,
        date_of_joining: data.orgAssignment?.dateOfJoining,
        status: 'Active',
        requires_password_change: true,
        personal_info: data.personalInfo,
        skills: data.skills,
        experience: data.experience,
        projects: data.projects,
        education: data.education,
        certifications: data.certifications
      }]);

    if (empError) throw empError;

    res.status(201).json({ success: true, employeeId: userId });

  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ----------------------------------------------------
// Soft Delete Employee (Manager Only)
// ----------------------------------------------------
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Delete from Supabase Auth (Hard delete to prevent login)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError && !authError.message.includes('not found')) {
      throw authError;
    }

    // 2. Soft delete in public.employees
    const { error: dbError } = await supabaseAdmin
      .from('employees')
      .update({ status: 'Terminated' })
      .eq('id', id);

    if (dbError) throw dbError;

    res.status(200).json({ success: true, message: 'Employee terminated successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ----------------------------------------------------
// Start Server
// ----------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
