import { Trophy, Medal, Award, Star, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Leaderboard = () => {
  const { employees } = useAppContext();
  
  // Sort only active members by score descending
  const joinedMembers = employees.filter(emp => emp.status === 'Active');
  const rankedMembers = [...joinedMembers].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Team Leaderboard
          </h1>
          <p className="text-slate-500 mt-1">Recognizing top contributors based on module completion and quality.</p>
        </div>
      </div>

      {rankedMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No active members yet</h3>
          <p className="text-slate-500 max-w-sm">Once employees accept their invitations and start completing modules, they will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
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
                      className={`hover:bg-slate-50 transition-colors ${index === 0 ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold">
                          {index === 0 ? <Medal className="w-5 h-5 text-amber-500" /> : 
                           index === 1 ? <Medal className="w-5 h-5 text-slate-400" /> : 
                           index === 2 ? <Medal className="w-5 h-5 text-amber-700" /> : 
                           `#${index + 1}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-brand-100 text-brand-700 ${
                              index === 0 ? 'ring-2 ring-amber-400 ring-offset-2' : ''
                            }`}>
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{member.name}</div>
                            <div className="text-xs text-slate-500">{member.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Star className={`w-4 h-4 ${isTop3 ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                          <span className={`font-bold ${isTop3 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {member.score || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {member.badges && member.badges.length > 0 ? member.badges.map((badge, i) => (
                            <span 
                              key={i} 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100"
                            >
                              <Award className="w-3 h-3" />
                              {badge}
                            </span>
                          )) : (
                            <span className="text-xs text-slate-400 italic">No badges yet</span>
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
