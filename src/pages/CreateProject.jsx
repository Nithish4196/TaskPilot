import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Calendar, X, Search, Filter, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function CreateProject() {
  const navigate = useNavigate();
  const { 
    addProject, 
    employees, 
    projects,
    getEmployeeActiveProjects, 
    getEmployeeWorkload, 
    getEmployeeAvailabilityStatus 
  } = useAppContext();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    deadline: '',
    team_leader_id: '',
    team_members: []
  });

  // Resource Assignment State
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  const [expandedCards, setExpandedCards] = useState({});
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState(null); // { type: 'leader'|'member', employee: obj }

  const toggleCardExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const allSkills = [...new Set(employees.flatMap(e => {
    try { return e.skills?.technical || []; } catch { return []; }
  }))];

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (emp.designation && emp.designation.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDept = deptFilter ? emp.department === deptFilter : true;
      const empSkills = (emp.skills?.technical || []).map(s => s.toLowerCase());
      const matchesSkill = skillFilter ? empSkills.includes(skillFilter.toLowerCase()) : true;
      
      return matchesSearch && matchesDept && matchesSkill;
    }).sort((a, b) => {
      // Sort by skill match if skill filter is active
      if (skillFilter) {
        const aHas = (a.skills?.technical || []).map(s => s.toLowerCase()).includes(skillFilter.toLowerCase());
        const bHas = (b.skills?.technical || []).map(s => s.toLowerCase()).includes(skillFilter.toLowerCase());
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
      }
      return 0;
    });
  }, [employees, searchQuery, deptFilter, skillFilter]);

  const handleNextStep = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleAssignAttempt = (emp, type) => {
    const workload = getEmployeeWorkload(emp.id);
    const activeProjs = getEmployeeActiveProjects(emp.id);

    if (workload > 90 || activeProjs.length >= 3) {
      setPendingAssignment({ type, employee: emp, workload, activeProjsCount: activeProjs.length });
      setShowWarningDialog(true);
    } else {
      executeAssignment(emp, type);
    }
  };

  const executeAssignment = (emp, type) => {
    if (type === 'leader') {
      if (formData.team_leader_id === emp.id) {
        setFormData({ ...formData, team_leader_id: '' });
      } else {
        setFormData({ ...formData, team_leader_id: emp.id });
        // Optional: remove from members if they are now leader
        setFormData(prev => ({ ...prev, team_members: prev.team_members.filter(id => id !== emp.id) }));
      }
    } else {
      if (formData.team_members.includes(emp.id)) {
        setFormData({ ...formData, team_members: formData.team_members.filter(id => id !== emp.id) });
      } else {
        setFormData({ ...formData, team_members: [...formData.team_members, emp.id] });
        // Optional: remove from leader if they are now member
        if (formData.team_leader_id === emp.id) {
          setFormData(prev => ({ ...prev, team_leader_id: '' }));
        }
      }
    }
  };

  const confirmWarningAssignment = () => {
    if (pendingAssignment) {
      executeAssignment(pendingAssignment.employee, pendingAssignment.type);
    }
    setShowWarningDialog(false);
    setPendingAssignment(null);
  };

  const handleSubmit = async () => {
    const newProjectId = await addProject(formData);
    if (newProjectId) {
      navigate(`/add-modules/${newProjectId}`);
    } else {
      alert("Failed to create project in database.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Warning Dialog */}
      {showWarningDialog && pendingAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in duration-300 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">High Workload Warning</h2>
            <p className="text-slate-600 mb-6">
              <strong className="text-slate-900">{pendingAssignment.employee.name}</strong> is currently assigned to {pendingAssignment.activeProjsCount} active projects with a workload of {pendingAssignment.workload}%. Do you want to continue assigning this employee?
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setShowWarningDialog(false)} className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">Cancel</button>
              <button onClick={confirmWarningAssignment} className="px-6 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700">Assign Anyway</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Create New Project</h1>
          <p className="text-slate-500 mt-1">Step {step} of 2: {step === 1 ? 'Project Details' : 'Resource Assignment'}</p>
        </div>
        <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {step === 1 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 md:p-8 max-w-3xl mx-auto">
          <form onSubmit={handleNextStep} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Project Name</label>
                <input
                  type="text" required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="e.g. Website Redesign"
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  required rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                  placeholder="Briefly describe the project goals and scope..."
                  value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Project Department</label>
                <select required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}
                >
                  <option value="">Select Department...</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Deadline</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="date" required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-slate-700"
                    value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-100">
              <button type="button" onClick={() => navigate('/')} className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Cancel
              </button>
              <button type="submit" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-brand-700 transition-all">
                Assign Resources <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Selection */}
          <div className="flex-1 space-y-6">
            
            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input type="text" placeholder="Search employees..." className="w-full pl-10 pr-4 py-2 border rounded-xl" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <div className="flex gap-4">
                <select className="px-4 py-2 border rounded-xl text-sm" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="px-4 py-2 border rounded-xl text-sm" value={skillFilter} onChange={e => setSkillFilter(e.target.value)}>
                  <option value="">All Skills</option>
                  {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Employee Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEmployees.map(emp => {
                const workload = getEmployeeWorkload(emp.id);
                const activeProjs = getEmployeeActiveProjects(emp.id);
                const status = getEmployeeAvailabilityStatus(workload);
                const isCrossDept = formData.department && emp.department && formData.department !== emp.department;
                
                let statusColor = 'bg-emerald-100 text-emerald-800';
                if (status === 'Moderate Workload') statusColor = 'bg-blue-100 text-blue-800';
                if (status === 'Busy') statusColor = 'bg-amber-100 text-amber-800';
                if (status === 'Full Capacity') statusColor = 'bg-red-100 text-red-800';

                const isLeader = formData.team_leader_id === emp.id;
                const isMember = formData.team_members.includes(emp.id);

                return (
                  <div key={emp.id} className={`bg-white rounded-2xl border-2 transition-all shadow-sm overflow-hidden ${isLeader ? 'border-brand-500' : isMember ? 'border-indigo-400' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-inner">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{emp.name}</h3>
                            <p className="text-xs text-slate-500">{emp.designation}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{emp.department}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${statusColor}`}>
                          {status} ({workload}%)
                        </span>
                      </div>

                      {isCrossDept && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span><strong>Cross-Dept:</strong> Will be borrowed from {emp.department}</span>
                        </div>
                      )}

                      <div className="mb-4 flex flex-wrap gap-1">
                        {(emp.skills?.technical || []).slice(0, 3).map((s, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{s}</span>
                        ))}
                        {(emp.skills?.technical?.length > 3) && <span className="text-[10px] text-slate-400">+{emp.skills.technical.length - 3}</span>}
                      </div>

                      {/* Active Projects Accordion */}
                      <div className="border border-slate-100 rounded-lg overflow-hidden mb-4">
                        <button onClick={() => toggleCardExpand(emp.id)} className="w-full bg-slate-50 p-2 text-xs font-bold text-slate-700 flex justify-between items-center hover:bg-slate-100">
                          <span>Active Projects: {activeProjs.length}</span>
                          {expandedCards[emp.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedCards[emp.id] && (
                          <div className="p-2 bg-white text-xs space-y-2">
                            {activeProjs.length === 0 ? <p className="text-slate-400 italic">No active projects.</p> : (
                              activeProjs.map(ap => (
                                <div key={ap.id} className="flex justify-between border-b border-slate-50 pb-1 last:border-0 last:pb-0">
                                  <span className="font-medium text-slate-700 truncate mr-2">{ap.name}</span>
                                  <span className="text-slate-400 shrink-0">{ap.deadline ? new Date(ap.deadline).toLocaleDateString() : 'No date'}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* Assignment Actions */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAssignAttempt(emp, 'leader')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${isLeader ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          {isLeader ? '★ Team Leader' : 'Set as Leader'}
                        </button>
                        <button 
                          onClick={() => handleAssignAttempt(emp, 'member')}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${isMember ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          {isMember ? '✓ Team Member' : 'Add to Team'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Summary Sticky */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-slate-900 rounded-2xl p-6 text-white sticky top-6 shadow-xl">
              <h2 className="text-xl font-bold mb-1">Project Summary</h2>
              <p className="text-sm text-slate-400 mb-6">{formData.name || 'Untitled Project'}</p>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Team Leader</h4>
                  {formData.team_leader_id ? (() => {
                    const l = employees.find(e => e.id === formData.team_leader_id);
                    return (
                      <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold">{l?.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-bold">{l?.name}</p>
                          <p className="text-[10px] text-brand-300">{l?.department}</p>
                        </div>
                      </div>
                    );
                  })() : <p className="text-sm text-slate-400 italic">None selected (Optional)</p>}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Team Members ({formData.team_members.length})</h4>
                  {formData.team_members.length > 0 ? (
                    <div className="space-y-2">
                      {formData.team_members.map(id => {
                        const m = employees.find(e => e.id === id);
                        return (
                          <div key={id} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">{m?.name.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-bold">{m?.name}</p>
                              <p className="text-[10px] text-indigo-300">{m?.department}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="text-sm text-slate-400 italic">None selected (Optional)</p>}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
                  Back
                </button>
                <button onClick={handleSubmit} className="flex-1 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg">
                  Finalize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
