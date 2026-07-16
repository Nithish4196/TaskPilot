import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Calendar, Trash2, Check, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const AddModules = () => {
 const { projectId } = useParams();
 const navigate = useNavigate();
 const { employees, addModules } = useAppContext();
 
 // Only employees with status 'Active' should appear in the dropdown
 const joinedEmployees = employees.filter(emp => emp.status === 'Active');
 
 const [localModules, setLocalModules] = useState([]);
 const [isAdding, setIsAdding] = useState(false);
 
 const [formData, setFormData] = useState({
 title: '',
 description: '',
 deadline: '',
 assignedTo: '',
 reward_points: 0,
 reward_bonus_coins: 0,
 reward_badge: ''
 });

 const handleAddModule = (e) => {
 e.preventDefault();
 const newModule = {
 id: `temp-${Date.now()}`,
 ...formData
 };
 setLocalModules([...localModules, newModule]);
 setFormData({ title: '', description: '', deadline: '', assignedTo: '', reward_points: 0, reward_bonus_coins: 0, reward_badge: '' });
 setIsAdding(false);
 };

 const removeModule = (id) => {
 setLocalModules(localModules.filter(m => m.id !== id));
 };

 const handleFinish = async () => {
 // Save all local modules to the global state for this project
 await addModules(projectId, localModules);
 navigate('/');
 };

 return (
 <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
 <div className="flex items-center justify-between mb-10">
 <div>
 <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">Add Modules</h1>
 <p className="text-[var(--text-secondary)] mt-1">Break down your project into manageable pieces and assign them to your team.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Modules List */}
 <div className="lg:col-span-2 space-y-6">
 {localModules.length === 0 && !isAdding ? (
 <div className="bg-white border border-dashed border-[var(--border)] p-12 text-center">
 <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg-secondary)] mb-6">
 <Plus className="w-6 h-6 text-[var(--text-primary)]" />
 </div>
 <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No modules yet</h3>
 <p className="text-[var(--text-secondary)] mb-6">Start by adding the first module to this project.</p>
 <button 
 onClick={() => setIsAdding(true)}
 className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-medium border border-[var(--border)] hover:bg-[var(--btn-primary-hover)] font-medium hover:bg-[var(--btn-primary-hover)] transition-all"
 >
 Add First Module
 </button>
 </div>
 ) : (
 <>
 {localModules.map(mod => {
 const assignee = employees.find(m => m.id === mod.assignedTo);
 return (
 <div key={mod.id} className="bg-white p-5 border border-[var(--border)]/60 flex items-start justify-between group">
 <div className="space-y-2">
 <h4 className="font-bold text-[var(--text-primary)]">{mod.title}</h4>
 <p className="text-sm text-[var(--text-secondary)]">{mod.description}</p>
 <div className="flex items-center gap-6 text-xs font-medium text-[var(--text-secondary)] pt-2">
 <div className="flex items-center gap-1.5">
 <Calendar className="w-4 h-4" />
 {mod.deadline}
 </div>
 {assignee && (
 <div className="flex items-center gap-1.5">
 <div className="w-5 h-5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center font-bold text-[10px]">
 {assignee.name.charAt(0)}
 </div>
 {assignee.name}
 </div>
 )}
 </div>
 </div>
 <button 
 onClick={() => removeModule(mod.id)}
 className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 )
 })}
 
 {!isAdding && localModules.length > 0 && (
 <button 
 onClick={() => setIsAdding(true)}
 className="w-full py-4 border-2 border-dashed border-[var(--border)] text-[var(--text-secondary)] font-medium hover:border-[var(--border)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-center gap-2"
 >
 <Plus className="w-5 h-5" />
 Add Another Module
 </button>
 )}
 </>
 )}

 {isAdding && (
 <div className="bg-white p-6 border border-[var(--border)] ring-1 ring-white/50">
 <h3 className="font-bold text-[var(--text-primary)] mb-6">New Module Details</h3>
 <form onSubmit={handleAddModule} className="space-y-6">
 <div>
 <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Title</label>
 <input
 type="text"
 required
 className="linear-input"
 value={formData.title}
 onChange={(e) => setFormData({...formData, title: e.target.value})}
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Description</label>
 <textarea
 required
 rows={2}
 className="linear-input min-h-[100px] py-3"
 value={formData.description}
 onChange={(e) => setFormData({...formData, description: e.target.value})}
 />
 </div>
 <div className="grid grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Deadline</label>
 <input
 type="date"
 required
 className="linear-input"
 value={formData.deadline}
 onChange={(e) => setFormData({...formData, deadline: e.target.value})}
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Assign To</label>
 {joinedEmployees.length === 0 ? (
 <div className="w-full px-4 py-2.5 border border-red-200 bg-red-50 text-red-600 text-sm flex items-center">
 No active employees available.
 </div>
 ) : (
 <select
 required
 className="w-full px-4 py-2.5 border border-[var(--border)] focus:ring-2 focus:ring-[var(--ring-focus)] focus:ring-1 focus:ring-[var(--ring-focus)] focus:border-[var(--border)] outline-none transition-all bg-white"
 value={formData.assignedTo}
 onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
 >
 <option value="">Select team member</option>
 {joinedEmployees.map(m => (
 <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
 ))}
 </select>
 )}
 </div>
 </div>
 
 <div className="border-t border-[var(--border)] pt-4 mt-4">
 <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">Individual Task Reward</h4>
 <div className="grid grid-cols-3 gap-6">
 <div>
 <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Points</label>
 <input
 type="number"
 className="linear-input"
 value={formData.reward_points}
 onChange={(e) => setFormData({...formData, reward_points: e.target.value})}
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Bonus Coins</label>
 <input
 type="number"
 className="linear-input"
 value={formData.reward_bonus_coins}
 onChange={(e) => setFormData({...formData, reward_bonus_coins: e.target.value})}
 />
 </div>
 <div>
 <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Appreciation Badge</label>
 <select
 className="w-full px-3 py-2 border border-[var(--border)] focus:ring-2 focus:ring-[var(--ring-focus)] outline-none text-sm"
 value={formData.reward_badge}
 onChange={(e) => setFormData({...formData, reward_badge: e.target.value})}
 >
 <option value="">None</option>
 <option value="Fast Starter">Fast Starter</option>
 <option value="Top Performer">Top Performer</option>
 <option value="Bug Squasher">Bug Squasher</option>
 </select>
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-4">
 <button
 type="button"
 onClick={() => setIsAdding(false)}
 className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={joinedEmployees.length === 0}
 className={`px-4 py-2 text-[var(--text-primary)] text-sm font-medium transition-all ${joinedEmployees.length === 0 ? 'bg-[var(--surface-hover)] cursor-not-allowed' : 'bg-[var(--surface)] hover:bg-[var(--surface)]'}`}
 >
 Save Module
 </button>
 </div>
 </form>
 </div>
 )}
 </div>

 {/* Sidebar Summary */}
 <div className="lg:col-span-1">
 <div className="bg-[var(--surface)] p-6 text-[var(--text-primary)] sticky top-6">
 <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
 <Check className="w-5 h-5 text-emerald-400" />
 Setup Summary
 </h3>
 <div className="space-y-6 mb-10">
 <div className="flex justify-between items-center text-sm">
 <span className="text-[var(--text-secondary)]">Total Modules</span>
 <span className="font-medium bg-[var(--surface)] px-2.5 py-1">{localModules.length}</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-[var(--text-secondary)]">Team Assigned</span>
 <span className="font-medium bg-[var(--surface)] px-2.5 py-1">
 {new Set(localModules.map(m => m.assignedTo).filter(Boolean)).size} members
 </span>
 </div>
 </div>
 <button
 onClick={handleFinish}
 disabled={localModules.length === 0}
 className={`w-full py-3 font-medium flex items-center justify-center gap-2 transition-all ${
 localModules.length > 0 
 ? 'bg-[var(--bg-secondary)]0 hover:bg-[var(--btn-primary-hover)] text-[var(--text-primary)] shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
 : 'bg-[var(--surface)] text-[var(--text-secondary)] cursor-not-allowed'
 }`}
 >
 Finish Setup
 <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 </div>
 );
};

export default AddModules;








