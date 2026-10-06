import React, { useState } from 'react';
import { HRTask, DailyNoteData, ViewMode, KeepNote } from '../types/hrTask';
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
  onAddKeepNote?: (note: Omit<KeepNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  layout?: 'vertical' | 'horizontal';
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  tasks,
  onOpenEditTask,
  onQuickToggleComplete,
  onOpenAddTask,
  onSelectView,
  dailyNote,
  onUpdateDailyNote,
  onAddKeepNote,
  layout = 'vertical',
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
    if (onAddKeepNote) {
      onAddKeepNote({
        title: '',
        content: quickNoteText.trim(),
        isChecklist: false,
        checklistItems: [],
        color: 'sand',
        isPinned: false,
        tags: [],
      });
    } else {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newContent = `${dailyNote.content}\n\n[${timestamp}] ${quickNoteText.trim()}`;
      onUpdateDailyNote({
        ...dailyNote,
        content: newContent,
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }
    setQuickNoteText('');
  };

  return (
    <div className="space-y-4">
      {/* 3 Main Action Cards: Grid in horizontal mode, Stack in vertical mode */}
      <div className={layout === 'horizontal' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5' : 'space-y-4'}>
        {/* 1. Daily Summary & Focus Goal Card */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
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
              <div className="mt-2.5 space-y-2">
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed italic">
                  "{dailyNote.focusGoal || 'Execute recruitment pipeline, conduct candidate debriefs, and manage team updates.'}"
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayTasks.length} scheduled today</span>
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono-numbers bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
              {completedToday}/{todayTasks.length} done
            </span>
          </div>
        </div>

        {/* 2. Follow-ups Alert Section */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 mb-2.5">
              <div className="flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Follow-ups Due ({urgentFollowUps.length})
                </h3>
              </div>
              <button
                onClick={() => onSelectView('daily-note')}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer font-medium"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {urgentFollowUps.length === 0 ? (
                <div className="py-6 text-center text-slate-400 dark:text-slate-500">
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                  <p className="text-[11px]">No urgent follow-ups pending today.</p>
                </div>
              ) : (
                urgentFollowUps.slice(0, 4).map(task => {
                  const isOverdue = isDateOverdue(task.followUpDate);
                  return (
                    <div
                      key={task.id}
                      className="p-2 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2 transition-colors text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-[11px]">
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
                        title="Open Task"
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

          <div className="mt-3 pt-2 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Automated alerts based on Follow-up Date</span>
            <button
              onClick={() => onOpenAddTask()}
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline cursor-pointer"
            >
              + Add follow-up
            </button>
          </div>
        </div>

        {/* 3. Quick Note / Scratchpad (Google Keep style) */}
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2.5">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Quick Scratchpad
                </h3>
              </div>
              <button
                onClick={() => onSelectView('notes')}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold cursor-pointer"
              >
                Open Notes
              </button>
            </div>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={quickNoteText}
                onChange={(e) => setQuickNoteText(e.target.value)}
                placeholder="Jot down a quick thought, memo, or reminder..."
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/70 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                onClick={handleAppendQuickNote}
                disabled={!quickNoteText.trim()}
                className="w-full py-1.5 text-xs font-semibold bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-700 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
              >
                Save to Notes
              </button>
            </div>
          </div>

          <div className="mt-3 pt-2 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Saves to separate Google Keep Notes</span>
            <span className="font-mono">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* 4. Keyboard Shortcuts & Tips */}
      {layout === 'horizontal' ? (
        <div className="p-3 bg-slate-100/70 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Productivity Hotkeys</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <span className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Quick Add Task:</span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono shadow-2xs">N</kbd>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Search Tasks:</span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono shadow-2xs">Ctrl + K</kbd>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Toggle Full Screen:</span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono shadow-2xs">F</kbd>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Exit Full Screen:</span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono shadow-2xs">Esc</kbd>
            </span>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
};
