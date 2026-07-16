import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, KeyRound, ArrowRight, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

const AcceptInvite = () => {
 const { token } = useParams();
 const navigate = useNavigate();
 
 const [employee, setEmployee] = useState(null);
 const [isLoading, setIsLoading] = useState(true);
 const [validationError, setValidationError] = useState('');

 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [termsAccepted, setTermsAccepted] = useState(false);
 const [error, setError] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [success, setSuccess] = useState(false);

 // Validate token on mount
 useEffect(() => {
 const validateToken = async () => {
 try {
 const response = await fetch(`http://localhost:5000/api/employees/validate-invite/${token}`);
 const data = await response.json();

 if (!response.ok) {
 throw new Error(data.error || 'Invalid invitation link.');
 }

 setEmployee(data.employee);
 } catch (err) {
 setValidationError(err.message);
 } finally {
 setIsLoading(false);
 }
 };

 validateToken();
 }, [token]);


 const handleSubmit = async (e) => {
 e.preventDefault();
 setError('');

 if (password.length < 8) {
 setError('Password must be at least 8 characters long.');
 return;
 }
 
 if (password !== confirmPassword) {
 setError('Passwords do not match.');
 return;
 }

 if (!termsAccepted) {
 setError('You must accept the Terms & Conditions.');
 return;
 }

 setIsSubmitting(true);

 try {
 const response = await fetch('http://localhost:5000/api/employees/activate', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ token, password })
 });

 const data = await response.json();

 if (!response.ok) {
 throw new Error(data.error || 'Activation failed.');
 }

 setSuccess(true);
 } catch (err) {
 setError(err.message);
 } finally {
 setIsSubmitting(false);
 }
 };


 if (isLoading) {
 return (
 <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
 <Loader2 className="w-8 h-8 text-[var(--text-primary)] animate-spin" />
 </div>
 );
 }

 if (validationError) {
 return (
 <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
 <div className="sm:mx-auto sm:w-full sm:max-w-md text-center bg-white p-8 border border-[var(--border)]">
 <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-6">
 <ShieldCheck className="h-6 w-6 text-red-600" />
 </div>
 <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Invalid or Expired Link</h2>
 <p className="mt-2 text-sm text-[var(--text-secondary)]">{validationError}</p>
 <button onClick={() => navigate('/')} className="mt-6 text-[var(--text-primary)] font-medium hover:text-[var(--text-primary)]">
 Go to Login
 </button>
 </div>
 </div>
 );
 }

 if (success) {
 return (
 <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
 <div className="sm:mx-auto sm:w-full sm:max-w-md text-center animate-in fade-in zoom-in duration-150">
 <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
 <CheckCircle2 className="h-8 w-8 text-emerald-600" />
 </div>
 <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">Welcome aboard, {employee.name.split(' ')[0]}!</h2>
 <p className="mt-3 text-[var(--text-secondary)]">Your account has been successfully created and you are now active.</p>
 <button 
 onClick={() => navigate('/')} 
 className="mt-8 w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] transition-colors"
 >
 Go to Dashboard
 </button>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
 <div className="sm:mx-auto sm:w-full sm:max-w-md">
 <div className="flex justify-center mb-6">
 <img src="/logo.png" alt="Taskpilot Logo" className="h-24 w-auto object-contain" />
 </div>
 <h2 className="text-center text-3xl font-extrabold text-[var(--text-primary)]">Accept Invitation</h2>
 <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
 You've been invited to join <span className="font-bold text-[var(--text-primary)]">{employee.institution || 'Taskpilot'}</span> as a <span className="font-bold text-[var(--text-primary)]">{employee.designation}</span> in the <span className="font-bold text-[var(--text-primary)]">{employee.department}</span> department.
 </p>
 </div>

 <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-2 duration-150">
 <div className="bg-white py-8 px-4 shadow sm: sm:px-10 border border-[var(--border)]">
 <div className="mb-6 flex items-center gap-6 bg-[var(--bg-secondary)] p-6 border border-[var(--border)]">
 <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center font-bold text-xl">
 {employee.name.charAt(0)}
 </div>
 <div>
 <p className="text-sm font-medium text-[var(--text-primary)]">{employee.name}</p>
 <p className="text-xs text-[var(--text-secondary)]">{employee.email}</p>
 </div>
 </div>

 <form className="space-y-6" onSubmit={handleSubmit}>
 {error && (
 <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 shrink-0" />
 {error}
 </div>
 )}
 
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)]">Set Password</label>
 <div className="mt-1 relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <KeyRound className="h-5 w-5 text-[var(--text-secondary)]" />
 </div>
 <input
 type="password"
 required
 className="linear-input"
 placeholder="••••••••"
 value={password}
 onChange={e => setPassword(e.target.value)}
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)]">Confirm Password</label>
 <div className="mt-1 relative">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <KeyRound className="h-5 w-5 text-[var(--text-secondary)]" />
 </div>
 <input
 type="password"
 required
 className="linear-input"
 placeholder="••••••••"
 value={confirmPassword}
 onChange={e => setConfirmPassword(e.target.value)}
 />
 </div>
 </div>

 <div className="flex items-start">
 <div className="flex items-center h-5">
 <input
 id="terms"
 type="checkbox"
 className="linear-input"
 checked={termsAccepted}
 onChange={(e) => setTermsAccepted(e.target.checked)}
 />
 </div>
 <label htmlFor="terms" className="ml-2 text-sm font-medium text-[var(--text-primary)] cursor-pointer">
 I agree to the <a href="#" className="text-[var(--text-primary)] hover:underline">Terms & Conditions</a> and <a href="#" className="text-[var(--text-primary)] hover:underline">Privacy Policy</a>
 </label>
 </div>

 <div>
 <button
 type="submit"
 disabled={isSubmitting}
 className="btn-primary"
 >
 {isSubmitting ? (
 <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Activating...</>
 ) : (
 <>Activate Account <ArrowRight className="ml-2 w-4 h-4" /></>
 )}
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>
 );
};

export default AcceptInvite;









