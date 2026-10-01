import React, { useState } from 'react';
import { HRTask } from '../types/hrTask';
import { isDateToday, isDateOverdue, formatDateFriendly, formatTimeCompact, getTodayDateString } from '../utils/storage';
import { getCategoryStyles } from '../utils/categories';
import { BellRing, Calendar, CheckCircle2, ChevronRight, Clock, AlertCircle, X } from 'lucide-react';

interface FollowUpSectionProps {
  tasks: HRTask[];
  onOpenEditTask: (task: HRTask) => void;
  onQuickToggleComplete?: (task: HRTask) => void;
  onMarkFollowUpDone?: (taskId: string) => void;
  onRescheduleFollowUp: (taskId: string, newDate: string) => void;
  onClose?: () => void;
}

export const FollowUpSection: React.FC<FollowUpSectionProps> = ({
  tasks,
  onOpenEditTask,
  onQuickToggleComplete,
  onMarkFollowUpDone,
  onRescheduleFollowUp,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming'>('today');

  const tasksWithFollowUp = tasks.filter(t => Boolean(t.followUpDate));

  const overdue = tasksWithFollowUp.filter(
    t => isDateOverdue(t.followUpDate) && t.status !== 'Completed'
  );
  const today = tasksWithFollowUp.filter(
    t => isDateToday(t.followUpDate) && t.status !== 'Completed'
  );
  const upcoming = tasksWithFollowUp.filter(
    t => t.followUpDate > getTodayDateString() && t.status !== 'Completed'
  );

  const currentList = activeTab === 'today' ? today : activeTab === 'overdue' ? overdue : upcoming;

  const handleSnoozeTomorrow = (taskId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    onRescheduleFollowUp(taskId, dateStr);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <BellRing className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Follow-up Center
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Candidate screening, BGV reports & panel checks
            </p>
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] font-medium ${
              activeTab === 'today'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Today ({today.length})
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] font-medium ${
              activeTab === 'overdue'
                ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Overdue ({overdue.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] font-medium ${
              activeTab === 'upcoming'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Upcoming ({upcoming.length})
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            title="Close follow-up banner"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Task List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
        {currentList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No {activeTab} follow-ups pending. Great job staying on top!
          </div>
        ) : (
          currentList.map(task => {
            const catStyle = getCategoryStyles(task.category);
            return (
              <div
                key={task.id}
                className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <button
                    onClick={() => {
                      if (onMarkFollowUpDone) {
                        onMarkFollowUpDone(task.id);
                      } else if (onQuickToggleComplete) {
                        onQuickToggleComplete(task);
                      }
                    }}
                    title="Mark follow-up done"
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {task.title}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${catStyle.pillBg} ${catStyle.pillText}`}>
                        {task.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-mono-numbers">{formatTimeCompact(task.time)}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        <span className="font-mono-numbers">Due: {formatDateFriendly(task.followUpDate)}</span>
                      </span>
                    </div>

                    {task.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-1 italic bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                        "{task.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Follow-up Actions */}
                <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleSnoozeTomorrow(task.id)}
                    title="Snooze to tomorrow"
                    className="text-[10px] font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    +1 Day
                  </button>
                  <button
                    onClick={() => onOpenEditTask(task)}
                    title="Edit task"
                    className="text-[10px] font-medium px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
