import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, KeyRound, Mail, ArrowRight, ShieldCheck, Loader2, AlertCircle, ClipboardList, TrendingUp, BellRing, BarChart } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Column (Branding & Features) */}
      <div className="hidden md:flex md:w-1/2 bg-white flex-col justify-center px-12 lg:px-24">
        <div className="max-w-md w-full">
          <img src="/logo2.png" alt="TaskPilot Logo" className="w-64 h-auto mb-2 object-contain" />
          
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Your Intelligent Task Manager.
          </h1>
          <p className="text-lg text-slate-600 mb-12">
            Streamline workflows, manage teams, assign modules, and track progress effortlessly.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-100 rounded-lg shrink-0">
                <ClipboardList className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Smart Task Delegation</h3>
                <p className="text-sm text-slate-500 mt-1">Assign tasks and modules seamlessly across teams.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-100 rounded-lg shrink-0">
                <TrendingUp className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Real-time Progress Tracking</h3>
                <p className="text-sm text-slate-500 mt-1">Monitor team bandwidth and project status instantly.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-100 rounded-lg shrink-0">
                <BellRing className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Automated Notifications</h3>
                <p className="text-sm text-slate-500 mt-1">Keep everyone in the loop with instant updates.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-100 rounded-lg shrink-0">
                <BarChart className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Manager Analytics</h3>
                <p className="text-sm text-slate-500 mt-1">Evaluate performance and manage team capacity.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (Login Form) */}
      <div className="w-full md:w-1/2 bg-black text-white flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24">
        
        {/* Mobile Logo Fallback */}
        <div className="md:hidden flex justify-center mb-10">
          <img src="/logo2.png" alt="TaskPilot Logo" className="w-48 h-auto object-contain brightness-0 invert" />
        </div>

        <div className="w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-3xl font-bold text-white mb-2">
            {requiresReset ? "Secure Account" : "Welcome back"}
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            {requiresReset ? "Please create a new password to continue." : "Sign in to your TaskPilot account."}
          </p>

          <form className="space-y-6" onSubmit={requiresReset ? handleResetPassword : handleLogin}>
            {error && (
              <div className="bg-red-950/50 border border-red-500/50 text-red-200 text-sm p-4 flex items-center gap-3 rounded-lg">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                {error}
              </div>
            )}
            
            {!requiresReset ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:bg-white/10 focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all outline-none"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="password"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:bg-white/10 focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all outline-none"
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center">
                    <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 bg-transparent border-gray-500 rounded focus:ring-0 checked:bg-white checked:border-white transition-colors" />
                    <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-gray-400"> Remember me </label>
                  </div>
                  <div className="text-sm">
                    <a href="#" className="font-semibold text-white hover:text-gray-300 transition-colors"> Forgot password? </a>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">New Secure Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShieldCheck className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="password"
                      required
                      minLength="8"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:bg-white/10 focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all outline-none"
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    For your security, you must replace the temporary password provided by your manager before accessing the dashboard.
                  </p>
                </div>
              </>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {requiresReset ? "Update & Login" : "Sign In"}
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
