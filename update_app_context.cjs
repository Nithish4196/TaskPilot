const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.jsx', 'utf8');

// 1. Add state declaration
const stateInjection = `
  const [projectRatings, setProjectRatings] = useState([]);
  const [reminders, setReminders] = useState([]);`;
code = code.replace('  const [projectRatings, setProjectRatings] = useState([]);', stateInjection.trim());

// 2. Add to Promise.all array
const promiseAllSearch = 'supabase.from(\'project_ratings\').select(\'*\').order(\'created_at\', { ascending: false })';
const promiseAllInjection = `supabase.from('project_ratings').select('*').order('created_at', { ascending: false }),
        supabase.from('reminders').select('*').order('reminder_date', { ascending: true })`;
code = code.replace(promiseAllSearch, promiseAllInjection);

// 3. Add to destruction array
const destructSearch = 'feedbackRes, ratingsRes';
const destructInjection = 'feedbackRes, ratingsRes, remindersRes';
code = code.replace(destructSearch, destructInjection);

// 4. Add to state setting
const setterSearch = 'if (ratingsRes && ratingsRes.data) setProjectRatings(ratingsRes.data);';
const setterInjection = `if (ratingsRes && ratingsRes.data) setProjectRatings(ratingsRes.data);
      if (remindersRes && remindersRes.data) setReminders(remindersRes.data);`;
code = code.replace(setterSearch, setterInjection);

// 5. Add to context provider value
const contextValueSearch = 'projectRatings, setProjectRatings,';
const contextValueInjection = 'projectRatings, setProjectRatings, reminders, setReminders,';
code = code.replace(contextValueSearch, contextValueInjection);

fs.writeFileSync('src/context/AppContext.jsx', code);
console.log('Successfully updated AppContext.jsx');
