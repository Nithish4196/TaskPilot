import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, Mail, Phone, MapPin, Building2, Briefcase, GraduationCap, Award, Save, FolderKanban, Star, TrendingUp } from 'lucide-react';

export default function EmployeeProfile() {
 const { currentUser, projects, projectTeams, dailyFeedback } = useAppContext();
 
 // Get completed projects for portfolio
 const userTeams = projectTeams.filter(t => t.team_leader_id === currentUser?.id || t.team_members?.includes(currentUser?.id));
 const portfolioProjects = projects.filter(p => p.status === 'Completed' && userTeams.some(t => t.project_id === p.id));
 
 // Editable state for permitted fields
 const [mobile, setMobile] = useState(currentUser?.mobile || '');
 const [address, setAddress] = useState(currentUser?.personal_info?.address || '');
 const [emergencyContact, setEmergencyContact] = useState(currentUser?.personal_info?.emergencyContact || '');
 
 const [isEditing, setIsEditing] = useState(false);
 const [isSaving, setIsSaving] = useState(false);

 const handleSave = async () => {
 setIsSaving(true);
 // Simulate API call to save profile
 await new Promise(resolve => setTimeout(resolve, 1000));
 setIsEditing(false);
 setIsSaving(false);
 // Note: In a real app, you would also update the AppContext and Supabase here
 };

 // Performance Score Calculation
 const myFeedback = dailyFeedback?.filter(f => f.to_employee_id === currentUser?.id && f.feedback_type === 'TL_to_Emp') || [];
 
 let overallScore = 0;
 let badges = [];
 
 if (myFeedback.length > 0) {
 let totalScore = 0;
 myFeedback.forEach(f => {
 const q = f.quality_rating || 0;
 const p = f.productivity_rating || 0;
 const c = f.collaboration_rating || 0;
 const comm = f.communication_rating || 0;
 const d = f.deadline_compliance_rating || 0;
 const prob = f.problem_solving_rating || 0;
 
 // Weighting: Tech Quality 30%, Productivity 20%, Teamwork 15%, Problem Solving 15%, Comm 10%, Deadline 10%
 const itemScore = (q * 0.3) + (p * 0.2) + (c * 0.15) + (prob * 0.15) + (comm * 0.1) + (d * 0.1);
 totalScore += itemScore;
 });
 // Convert 1-5 scale to 0-100 scale: (averageScore / 5) * 100
 overallScore = Math.round((totalScore / myFeedback.length) / 5 * 100);

 const avgDeadline = myFeedback.reduce((acc, f) => acc + (f.deadline_compliance_rating || 0), 0) / myFeedback.length;
 if (avgDeadline >= 4.5) badges.push({ name: 'On-Time Performer', icon: '⭐', color: 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[#2A2A2A]' });
 
 const avgProd = myFeedback.reduce((acc, f) => acc + (f.productivity_rating || 0), 0) / myFeedback.length;
 if (avgProd >= 4.5) badges.push({ name: 'Fast Learner', icon: '🚀', color: 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-[var(--border)]' });
 
 const avgTeam = myFeedback.reduce((acc, f) => acc + (f.collaboration_rating || 0), 0) / myFeedback.length;
 if (avgTeam >= 4.5) badges.push({ name: 'Team Champion', icon: '🏆', color: 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[#2A2A2A]' });
 }

 return (
 <div className="max-w-4xl mx-auto pb-24">
 <div className="flex justify-between items-end mb-10">
 <div>
 <h1 className="page-title tracking-tight">My Profile</h1>
 <p className="text-[var(--text-secondary)] mt-1 text-sm">View and manage your personal and professional information.</p>
 </div>
 {!isEditing ? (
 <button 
 onClick={() => setIsEditing(true)}
 className="px-4 py-2 linear-card text-[var(--text-primary)] font-medium text-sm hover:bg-[var(--bg-secondary)] transition-colors"
 >
 Edit Profile
 </button>
 ) : (
 <button 
 onClick={handleSave}
 disabled={isSaving}
 className="btn-primary"
 >
 <Save className="w-4 h-4" />
 {isSaving ? 'Saving...' : 'Save Changes'}
 </button>
 )}
 </div>

 <div className="space-y-6">
 {/* Performance Score & Badges */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="linear-card p-6 flex flex-col justify-center items-center text-center">
 <div className="w-20 h-20 rounded-full bg-[var(--surface)] border-[3px] border-[#111111] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
 <span className="text-3xl font-bold text-[var(--text-primary)]">{overallScore}</span>
 </div>
 <h2 className="card-title mb-1">Performance Score</h2>
 <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Based on TL daily reviews</p>
 </div>

 <div className="linear-card p-6">
 <div className="flex items-center gap-2 mb-5">
 <Star className="w-4 h-4 text-[var(--text-secondary)]" />
 <h2 className="text-base font-semibold text-[var(--text-primary)]">Achievement Badges</h2>
 </div>
 <div className="flex flex-wrap gap-3">
 {badges.length > 0 ? badges.map((b, idx) => (
 <div key={idx} className={`px-3 py-2 border flex items-center gap-2 ${b.color}`}>
 <span className="text-lg">{b.icon}</span>
 <span className="font-semibold text-xs tracking-wide">{b.name}</span>
 </div>
 )) : (
 <p className="text-[var(--text-secondary)] text-sm italic">Keep up the good work to earn badges!</p>
 )}
 </div>
 </div>
 </div>

 {/* Personal Info */}
 <div className="linear-card overflow-hidden">
 <div className="p-5 border-b border-[var(--border)] flex items-center gap-2.5 bg-[var(--surface)]">
 <User className="w-4 h-4 text-[var(--text-primary)]" />
 <h2 className="text-base font-semibold text-[var(--text-primary)]">Personal Information</h2>
 </div>
 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Full Name</label>
 <input type="text" className="w-full px-3 py-2 linear-card text-[var(--text-primary)] opacity-70 cursor-not-allowed text-sm" value={currentUser?.name || ''} readOnly />
 <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">Contact HR to change your legal name.</p>
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Email Address</label>
 <div className="relative">
 <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-2.5" />
 <input type="email" className="w-full pl-9 pr-3 py-2 linear-card text-[var(--text-primary)] opacity-70 cursor-not-allowed text-sm" value={currentUser?.email || ''} readOnly />
 </div>
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Mobile Number</label>
 <div className="relative">
 <Phone className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-2.5" />
 <input 
 type="tel" 
 className={`w-full pl-9 pr-3 py-2 border text-sm transition-colors ${isEditing ? 'border-[#111111] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--ring-focus)] outline-none' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] opacity-70 cursor-not-allowed'}`} 
 value={mobile} 
 onChange={e => setMobile(e.target.value)}
 readOnly={!isEditing} 
 />
 </div>
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Date of Birth</label>
 <input type="text" className="linear-input" value={currentUser?.personal_info?.dob || 'Not provided'} readOnly />
 </div>
 <div className="col-span-1 md:col-span-2">
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Residential Address</label>
 <div className="relative">
 <MapPin className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-2.5" />
 <input 
 type="text" 
 className={`w-full pl-9 pr-3 py-2 border text-sm transition-colors ${isEditing ? 'border-[#111111] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--ring-focus)] outline-none' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] opacity-70 cursor-not-allowed'}`} 
 value={address} 
 onChange={e => setAddress(e.target.value)}
 readOnly={!isEditing} 
 />
 </div>
 </div>
 <div className="col-span-1 md:col-span-2">
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Emergency Contact Number</label>
 <div className="relative">
 <Phone className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-2.5" />
 <input 
 type="tel" 
 className={`w-full pl-9 pr-3 py-2 border text-sm transition-colors ${isEditing ? 'border-[#111111] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--ring-focus)] outline-none' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] opacity-70 cursor-not-allowed'}`} 
 value={emergencyContact} 
 onChange={e => setEmergencyContact(e.target.value)}
 readOnly={!isEditing} 
 placeholder="e.g. +1 234 567 8900 (Spouse)"
 />
 </div>
 </div>
 </div>
 </div>

 {/* Professional Info */}
 <div className="linear-card overflow-hidden">
 <div className="p-5 border-b border-[var(--border)] flex items-center gap-2.5 bg-[var(--surface)]">
 <Building2 className="w-4 h-4 text-[var(--text-primary)]" />
 <h2 className="text-base font-semibold text-[var(--text-primary)]">Professional Information</h2>
 </div>
 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Employee ID</label>
 <p className="font-semibold text-[var(--text-primary)] text-sm">{currentUser?.id?.slice(0,8) || 'N/A'}</p>
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Institution</label>
 <p className="font-semibold text-[var(--text-primary)] text-sm">{currentUser?.institution || 'Taskpilot Organization'}</p>
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Department</label>
 <p className="font-semibold text-[var(--text-primary)] text-sm">{currentUser?.department || 'N/A'}</p>
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Team</label>
 <p className="font-semibold text-[var(--text-primary)] text-sm">{currentUser?.team || 'N/A'}</p>
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Designation / Role</label>
 <p className="font-semibold text-[var(--text-primary)] text-sm">{currentUser?.role || 'N/A'}</p>
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Reporting Manager</label>
 <p className="font-semibold text-[var(--text-primary)] text-sm">{currentUser?.reporting_manager || 'N/A'}</p>
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Joining Date</label>
 <p className="font-semibold text-[var(--text-primary)] text-sm">
 {currentUser?.date_of_joining ? new Date(currentUser.date_of_joining).toLocaleDateString() : 'N/A'}
 </p>
 </div>
 <div>
 <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Employment Type</label>
 <p className="font-semibold text-[var(--text-primary)] text-sm">{currentUser?.employment_type || 'Full-time'}</p>
 </div>
 </div>
 </div>

 {/* Skills & Certs Summary (from extracted resume) */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="linear-card overflow-hidden">
 <div className="p-5 border-b border-[var(--border)] flex items-center gap-2.5 bg-[var(--surface)]">
 <Briefcase className="w-4 h-4 text-[var(--text-primary)]" />
 <h2 className="text-base font-semibold text-[var(--text-primary)]">Technical Skills</h2>
 </div>
 <div className="p-5">
 <div className="flex flex-wrap gap-2">
 {(currentUser?.skills?.technical || ['React', 'JavaScript', 'Node.js', 'CSS']).map((skill, idx) => (
 <span key={idx} className="px-2.5 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border)]">
 {skill}
 </span>
 ))}
 </div>
 </div>
 </div>

 <div className="linear-card overflow-hidden">
 <div className="p-5 border-b border-[var(--border)] flex items-center gap-2.5 bg-[var(--surface)]">
 <Award className="w-4 h-4 text-[var(--text-primary)]" />
 <h2 className="text-base font-semibold text-[var(--text-primary)]">Certifications</h2>
 </div>
 <div className="p-5 space-y-6">
 {(currentUser?.certifications || []).length > 0 ? (
 currentUser.certifications.map((cert, idx) => (
 <div key={idx} className="flex gap-3">
 <div className="w-1.5 h-1.5 rounded-full bg-[#2A2A2A] mt-1.5 shrink-0"></div>
 <div>
 <p className="font-semibold text-[var(--text-primary)] text-sm">{cert.name}</p>
 <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{cert.issuer}</p>
 </div>
 </div>
 ))
 ) : (
 <p className="text-[var(--text-secondary)] text-sm italic">No certifications on record.</p>
 )}
 </div>
 </div>
 </div>

 {/* Portfolio / Completed Projects */}
 <div className="linear-card overflow-hidden mt-6">
 <div className="p-5 border-b border-[var(--border)] flex items-center gap-2.5 bg-[var(--surface)]">
 <FolderKanban className="w-4 h-4 text-[var(--text-primary)]" />
 <h2 className="text-base font-semibold text-[var(--text-primary)]">Project Portfolio</h2>
 </div>
 <div className="p-5">
 {portfolioProjects.length === 0 ? (
 <p className="text-[var(--text-secondary)] text-sm italic">No completed projects to display yet.</p>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {portfolioProjects.map(project => (
 <div key={project.id} className="linear-card p-6">
 <p className="font-semibold text-[var(--text-primary)] text-sm mb-1">{project.name}</p>
 <p className="text-[10px] text-[var(--text-secondary)] mb-3 line-clamp-2 leading-relaxed">{project.description}</p>
 <p className="text-[10px] font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] inline-block px-2 py-0.5 rounded border border-[#2A2A2A] uppercase tracking-wider">
 Completed: {project.completed_at ? new Date(project.completed_at).toLocaleDateString() : 'N/A'}
 </p>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 </div>
 </div>
 );
}









