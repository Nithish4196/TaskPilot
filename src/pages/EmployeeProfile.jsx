import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, Mail, Phone, MapPin, Building2, Briefcase, GraduationCap, Award, Save } from 'lucide-react';

export default function EmployeeProfile() {
  const { currentUser } = useAppContext();
  
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

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-slate-500 mt-2">View and manage your personal and professional information.</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Edit Profile
          </button>
        ) : (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      <div className="space-y-8">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
            <User className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
              <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed" value={currentUser?.name || ''} readOnly />
              <p className="text-xs text-slate-400 mt-1">Contact HR to change your legal name.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input type="email" className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed" value={currentUser?.email || ''} readOnly />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="tel" 
                  className={`w-full pl-9 pr-4 py-2 rounded-lg border ${isEditing ? 'border-brand-300 focus:ring-brand-500 bg-white' : 'border-slate-200 bg-slate-50 cursor-not-allowed'}`} 
                  value={mobile} 
                  onChange={e => setMobile(e.target.value)}
                  readOnly={!isEditing} 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Date of Birth</label>
              <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed" value={currentUser?.personal_info?.dob || 'Not provided'} readOnly />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Residential Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text" 
                  className={`w-full pl-9 pr-4 py-2 rounded-lg border ${isEditing ? 'border-brand-300 focus:ring-brand-500 bg-white' : 'border-slate-200 bg-slate-50 cursor-not-allowed'}`} 
                  value={address} 
                  onChange={e => setAddress(e.target.value)}
                  readOnly={!isEditing} 
                />
              </div>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Emergency Contact Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="tel" 
                  className={`w-full pl-9 pr-4 py-2 rounded-lg border ${isEditing ? 'border-brand-300 focus:ring-brand-500 bg-white' : 'border-slate-200 bg-slate-50 cursor-not-allowed'}`} 
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
            <Building2 className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">Professional Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Employee ID</label>
              <p className="font-medium text-slate-900">{currentUser?.id?.slice(0,8) || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Institution</label>
              <p className="font-medium text-slate-900">{currentUser?.institution || 'Taskpilot Organization'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
              <p className="font-medium text-slate-900">{currentUser?.department || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Team</label>
              <p className="font-medium text-slate-900">{currentUser?.team || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Designation / Role</label>
              <p className="font-medium text-slate-900">{currentUser?.role || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reporting Manager</label>
              <p className="font-medium text-slate-900">{currentUser?.reporting_manager || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Joining Date</label>
              <p className="font-medium text-slate-900">
                {currentUser?.date_of_joining ? new Date(currentUser.date_of_joining).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Employment Type</label>
              <p className="font-medium text-slate-900">{currentUser?.employment_type || 'Full-time'}</p>
            </div>
          </div>
        </div>

        {/* Skills & Certs Summary (from extracted resume) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
              <Briefcase className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">Technical Skills</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {(currentUser?.skills?.technical || ['React', 'JavaScript', 'Node.js', 'CSS']).map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
              <Award className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">Certifications</h2>
            </div>
            <div className="p-6 space-y-4">
              {(currentUser?.certifications || []).length > 0 ? (
                currentUser.certifications.map((cert, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0"></div>
                    <div>
                      <p className="font-bold text-slate-900">{cert.name}</p>
                      <p className="text-sm text-slate-500">{cert.issuer}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No certifications on record.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
