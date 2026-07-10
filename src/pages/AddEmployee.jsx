import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, UserPlus, ArrowRight, Loader2, Edit3, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const AddEmployee = () => {
  const navigate = useNavigate();
  const { addEmployee } = useAppContext();
  
  const [mode, setMode] = useState(null); // 'upload' | 'manual' | null
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    skills: '',
    projects: '',
    experience: '',
    education: '',
    department: '',
    role: ''
  });

  const departments = ['Engineering', 'Design', 'QA', 'Marketing', 'Product', 'HR'];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFileName(file.name);
    setIsParsing(true);
    setMode('upload');
    
    // Stub: Simulate AI Resume Parsing (to be replaced with actual Gemini API call)
    setTimeout(() => {
      setFormData({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        mobile: '+1 555-0198',
        skills: 'React, Node.js, TypeScript, Tailwind CSS, PostgreSQL',
        projects: 'E-commerce Platform Redesign (Lead Frontend Developer)\nInternal Dashboard built with Vite and Firebase',
        experience: 'Senior Frontend Developer at TechCorp (2022 - Present)\nWeb Developer at StartupX (2019 - 2022)',
        education: 'B.S. Computer Science, State University (2015 - 2019)',
        department: 'Engineering',
        role: 'Senior Developer'
      });
      setIsParsing(false);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert skills to array if it's a comma separated string
    const processedData = {
      ...formData,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean)
    };
    
    const empId = addEmployee(processedData);
    
    // Simulate sending email and then redirect to employees list
    console.log(`Invite sent successfully for ${empId}`);
    navigate('/employees');
  };

  if (!mode && !isParsing) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Add New Employee</h1>
            <p className="text-slate-500 mt-1">Choose how you want to add an employee to your organization.</p>
          </div>
          <button onClick={() => navigate('/employees')} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Option 1: Upload */}
          <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-brand-200 hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer group relative">
            <input 
              type="file" 
              accept=".pdf" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              onChange={handleFileUpload}
            />
            <div className="flex flex-col items-center text-center space-y-4 pointer-events-none">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-brand-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Upload Resume (PDF)</h3>
                <p className="text-sm text-slate-500 mt-2">Our AI will automatically extract the candidate's details, skills, and experience.</p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-brand-600">
                Browse Files <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Option 2: Manual */}
          <div 
            onClick={() => setMode('manual')}
            className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all cursor-pointer group"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Edit3 className="w-8 h-8 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Enter Manually</h3>
                <p className="text-sm text-slate-500 mt-2">Fill out the employee profile fields yourself without uploading a document.</p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                Start Typing <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            {mode === 'upload' ? <FileText className="w-6 h-6 text-brand-600" /> : <UserPlus className="w-6 h-6 text-slate-600" />}
            {mode === 'upload' ? 'Review Parsed Data' : 'Employee Details'}
          </h1>
          {mode === 'upload' && (
            <p className="text-sm text-slate-500 mt-1">
              Parsed from: <span className="font-medium text-slate-700">{fileName}</span>
            </p>
          )}
        </div>
        <button onClick={() => { setMode(null); setIsParsing(false); setFormData({}); }} className="text-sm font-medium text-slate-500 hover:text-slate-900">
          Cancel
        </button>
      </div>

      {isParsing ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-900">Parsing Resume via AI...</h3>
            <p className="text-sm text-slate-500 mt-1">Extracting skills, experience, and contact info.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {mode === 'upload' && (
            <div className="bg-brand-50 border border-brand-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-brand-800 font-medium flex items-start gap-2">
                <span className="text-lg leading-none">✨</span>
                Data successfully extracted! Please review and select a department before sending the invite.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Full Name</label>
              <input type="text" required className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Email Address</label>
              <input type="email" required className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Mobile Number</label>
              <input type="tel" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Skills <span className="text-slate-400 font-normal">(comma separated)</span></label>
              <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Work Experience</label>
            <textarea rows={3} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Past Projects</label>
            <textarea rows={2} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={formData.projects} onChange={e => setFormData({...formData, projects: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Education</label>
            <input type="text" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} />
          </div>

          <hr className="border-slate-100" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Department Assignment</label>
              <select required className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none transition-all bg-white" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Role / Designation</label>
              <input type="text" required className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="e.g. Frontend Developer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-xl shadow hover:bg-brand-700 transition-all">
              <UserPlus className="w-5 h-5" />
              Send Invite
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddEmployee;
