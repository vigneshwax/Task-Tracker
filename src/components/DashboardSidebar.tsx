import React, { useState } from 'react';
import { HRTask, DailyNoteData, ViewMode } from '../types/hrTask';
import { isDateToday, isDateOverdue, formatDateFriendly } from '../utils/storage';
import { 
  BellRing, 
  Target,
  ArrowUpRight,
  FileText, 
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface DashboardSidebarProps {
  tasks: HRTask[];
  onOpenEditTask: (task: HRTask) => void;
  onQuickToggleComplete: (task: HRTask) => void;
  onOpenAddTask: () => void;
  onSelectView: (view: ViewMode) => void;
  dailyNote: DailyNoteData;
  onUpdateDailyNote: (note: DailyNoteData) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  tasks,
  onOpenEditTask,
  onQuickToggleComplete,
  onOpenAddTask,
  onSelectView,
  dailyNote,
  onUpdateDailyNote,
}) => {
  const [quickNoteText, setQuickNoteText] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalText, setGoalText] = useState(dailyNote.focusGoal);

  const todayTasks = tasks.filter(t => isDateToday(t.date));
  const completedToday = todayTasks.filter(t => t.status === 'Completed').length;
  
  // Follow-ups requiring immediate attention (today or overdue)
  const urgentFollowUps = tasks.filter(
    t => t.followUpDate && (isDateToday(t.followUpDate) || isDateOverdue(t.followUpDate)) && t.status !== 'Completed'
  );

  const handleSaveGoal = () => {
    onUpdateDailyNote({
      ...dailyNote,
      focusGoal: goalText,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
    setIsEditingGoal(false);
  };

  const handleAppendQuickNote = () => {
    if (!quickNoteText.trim()) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newContent = `${dailyNote.content}\n\n[${timestamp}] ${quickNoteText.trim()}`;
    onUpdateDailyNote({
      ...dailyNote,
      content: newContent,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
    setQuickNoteText('');
  };

  return (
    <div className="space-y-4">
      {/* 1. Daily Summary & Focus Goal Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Today's Focus
            </h3>
          </div>
          <button
            onClick={() => setIsEditingGoal(!isEditingGoal)}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium cursor-pointer"
          >
            {isEditingGoal ? 'Cancel' : 'Edit Goal'}
          </button>
        </div>

        {isEditingGoal ? (
          <div className="mt-2.5 space-y-2">
            <textarea
              rows={2}
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-600"
              placeholder="Set priority goal for today..."
            />
            <button
              onClick={handleSaveGoal}
              className="w-full py-1 text-xs font-semibold bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 cursor-pointer"
            >
              Save Focus
            </button>
          </div>
        ) : (
          <div className="mt-2.5">
            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              "{dailyNote.focusGoal || 'Close critical pipeline roles and conduct scheduled candidate interviews.'}"
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{todayTasks.length} tasks scheduled today</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                {completedToday}/{todayTasks.length} done
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Follow-ups Alert Section */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-2.5">
          <div className="flex items-center gap-1.5">
            <BellRing className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Follow-ups Due ({urgentFollowUps.length})
            </h3>
          </div>
          <button
            onClick={() => onSelectView('daily-note')}
            className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2 max-h-52 overflow-y-auto">
          {urgentFollowUps.length === 0 ? (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 py-2 text-center">
              No urgent follow-ups pending today.
            </p>
          ) : (
            urgentFollowUps.slice(0, 4).map(task => {
              const isOverdue = isDateOverdue(task.followUpDate);
              return (
                <div
                  key={task.id}
                  className="p-2.5 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2 transition-colors text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                      <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-amber-700 dark:text-amber-400 font-semibold'}>
                        {isOverdue ? 'Overdue: ' : 'Due Today: '} {formatDateFriendly(task.followUpDate)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenEditTask(task)}
                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-600 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Quick Note / Candidate Debrief Snippet */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2.5">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Quick HR Scratchpad
            </h3>
          </div>
          <button
            onClick={() => onSelectView('daily-note')}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium cursor-pointer"
          >
            Open Planner
          </button>
        </div>

        <div className="space-y-2">
          <textarea
            rows={3}
            value={quickNoteText}
            onChange={(e) => setQuickNoteText(e.target.value)}
            placeholder="Quick phone screen observation, recruiter note, salary range quote..."
            className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <button
            onClick={handleAppendQuickNote}
            disabled={!quickNoteText.trim()}
            className="w-full py-1.5 text-xs font-semibold bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
          >
            Add to Daily Journal
          </button>
        </div>
      </div>

      {/* 4. Keyboard Shortcuts & Tips */}
      <div className="p-3.5 bg-slate-100/70 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
        <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          <span>Productivity Shortcuts</span>
        </p>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span>Quick Add Task</span>
          <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono">N</kbd>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span>Quick Search</span>
          <span className="font-mono text-[10px]">Ctrl + K</span>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span>Theme Toggle</span>
          <span>Sun / Moon Icon</span>
        </div>
      </div>
    </div>
  );
};
