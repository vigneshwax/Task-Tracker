import React, { useState } from 'react';
import { HRTask, TaskStatus, TaskPriority } from '../types/hrTask';
import { formatDateCompact, formatTimeCompact, isDateToday, isDateOverdue } from '../utils/storage';
import { getCategoryStyles } from '../utils/categories';
import { 
  Plus, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface KanbanViewProps {
  tasks: HRTask[];
  onUpdateTaskField: (taskId: string, field: keyof HRTask, value: any) => void;
  onEditTask: (task: HRTask) => void;
  onOpenAddTask: (defaultStatus?: TaskStatus) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  tasks,
  onUpdateTaskField,
  onEditTask,
  onOpenAddTask,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const columns: { status: TaskStatus; title: string; color: string; badgeColor: string }[] = [
    { status: 'Pending', title: 'Pending', color: 'border-amber-300 dark:border-amber-700', badgeColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
    { status: 'In Progress', title: 'In Progress', color: 'border-sky-300 dark:border-sky-700', badgeColor: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300' },
    { status: 'Completed', title: 'Completed', color: 'border-emerald-300 dark:border-emerald-700', badgeColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onUpdateTaskField(taskId, 'status', targetStatus);
    }
    setDraggedTaskId(null);
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'High':
        return 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
      case 'Medium':
        return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
      case 'Low':
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {columns.map(col => {
        const columnTasks = tasks.filter(t => t.status === col.status);

        return (
          <div
            key={col.status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.status)}
            className="bg-slate-50/70 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {col.title}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full font-mono-numbers ${col.badgeColor}`}>
                  {columnTasks.length}
                </span>
              </div>

              <button
                onClick={() => onOpenAddTask(col.status)}
                title={`Add task to ${col.title}`}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Cards Dropzone */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {columnTasks.length === 0 ? (
                <div className="h-32 border-2 border-dashed border-slate-200/90 dark:border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                  Drop tasks here or click + to add
                </div>
              ) : (
                columnTasks.map(task => {
                  const catStyle = getCategoryStyles(task.category);
                  const isFollowUpDue = task.followUpDate && (isDateToday(task.followUpDate) || isDateOverdue(task.followUpDate));

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => onEditTask(task)}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-grab active:cursor-grabbing group select-none"
                    >
                      {/* Category and Priority tags */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${catStyle.pillBg} ${catStyle.pillText}`}>
                          {task.category}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getPriorityStyle(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {task.title}
                      </h4>

                      {/* Description / Notes snippet */}
                      {(task.description || task.notes) && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {task.description || task.notes}
                        </p>
                      )}

                      {/* Footer: Date, Time */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-mono-numbers">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatTimeCompact(task.time)}</span>
                          </span>
                          <span>·</span>
                          <span className="font-mono-numbers text-[10px]">
                            {formatDateCompact(task.date)}
                          </span>
                        </div>
                      </div>

                      {/* Follow-up badge */}
                      {task.followUpDate && (
                        <div className={`mt-2 text-[10px] flex items-center gap-1 font-mono-numbers px-2 py-0.5 rounded ${
                          isFollowUpDue
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                        }`}>
                          <Calendar className="w-3 h-3 text-amber-500" />
                          <span>Follow-up: {formatDateCompact(task.followUpDate)}</span>
                        </div>
                      )}

                      {/* Column quick move actions */}
                      <div className="mt-2 pt-2 border-t border-slate-50 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {col.status !== 'Pending' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const prev: Record<TaskStatus, TaskStatus> = {
                                Completed: 'In Progress',
                                'In Progress': 'Pending',
                                Pending: 'Pending'
                              };
                              onUpdateTaskField(task.id, 'status', prev[col.status]);
                            }}
                            className="hover:text-slate-800 dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
                          >
                            <ChevronLeft className="w-3 h-3" />
                            <span>Move left</span>
                          </button>
                        ) : <span />}

                        {col.status !== 'Completed' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const next: Record<TaskStatus, TaskStatus> = {
                                Pending: 'In Progress',
                                'In Progress': 'Completed',
                                Completed: 'Completed'
                              };
                              onUpdateTaskField(task.id, 'status', next[col.status]);
                            }}
                            className="hover:text-slate-800 dark:hover:text-white flex items-center gap-0.5 cursor-pointer ml-auto"
                          >
                            <span>Move right</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : <span />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
