import { Trophy, Medal, Award, Star, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Leaderboard = () => {
 const { employees } = useAppContext();
 
 // Sort only active members by score descending
 const joinedMembers = employees.filter(emp => emp.status === 'Active');
 const rankedMembers = [...joinedMembers].sort((a, b) => (b.score || 0) - (a.score || 0));

 return (
 <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
 <div className="flex items-center justify-between mb-10">
 <div>
 <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
 <Trophy className="w-8 h-8 text-amber-500" />
 Team Leaderboard
 </h1>
 <p className="text-[var(--text-secondary)] mt-1">Recognizing top contributors based on module completion and quality.</p>
 </div>
 </div>

 {rankedMembers.length === 0 ? (
 <div className="bg-white border border-dashed border-[var(--border)] p-12 text-center flex flex-col items-center">
 <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-6">
 <Users className="w-8 h-8 text-[var(--text-secondary)]" />
 </div>
 <h3 className="section-title mb-2">No active members yet</h3>
 <p className="text-[var(--text-secondary)] max-w-sm">Once employees accept their invitations and start completing modules, they will appear here.</p>
 </div>
 ) : (
 <div className="bg-white border border-[var(--border)]/60 overflow-hidden">
 <div className="linear-table-container">
 <table className="w-full text-left text-sm text-[var(--text-secondary)]">
 <thead className="bg-[var(--bg-secondary)]/80 text-xs uppercase font-bold text-[var(--text-secondary)] border-b border-[var(--border)]">
 <tr>
 <th className="px-6 py-4 rounded-tl-2xl">Rank</th>
 <th className="px-6 py-4">Team Member</th>
 <th className="px-6 py-4">Total Score</th>
 <th className="px-6 py-4 rounded-tr-2xl">Badges Earned</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {rankedMembers.map((member, index) => {
 const isTop3 = index < 3;
 return (
 <tr 
 key={member.id} 
 className={`hover:bg-[var(--bg-secondary)] transition-colors ${index === 0 ? 'bg-amber-50/30' : ''}`}
 >
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-bold">
 {index === 0 ? <Medal className="w-5 h-5 text-amber-500" /> : 
 index === 1 ? <Medal className="w-5 h-5 text-[var(--text-secondary)]" /> : 
 index === 2 ? <Medal className="w-5 h-5 text-amber-700" /> : 
 `#${index + 1}`}
 </div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] ${
 index === 0 ? 'ring-2 ring-amber-400 ring-offset-2' : ''
 }`}>
 {member.name.charAt(0)}
 </div>
 <div>
 <div className="font-bold text-[var(--text-primary)]">{member.name}</div>
 <div className="text-xs text-[var(--text-secondary)]">{member.role}</div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="flex items-center gap-2">
 <Star className={`w-4 h-4 ${isTop3 ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-muted)]'}`} />
 <span className={`font-bold ${isTop3 ? 'text-amber-600' : 'text-[var(--text-primary)]'}`}>
 {member.score || 0}
 </span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-wrap gap-2">
 {member.badges && member.badges.length > 0 ? member.badges.map((badge, i) => (
 <span 
 key={i} 
 className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)]"
 >
 <Award className="w-3 h-3" />
 {badge}
 </span>
 )) : (
 <span className="text-xs text-[var(--text-secondary)] italic">No badges yet</span>
 )}
 </div>
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 );
};

export default Leaderboard;







