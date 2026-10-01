import React, { useMemo } from 'react';
import { HRTask, TaskStatus, ViewMode } from '../types/hrTask';
import { formatDateFriendly, formatTimeCompact, isDateToday, isDateOverdue } from '../utils/storage';
import { getCategoryStyles } from '../utils/categories';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  Circle, 
  AlertCircle, 
  Calendar, 
  ArrowUpRight, 
  TrendingUp, 
  Sparkles, 
  CheckSquare, 
  BookOpen, 
  Upload, 
  FileText,
  ChevronRight,
  Layers,
  Flag,
  Flame,
  BellRing
} from 'lucide-react';

interface DashboardViewProps {
  tasks: HRTask[];
  onOpenAddTask: () => void;
  onOpenImport: () => void;
  onSelectView: (view: ViewMode) => void;
  onUpdateTaskField: (taskId: string, field: keyof HRTask, value: any) => void;
  onEditTask: (task: HRTask) => void;
  userName?: string;
  userRole?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  onOpenAddTask,
  onOpenImport,
  onSelectView,
  onUpdateTaskField,
  onEditTask,
  userName = 'HR Specialist',
  userRole = 'Talent Acquisition & HR Operations',
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const todayTasks = tasks.filter(t => isDateToday(t.date));
    const overdueTasks = tasks.filter(t => isDateOverdue(t.date) && t.status !== 'Completed');
    const highPriority = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed');

