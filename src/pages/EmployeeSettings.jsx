import { useState } from 'react';
import { Settings, Shield, Bell, Moon, Sun, Smartphone, MonitorSmartphone, Key } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function EmployeeSettings() {
 const { currentUser } = useAppContext();
 const [activeTab, setActiveTab] = useState('security');

 return (
 <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-2 duration-150">
 <div className="flex justify-between items-end mb-10">
 <div>
 <h1 className="page-title">Settings</h1>
 <p className="text-[var(--text-secondary)] mt-2">Manage your account security, preferences, and notifications.</p>
 </div>
 </div>

 <div className="flex flex-col md:flex-row gap-8">
 {/* Settings Navigation */}
 <div className="w-full md:w-64 shrink-0">
 <div className="linear-card p-2 flex flex-col gap-1">
 <button 
 onClick={() => setActiveTab('security')}
 className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === 'security' ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
 >
 <Shield className={`w-5 h-5 ${activeTab === 'security' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`} />
 Security & Password
 </button>
 <button 
 onClick={() => setActiveTab('notifications')}
 className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === 'notifications' ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
 >
 <Bell className={`w-5 h-5 ${activeTab === 'notifications' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`} />
 Notifications
 </button>
 </div>
 </div>

 {/* Settings Content */}
 <div className="flex-1">
 {activeTab === 'security' && (
 <div className="space-y-6">
 <div className="linear-card p-6">
 <h2 className="card-title mb-6 flex items-center gap-2">
 <Key className="w-5 h-5 text-[var(--text-primary)]" /> Change Password
 </h2>
 <form className="space-y-6 max-w-md">
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Current Password</label>
 <input type="password" required className="w-full px-4 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] text-sm" />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">New Password</label>
 <input type="password" required className="w-full px-4 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] text-sm" />
 </div>
 <div>
 <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Confirm New Password</label>
 <input type="password" required className="w-full px-4 py-2 linear-card text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--ring-focus)] text-sm" />
 </div>
 <button type="button" className="btn-primary">
 Update Password
 </button>
 </form>
 </div>

 <div className="linear-card p-6">
 <h2 className="card-title mb-6 flex items-center gap-2">
 <Smartphone className="w-5 h-5 text-[var(--text-primary)]" /> Two-Factor Authentication
 </h2>
 <p className="text-sm text-[var(--text-secondary)] mb-6">Add an extra layer of security to your account. We strongly recommend enabling 2FA.</p>
 <button type="button" className="px-6 py-2 linear-card hover:border-[var(--ring-focus)] text-[var(--text-primary)] font-semibold hover:bg-[var(--surface-hover)] transition-colors">
 Enable 2FA
 </button>
 </div>
 </div>
 )}

 {activeTab === 'notifications' && (
 <div className="linear-card p-6 space-y-6">
 <h2 className="card-title mb-6">Email Notifications</h2>
 
 {[
 { title: 'New Task Assignments', desc: 'Receive an email when you are assigned a new task.' },
 { title: 'Task Deadline Approaching', desc: 'Get reminded 24 hours before a task is due.' },
 { title: 'Manager Comments', desc: 'Get notified when a manager comments on your updates.' },
 { title: 'Company Announcements', desc: 'Important news and policy changes from HR.' },
 ].map((item, idx) => (
 <div key={idx} className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
 <div>
 <h4 className="font-bold text-[var(--text-primary)]">{item.title}</h4>
 <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" className="sr-only peer" defaultChecked />
 <div className="w-11 h-6 bg-[#2A2A2A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--btn-primary-bg)]"></div>
 </label>
 </div>
 ))}
 </div>
 )}

 </div>
 </div>
 </div>
 );
}









