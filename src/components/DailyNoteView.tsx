import React, { useState, useEffect, useRef } from 'react';
import { HRTask, DailyNoteData } from '../types/hrTask';
import { isDateToday, formatDateFriendly } from '../utils/storage';
import { getCategoryStyles } from '../utils/categories';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  FileText, 
  Plus, 
  Save, 
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';

interface DailyNoteViewProps {
  tasks: HRTask[];
  onToggleComplete: (task: HRTask) => void;
  onEditTask: (task: HRTask) => void;
  onOpenAddTask: () => void;
  dailyNote: DailyNoteData;
  onSaveDailyNote: (note: DailyNoteData) => void;
  initialFocusNotes?: boolean;
}

export const DailyNoteView: React.FC<DailyNoteViewProps> = ({
  tasks,
  onToggleComplete,
  onEditTask,
  onOpenAddTask,
  dailyNote,
  onSaveDailyNote,
  initialFocusNotes = false,
}) => {
  const [focusGoal, setFocusGoal] = useState(dailyNote.focusGoal);
  const [content, setContent] = useState(dailyNote.content);
  const [isSaved, setIsSaved] = useState(false);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialFocusNotes && notesTextareaRef.current) {
      notesTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      notesTextareaRef.current.focus();
    }
  }, [initialFocusNotes]);

  useEffect(() => {
    setFocusGoal(dailyNote.focusGoal);
    setContent(dailyNote.content);
  }, [dailyNote]);

  const handleManualSave = () => {
    onSaveDailyNote({
      focusGoal,
      content,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const todayTasks = tasks.filter(t => isDateToday(t.date));
  const todayPriorities = todayTasks.filter(t => t.priority === 'High' || t.priority === 'Medium');
  const completedToday = tasks.filter(t => isDateToday(t.date) && t.status === 'Completed');
  const pendingOrFollowUp = tasks.filter(
    t => (isDateToday(t.date) || isDateToday(t.followUpDate)) && t.status !== 'Completed'
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Planner Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                HR Daily Planner & Journal
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {todayFormatted}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved to LocalStorage' : 'Save Planner'}</span>
            </button>
          </div>
        </div>

        {/* Today's Focus Goal */}
        <div className="mt-4 pt-1">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-rose-500" />
            <span>Today's Core Focus & Hiring Priorities</span>
          </label>
          <input
            type="text"
            value={focusGoal}
            onChange={(e) => setFocusGoal(e.target.value)}
            onBlur={handleManualSave}
            placeholder="What is the single most important hiring or HR outcome to achieve today?"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 font-medium text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Grid: 🎯 Today's Priorities + ✅ Completed Today */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Today's Priorities */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Today's Priorities</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono-numbers">
                {todayPriorities.length} tasks
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {todayPriorities.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
                  No priority tasks scheduled for today.
                </p>
              ) : (
                todayPriorities.map((task, idx) => {
                  const catStyle = getCategoryStyles(task.category);
                  const isDone = task.status === 'Completed';

                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3 transition-colors"
                    >
                      <button
                        onClick={() => onToggleComplete(task)}
                        className={`mt-0.5 cursor-pointer ${
                          isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onEditTask(task)}>
                        <p className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                          {idx + 1}. {task.title}
                        </p>
                        {(task.description || task.notes) && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {task.description || task.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className={`px-1.5 py-0.2 rounded ${catStyle.pillBg} ${catStyle.pillText}`}>
                            {task.category}
                          </span>
                          <span>·</span>
                          <span className="font-mono-numbers">{task.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
            <button
              onClick={onOpenAddTask}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add another today's task</span>
            </button>
          </div>
        </div>

        {/* Completed Today */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Completed Today</span>
              </h3>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                {completedToday.length} done
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {completedToday.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
                  Check off tasks as you finish candidate calls & HR workflows.
                </p>
              ) : (
                completedToday.map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-through">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {task.category} · Completed at {task.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 mt-3">
            Accomplishments feed directly into your weekly HR productivity scorecard.
          </div>
        </div>
      </div>

      {/* 🔄 Pending / Follow-up Today */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <h3 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Pending & Scheduled Follow-ups</span>
          </h3>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-mono-numbers">
            {pendingOrFollowUp.length} pending
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto">
          {pendingOrFollowUp.length === 0 ? (
            <p className="col-span-2 text-xs text-slate-400 dark:text-slate-500 py-3 text-center">
              All scheduled tasks and follow-ups are up to date!
            </p>
          ) : (
            pendingOrFollowUp.map(task => (
              <div
                key={task.id}
                onClick={() => onEditTask(task)}
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {task.title}
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono-numbers font-semibold">
                    {task.time}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{task.category}</span>
                  {task.followUpDate && (
                    <span className="text-amber-800 dark:text-amber-400 font-medium">
                      Follow-up: {formatDateFriendly(task.followUpDate)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 📝 Free-text Notion-style Daily Notepad */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Daily HR Notepad & Candidate Debriefs
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Auto-saves locally
          </span>
        </div>

        <textarea
          ref={notesTextareaRef}
          rows={7}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            onSaveDailyNote({
              focusGoal,
              content: e.target.value,
              lastUpdated: new Date().toISOString().split('T')[0],
            });
          }}
          placeholder="Jot down notes from hiring manager catchups, candidate interview feedback, salary negotiations, or things to carry over to tomorrow..."
          className="w-full p-3.5 text-xs bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 leading-relaxed font-sans placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-y"
        />
      </div>
    </div>
  );
};
