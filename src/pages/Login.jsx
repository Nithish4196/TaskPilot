import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, KeyRound, Mail, ArrowRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useAppContext, supabase } from '../context/AppContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requiresReset, setRequiresReset] = useState(false);
  const [tempUser, setTempUser] = useState(null);

  const navigate = useNavigate();
  const { login } = useAppContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Fetch Employee Profile
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (empError) {
        // If not found in employees table, they might be an admin bypassing the system, but we don't support that here anymore
        throw new Error("Employee profile not found in system.");
      }

      // 3. Check if password reset is required
      if (empData.requires_password_change) {
        setTempUser(empData);
        setRequiresReset(true);
        setIsLoading(false);
        return; // Stop here, show reset UI
      }

      // 4. Determine Role (simplified for TaskPilot logic)
      const { data: teamLeadData } = await supabase
        .from('project_teams')
        .select('id')
        .eq('team_leader_id', empData.id);

      const isTeamLeader = teamLeadData && teamLeadData.length > 0;
      let role = empData.designation?.toLowerCase().includes('manager') ? 'manager' : (isTeamLeader ? 'team_leader' : 'employee');

      // 5. Complete Login
      login(empData, role);
      
      if (role === 'manager') navigate('/');
      else navigate('/employee/dashboard');

    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // 1. Update password in Supabase Auth
      const { error: updateAuthError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateAuthError) throw updateAuthError;

      // 2. Update flag in public.employees
      const { error: dbError } = await supabase
        .from('employees')
        .update({ requires_password_change: false })
        .eq('id', tempUser.id);
      
      if (dbError) throw dbError;

      // 3. Determine Role
      const { data: teamLeadData } = await supabase
        .from('project_teams')
        .select('id')
        .eq('team_leader_id', tempUser.id);

      const isTeamLeader = teamLeadData && teamLeadData.length > 0;
      let role = tempUser.designation?.toLowerCase().includes('manager') ? 'manager' : (isTeamLeader ? 'team_leader' : 'employee');

      // 4. Complete Login
      login(tempUser, role);
      
      if (role === 'manager') navigate('/');
      else navigate('/employee/dashboard');

    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Taskpilot Logo" className="h-24 w-auto object-contain" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-[var(--text-primary)]">
          {requiresReset ? "Secure Your Account" : "Sign in to Taskpilot"}
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
          {requiresReset ? "Please change your temporary password to continue." : "Enter your credentials to access your dashboard."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-2 duration-150">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-[var(--border)]">
          
          <form className="space-y-6" onSubmit={requiresReset ? handleResetPassword : handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 flex items-center gap-2 rounded">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            
            {!requiresReset ? (
              <>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)]">Email Address</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-[var(--text-secondary)]" />
                    </div>
                    <input
                      type="email"
                      required
                      className="linear-input pl-10"
                      placeholder="Enter your email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)]">Password</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-[var(--text-secondary)]" />
                    </div>
                    <input
                      type="password"
                      required
                      className="linear-input pl-10"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-[var(--text-primary)] focus:ring-[var(--ring-focus)] border-gray-300 rounded" />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-[var(--text-secondary)]"> Remember me </label>
                  </div>
                  <div className="text-sm">
                    <a href="#" className="font-medium text-[var(--text-primary)] hover:underline"> Forgot password? </a>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)]">New Secure Password</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShieldCheck className="h-5 w-5 text-[var(--text-secondary)]" />
                    </div>
                    <input
                      type="password"
                      required
                      minLength="8"
                      className="linear-input pl-10"
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-2">
                    For your security, you must replace the temporary password provided by your manager before accessing the dashboard.
                  </p>
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex justify-center py-2.5"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {requiresReset ? "Update Password & Login" : "Sign In"} <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