    const followUpsTodayOrOverdue = tasks.filter(
      t => t.followUpDate && (isDateToday(t.followUpDate) || isDateOverdue(t.followUpDate)) && t.status !== 'Completed'
    );

    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate,
      todayTasks,
      overdueTasks,
      highPriority,
      followUpsTodayOrOverdue,
    };
  }, [tasks]);

  // Priority Focus Queue: Today's tasks + overdue + high priority tasks not completed
  const priorityFocusList = useMemo(() => {
    const map = new Map<string, HRTask>();
    // Overdue non-completed first
    metrics.overdueTasks.forEach(t => map.set(t.id, t));
    // High priority not completed
    metrics.highPriority.forEach(t => map.set(t.id, t));
    // Today's tasks
    metrics.todayTasks.forEach(t => map.set(t.id, t));
    // If still small, add other pending/in-progress
    if (map.size < 6) {
      tasks.filter(t => t.status !== 'Completed').forEach(t => map.set(t.id, t));
    }
    return Array.from(map.values()).slice(0, 6);
  }, [tasks, metrics]);

  // Category statistics
  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    tasks.forEach(t => {
      const cat = t.category || 'General';
      if (!map[cat]) map[cat] = { total: 0, completed: 0 };
      map[cat].total++;
      if (t.status === 'Completed') map[cat].completed++;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      total: data.total,
      completed: data.completed,
      rate: Math.round((data.completed / data.total) * 100),
      styles: getCategoryStyles(name),
    }));
  }, [tasks]);

  // Status cycling helper
  const handleCycleStatus = (task: HRTask) => {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      Pending: 'In Progress',
      'In Progress': 'Completed',
      Completed: 'Pending',
    };
    onUpdateTaskField(task.id, 'status', nextStatus[task.status]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Hero Executive Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Command Center
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-numbers">
                {todayFormatted}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {getGreeting()}, {userName.split(' ')[0]}
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              You have <strong className="font-semibold text-slate-900 dark:text-white">{metrics.inProgress + metrics.pending} active tasks</strong> in your pipeline today. 
              {metrics.followUpsTodayOrOverdue.length > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-medium ml-1">
                  ({metrics.followUpsTodayOrOverdue.length} follow-up{metrics.followUpsTodayOrOverdue.length > 1 ? 's' : ''} need attention).
                </span>
              )}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={onOpenAddTask}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>

            <button
              onClick={() => onSelectView('list')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Full Task Table</span>
            </button>

            <button
              onClick={() => onSelectView('daily-note')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Daily Planner</span>
            </button>
          </div>
        </div>

        {/* Progress Bar Ribbon */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Daily Velocity</span>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{metrics.completed} Completed</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>{metrics.inProgress} In Progress</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{metrics.pending} Pending</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Overall Progress</span>
            <span className="font-semibold text-slate-900 dark:text-white font-mono-numbers">
              {metrics.completionRate}%
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden flex">
          <div 
            style={{ width: `${(metrics.completed / (metrics.total || 1)) * 100}%` }}
            className="bg-emerald-500 h-full transition-all duration-300"
          />
          <div 
            style={{ width: `${(metrics.inProgress / (metrics.total || 1)) * 100}%` }}
            className="bg-sky-500 h-full transition-all duration-300"
          />
          <div 
            style={{ width: `${(metrics.pending / (metrics.total || 1)) * 100}%` }}
            className="bg-amber-400 h-full transition-all duration-300"
          />
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: In Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">In Progress</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono-numbers">
              {metrics.inProgress}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">active operations</span>
          </div>
        </div>

        {/* KPI 2: Pending Tasks */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Pending Queue</span>
            <Circle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono-numbers">
              {metrics.pending}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">awaiting action</span>
          </div>
        </div>

        {/* KPI 3: Completed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono-numbers">
              {metrics.completed}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono-numbers">
              {metrics.completionRate}% closed
            </span>
          </div>
        </div>

        {/* KPI 4: Follow-up Radar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Follow-ups Due</span>
            <BellRing className={`w-4 h-4 ${metrics.followUpsTodayOrOverdue.length > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-bold font-mono-numbers ${metrics.followUpsTodayOrOverdue.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {metrics.followUpsTodayOrOverdue.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {metrics.followUpsTodayOrOverdue.length > 0 ? 'urgent candidate/client steps' : 'all clear'}
            </span>
          </div>
        </div>

      </div>

      {/* Main Grid: Priority Focus Queue + Category Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2 spans): Priority Focus Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Priority Focus Queue
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({priorityFocusList.length} top items)
              </span>
            </div>

            <button
              onClick={() => onSelectView('list')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View all tasks</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {priorityFocusList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              No pending priority tasks. You are all caught up!
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs">
              {priorityFocusList.map((task) => {
                const isCompleted = task.status === 'Completed';
                const isHigh = task.priority === 'High';

                return (
                  <div 
                    key={task.id}
                    className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors flex items-start justify-between gap-3 group"
                  >
                    {/* Status Toggle & Title */}
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => handleCycleStatus(task)}
                        title={`Current: ${task.status} · Click to cycle status`}
                        className={`mt-0.5 p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                          task.status === 'Completed'
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
                            : task.status === 'In Progress'
                            ? 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100'
                            : 'text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        {task.status === 'Completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {task.status === 'In Progress' && <Clock className="w-4 h-4 text-sky-600" />}
                        {task.status === 'Pending' && <Circle className="w-4 h-4 text-slate-400" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold truncate ${
                            isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                          }`}>
                            {task.title}
                          </p>

                          {isHigh && (
                            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded">
                              High Priority
                            </span>
                          )}
                        </div>

                        {task.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {task.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
                          <span>{task.category}</span>
                          <span>·</span>
                          <span className="font-mono-numbers">{formatDateFriendly(task.date)}</span>
                          {task.time && (
                            <>
                              <span>·</span>
                              <span className="font-mono-numbers">{formatTimeCompact(task.time)}</span>
                            </>
                          )}
                          {task.followUpDate && (
                            <>
                              <span>·</span>
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Follow-up: {formatDateFriendly(task.followUpDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Edit Action */}
                    <button
                      onClick={() => onEditTask(task)}
                      className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (1 span): Category Pulse & Workstream Distribution */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                HR Workstream Pulse
              </h3>
            </div>
            <button
              onClick={() => onSelectView('analytics')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
            {categoryStats.map(cat => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {cat.name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono-numbers">
                    {cat.completed}/{cat.total} ({cat.rate}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${cat.rate}%` }}
                    className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Daily HR Tip</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Screen candidates within 24 hours of application submission to double candidate engagement and offer acceptance rate.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
