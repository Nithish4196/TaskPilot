import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 UploadCloud, UserPlus, ArrowRight, ArrowLeft, Loader2, FileText,
 CheckCircle2, Building2, Briefcase, Mail, Check
} from 'lucide-react';
import { parseResumeFile } from '../services/resumeParser';
import { useAppContext } from '../context/AppContext';

// --- STYLED COMPONENTS & ICONS ---
const StepIndicator = ({ step, currentStep, label }) => {
 const isCompleted = currentStep > step;
 const isActive = currentStep === step;
 
 return (
 <div className="flex flex-col items-center flex-1 relative">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-colors ${
 isActive ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-medium border border-[var(--border)] hover:bg-[var(--btn-primary-hover)] ring-4 ring-white' : 
 isCompleted ? 'badge-completed' : 
 'bg-[var(--surface-hover)] text-[var(--text-secondary)]'
 }`}>
 {isCompleted ? <Check className="w-5 h-5" /> : step}
 </div>
 <span className={`text-xs font-medium mt-2 text-center hidden md:block ${
 isActive ? 'text-[var(--text-primary)]' : isCompleted ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
 }`}>
 {label}
 </span>
 {step < 4 && (
 <div className={`absolute top-6 left-1/2 w-full h-0.5 -z-0 ${
 isCompleted ? 'bg-emerald-500' : 'bg-[var(--surface-hover)]'
 }`} />
 )}
 </div>
 );
};

// --- MAIN WIZARD COMPONENT ---
export default function AddEmployeeWizard() {
 const navigate = useNavigate();
 const { addEmployee } = useAppContext();
 
 const [step, setStep] = useState(1);
 const [isParsing, setIsParsing] = useState(false);
 const [parseError, setParseError] = useState('');
 
 // Data States
 const [parsedData, setParsedData] = useState(null);
 const [orgData, setOrgData] = useState({
 institution: 'Taskpilot Organization',
 department: '',
 team: '',
 designation: '',
 reportingManager: '',
 employeeRole: '',
 dateOfJoining: '',
 employmentType: 'Full-time'
 });

 const [simulatedEmailLink, setSimulatedEmailLink] = useState(null);

 // --- Handlers ---
 const handleFileUpload = async (e) => {
 const file = e.target.files[0];
 if (!file) return;
 
 setIsParsing(true);
 setParseError('');
 
 try {
 const data = await parseResumeFile(file);
 setParsedData(data);
 setStep(2);
 } catch (err) {
 setParseError(err.message || 'Failed to parse resume.');
 } finally {
 setIsParsing(false);
 }
 };

 const handleManualEntry = () => {
 setParsedData({
 personalInfo: { fullName: '', email: '', mobile: '', address: '', linkedIn: '', github: '', portfolio: '', dob: '' },
 summary: { careerObjective: '', professionalSummary: '' },
 skills: { technical: [], languages: [], frameworks: [], databases: [], cloudPlatforms: [], tools: [], softSkills: [] },
 experience: [],
 projects: [],
 education: [],
 certifications: [],
 languages: [],
 achievements: []
 });
 setStep(2);
 };

 const [isSending, setIsSending] = useState(false);
 const [inviteError, setInviteError] = useState('');

 const handleSendInvite = async () => {
 setIsSending(true);
 setInviteError('');
 
 const fullEmployeeRecord = {
 name: parsedData.personalInfo?.fullName || 'Unknown',
 email: parsedData.personalInfo?.email || '',
 mobile: parsedData.personalInfo?.mobile || '',
 department: orgData.department,
 role: orgData.designation,
 ...parsedData, // Store the rest of the rich data
 orgAssignment: orgData
 };
 
 try {
 const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
 const response = await fetch(`${API_URL}/api/employees/invite`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify(fullEmployeeRecord),
 });

 const data = await response.json();

 if (!response.ok) {
 throw new Error(data.error || 'Failed to send invitation');
 }

 // Show success state
 setSimulatedEmailLink(data.inviteLink);
 
 } catch (error) {
 setInviteError(error.message);
 } finally {
 setIsSending(false);
 }
 };

 // --- RENDERING STEPS ---
 
 const renderStep1 = () => (
 <div className="animate-in fade-in slide-in-from-bottom-2 duration-150">
 <div className="text-center mb-10">
 <h2 className="page-title">Upload Resume</h2>
 <p className="text-[var(--text-secondary)] mt-2">Upload a PDF or DOCX file. Our AI will automatically extract all information.</p>
 </div>

 {parseError && (
 <div className="bg-red-50 border border-red-200 text-red-700 p-6 mb-6 flex items-center justify-between">
 <p>{parseError}</p>
 <button onClick={() => setParseError('')} className="text-red-500 hover:text-red-700">Clear</button>
 </div>
 )}

 {isParsing ? (
 <div className="bg-white p-12 border border-[var(--border)] flex flex-col items-center justify-center space-y-6">
 <Loader2 className="w-12 h-12 text-[var(--text-primary)] animate-spin" />
 <div className="text-center">
 <h3 className="card-title">Analyzing Resume via AI...</h3>
 <p className="text-sm text-[var(--text-secondary)] mt-1">Extracting skills, experience, projects, and contact info.</p>
 </div>
 </div>
 ) : (
 <div className="space-y-6">
 <div className="bg-white p-12 border-2 border-dashed border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--bg-secondary)]/50 transition-all cursor-pointer relative flex flex-col items-center text-center group">
 <input 
 type="file" 
 accept=".pdf,.docx" 
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
 onChange={handleFileUpload}
 />
 <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform mb-6">
 <UploadCloud className="w-8 h-8 text-[var(--text-primary)]" />
 </div>
 <h3 className="card-title">Drag & Drop or Click to Upload</h3>
 <p className="text-sm text-[var(--text-secondary)] mt-2">Supports PDF and DOCX up to 5MB</p>
 </div>

 <div className="flex items-center gap-6 py-4">
 <div className="h-px bg-[var(--surface-hover)] flex-1"></div>
 <span className="text-[var(--text-secondary)] text-sm font-medium">OR</span>
 <div className="h-px bg-[var(--surface-hover)] flex-1"></div>
 </div>

 <button 
 onClick={handleManualEntry}
 className="btn-primary"
 >
 Enter Information Manually
 </button>
 </div>
 )}
 </div>
 );

 const renderStep2 = () => (
 <div className="animate-in fade-in slide-in-from-right-4 duration-150 space-y-8">
 <div className="flex justify-between items-end mb-6">
 <div>
 <h2 className="page-title">Review Extracted Information</h2>
 <p className="text-[var(--text-secondary)] mt-1">Please review and edit any inaccurate or missing information.</p>
 </div>
 </div>

 {/* Personal Info */}
 <section className="bg-white p-6 border border-[var(--border)] space-y-6">
 <h3 className="card-title flex items-center gap-2"><UserPlus className="w-5 h-5 text-[var(--text-primary)]"/> Personal Information</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Full Name</label>
 <input type="text" className="linear-input" 
 value={parsedData.personalInfo?.fullName || ''} 
 onChange={e => setParsedData({...parsedData, personalInfo: {...parsedData.personalInfo, fullName: e.target.value}})} 
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Email Address</label>
 <input type="email" className="linear-input" 
 value={parsedData.personalInfo?.email || ''} 
 onChange={e => setParsedData({...parsedData, personalInfo: {...parsedData.personalInfo, email: e.target.value}})} 
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Mobile Number</label>
 <input type="tel" className="linear-input" 
 value={parsedData.personalInfo?.mobile || ''} 
 onChange={e => setParsedData({...parsedData, personalInfo: {...parsedData.personalInfo, mobile: e.target.value}})} 
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Date of Birth</label>
 <input type="text" className="linear-input" 
 value={parsedData.personalInfo?.dob || ''} 
 onChange={e => setParsedData({...parsedData, personalInfo: {...parsedData.personalInfo, dob: e.target.value}})} 
 />
 </div>
 </div>
 </section>

 {/* Basic Skills (Comma separated for demo brevity, though schema has nested arrays) */}
 <section className="bg-white p-6 border border-[var(--border)] space-y-6">
 <h3 className="card-title">Skills & Tech Stack</h3>
 <div className="space-y-6">
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Technical Skills</label>
 <textarea className="linear-input min-h-[100px] py-3" rows={2}
 value={Array.isArray(parsedData.skills?.technical) ? parsedData.skills.technical.join(', ') : ''} 
 onChange={e => setParsedData({...parsedData, skills: {...parsedData.skills, technical: e.target.value.split(',').map(s=>s.trim())}})} 
 />
 </div>
 </div>
 </section>

 {/* Experience */}
 <section className="bg-white p-6 border border-[var(--border)] space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="card-title">Work Experience</h3>
 <button onClick={() => setParsedData({...parsedData, experience: [...(parsedData.experience||[]), {}]})} className="text-sm font-bold text-[var(--text-primary)] hover:text-[var(--text-primary)]">+ Add Experience</button>
 </div>
 {(parsedData.experience || []).map((exp, idx) => (
 <div key={idx} className="p-6 bg-[var(--bg-secondary)] border border-[var(--border)] space-y-6 relative">
 <button onClick={() => {
 const newExp = [...parsedData.experience]; newExp.splice(idx, 1);
 setParsedData({...parsedData, experience: newExp});
 }} className="absolute top-6 right-4 text-[var(--text-secondary)] hover:text-red-500 font-bold text-xs uppercase">Remove</button>
 
 <div className="grid grid-cols-2 gap-6 mr-16">
 <div>
 <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Company</label>
 <input type="text" className="linear-input" value={exp.company || ''} onChange={e => { const n = [...parsedData.experience]; n[idx].company = e.target.value; setParsedData({...parsedData, experience: n}) }} />
 </div>
 <div>
 <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Job Title</label>
 <input type="text" className="linear-input" value={exp.jobTitle || ''} onChange={e => { const n = [...parsedData.experience]; n[idx].jobTitle = e.target.value; setParsedData({...parsedData, experience: n}) }} />
 </div>
 <div>
 <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Duration</label>
 <input type="text" className="linear-input" value={exp.duration || ''} onChange={e => { const n = [...parsedData.experience]; n[idx].duration = e.target.value; setParsedData({...parsedData, experience: n}) }} />
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Responsibilities</label>
 <textarea className="linear-input min-h-[100px] py-3" rows={2} value={exp.responsibilities || ''} onChange={e => { const n = [...parsedData.experience]; n[idx].responsibilities = e.target.value; setParsedData({...parsedData, experience: n}) }} />
 </div>
 </div>
 ))}
 </section>

 {/* Projects */}
 <section className="bg-white p-6 border border-[var(--border)] space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="card-title">Projects</h3>
 <button onClick={() => setParsedData({...parsedData, projects: [...(parsedData.projects||[]), {}]})} className="text-sm font-bold text-[var(--text-primary)] hover:text-[var(--text-primary)]">+ Add Project</button>
 </div>
 {(parsedData.projects || []).map((proj, idx) => (
 <div key={idx} className="p-6 bg-[var(--bg-secondary)] border border-[var(--border)] space-y-6 relative">
 <button onClick={() => {
 const newProj = [...parsedData.projects]; newProj.splice(idx, 1);
 setParsedData({...parsedData, projects: newProj});
 }} className="absolute top-6 right-4 text-[var(--text-secondary)] hover:text-red-500 font-bold text-xs uppercase">Remove</button>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mr-16">
 <div>
 <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Project Name</label>
 <input type="text" className="linear-input" value={proj.name || ''} onChange={e => { const n = [...parsedData.projects]; n[idx].name = e.target.value; setParsedData({...parsedData, projects: n}) }} />
 </div>
 <div className="col-span-1 md:col-span-2">
 <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">Description</label>
 <textarea className="linear-input min-h-[100px] py-3" rows={2} value={proj.description || ''} onChange={e => { const n = [...parsedData.projects]; n[idx].description = e.target.value; setParsedData({...parsedData, projects: n}) }} />
 </div>
 </div>
 </div>
 ))}
 </section>

 <div className="flex justify-between pt-4">
 <button onClick={() => {setStep(1); setParsedData(null);}} className="px-6 py-2.5 border border-[var(--border)] text-[var(--text-primary)] font-bold hover:bg-[var(--bg-secondary)]">Back</button>
 <button onClick={() => setStep(3)} className="px-6 py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-medium border border-[var(--border)] hover:bg-[var(--btn-primary-hover)] font-bold hover:bg-[var(--btn-primary-hover)] flex items-center gap-2">Next <ArrowRight className="w-4 h-4"/></button>
 </div>
 </div>
 );

 const renderStep3 = () => (
 <div className="animate-in fade-in slide-in-from-right-4 duration-150 space-y-8">
 <div className="mb-6">
 <h2 className="page-title">Organization Assignment</h2>
 <p className="text-[var(--text-secondary)] mt-1">Assign the employee to their respective institution and department.</p>
 </div>

 <div className="bg-white p-6 md:p-8 border border-[var(--border)] space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Institution</label>
 <input type="text" className="linear-input" value={orgData.institution} readOnly />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Department</label>
 <select className="w-full px-4 py-2.5 border border-[var(--border)] focus:ring-[var(--ring-focus)]" value={orgData.department} onChange={e=>setOrgData({...orgData, department: e.target.value})}>
 <option value="">Select Department</option>
 <option value="Engineering">Engineering</option>
 <option value="Design">Design</option>
 <option value="Product">Product</option>
 <option value="HR">HR</option>
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Team</label>
 <input type="text" className="linear-input" placeholder="e.g. Frontend Team" value={orgData.team} onChange={e=>setOrgData({...orgData, team: e.target.value})} />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Designation</label>
 <input type="text" className="linear-input" placeholder="e.g. Senior Developer" value={orgData.designation} onChange={e=>setOrgData({...orgData, designation: e.target.value})} />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Reporting Manager</label>
 <input type="text" className="linear-input" placeholder="Manager Name" value={orgData.reportingManager} onChange={e=>setOrgData({...orgData, reportingManager: e.target.value})} />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Date of Joining</label>
 <input type="date" className="linear-input" value={orgData.dateOfJoining} onChange={e=>setOrgData({...orgData, dateOfJoining: e.target.value})} />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Employment Type</label>
 <select className="w-full px-4 py-2.5 border border-[var(--border)] focus:ring-[var(--ring-focus)]" value={orgData.employmentType} onChange={e=>setOrgData({...orgData, employmentType: e.target.value})}>
 <option value="Full-time">Full-time</option>
 <option value="Part-time">Part-time</option>
 <option value="Contract">Contract</option>
 <option value="Internship">Internship</option>
 </select>
 </div>
 </div>
 </div>

 <div className="flex justify-between pt-4">
 <button onClick={() => setStep(2)} className="px-6 py-2.5 border border-[var(--border)] text-[var(--text-primary)] font-bold hover:bg-[var(--bg-secondary)] flex items-center gap-2"><ArrowLeft className="w-4 h-4"/> Back</button>
 <button 
 onClick={() => setStep(4)} 
 disabled={!orgData.department || !orgData.designation}
 className="px-6 py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-medium border border-[var(--border)] hover:bg-[var(--btn-primary-hover)] font-bold hover:bg-[var(--btn-primary-hover)] flex items-center gap-2 disabled:bg-[var(--surface-hover)] disabled:cursor-not-allowed"
 >
 Review & Invite <ArrowRight className="w-4 h-4"/>
 </button>
 </div>
 </div>
 );

 const renderStep4 = () => (
 <div className="animate-in fade-in slide-in-from-right-4 duration-150 space-y-8">
 <div className="mb-6">
 <h2 className="page-title">Final Review & Invite</h2>
 <p className="text-[var(--text-secondary)] mt-1">Review the final details before sending the invitation email.</p>
 </div>

 <div className="bg-white border border-[var(--border)] overflow-hidden">
 <div className="p-6 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center gap-6">
 <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center font-bold text-2xl">
 {parsedData.personalInfo?.fullName ? parsedData.personalInfo.fullName.charAt(0) : '?'}
 </div>
 <div>
 <h3 className="section-title">{parsedData.personalInfo?.fullName || 'No Name Provided'}</h3>
 <p className="text-[var(--text-secondary)] flex items-center gap-2"><Mail className="w-4 h-4"/> {parsedData.personalInfo?.email || 'No Email Provided'}</p>
 </div>
 </div>
 
 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
 <div>
 <h4 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6 flex items-center gap-2"><Building2 className="w-4 h-4"/> Organization Info</h4>
 <ul className="space-y-3">
 <li className="flex justify-between border-b border-[var(--border)] pb-2">
 <span className="text-[var(--text-secondary)]">Institution</span>
 <span className="font-bold text-[var(--text-primary)]">{orgData.institution}</span>
 </li>
 <li className="flex justify-between border-b border-[var(--border)] pb-2">
 <span className="text-[var(--text-secondary)]">Department</span>
 <span className="font-bold text-[var(--text-primary)]">{orgData.department}</span>
 </li>
 <li className="flex justify-between border-b border-[var(--border)] pb-2">
 <span className="text-[var(--text-secondary)]">Designation</span>
 <span className="font-bold text-[var(--text-primary)]">{orgData.designation}</span>
 </li>
 <li className="flex justify-between border-b border-[var(--border)] pb-2">
 <span className="text-[var(--text-secondary)]">Employment Type</span>
 <span className="font-bold text-[var(--text-primary)]">{orgData.employmentType}</span>
 </li>
 </ul>
 </div>
 
 <div>
 <h4 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6 flex items-center gap-2"><Briefcase className="w-4 h-4"/> parsed Profile Summary</h4>
 <ul className="space-y-3">
 <li className="flex justify-between border-b border-[var(--border)] pb-2">
 <span className="text-[var(--text-secondary)]">Total Experience</span>
 <span className="font-bold text-[var(--text-primary)]">{parsedData.experience?.length || 0} Roles</span>
 </li>
 <li className="flex justify-between border-b border-[var(--border)] pb-2">
 <span className="text-[var(--text-secondary)]">Total Projects</span>
 <span className="font-bold text-[var(--text-primary)]">{parsedData.projects?.length || 0} Projects</span>
 </li>
 <li className="flex justify-between border-b border-[var(--border)] pb-2">
 <span className="text-[var(--text-secondary)]">Tech Skills</span>
 <span className="font-bold text-[var(--text-primary)] truncate max-w-[200px]">{parsedData.skills?.technical?.length || 0} listed</span>
 </li>
 </ul>
 </div>
 </div>
 </div>

 <div className="flex justify-between pt-4">
 <button onClick={() => setStep(3)} className="px-6 py-2.5 border border-[var(--border)] text-[var(--text-primary)] font-bold hover:bg-[var(--bg-secondary)] flex items-center gap-2"><ArrowLeft className="w-4 h-4"/> Back</button>
 <button 
 onClick={handleSendInvite} 
 disabled={!parsedData.personalInfo?.email || isSending}
 className="px-8 py-3 bg-[var(--surface)] text-[var(--text-primary)] font-bold hover:bg-[var(--surface)] flex items-center gap-2 transition-all disabled:bg-[var(--surface-hover)] disabled:cursor-not-allowed"
 >
 {isSending ? (
 <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
 ) : (
 <><Mail className="w-5 h-5"/> Send Invitation Email</>
 )}
 </button>
 </div>
 
 {!parsedData.personalInfo?.email && (
 <p className="text-red-500 text-sm text-right mt-2">Employee must have an email address to send an invitation.</p>
 )}
 {inviteError && (
 <p className="text-red-500 text-sm text-right mt-2">{inviteError}</p>
 )}
 </div>
 );

 return (
 <div className="max-w-4xl mx-auto pb-24">
 {/* Success Modal */}
 {simulatedEmailLink && (
 <div className="fixed inset-0 bg-[var(--surface)]/50 flex items-center justify-center p-6 z-50 backdrop-blur-sm">
 <div className="bg-white max-w-lg w-full p-8 text-center animate-in zoom-in duration-150 space-y-6">
 <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <CheckCircle2 className="w-10 h-10 text-emerald-600" />
 </div>
 <h2 className="page-title">Employee Created!</h2>
 <p className="text-[var(--text-secondary)]">
 The invitation process is complete. If you're testing and emails are blocked, you can use this direct link to accept the invite:
 </p>
 <div className="bg-[var(--bg-secondary)] border border-[var(--border)] p-6 text-left break-all select-all shadow-inner">
 <a href={simulatedEmailLink} target="_blank" rel="noopener noreferrer" className="text-[var(--text-primary)] font-bold hover:underline">
 {simulatedEmailLink}
 </a>
 </div>
 <button 
 onClick={() => navigate('/employees')} 
 className="mt-4 w-full py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-medium border border-[var(--border)] hover:bg-[var(--btn-primary-hover)] font-bold hover:bg-[var(--btn-primary-hover)] transition-colors"
 >
 Back to Dashboard
 </button>
 </div>
 </div>
 )}

 {/* Header */}
 <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div>
 <h1 className="page-title">Onboard New Employee</h1>
 <p className="text-[var(--text-secondary)] mt-2">Follow the steps to parse, review, and invite a new team member.</p>
 </div>
 
 {/* Stepper */}
 <div className="flex items-center w-full md:w-96">
 <StepIndicator step={1} currentStep={step} label="Upload" />
 <StepIndicator step={2} currentStep={step} label="Review" />
 <StepIndicator step={3} currentStep={step} label="Assign" />
 <StepIndicator step={4} currentStep={step} label="Invite" />
 </div>
 </div>

 {/* Render Current Step */}
 <div className="mt-8">
 {step === 1 && renderStep1()}
 {step === 2 && renderStep2()}
 {step === 3 && renderStep3()}
 {step === 4 && renderStep4()}
 </div>
 </div>
 );
}










