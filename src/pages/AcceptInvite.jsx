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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <ShieldCheck className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Invalid or Expired Link</h2>
          <p className="mt-2 text-sm text-slate-600">{validationError}</p>
          <button onClick={() => navigate('/')} className="mt-6 text-brand-600 font-medium hover:text-brand-500">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center animate-in fade-in zoom-in duration-500">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Welcome aboard, {employee.name.split(' ')[0]}!</h2>
          <p className="mt-3 text-slate-600">Your account has been successfully created and you are now active.</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-8 w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Taskpilot Logo" className="h-24 w-auto object-contain" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900">Accept Invitation</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          You've been invited to join <span className="font-bold text-slate-900">{employee.institution || 'Taskpilot'}</span> as a <span className="font-bold text-slate-900">{employee.designation}</span> in the <span className="font-bold text-slate-900">{employee.department}</span> department.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200">
          <div className="mb-6 flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xl">
              {employee.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{employee.name}</p>
              <p className="text-xs text-slate-500">{employee.email}</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700">Set Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700">Confirm Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
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
                  className="w-4 h-4 border border-slate-300 rounded bg-white focus:ring-3 focus:ring-brand-300 text-brand-600 cursor-pointer"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
              </div>
              <label htmlFor="terms" className="ml-2 text-sm font-medium text-slate-700 cursor-pointer">
                I agree to the <a href="#" className="text-brand-600 hover:underline">Terms & Conditions</a> and <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:bg-brand-400"
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
