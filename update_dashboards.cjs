const fs = require('fs');

// 1. Employee Dashboard
let empCode = fs.readFileSync('src/pages/EmployeeDashboard.jsx', 'utf8');
if (!empCode.includes('TodaysScheduleWidget')) {
  empCode = empCode.replace('import { useAppContext } from \'../context/AppContext\';', 'import { useAppContext } from \'../context/AppContext\';\nimport TodaysScheduleWidget from \'../components/TodaysScheduleWidget\';');
  
  const injectLocation = `{/* Quick Actions (Placeholder for Phase 2) */}`;
  const injection = `
      {/* Dynamic Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions (Placeholder for Phase 2) */}
`;
  empCode = empCode.replace(injectLocation, injection);
  
  const injectEnd = `</div>
 </div>
 </div>`;
  const injectionEnd = `
        </div>
        <div className="lg:col-span-1 h-[400px]">
          <TodaysScheduleWidget />
        </div>
      </div>
    </div>
  );
}`;
  // We need to carefully replace the ending divs.
  empCode = empCode.replace('      </div>\n    </div>\n  );\n}', `      </div>\n      </div>\n      <div className="lg:col-span-1 h-[400px]"><TodaysScheduleWidget /></div>\n      </div>\n    </div>\n  );\n}`);
  
  fs.writeFileSync('src/pages/EmployeeDashboard.jsx', empCode);
  console.log('EmployeeDashboard updated');
}

// 2. Manager Dashboard
let mgrCode = fs.readFileSync('src/pages/ManagerDashboard.jsx', 'utf8');
if (!mgrCode.includes('TodaysScheduleWidget')) {
  mgrCode = mgrCode.replace('import { useAppContext, supabase } from \'../context/AppContext\';', 'import { useAppContext, supabase } from \'../context/AppContext\';\nimport TodaysScheduleWidget from \'../components/TodaysScheduleWidget\';');
  
  // Find where Overview tab renders the main content
  // We'll wrap the bottom charts/activity into a grid.
  const mgrInjectSearch = '{/* Active Projects Grid */}';
  const mgrInjectReplace = `
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Active Projects Grid */}
  `;
  mgrCode = mgrCode.replace(mgrInjectSearch, mgrInjectReplace);
  
  const mgrInjectEndSearch = '{activeProjects.length === 0 && (';
  const mgrInjectEndReplace = `
          </div>
          <div className="lg:col-span-1 h-[600px] sticky top-6">
            <TodaysScheduleWidget />
          </div>
        </div>
        {activeProjects.length === 0 && (
  `;
  mgrCode = mgrCode.replace(mgrInjectEndSearch, mgrInjectEndReplace);

  fs.writeFileSync('src/pages/ManagerDashboard.jsx', mgrCode);
  console.log('ManagerDashboard updated');
}

// 3. TeamLeaderWorkspace
let tlCode = fs.readFileSync('src/pages/TeamLeaderWorkspace.jsx', 'utf8');
if (!tlCode.includes('TodaysScheduleWidget')) {
  tlCode = tlCode.replace('import { useAppContext, supabase } from \'../context/AppContext\';', 'import { useAppContext, supabase } from \'../context/AppContext\';\nimport TodaysScheduleWidget from \'../components/TodaysScheduleWidget\';');
  
  const tlInjectSearch = '{/* Main Content based on active tab */}';
  const tlInjectReplace = `
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {/* Main Content based on active tab */}
  `;
  tlCode = tlCode.replace(tlInjectSearch, tlInjectReplace);
  
  const tlInjectEndSearch = '{/* Submit Module Update Modal */}';
  const tlInjectEndReplace = `
        </div>
        <div className="lg:col-span-1 h-[600px] sticky top-6 pt-6">
          <TodaysScheduleWidget />
        </div>
      </div>

      {/* Submit Module Update Modal */}
  `;
  tlCode = tlCode.replace(tlInjectEndSearch, tlInjectEndReplace);

  fs.writeFileSync('src/pages/TeamLeaderWorkspace.jsx', tlCode);
  console.log('TeamLeaderWorkspace updated');
}

