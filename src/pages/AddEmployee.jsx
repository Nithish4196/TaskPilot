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
 <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
 <div className="mb-10 flex items-center justify-between">
 <div>
 <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">Add New Employee</h1>
 <p className="text-[var(--text-secondary)] mt-1">Choose how you want to add an employee to your organization.</p>
 </div>
 <button onClick={() => navigate('/employees')} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-full">
 <X className="w-6 h-6" />
 </button>
 </div>

 <div className="grid md:grid-cols-2 gap-6">
 {/* Option 1: Upload */}
 <div className="bg-white p-8 border-2 border-dashed border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--bg-secondary)]/50 transition-all cursor-pointer group relative">
 <input 
 type="file" 
 accept=".pdf" 
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
 onChange={handleFileUpload}
 />
 <div className="flex flex-col items-center text-center space-y-6 pointer-events-none">
 <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
 <UploadCloud className="w-8 h-8 text-[var(--text-primary)]" />
 </div>
 <div>
 <h3 className="card-title">Upload Resume (PDF)</h3>
 <p className="text-sm text-[var(--text-secondary)] mt-2">Our AI will automatically extract the candidate's details, skills, and experience.</p>
 </div>
 <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
 Browse Files <ArrowRight className="w-4 h-4" />
 </span>
 </div>
 </div>

 {/* Option 2: Manual */}
 <div 
 onClick={() => setMode('manual')}
 className="bg-white p-8 border border-[var(--border)] hover:border-[var(--border)] hover:shadow transition-all cursor-pointer group"
 >
 <div className="flex flex-col items-center text-center space-y-6">
 <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
 <Edit3 className="w-8 h-8 text-[var(--text-secondary)]" />
 </div>
 <div>
 <h3 className="card-title">Enter Manually</h3>
 <p className="text-sm text-[var(--text-secondary)] mt-2">Fill out the employee profile fields yourself without uploading a document.</p>
 </div>
 <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)]">
 Start Typing <ArrowRight className="w-4 h-4" />
 </span>
 </div>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="max-w-3xl mx-auto animate-in fade-in duration-150">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="page-title flex items-center gap-3">
 {mode === 'upload' ? <FileText className="w-6 h-6 text-[var(--text-primary)]" /> : <UserPlus className="w-6 h-6 text-[var(--text-secondary)]" />}
 {mode === 'upload' ? 'Review Parsed Data' : 'Employee Details'}
 </h1>
 {mode === 'upload' && (
 <p className="text-sm text-[var(--text-secondary)] mt-1">
 Parsed from: <span className="font-medium text-[var(--text-primary)]">{fileName}</span>
 </p>
 )}
 </div>
 <button onClick={() => { setMode(null); setIsParsing(false); setFormData({}); }} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
 Cancel
 </button>
 </div>

 {isParsing ? (
 <div className="bg-white p-12 border border-[var(--border)] flex flex-col items-center justify-center space-y-6">
 <Loader2 className="w-10 h-10 text-[var(--text-primary)] animate-spin" />
 <div className="text-center">
 <h3 className="card-title">Parsing Resume via AI...</h3>
 <p className="text-sm text-[var(--text-secondary)] mt-1">Extracting skills, experience, and contact info.</p>
 </div>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 border border-[var(--border)] space-y-6">
 {mode === 'upload' && (
 <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-6 mb-6">
 <p className="text-sm text-[var(--text-primary)] font-medium flex items-start gap-2">
 <span className="text-lg leading-none">✨</span>
 Data successfully extracted! Please review and select a department before sending the invite.
 </p>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Full Name</label>
 <input type="text" required className="linear-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Email Address</label>
 <input type="email" required className="linear-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Mobile Number</label>
 <input type="tel" className="linear-input" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Skills <span className="text-[var(--text-secondary)] font-normal">(comma separated)</span></label>
 <input type="text" className="linear-input" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
 </div>
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Work Experience</label>
 <textarea rows={3} className="linear-input" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} />
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Past Projects</label>
 <textarea rows={2} className="linear-input" value={formData.projects} onChange={e => setFormData({...formData, projects: e.target.value})} />
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Education</label>
 <input type="text" className="linear-input" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} />
 </div>

 <hr className="border-[var(--border)]" />

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Department Assignment</label>
 <select required className="linear-input bg-white" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
 <option value="">Select Department</option>
 {departments.map(d => <option key={d} value={d}>{d}</option>)}
 </select>
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-[var(--text-primary)]">Role / Designation</label>
 <input type="text" required className="linear-input" placeholder="e.g. Frontend Developer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
 </div>
 </div>

 <div className="flex justify-end pt-6">
 <button type="submit" className="btn-primary">
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










