const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.jsx', 'utf8');

const oldLogic = `        // Auto-progress enterprise_rewards directly to Unlocked!
        const { data: rewards } = await supabase.from('enterprise_rewards')
          .select('*')
          .contains('module_ids', [sub.module_id])
          .eq('status', 'Waiting for Manager Approval');
          
        if (rewards && rewards.length > 0) {
          for (const reward of rewards) {
            await supabase.from('enterprise_rewards').update({ status: 'Unlocked' }).eq('id', reward.id);
            
            // Get all employees in the target team
            const { data: teamMembers } = await supabase.from('employees').select('id').eq('team', reward.team_name);
            if (teamMembers && teamMembers.length > 0) {
              const claimsToInsert = teamMembers.map(emp => ({
                reward_id: reward.id,
                employee_id: emp.id,
                status: 'Unlocked'
              }));
              await supabase.from('reward_claims').upsert(claimsToInsert, { onConflict: 'reward_id, employee_id', ignoreDuplicates: true });
              
              // Notify TL
              triggerNotification(sub.tl_id, 'Reward Unlocked!', \\\`Congratulations! The reward "\${reward.title}" has been unlocked by the Manager. Claim it now!\\\`, 'reward');
            }
          }
        }`;

const newLogic = `        // Auto-progress enterprise_rewards directly to Unlocked!
        const { data: rewards } = await supabase.from('enterprise_rewards')
          .select('*')
          .contains('module_ids', [sub.module_id])
          .eq('status', 'Waiting for Manager Approval');
          
        if (rewards && rewards.length > 0) {
          for (const reward of rewards) {
            // Check if ALL modules associated with this reward are completed/approved
            const { data: rewardModules } = await supabase.from('project_modules').select('manager_approved').in('id', reward.module_ids || []);
            const allApproved = rewardModules && rewardModules.length > 0 && rewardModules.every(m => m.manager_approved === true);
            
            if (allApproved) {
              await supabase.from('enterprise_rewards').update({ status: 'Unlocked' }).eq('id', reward.id);
              
              // Get all employees in the target team (if team_name is set, otherwise check team_ids)
              let teamMembers = [];
              if (reward.team_ids && reward.team_ids.length > 0) {
                const { data } = await supabase.from('employees').select('id').in('team_id', reward.team_ids);
                teamMembers = data || [];
              } else if (reward.team_name) {
                const { data } = await supabase.from('employees').select('id').eq('team', reward.team_name);
                teamMembers = data || [];
              }
              
              if (teamMembers.length > 0) {
                const claimsToInsert = teamMembers.map(emp => ({
                  reward_id: reward.id,
                  employee_id: emp.id,
                  status: 'Unlocked'
                }));
                await supabase.from('reward_claims').upsert(claimsToInsert, { onConflict: 'reward_id, employee_id', ignoreDuplicates: true });
                
                // Notify TL
                triggerNotification(sub.tl_id, 'Reward Unlocked!', \\\`Congratulations! The reward "\${reward.title}" has been unlocked by the Manager. Claim it now!\\\`, 'reward');
              }
            }
          }
        }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/pages/ProjectDetail.jsx', code);
console.log('Fixed auto unlock logic');
