import { useState } from 'react';
import { Settings, Shield, Bell, Moon, Sun, Smartphone, MonitorSmartphone, Key } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function EmployeeSettings() {
  const { currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState('security');

  return (
    <div className="max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-2">Manage your account security, preferences, and notifications.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'security' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Shield className={`w-5 h-5 ${activeTab === 'security' ? 'text-brand-600' : 'text-slate-400'}`} />
              Security & Password
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'notifications' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Bell className={`w-5 h-5 ${activeTab === 'notifications' ? 'text-brand-600' : 'text-slate-400'}`} />
              Notifications
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'appearance' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <MonitorSmartphone className={`w-5 h-5 ${activeTab === 'appearance' ? 'text-brand-600' : 'text-slate-400'}`} />
              Appearance
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-brand-600" /> Change Password
                </h2>
                <form className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Current Password</label>
                    <input type="password" required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 focus:border-brand-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
                    <input type="password" required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 focus:border-brand-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Confirm New Password</label>
                    <input type="password" required className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 focus:border-brand-500 text-sm" />
                  </div>
                  <button type="button" className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
                    Update Password
                  </button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-brand-600" /> Two-Factor Authentication
                </h2>
                <p className="text-sm text-slate-500 mb-4">Add an extra layer of security to your account. We strongly recommend enabling 2FA.</p>
                <button type="button" className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                  Enable 2FA
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Email Notifications</h2>
              
              {[
                { title: 'New Task Assignments', desc: 'Receive an email when you are assigned a new task.' },
                { title: 'Task Deadline Approaching', desc: 'Get reminded 24 hours before a task is due.' },
                { title: 'Manager Comments', desc: 'Get notified when a manager comments on your updates.' },
                { title: 'Company Announcements', desc: 'Important news and policy changes from HR.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Theme Preferences</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-brand-500 bg-brand-50">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Sun className="w-6 h-6 text-brand-600" />
                  </div>
                  <span className="font-bold text-brand-700">Light Mode</span>
                </button>
                
                <button className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shadow-sm">
                    <Moon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-bold text-slate-700">Dark Mode</span>
                </button>

                <button className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shadow-sm">
                    <MonitorSmartphone className="w-6 h-6 text-slate-600" />
                  </div>
                  <span className="font-bold text-slate-700">System Default</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
