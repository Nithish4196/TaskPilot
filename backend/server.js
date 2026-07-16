require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ----------------------------------------------------
// HELPER: Generate Email Template
// ----------------------------------------------------
const generateEmailHTML = (employee, token) => {
  const activationLink = `${FRONTEND_URL}/accept-invite/${token}`;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; padding: 20px;">
        <h1 style="color: #2563eb;">${employee.institution || 'Taskpilot'}</h1>
      </div>
      <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px;">
        <h2 style="margin-top: 0;">Welcome to the team, ${employee.name}!</h2>
        <p>You have been invited by your manager to join the <strong>${employee.department}</strong> department as a <strong>${employee.designation}</strong>.</p>
        
        <div style="background-color: #fff; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 10px 0; color: #64748b;">Your Assignment Details</h4>
          <p style="margin: 5px 0;"><strong>Team:</strong> ${employee.team || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Reporting Manager:</strong> ${employee.reporting_manager || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Joining Date:</strong> ${employee.date_of_joining || 'N/A'}</p>
        </div>

        <p>Please click the button below to accept your invitation, set up your password, and activate your account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
        </div>
        
        <p style="font-size: 12px; color: #64748b;">This invitation link will expire in 72 hours.</p>
      </div>
      <div style="text-align: center; padding: 20px; font-size: 12px; color: #94a3b8;">
        <p>If you have any questions, please contact support@${employee.institution ? employee.institution.toLowerCase().replace(/\\s+/g, '') : 'taskpilot'}.com</p>
      </div>
    </div>
  `;
};


// ----------------------------------------------------
// 1. Send Invitation (Create Employee & Token, Send Email)
// ----------------------------------------------------
app.post('/api/employees/invite', async (req, res) => {
  try {
    const data = req.body;

    // 1. Insert Employee into Supabase
    const { data: empData, error: empError } = await supabase
      .from('employees')
      .insert([{
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        department: data.department,
        designation: data.role,
        role: data.role,
        institution: data.orgAssignment?.institution,
        team: data.orgAssignment?.team,
        reporting_manager: data.orgAssignment?.reportingManager,
        employment_type: data.orgAssignment?.employmentType,
        date_of_joining: data.orgAssignment?.dateOfJoining,
        status: 'Pending',
        personal_info: data.personalInfo,
        skills: data.skills,
        experience: data.experience,
        projects: data.projects,
        education: data.education,
        certifications: data.certifications
      }])
      .select('id')
      .single();

    if (empError) {
      if (empError.code === '23505') {
        return res.status(400).json({ error: 'An employee with this email already exists.' });
      }
      throw empError;
    }

    const employeeId = empData.id;

    // 2. Generate secure token & expiry (72 hours)
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    const { error: inviteError } = await supabase
      .from('invitations')
      .insert([{
        employee_id: employeeId,
        token: token,
        expires_at: expiresAt.toISOString(),
        status: 'Sent'
      }]);

    if (inviteError) throw inviteError;

    // 3. Send Email via Resend
    const emailHtml = generateEmailHTML({
      name: data.name,
      institution: data.orgAssignment?.institution,
      department: data.department,
      designation: data.role,
      team: data.orgAssignment?.team,
      reporting_manager: data.orgAssignment?.reportingManager,
      date_of_joining: data.orgAssignment?.dateOfJoining
    }, token);

    try {
      const { data: emailResponse, error: emailError } = await resend.emails.send({
        from: 'Taskpilot HR <onboarding@resend.dev>', // Use resend.dev for testing unless domain is verified
        to: [data.email],
        subject: `Welcome to the team, ${data.name}!`,
        html: emailHtml
      });
      if (emailError) {
        console.warn('Resend API Warning: Could not send email (likely due to free tier restrictions):', emailError.message);
      }
    } catch (emailException) {
      console.warn('Resend API Exception (Ignored for demo):', emailException.message);
    }

    res.status(200).json({ 
      success: true, 
      employeeId, 
      inviteLink: emailHtml.match(/href="([^"]+)"/)[1], // Extract the activation link from the HTML template
      message: 'Invitation created successfully (Email skipped if unverified).' 
    });

  } catch (error) {
    console.error('Error sending invite:', error);
    res.status(500).json({ error: 'Internal server error while sending invitation.', details: error.message || error });
  }
});


// ----------------------------------------------------
// 2. Validate Invitation Token
// ----------------------------------------------------
app.get('/api/employees/validate-invite/:token', async (req, res) => {
  try {
    const { token } = req.params;
    console.log(`[Validation] Checking token: ${token}`);

    // Find token
    const { data: invite, error: inviteError } = await supabase
      .from('invitations')
      .select('*, employees(*)')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      console.error('[Validation Error]:', inviteError || 'No invite found');
      return res.status(404).json({ error: 'Invalid or missing invitation token.' });
    }

    // Check expiry
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    if (now > expiresAt || invite.status !== 'Sent') {
      // Mark expired if not already
      if (invite.status === 'Sent') {
        await supabase.from('invitations').update({ status: 'Expired' }).eq('id', invite.id);
      }
      return res.status(400).json({ error: 'This invitation link has expired or already been used.' });
    }

    res.status(200).json({ valid: true, employee: invite.employees });

  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ----------------------------------------------------
// 3. Activate Account (Set Password)
// ----------------------------------------------------
app.post('/api/employees/activate', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Validate token again
    const { data: invite, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite || invite.status !== 'Sent') {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update Employee Status
    const { error: empError } = await supabase
      .from('employees')
      .update({ 
        status: 'Active',
        password_hash: passwordHash
      })
      .eq('id', invite.employee_id);

    if (empError) throw empError;

    // Update Token Status
    const { error: updateInviteError } = await supabase
      .from('invitations')
      .update({ status: 'Used' })
      .eq('id', invite.id);

    if (updateInviteError) throw updateInviteError;

    res.status(200).json({ success: true, message: 'Account activated successfully.' });

  } catch (error) {
    console.error('Error activating account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ----------------------------------------------------
// 4. Employee Login
// ----------------------------------------------------
app.post('/api/employees/login', async (req, res) => {
  try {
    const { email } = req.body; // Can be name or email

    if (!email) {
      return res.status(400).json({ error: 'Name or Email is required.' });
    }

    const searchTerm = email.trim().toLowerCase();

    // Manager backdoor login for demo purposes
    if (searchTerm === 'admin@taskpilot.com' || searchTerm === 'admin' || searchTerm === 'manager' || searchTerm === 'system admin') {
      return res.status(200).json({ 
        success: true, 
        role: 'manager', 
        user: { id: 'admin-1', name: 'System Admin', email: 'admin@taskpilot.com' } 
      });
    }

    let employee = null;

    // 1. Try matching by name (case-insensitive substring)
    const { data: nameMatches } = await supabase
      .from('employees')
      .select('*')
      .ilike('name', `%${searchTerm}%`);

    if (nameMatches && nameMatches.length > 0) {
      employee = nameMatches[0];
    } else {
      // 2. Try matching by email
      const { data: emailMatch } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email.trim())
        .maybeSingle();
      employee = emailMatch;
    }

    if (!employee) {
      return res.status(401).json({ error: 'Employee not found by name or email.' });
    }

    // Don't send the password hash back to the client
    delete employee.password_hash;

    res.status(200).json({ success: true, role: 'employee', user: employee });

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ----------------------------------------------------
// Start Server
// ----------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
