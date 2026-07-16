import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, KeyRound, Mail, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Login() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const navigate = useNavigate();
 const { login } = useAppContext();

 const handleSubmit = async (e) => {
 e.preventDefault();
 setError('');
 setIsLoading(true);

 try {
 const response = await fetch('http://localhost:5000/api/employees/login', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email, password }),
 });

 const data = await response.json();

 if (!response.ok) {
 throw new Error(data.error || 'Login failed');
 }

 // Context handles state and localStorage saving
 login(data.user, data.role);
 
 // Navigate based on role
 if (data.role === 'manager') {
 navigate('/');
 } else {
 navigate('/employee/dashboard');
 }

 } catch (err) {
 setError(err.message);
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
 <h2 className="text-center text-3xl font-extrabold text-[var(--text-primary)]">Sign in to Taskpilot</h2>
 <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
 Enter your credentials to access your dashboard.
 </p>
 </div>

 <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-2 duration-150">
 <div className="bg-white py-8 px-4 shadow sm: sm:px-10 border border-[var(--border)]">
 

 <form className="space-y-6" onSubmit={handleSubmit}>
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 shrink-0" />
 {error}
 </div>
 )}
 
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)]">Employee Name or Email</label>
 <div className="mt-1 relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Mail className="h-5 w-5 text-[var(--text-secondary)]" />
 </div>
 <input
 type="text"
 required
 className="linear-input"
 placeholder="Enter Employee Name or Email"
 value={email}
 onChange={e => setEmail(e.target.value)}
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)]">Password <span className="text-[10px] font-normal text-[var(--text-secondary)]">(Optional for testing)</span></label>
 <div className="mt-1 relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <KeyRound className="h-5 w-5 text-[var(--text-secondary)]" />
 </div>
 <input
 type="password"
 className="linear-input"
 placeholder="••••••••"
 value={password}
 onChange={e => setPassword(e.target.value)}
 />
 </div>
 </div>

 <div className="flex items-center justify-between">
 <div className="flex items-center">
 <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-[var(--text-primary)] focus:ring-[var(--ring-focus)] border-gray-300 rounded" />
 <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900"> Remember me </label>
 </div>
 <div className="text-sm">
 <a href="#" className="font-medium text-[var(--text-primary)] hover:text-[var(--text-primary)]"> Forgot your password? </a>
 </div>
 </div>

 <div>
 <button
 type="submit"
 disabled={isLoading}
 className="btn-primary"
 >
 {isLoading ? (
 <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Signing in...</>
 ) : (
 <>Sign in <ArrowRight className="ml-2 w-4 h-4" /></>
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>
 );
}








