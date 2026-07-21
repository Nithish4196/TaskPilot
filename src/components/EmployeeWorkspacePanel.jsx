import React, { useState, useEffect } from 'react';
import { supabase } from '../context/AppContext';
import { 
  Play, CheckCircle2, Clock, Target, AlertCircle, 
  MessageSquare, FileText, CheckSquare, Loader2, Star, 
  History, Calendar, AlertTriangle 
} from 'lucide-react';

export default function EmployeeWorkspacePanel({ 
  selectedTask, taskSubs, taskModule, taskProject, 
  currentUser, employees, fetchGlobalData, triggerNotification, taskDeliverables, taskHistory 
}) {
  const [activeTab, setActiveTab] = useState('submission'); // submission, history, overall

  // Form State
  const [progressVal, setProgressVal] = useState(0);
  const [updateDesc, setUpdateDesc] = useState('');
  const [changesMade, setChangesMade] = useState('');
  const [hasBlocker, setHasBlocker] = useState('No');
  const [blockerDesc, setBlockerDesc] = useState('');
  const [timeSpentHours, setTimeSpentHours] = useState('');
  const [timeSpentMinutes, setTimeSpentMinutes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [checklist, setChecklist] = useState({ progress: false, summary: false, evidence: false });
  const [submissionLinks, setSubmissionLinks] = useState([{ title: '', url: '' }]);
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);

  // Final Completion State
  const [finalDeliverables, setFinalDeliverables] = useState('');
  const [sourceCodeUrl, setSourceCodeUrl] = useState('');
  const [filesUrl, setFilesUrl] = useState('');
  const [finalNotes, setFinalNotes] = useState('');
  const [testingDetails, setTestingDetails] = useState('');
  const [deploymentDetails, setDeploymentDetails] = useState('');

  // Activity Timeline
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    if (selectedTask) {
      setProgressVal(selectedTask.progress || 0);
      setChecklist({ progress: false, summary: false, evidence: false });
      setHasBlocker('No');
      setBlockerDesc('');
      setTimeSpentHours('');
      setTimeSpentMinutes('');
      setUpdateDesc('');
      setChangesMade('');
      setSubmissionLinks([{ title: '', url: '' }]);
      setSubmissionFiles([]);
      loadDraft();
      fetchTimeline();
    }
  }, [selectedTask]);

  useEffect(() => {
    // Autosave every 30 seconds
    const interval = setInterval(() => {
      saveDraft();
    }, 30000);
    return () => clearInterval(interval);
  }, [updateDesc, changesMade, progressVal, hasBlocker, blockerDesc, timeSpentHours, timeSpentMinutes, submissionLinks, submissionFiles]);

  const saveDraft = () => {
    if (!selectedTask) return;
    const draft = { updateDesc, changesMade, progressVal, hasBlocker, blockerDesc, timeSpentHours, timeSpentMinutes, submissionLinks, submissionFiles };
    localStorage.setItem(`draft_${selectedTask.id}`, JSON.stringify(draft));
    setLastSaved(new Date());
  };

  const loadDraft = () => {
    if (!selectedTask) return;
    const draft = localStorage.getItem(`draft_${selectedTask.id}`);
    if (draft) {
      try {
        const d = JSON.parse(draft);
        setUpdateDesc(d.updateDesc || '');
        setChangesMade(d.changesMade || '');
        setSubmissionLinks(d.submissionLinks || [{ title: '', url: '' }]);
        setSubmissionFiles(d.submissionFiles || []);
        setProgressVal(d.progressVal || selectedTask.progress || 0);
        setHasBlocker(d.hasBlocker || 'No');
        setBlockerDesc(d.blockerDesc || '');
        setTimeSpentHours(d.timeSpentHours || '');
        setTimeSpentMinutes(d.timeSpentMinutes || '');
      } catch(e) {}
    }
  };

  const clearDraft = () => {
    if (!selectedTask) return;
    localStorage.removeItem(`draft_${selectedTask.id}`);
  };

  const fetchTimeline = async () => {
    if (!selectedTask) return;
    const { data } = await supabase.from('task_history').select('*').eq('task_id', selectedTask.id).order('timestamp', { ascending: true });
    setTimeline(data || []);
  };

  if (!selectedTask) {
    return (
      <div className="w-full lg:w-1/2 p-8 text-center text-[var(--text-secondary)]">
        <Target className="w-12 h-12 opacity-50 mx-auto mb-4" />
        <h3 className="font-semibold text-[var(--text-primary)]">No Task Selected</h3>
        <p className="text-sm">Select a task from the list to view its workspace.</p>
      </div>
    );
  }

  // Derived Properties & Gating
  const isModuleStarted = taskModule && (taskModule.module_started || taskModule.status === 'Started' || taskModule.status === 'In Progress');
  const isModuleCompletedOrClosed = taskModule && (taskModule.manager_approved || taskModule.locked_at !== null || (taskProject && (taskProject.status === 'Completed' || taskProject.status === 'Closed')));
  
  const todayStr = new Date().toDateString();
  const latestTodaySub = taskSubs.find(s => new Date(s.submitted_at).toDateString() === todayStr);
  const showRevisionInput = taskSubs[0]?.status === 'Rejected';
  
  const isSubmissionAllowed = isModuleStarted && !isModuleCompletedOrClosed && selectedTask.status !== 'Completed' && selectedTask.status !== 'Under Final Review';
  const showFinalCompletionForm = selectedTask.progress === 100 && (selectedTask.status === 'In Progress' || selectedTask.status === 'Changes Requested');
  
  const totalSubmissions = taskSubs.length;
  const approvedSubmissions = taskSubs.filter(s => s.status === 'Approved').length;
  const rejectedSubmissions = taskSubs.filter(s => s.status === 'Rejected').length;
  const pendingSubmissions = taskSubs.filter(s => s.status === 'Pending TL Review').length;
  
  let avgRating = 0;
  const ratedSubs = taskSubs.filter(s => s.rating > 0);
  if (ratedSubs.length > 0) {
    avgRating = (ratedSubs.reduce((acc, s) => acc + s.rating, 0) / ratedSubs.length).toFixed(1);
  }

  const renderSmartReminders = () => {
    const reminders = [];
    if (!latestTodaySub && isModuleStarted && selectedTask.status !== 'Completed' && selectedTask.status !== 'Under Final Review') {
      const now = new Date();
      if (now.getHours() >= 17) {
        reminders.push("Today's update missed. Please submit tomorrow with explanation.");
      } else {
        reminders.push("Today's submission pending.");
      }
    }
    if (selectedTask.due_date && selectedTask.status !== 'Completed') {
      const diff = Math.ceil((new Date(selectedTask.due_date) - new Date()) / (1000 * 60 * 60 * 24));
      if (diff > 0 && diff <= 3) reminders.push(`Deadline in ${diff} Days.`);
    }
    if (reminders.length === 0) return null;
    return (
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6 space-y-2">
        <p className="font-semibold text-blue-700 text-sm flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Smart Reminders</p>
        <ul className="list-disc list-inside text-xs text-blue-600">
          {reminders.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>
    );
  };

  const handleStartTask = async () => {
    try {
      await supabase.from('tasks').update({ status: 'In Progress' }).eq('id', selectedTask.id);
      await supabase.from('task_history').insert([{ task_id: selectedTask.id, performed_by: currentUser.id, action: 'Started Task', new_status: 'In Progress', comments: 'Task work started.' }]);
      fetchGlobalData();
    } catch(err) {}
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!checklist.progress || !checklist.summary || !checklist.evidence) {
      return alert('Please complete all checklist items before submitting.');
    }
    if (progressVal < (selectedTask.progress || 0)) {
      return alert('New progress cannot be less than current progress.');
    }
    if (showRevisionInput && !changesMade) {
      return alert('Please describe the changes you made after the rejection.');
    }
    if (hasBlocker === 'Yes' && !blockerDesc) {
      return alert('Please describe your blocker.');
    }

    setIsUpdating(true);
    try {
      const nextVersion = taskSubs.length > 0 ? (taskSubs[0].version || taskSubs.length) + 1 : 1;
      const progressAdded = progressVal - (selectedTask.progress || 0);
      const remainingProgress = 100 - progressVal;

      const { error: insertError } = await supabase.from('daily_work_submissions').insert([{
        task_id: selectedTask.id,
        employee_id: currentUser.id,
        project_id: selectedTask.project_id,
        progress_pct: progressVal,
        previous_progress: selectedTask.progress || 0,
        progress_added: progressAdded,
        remaining_progress: remainingProgress,
        time_spent_minutes: (parseInt(timeSpentHours || 0) * 60) + parseInt(timeSpentMinutes || 0),
        hours_worked: parseInt(timeSpentHours || 0),
        minutes_worked: parseInt(timeSpentMinutes || 0),
        work_notes: updateDesc,
        changes_made: showRevisionInput ? changesMade : null,
        links: submissionLinks.filter(l => l.url),
        files: submissionFiles,
        blockers: hasBlocker === 'Yes' ? blockerDesc : null,
        status: 'Pending TL Review',
        version: nextVersion
      }]);

      if (insertError) throw insertError;

      await supabase.from('tasks').update({ status: 'In Progress' }).eq('id', selectedTask.id);
      await supabase.from('task_history').insert([{
        task_id: selectedTask.id,
        performed_by: currentUser.id,
        action: showRevisionInput ? 'Submitted Revision' : 'Submitted Daily Work',
        new_status: 'In Progress',
        comments: showRevisionInput ? `Revision (v${nextVersion}): ${changesMade}` : updateDesc
      }]);

      if (taskModule) {
        const { data: teamData } = await supabase.from('project_teams').select('team_leader_id').eq('id', taskModule.team_id).single();
        if (teamData) {
          triggerNotification(teamData.team_leader_id, 'Employee Submitted Work', `${currentUser.name} submitted work for task "${selectedTask.name}".`, 'employee_submitted', selectedTask.id);
        }
      }

      clearDraft();
      fetchGlobalData();
    } catch (err) {
      console.error(err);
      alert('Failed to submit update.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFinalCompletionSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('task_deliverables').insert({
        task_id: selectedTask.id,
        employee_id: currentUser.id,
        link_url: sourceCodeUrl || filesUrl || finalDeliverables || 'N/A',
        description: `Final Deliverables: ${finalDeliverables}\nSource Code: ${sourceCodeUrl}\nFiles: ${filesUrl}\nTesting: ${testingDetails}\nDeployment: ${deploymentDetails}\nNotes: ${finalNotes}`
      });
      if (error) throw error;

      await supabase.from('tasks').update({ status: 'Under Final Review' }).eq('id', selectedTask.id);
      await supabase.from('task_history').insert([{
        task_id: selectedTask.id,
        performed_by: currentUser.id,
        action: 'Submitted Final Completion',
        new_status: 'Under Final Review',
        comments: 'Task submitted for final review.'
      }]);

      if (taskModule) {
        const { data: teamData } = await supabase.from('project_teams').select('team_leader_id').eq('id', taskModule.team_id).single();
        if (teamData) {
          triggerNotification(teamData.team_leader_id, 'Final Task Review', `${currentUser.name} submitted task "${selectedTask.name}" for final completion review.`, 'final_review', selectedTask.id);
        }
      }

      fetchGlobalData();
    } catch (err) {
      console.error(err);
      alert('Failed to submit final completion.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full linear-card overflow-hidden sticky top-24 bg-[var(--bg-primary)] shadow-md border border-[var(--border)] rounded-2xl">
      {/* 1. Task Information */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{selectedTask.name}</h2>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-secondary)] mt-1">{taskModule?.name || 'Unknown Module'}</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase linear-card text-[var(--text-secondary)] border border-[var(--border)]">
            {selectedTask.status}
          </span>
        </div>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">{selectedTask.description}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Priority</p>
            <p className="font-semibold text-[var(--text-primary)] text-xs">{selectedTask.priority}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Deadline</p>
            <p className="font-semibold text-[var(--text-primary)] text-xs">{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Assigned By</p>
            <p className="font-semibold text-[var(--text-primary)] text-xs">{employees.find(e => e.id === taskModule?.team_leader_id)?.name || 'Team Leader'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Est. Hours</p>
            <p className="font-semibold text-[var(--text-primary)] text-xs">{selectedTask.estimated_hours || 0} hrs</p>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex border-b border-[var(--border)]">
        {['submission', 'history', 'timeline', 'overall'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center transition-colors ${activeTab === tab ? 'text-[var(--text-primary)] border-b-2 border-[var(--text-primary)] bg-[var(--surface)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(100vh-350px)]">
        {activeTab === 'submission' && (
          <div className="space-y-6">
            {renderSmartReminders()}
            {!isModuleStarted ? (
              <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md text-sm text-[var(--text-secondary)] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--text-primary)] shrink-0" />
                <span>Waiting for Team Leader to start this module.</span>
              </div>
            ) : selectedTask.status === 'Completed' || selectedTask.status === 'Under Final Review' || isModuleCompletedOrClosed ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <span>Task Completed Successfully</span>
                  </div>
                  <p className="text-xs">No more submissions allowed.</p>
                </div>
                
                {/* Final Submission Details & TL Feedback */}
                <div className="linear-card p-6 border border-green-200 bg-green-50/10">
                  <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                    <CheckSquare className="w-5 h-5 text-green-600" /> Final Submission & Review Details
                  </h3>
                  
                  {taskDeliverables && taskDeliverables.find(d => d.task_id === selectedTask.id) && (
                    <div className="mb-6 pb-6 border-b border-[var(--border)]">
                      <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Your Submitted Deliverables</p>
                      <div className="bg-[var(--bg-secondary)] p-4 rounded text-[var(--text-primary)] whitespace-pre-wrap font-mono text-xs border border-[var(--border)]">
                        {taskDeliverables.find(d => d.task_id === selectedTask.id).description}
                      </div>
                      <div className="mt-3">
                        <a href={taskDeliverables.find(d => d.task_id === selectedTask.id).link_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                          <Play className="w-3 h-3"/> Open Attachment / URL
                        </a>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Team Leader Feedback</p>
                    {selectedTask.tl_feedback ? (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded border border-slate-200 text-sm">
                          {selectedTask.tl_feedback}
                        </div>
                        {selectedTask.improvement_suggestions && (
                          <div className="bg-blue-50 p-4 rounded border border-blue-200 text-sm">
                            <span className="font-bold text-blue-700 block mb-1">Suggestions for Next Time:</span>
                            {selectedTask.improvement_suggestions}
                          </div>
                        )}
                        <div className="flex gap-4">
                          <div className="bg-[var(--bg-secondary)] px-4 py-2 rounded border border-[var(--border)] text-sm flex items-center gap-2">
                            <span className="font-semibold text-[var(--text-secondary)]">Rating:</span>
                            <span className="font-bold text-[var(--text-primary)] flex items-center">{selectedTask.final_rating}/5 <Star className="w-4 h-4 ml-1 fill-yellow-400 text-yellow-400"/></span>
                          </div>
                          {selectedTask.quality_score && (
                            <div className="bg-[var(--bg-secondary)] px-4 py-2 rounded border border-[var(--border)] text-sm flex items-center gap-2">
                              <span className="font-semibold text-[var(--text-secondary)]">Quality Score:</span>
                              <span className="font-bold text-green-600">{selectedTask.quality_score}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)] italic">Pending TL Feedback...</p>
                    )}
                  </div>
                </div>
              </div>
            ) : selectedTask.status === 'Assigned' ? (
              <div className="p-6 linear-card text-center">
                <p className="text-sm text-[var(--text-secondary)] mb-4">You must start the task before submitting daily updates.</p>
                <button onClick={handleStartTask} className="btn-primary mx-auto">
                  <Play className="w-4 h-4" /> Start Task
                </button>
              </div>
            ) : (
              <>
                {/* Rejection Alert */}
                {showRevisionInput && (
                  <div className="bg-red-50 border border-red-200 p-4 text-red-700 text-sm space-y-2 rounded-md mb-6">
                    <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/> Previous Submission Rejected</p>
                    <p className="text-xs">Reason: {taskSubs[0].tl_comments}</p>
                    <p className="text-xs">Reviewed by TL | Rating: {taskSubs[0].rating}/5</p>
                  </div>
                )}

                {/* 2. Today's Work Submission Form */}
                {latestTodaySub && !showRevisionInput ? (
                  <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md text-sm text-[var(--text-secondary)] flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[var(--text-primary)] shrink-0" />
                    <span>Today's submission already sent. Great job!</span>
                  </div>
                ) : showFinalCompletionForm ? (
                  <form onSubmit={handleFinalCompletionSubmit} className="space-y-6">
                    <h3 className="section-title text-green-500 mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Submit Final Completion</h3>
                    
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Final Deliverables (Required)</label>
                      <textarea required placeholder="Summarize the final output..." className="w-full px-3 py-2 linear-card text-sm h-20 resize-none" value={finalDeliverables} onChange={e => setFinalDeliverables(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Source Code URL</label>
                        <input type="url" required placeholder="https://github.com/..." className="w-full px-3 py-2 linear-card text-sm" value={sourceCodeUrl} onChange={e => setSourceCodeUrl(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Files URL</label>
                        <input type="url" placeholder="https://drive.google.com/..." className="w-full px-3 py-2 linear-card text-sm" value={filesUrl} onChange={e => setFilesUrl(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Testing Details (Required)</label>
                      <textarea required placeholder="Test cases..." className="w-full px-3 py-2 linear-card text-sm h-16 resize-none" value={testingDetails} onChange={e => setTestingDetails(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Deployment Details (Required)</label>
                      <textarea required placeholder="Live links..." className="w-full px-3 py-2 linear-card text-sm h-16 resize-none" value={deploymentDetails} onChange={e => setDeploymentDetails(e.target.value)} />
                    </div>
                    <button type="submit" disabled={isUpdating} className="w-full btn-primary bg-green-600 hover:bg-green-700 text-white">
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Submit Final Completion
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleUpdateProgress} className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-[var(--text-primary)]">Today's Work Submission</h3>
                      {lastSaved && <span className="text-[10px] text-[var(--text-secondary)]">Draft saved: {lastSaved.toLocaleTimeString()}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-6 p-4 linear-card bg-[var(--surface)]">
                      <div>
                        <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Current Progress</p>
                        <p className="font-semibold text-lg text-[var(--text-primary)]">{selectedTask.progress || 0}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">New Progress Today</p>
                        <div className="flex items-center gap-3">
                          <input type="range" min="0" max="100" step="5" value={progressVal} onChange={e => setProgressVal(parseInt(e.target.value))} className="w-full accent-white" />
                          <span className="font-semibold text-lg text-[var(--text-primary)] w-12 text-right">{progressVal}%</span>
                        </div>
                        {progressVal < (selectedTask.progress || 0) && <p className="text-red-500 text-xs mt-1">Cannot be less than current.</p>}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">What did you complete today? (Required)</label>
                        <span className="text-[10px] text-[var(--text-secondary)]">{updateDesc.length}/500</span>
                      </div>
                      <textarea required maxLength={500} placeholder="Describe the tasks completed..." className="w-full px-3 py-2 linear-card text-sm h-24 resize-none" value={updateDesc} onChange={e => setUpdateDesc(e.target.value)} />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Additional Changes {showRevisionInput && '(Required)'}</label>
                        <span className="text-[10px] text-[var(--text-secondary)]">{changesMade.length}/500</span>
                      </div>
                      <textarea required={showRevisionInput} maxLength={500} placeholder="What extra changes or improvements did you make today?" className="w-full px-3 py-2 linear-card text-sm h-20 resize-none" value={changesMade} onChange={e => setChangesMade(e.target.value)} />
                    </div>


                    {/* Repository / Deployment Links */}
                    <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Repository / Deployment Links</label>
                      </div>
                      {submissionLinks.map((link, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="text" placeholder="Title (e.g. GitHub PR)" className="w-1/3 px-3 py-2 linear-card text-sm" value={link.title} onChange={e => {
                            const newLinks = [...submissionLinks];
                            newLinks[idx].title = e.target.value;
                            setSubmissionLinks(newLinks);
                          }} />
                          <input type="url" placeholder="https://..." className="w-2/3 px-3 py-2 linear-card text-sm" value={link.url} onChange={e => {
                            const newLinks = [...submissionLinks];
                            newLinks[idx].url = e.target.value;
                            setSubmissionLinks(newLinks);
                          }} />
                          {submissionLinks.length > 1 && (
                            <button type="button" onClick={() => setSubmissionLinks(submissionLinks.filter((_, i) => i !== idx))} className="p-2 text-[var(--text-secondary)] hover:text-red-500">×</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => setSubmissionLinks([...submissionLinks, { title: '', url: '' }])} className="text-xs text-blue-500 font-semibold hover:underline">+ Add Another Link</button>
                    </div>

                    {/* File Uploads (Simulated) */}
                    <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">File Attachments</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {submissionFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-[var(--bg-secondary)] px-2 py-1 rounded text-xs border border-[var(--border)]">
                            <FileText className="w-3 h-3 text-[var(--text-secondary)]" />
                            <span>{f.name}</span>
                            <button type="button" onClick={() => setSubmissionFiles(submissionFiles.filter((_, i) => i !== idx))} className="text-[var(--text-secondary)] hover:text-red-500">×</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="file" multiple className="text-xs text-[var(--text-secondary)]" onChange={e => {
                          const files = Array.from(e.target.files).map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
                          setSubmissionFiles([...submissionFiles, ...files]);
                        }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Problems Faced / Blockers</label>
                        <select className="w-full px-3 py-2 linear-card text-sm bg-[var(--surface)]" value={hasBlocker} onChange={e => setHasBlocker(e.target.value)}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Hours Worked Today</label>
                        <div className="flex gap-2">
                          <input type="number" min="0" placeholder="Hrs" className="w-full px-3 py-2 linear-card text-sm text-center" value={timeSpentHours} onChange={e => setTimeSpentHours(e.target.value)} />
                          <span className="self-center">:</span>
                          <input type="number" min="0" max="59" placeholder="Mins" className="w-full px-3 py-2 linear-card text-sm text-center" value={timeSpentMinutes} onChange={e => setTimeSpentMinutes(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    {hasBlocker === 'Yes' && (
                      <div>
                        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Describe Blocker (Required)</label>
                        <input type="text" required placeholder="What is blocking you?" className="w-full px-3 py-2 linear-card text-sm" value={blockerDesc} onChange={e => setBlockerDesc(e.target.value)} />
                      </div>
                    )}

                    <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded">
                      <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Submission Checklist</p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-[var(--text-primary)] text-[var(--text-secondary)]">
                          <input type="checkbox" checked={checklist.progress} onChange={e => setChecklist({...checklist, progress: e.target.checked})} className="accent-white w-3.5 h-3.5" /> Progress updated accurately
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-[var(--text-primary)] text-[var(--text-secondary)]">
                          <input type="checkbox" checked={checklist.summary} onChange={e => setChecklist({...checklist, summary: e.target.checked})} className="accent-white w-3.5 h-3.5" /> Work summary detailed
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-[var(--text-primary)] text-[var(--text-secondary)]">
                          <input type="checkbox" checked={checklist.evidence} onChange={e => setChecklist({...checklist, evidence: e.target.checked})} className="accent-white w-3.5 h-3.5" /> Evidence / Attachments prepared
                        </label>
                      </div>
                    </div>

                    <button type="submit" disabled={isUpdating} className={`w-full btn-primary ${isUpdating ? 'opacity-50' : ''}`}>
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Submit Daily Update
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        )}

        {/* 4. Previous Submission History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {taskSubs.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No previous submissions.</p>
            ) : taskSubs.map((sub, i) => (
              <div key={sub.id} className="p-4 linear-card border-l-4 border-l-[var(--text-primary)]">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mr-2">Version {sub.version}</span>
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${
                    sub.status === 'Approved' ? 'bg-green-50 text-green-700' :
                    sub.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <p className="font-semibold text-sm text-[var(--text-primary)] mb-1">Progress: {sub.progress_pct}%</p>
                <p className="text-sm text-[var(--text-secondary)] mb-2 italic">"{sub.work_notes}"</p>
                {sub.tl_comments && (
                  <div className="mt-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-xs">
                    <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1"><Star className="w-3 h-3"/> TL Feedback (Rating: {sub.rating}/5)</p>
                    <p className="text-[var(--text-secondary)]">{sub.tl_comments}</p>
                  </div>
                )}
                
                {((sub.links && sub.links.length > 0) || (sub.files && sub.files.length > 0)) && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                    {sub.links && sub.links.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sub.links.map((link, idx) => (
                          <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline bg-blue-50/10 px-2 py-1 rounded">
                            {link.title || link.url}
                          </a>
                        ))}
                      </div>
                    )}
                    {sub.files && sub.files.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sub.files.map((file, idx) => (
                          <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border)] px-2 py-1 rounded hover:bg-[var(--surface)]">
                            <FileText className="w-3 h-3" /> {file.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 6. Activity Timeline */}
        {activeTab === 'timeline' && (
          <div className="relative border-l border-[var(--border)] ml-3 space-y-6">
            {timeline.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] pl-4">No activity yet.</p>
            ) : timeline.map(event => (
              <div key={event.id} className="relative pl-6">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--text-primary)] outline outline-4 outline-[var(--surface)]"></div>
                <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1">{new Date(event.created_at).toLocaleString()}</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{event.action}</p>
                {event.comments && <p className="text-xs text-[var(--text-secondary)] mt-1">{event.comments}</p>}
              </div>
            ))}
          </div>
        )}

        {/* 5. Overall Progress Card */}
        {activeTab === 'overall' && (
          <div className="space-y-6">
            <div className="linear-card p-6 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Overall Progress</span>
              <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-4">{selectedTask.progress || 0}%</h2>
              <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 overflow-hidden border border-[var(--border)]">
                <div className="bg-[var(--text-primary)] h-full rounded-full transition-all duration-1000" style={{ width: `${selectedTask.progress || 0}%` }}></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="linear-card p-4">
                <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Total Updates</p>
                <p className="font-semibold text-lg text-[var(--text-primary)]">{totalSubmissions}</p>
              </div>
              <div className="linear-card p-4">
                <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Avg Rating</p>
                <p className="font-semibold text-lg text-[var(--text-primary)] flex items-center gap-1.5">{avgRating} <Star className="w-4 h-4 fill-[var(--text-primary)]"/></p>
              </div>
              <div className="linear-card p-4">
                <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Approved</p>
                <p className="font-semibold text-lg text-green-500">{approvedSubmissions}</p>
              </div>
              <div className="linear-card p-4">
                <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Rejected</p>
                <p className="font-semibold text-lg text-red-500">{rejectedSubmissions}</p>
              </div>
            </div>

            <div className="linear-card p-6 bg-[var(--surface)]">
              <h4 className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Estimated vs Actual Effort</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[var(--text-secondary)]">Estimated Hours</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedTask.estimated_hours || 0}h</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                <span className="text-sm text-[var(--text-secondary)]">Actual Hours (from updates)</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {Math.round(taskSubs.reduce((acc, s) => acc + (s.time_spent_minutes || 0), 0) / 60)}h
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
