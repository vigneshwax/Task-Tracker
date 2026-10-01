import React, { useState, useMemo, useEffect } from 'react';
import { HRTask, TaskPriority, TaskStatus, TaskFilterState } from '../types/hrTask';
import { formatDateFriendly, isDateOverdue, isDateToday, getTodayDateString } from '../utils/storage';
import { getCategoryStyles } from '../utils/categories';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Edit3, 
  Trash2, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Circle,
  History,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface TaskTableProps {
  tasks: HRTask[];
  onToggleComplete: (task: HRTask) => void;
  onUpdateTaskField: (taskId: string, field: keyof HRTask, value: any) => void;
  onEditTask: (task: HRTask) => void;
  onDuplicateTask: (task: HRTask) => void;
  onRequestDeleteTask: (task: HRTask) => void;
  onRequestBulkDelete: (taskIds: string[]) => void;
  onBulkUpdateStatus: (taskIds: string[], newStatus: TaskStatus) => void;
  categories: string[];
  filterState: TaskFilterState;
  onFilterChange: (newFilter: TaskFilterState) => void;
  selectedTaskIds: string[];
  onToggleSelectTask: (taskId: string) => void;
  onSelectAllVisible: (taskIds: string[]) => void;
  onClearSelection: () => void;
  onOpenAddTask: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  downsideSlot?: React.ReactNode;
}

type SortField = 'date' | 'time' | 'title' | 'category' | 'priority' | 'status' | 'followUpDate';
type SortDirection = 'asc' | 'desc';

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onToggleComplete,
  onUpdateTaskField,
  onEditTask,
  onDuplicateTask,
  onRequestDeleteTask,
  onRequestBulkDelete,
  onBulkUpdateStatus,
  categories,
  filterState,
  onFilterChange,
  selectedTaskIds,
  onToggleSelectTask,
  onSelectAllVisible,
  onClearSelection,
  onOpenAddTask,
  isFullScreen = false,
  onToggleFullScreen,
  downsideSlot,
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const [showDatePickerPopover, setShowDatePickerPopover] = useState(false);

  // Keyboard shortcut listener: 'F' toggles fullscreen, 'Esc' exits
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if ((e.key === 'f' || e.key === 'F') && onToggleFullScreen) {
        e.preventDefault();
        onToggleFullScreen();
      } else if (e.key === 'Escape' && isFullScreen && onToggleFullScreen) {
        e.preventDefault();
        onToggleFullScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, onToggleFullScreen]);

  // Handle sorting toggles
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Count tasks by date ranges for immediate badge visibility
  const dateCounts = useMemo(() => {
    const todayStr = getTodayDateString();
    const today = tasks.filter(t => isDateToday(t.date)).length;
    const todayCompleted = tasks.filter(t => 
      t.status === 'Completed' && (t.completedDate === todayStr || (!t.completedDate && isDateToday(t.date)))
    ).length;
    const overdue = tasks.filter(t => isDateOverdue(t.date) && t.status !== 'Completed').length;
    const all = tasks.length;
    const allCompleted = tasks.filter(t => t.status === 'Completed').length;
    return { today, todayCompleted, overdue, all, allCompleted };
  }, [tasks]);

  // Statistics for the actively selected specific date or today
  const activeDateStats = useMemo(() => {
    const targetDate = filterState.dateRange === 'specific-date' && filterState.specificDate
      ? filterState.specificDate
      : filterState.dateRange === 'today'
      ? getTodayDateString()
      : null;

    if (!targetDate) return null;

    // Tasks completed on this specific target date
    const completedOnDate = tasks.filter(t => 
      t.status === 'Completed' && (t.completedDate === targetDate || (!t.completedDate && t.date === targetDate))
    );
    // Tasks scheduled for this date
    const scheduledOnDate = tasks.filter(t => t.date === targetDate);
    // Combined all tasks associated with this date (either scheduled or completed on this date)
    const allDateTasks = tasks.filter(t => t.date === targetDate || (t.status === 'Completed' && t.completedDate === targetDate));

    const total = allDateTasks.length;
    const completed = completedOnDate.length;
    const inProgress = scheduledOnDate.filter(t => t.status === 'In Progress').length;
    const pending = scheduledOnDate.filter(t => t.status === 'Pending').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      targetDate,
      total,
      completed,
      inProgress,
      pending,
      rate,
      completedTasks: completedOnDate,
    };
  }, [tasks, filterState]);

  // List of distinct dates with task activity & completions for easy date selection
  const dateHistoryList = useMemo(() => {
    const dateMap = new Map<string, { date: string; total: number; completed: number; pending: number }>();
    
    tasks.forEach(t => {
      // Scheduled date
      if (t.date) {
        if (!dateMap.has(t.date)) {
          dateMap.set(t.date, { date: t.date, total: 0, completed: 0, pending: 0 });
        }
        const entry = dateMap.get(t.date)!;
        entry.total += 1;
        if (t.status === 'Pending' || t.status === 'In Progress') {
          entry.pending += 1;
        }
      }
      // Completed date
      if (t.status === 'Completed') {
        const compDate = t.completedDate || t.date;
        if (compDate) {
          if (!dateMap.has(compDate)) {
            dateMap.set(compDate, { date: compDate, total: 0, completed: 0, pending: 0 });
          }
          const entry = dateMap.get(compDate)!;
          entry.completed += 1;
        }
      }
    });

    return Array.from(dateMap.values())
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [tasks]);

  // Step single date forward or backward
  const handleStepDate = (days: number) => {
    const baseDateStr = filterState.specificDate || getTodayDateString();
    const [y, m, d] = baseDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const newDateStr = dateObj.toISOString().split('T')[0];
    onFilterChange({
      ...filterState,
      dateRange: 'specific-date',
      specificDate: newDateStr,
    });
  };

  // Filter tasks based on search & filterState
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. Search Query
      if (filterState.search.trim()) {
        const q = filterState.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesCategory = task.category.toLowerCase().includes(q);
        const matchesNotes = task.notes.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesNotes) {
          return false;
        }
      }

      // 2. Status filter
      if (filterState.status !== 'All' && task.status !== filterState.status) {
        return false;
      }

      // 3. Priority filter
      if (filterState.priority !== 'All' && task.priority !== filterState.priority) {
        return false;
      }

      // 4. Category filter
      if (filterState.category !== 'All' && task.category !== filterState.category) {
        return false;
      }

      // 5. Follow-up only filter
      if (filterState.hasFollowUpOnly && !task.followUpDate) {
        return false;
      }

      // 7. Follow-up category (overdue, today, upcoming)
      if (filterState.followUpFilter === 'today' && (!task.followUpDate || !isDateToday(task.followUpDate))) {
        return false;
      }
      if (filterState.followUpFilter === 'overdue' && (!task.followUpDate || !isDateOverdue(task.followUpDate))) {
        return false;
      }
      if (filterState.followUpFilter === 'upcoming') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!task.followUpDate || task.followUpDate <= todayStr) {
          return false;
        }
      }

      // 8. Date range filter
      if (filterState.dateRange === 'today') {
        const todayStr = getTodayDateString();
        if (filterState.status === 'Completed') {
          const isCompToday = task.status === 'Completed' && (task.completedDate === todayStr || (!task.completedDate && isDateToday(task.date)));
          if (!isCompToday) return false;
        } else {
          if (!isDateToday(task.date) && task.completedDate !== todayStr) return false;
        }
      } else if (filterState.dateRange === 'specific-date' && filterState.specificDate) {
        const target = filterState.specificDate;
        if (filterState.status === 'Completed') {
          const isCompOnDate = task.status === 'Completed' && (task.completedDate === target || (!task.completedDate && task.date === target));
          if (!isCompOnDate) return false;
        } else {
          if (task.date !== target && task.completedDate !== target) return false;
        }
      } else if (filterState.dateRange === 'overdue') {
        if (!isDateOverdue(task.date) || task.status === 'Completed') return false;
      } else if (filterState.dateRange === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        if (task.date !== tomorrowStr) return false;
      } else if (filterState.dateRange === 'this-week') {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(now);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const taskD = new Date(task.date);
        if (taskD < startOfWeek || taskD > endOfWeek) return false;
      } else if (filterState.dateRange === 'custom') {
        if (filterState.customDateStart && task.date < filterState.customDateStart) return false;
        if (filterState.customDateEnd && task.date > filterState.customDateEnd) return false;
      }

      return true;
    });
  }, [tasks, filterState]);

  // Sort filtered tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Priority sort order weight
      if (sortField === 'priority') {
        const pOrder: Record<TaskPriority, number> = { High: 3, Medium: 2, Low: 1 };
        valA = pOrder[a.priority];
        valB = pOrder[b.priority];
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortField, sortDirection]);

  const allVisibleSelected = sortedTasks.length > 0 && sortedTasks.every(t => selectedTaskIds.includes(t.id));

  const handleSelectAllToggle = () => {
    if (allVisibleSelected) {
      onClearSelection();
    } else {
      onSelectAllVisible(sortedTasks.map(t => t.id));
    }
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'High':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'Medium':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Low':
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'In Progress':
        return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'Pending':
        return 'text-amber-700 bg-amber-50 border-amber-200';
    }
  };

  const tableCard = (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
      {/* Search & Filter Toolbar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Global Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder='Search tasks, e.g. "Fabric Sourcing" or candidate name...'
              value={filterState.search}
              onChange={(e) => onFilterChange({ ...filterState, search: e.target.value })}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {filterState.search && (
              <button
                onClick={() => onFilterChange({ ...filterState, search: '' })}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Filters & Advanced Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs relative">
              {/* 1. Today Pill Button */}
              <div className="inline-flex items-center">
                <button
                  onClick={() => onFilterChange({ ...filterState, dateRange: 'today', specificDate: undefined })}
                  title="Show Today's tasks"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    filterState.dateRange === 'today'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>Today</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-numbers ${
                    filterState.dateRange === 'today'
                      ? 'bg-slate-900 text-white dark:bg-indigo-600'
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {dateCounts.today}
                  </span>
                </button>

                {/* If Today is selected, allow 1-click toggle to view only Completed today */}
                {filterState.dateRange === 'today' && dateCounts.todayCompleted > 0 && (
                  <button
                    onClick={() => onFilterChange({ 
                      ...filterState, 
                      status: filterState.status === 'Completed' ? 'All' : 'Completed' 
                    })}
                    title="Click to view tasks completed today"
                    className={`ml-1 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      filterState.status === 'Completed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{dateCounts.todayCompleted} Done</span>
                  </button>
                )}
              </div>

              {/* 2. Select Date & Completion History Button */}
              <div className="relative inline-flex items-center">
                {/* Previous day stepper */}
                {filterState.dateRange === 'specific-date' && filterState.specificDate && (
                  <button
                    onClick={() => handleStepDate(-1)}
                    title="Previous day"
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                )}

                {/* Main Popover Trigger Button */}
                <button
                  type="button"
                  onClick={() => setShowDatePickerPopover(!showDatePickerPopover)}
                  title="Click to select any date or view completion history across dates"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    filterState.dateRange === 'specific-date'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold ring-1 ring-indigo-500/20'
                      : showDatePickerPopover
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>
                    {filterState.dateRange === 'specific-date' && filterState.specificDate
                      ? formatDateFriendly(filterState.specificDate)
                      : 'Select Date'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showDatePickerPopover ? 'rotate-180' : ''}`} />
                </button>

                {/* Next day stepper */}
                {filterState.dateRange === 'specific-date' && filterState.specificDate && (
                  <button
                    onClick={() => handleStepDate(1)}
                    title="Next day"
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}

                {/* If specific date selected, allow 1-click toggle to view only Completed on that date */}
                {filterState.dateRange === 'specific-date' && activeDateStats && activeDateStats.completed > 0 && (
                  <button
                    onClick={() => onFilterChange({ 
                      ...filterState, 
                      status: filterState.status === 'Completed' ? 'All' : 'Completed' 
                    })}
                    title={`Click to view tasks completed on ${activeDateStats.targetDate}`}
                    className={`ml-1 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      filterState.status === 'Completed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{activeDateStats.completed} Done</span>
                  </button>
                )}

                {/* Interactive Date Picker & Completion Log Popover */}
                {showDatePickerPopover && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowDatePickerPopover(false)} 
                    />
                    <div className="absolute right-0 sm:left-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              Select Date & View Completed Tasks
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Choose a date to inspect tasks and completions
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDatePickerPopover(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Direct Calendar Date Input */}
                      <div className="mt-3.5 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                          Pick Date from Calendar:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={filterState.specificDate || getTodayDateString()}
                            onChange={(e) => {
                              if (e.target.value) {
                                onFilterChange({
                                  ...filterState,
                                  dateRange: 'specific-date',
                                  specificDate: e.target.value,
                                  status: 'All',
                                });
                                setShowDatePickerPopover(false);
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const picked = filterState.specificDate || getTodayDateString();
                              onFilterChange({
                                ...filterState,
                                dateRange: 'specific-date',
                                specificDate: picked,
                                status: 'Completed',
                              });
                              setShowDatePickerPopover(false);
                            }}
                            title="View tasks completed on this chosen date"
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors shrink-0 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>View Completed</span>
                          </button>
                        </div>
                      </div>

                      {/* Quick Shortcuts */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                          Quick Presets
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {/* Today */}
                          <button
                            type="button"
                            onClick={() => {
                              onFilterChange({ ...filterState, dateRange: 'today', specificDate: undefined, status: 'All' });
                              setShowDatePickerPopover(false);
                            }}
                            className="p-2 text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer group"
                          >
                            <div className="font-semibold text-slate-900 dark:text-white text-[11px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              Today
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                              <span>{dateCounts.today} tasks</span>
                              <span>·</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {dateCounts.todayCompleted} done</span>
                            </div>
                          </button>

                          {/* Yesterday */}
                          <button
                            type="button"
                            onClick={() => {
                              const y = new Date();
                              y.setDate(y.getDate() - 1);
                              const yStr = y.toISOString().split('T')[0];
                              onFilterChange({ ...filterState, dateRange: 'specific-date', specificDate: yStr, status: 'All' });
                              setShowDatePickerPopover(false);
                            }}
                            className="p-2 text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer group"
                          >
                            <div className="font-semibold text-slate-900 dark:text-white text-[11px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              Yesterday
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Check yesterday's log
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Recent Dates & Completion Log */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <History className="w-3 h-3 text-indigo-500" />
                            <span>Dates with Activity & Completions</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {dateHistoryList.length} dates
                          </span>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100/60 dark:divide-slate-800/60">
                          {dateHistoryList.length === 0 ? (
                            <p className="text-[11px] text-slate-400 py-2 text-center">No dates recorded yet</p>
                          ) : (
                            dateHistoryList.slice(0, 7).map((item) => {
                              const isToday = isDateToday(item.date);
                              const isCurrent = (filterState.dateRange === 'specific-date' && filterState.specificDate === item.date) ||
                                (filterState.dateRange === 'today' && isToday);

                              return (
                                <div
                                  key={item.date}
                                  className={`pt-1.5 pb-1 flex items-center justify-between gap-2 text-xs rounded-lg px-2 transition-colors ${
                                    isCurrent ? 'bg-indigo-50/70 dark:bg-indigo-950/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                  }`}
                                >
                                  <div>
                                    <div className="font-semibold text-slate-900 dark:text-white text-[11px] flex items-center gap-1.5">
                                      <span>{formatDateFriendly(item.date)}</span>
                                      {isToday && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                                          Today
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                      <span>{item.total} tasks</span>
                                      <span>·</span>
                                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                        ✓ {item.completed} completed
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onFilterChange({
                                          ...filterState,
                                          dateRange: isToday ? 'today' : 'specific-date',
                                          specificDate: isToday ? undefined : item.date,
                                          status: 'All',
                                        });
                                        setShowDatePickerPopover(false);
                                      }}
                                      className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-medium cursor-pointer"
                                    >
                                      All
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onFilterChange({
                                          ...filterState,
                                          dateRange: isToday ? 'today' : 'specific-date',
                                          specificDate: isToday ? undefined : item.date,
                                          status: 'Completed',
                                        });
                                        setShowDatePickerPopover(false);
                                      }}
                                      title="View which tasks were completed on this date"
                                      className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Completed ({item.completed})</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

              {/* 3. All Dates Button */}
              <button
                onClick={() => onFilterChange({ ...filterState, dateRange: 'all', specificDate: undefined })}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  filterState.dateRange === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>All Dates</span>
                <span className="text-[10px] font-mono-numbers text-slate-400">
                  {dateCounts.all}
                </span>
              </button>

              {/* 4. Overdue Button */}
              {dateCounts.overdue > 0 && (
                <button
                  onClick={() => onFilterChange({ ...filterState, dateRange: 'overdue', specificDate: undefined })}
                  title={`${dateCounts.overdue} overdue tasks`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    filterState.dateRange === 'overdue'
                      ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-2xs font-semibold'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  }`}
                >
                  <span>Overdue</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono-numbers bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold">
                    {dateCounts.overdue}
                  </span>
                </button>
              )}

              {/* 5. This Week Button */}
              <button
                onClick={() => onFilterChange({ ...filterState, dateRange: 'this-week', specificDate: undefined })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  filterState.dateRange === 'this-week'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                This Week
              </button>
            </div>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                showAdvancedFilters || filterState.status !== 'All' || filterState.priority !== 'All' || filterState.category !== 'All'
                  ? 'border-slate-900 bg-slate-900 text-white dark:bg-indigo-600 dark:border-transparent'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {onToggleFullScreen && (
              <button
                type="button"
                onClick={onToggleFullScreen}
                title={isFullScreen ? "Exit Full Screen (Esc)" : "Full Screen Table Mode (F)"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  isFullScreen
                    ? 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300'
                }`}
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Exit Full Screen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Full Screen</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Date Filter & Task Completion Details Banner */}
        {(filterState.dateRange === 'specific-date' || filterState.dateRange === 'today') && activeDateStats && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs p-3 bg-indigo-50/50 dark:bg-slate-800/60 border border-indigo-100/90 dark:border-slate-700/80 rounded-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>
                  {filterState.dateRange === 'today' ? "Today's Tasks" : formatDateFriendly(activeDateStats.targetDate)}
                </span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 font-mono-numbers">
                  ({activeDateStats.targetDate})
                </span>
              </div>

              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>

              {/* Completion Breakdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{activeDateStats.completed} Completed</span>
                  <span className="text-[10px] font-mono-numbers text-emerald-600 dark:text-emerald-400 font-semibold">({activeDateStats.rate}%)</span>
                </span>

                {activeDateStats.inProgress > 0 && (
                  <span className="text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 rounded text-[11px] font-medium border border-sky-100 dark:border-sky-800/60">
                    {activeDateStats.inProgress} in progress
                  </span>
                )}
                {activeDateStats.pending > 0 && (
                  <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded text-[11px] font-medium border border-amber-100 dark:border-amber-800/60">
                    {activeDateStats.pending} pending
                  </span>
                )}
              </div>
            </div>

            {/* Quick Status Sub-Filter for this Date: View completed vs all */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">View:</span>
              <button
                onClick={() => onFilterChange({ ...filterState, status: 'All' })}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  filterState.status === 'All'
                    ? 'bg-slate-900 text-white dark:bg-indigo-600 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                All ({activeDateStats.total})
              </button>
              <button
                onClick={() => onFilterChange({ ...filterState, status: 'Completed' })}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  filterState.status === 'Completed'
                    ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 font-medium'
                }`}
              >
                <span>Completed ({activeDateStats.completed})</span>
              </button>
              <button
                onClick={() => onFilterChange({ ...filterState, dateRange: 'all', specificDate: undefined, status: 'All' })}
                className="text-indigo-600 dark:text-indigo-400 hover:underline ml-1 cursor-pointer font-medium"
              >
                Show all dates
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Advanced Filters Row */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Status</label>
              <select
                value={filterState.status}
                onChange={(e) => onFilterChange({ ...filterState, status: e.target.value as any })}
                className="w-full text-xs p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Priority</label>
              <select
                value={filterState.priority}
                onChange={(e) => onFilterChange({ ...filterState, priority: e.target.value as any })}
                className="w-full text-xs p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
              >
                <option value="All">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Category</label>
              <select
                value={filterState.category}
                onChange={(e) => onFilterChange({ ...filterState, category: e.target.value })}
                className="w-full text-xs p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-md focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            <div className="sm:col-span-3 flex items-center justify-end pt-1">
              <button
                onClick={() => onFilterChange({
                  search: '',
                  dateRange: 'all',
                  status: 'All',
                  priority: 'All',
                  category: 'All',
                  assignedTo: 'All',
                  hasFollowUpOnly: false,
                  followUpFilter: 'all',
                })}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          </div>
        )}

        {/* Bulk Action Bar (when rows are selected) */}
        {selectedTaskIds.length > 0 && (
          <div className="p-2.5 bg-slate-900 text-white rounded-lg flex items-center justify-between flex-wrap gap-2 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-semibold px-2 py-0.5 bg-slate-800 rounded">
                {selectedTaskIds.length} selected
              </span>
              <button
                onClick={onClearSelection}
                className="text-slate-300 hover:text-white text-xs underline cursor-pointer"
              >
                Deselect all
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-300 text-[11px]">Set Status:</span>
              <button
                onClick={() => onBulkUpdateStatus(selectedTaskIds, 'Completed')}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors cursor-pointer"
              >
                Mark Completed
              </button>
              <button
                onClick={() => onBulkUpdateStatus(selectedTaskIds, 'In Progress')}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded font-medium transition-colors cursor-pointer"
              >
                In Progress
              </button>
              <button
                onClick={() => onBulkUpdateStatus(selectedTaskIds, 'Pending')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition-colors cursor-pointer"
              >
                Pending
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <button
                onClick={() => onRequestBulkDelete(selectedTaskIds)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Data View */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left">
          <thead className="bg-slate-50/75 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
            <tr>
              {/* Date */}
              <th 
                onClick={() => handleSort('date')}
                className="px-4 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  {sortField === 'date' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </div>
              </th>

              {/* Time */}
              <th 
                onClick={() => handleSort('time')}
                className="px-2 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Time</span>
                  {sortField === 'time' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </div>
              </th>

              {/* Task / Activity */}
              <th 
                onClick={() => handleSort('title')}
                className="px-3 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors min-w-[260px]"
              >
                <div className="flex items-center gap-1">
                  <span>Task / Activity</span>
                  {sortField === 'title' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </div>
              </th>

              {/* Category */}
              <th 
                onClick={() => handleSort('category')}
                className="px-3 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Category</span>
                  {sortField === 'category' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </div>
              </th>

              {/* Priority */}
              <th 
                onClick={() => handleSort('priority')}
                className="px-3 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Priority</span>
                  {sortField === 'priority' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </div>
              </th>

              {/* Status */}
              <th 
                onClick={() => handleSort('status')}
                className="px-3 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </div>
              </th>

              {/* Follow-up Date */}
              <th 
                onClick={() => handleSort('followUpDate')}
                className="px-3 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Follow-up Date</span>
                  {sortField === 'followUpDate' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </div>
              </th>

              {/* Actions */}
              <th className="px-3 py-3 text-right whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {filterState.dateRange === 'today' ? "No tasks scheduled for today" : "No tasks found"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {filterState.dateRange === 'today' 
                        ? "You're all caught up for today! Log a new task or switch to view all dates."
                        : "No matching tasks for current filters or search query."}
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={onOpenAddTask}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        + Add Today's Task
                      </button>
                      {filterState.dateRange === 'today' && (
                        <button
                          onClick={() => onFilterChange({ ...filterState, dateRange: 'all' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          View All Dates ({dateCounts.all})
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedTasks.map(task => {
                const isSelected = selectedTaskIds.includes(task.id);
                const isCompleted = task.status === 'Completed';
                const catStyle = getCategoryStyles(task.category);
                const hasFollowUpToday = isDateToday(task.followUpDate);
                const hasFollowUpOverdue = isDateOverdue(task.followUpDate);

                return (
                  <tr
                    key={task.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group ${
                      isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono-numbers text-slate-600 dark:text-slate-300">
                      <div className="flex flex-col gap-0.5">
                        <span className={isDateToday(task.date) ? 'font-semibold text-slate-900 dark:text-white' : ''}>
                          {formatDateFriendly(task.date)}
                        </span>
                        {task.status === 'Completed' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const target = task.completedDate || task.date;
                              onFilterChange({
                                ...filterState,
                                dateRange: 'specific-date',
                                specificDate: target,
                                status: 'Completed',
                              });
                            }}
                            title={`Completed on ${task.completedDate || task.date}. Click to view all tasks completed on this date.`}
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium hover:underline cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Done {formatDateFriendly(task.completedDate || task.date)}</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Time */}
                    <td className="px-2 py-3 whitespace-nowrap font-mono-numbers text-slate-500 dark:text-slate-400 text-[11px]">
                      {task.time || '—'}
                    </td>

                    {/* Task / Activity + Notes snippet */}
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-2">
                        {/* 3-Option Status Trigger (Completed, In Progress, Pending) */}
                        <div className="relative inline-block shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenStatusMenuId(openStatusMenuId === task.id ? null : task.id);
                            }}
                            title={`Status: ${task.status} · Click to choose Completed, In Progress, or Pending`}
                            className={`mt-0.5 p-1 rounded-md cursor-pointer transition-all flex items-center gap-1 group/statusbtn ${
                              task.status === 'Completed'
                                ? 'text-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100/80 ring-1 ring-emerald-200/60 dark:ring-emerald-800/60'
                                : task.status === 'In Progress'
                                ? 'text-sky-600 bg-sky-50/80 dark:bg-sky-950/40 hover:bg-sky-100/80 ring-1 ring-sky-200/60 dark:ring-sky-800/60'
                                : 'text-slate-400 bg-slate-50 dark:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700'
                            }`}
                          >
                            {task.status === 'Completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                            {task.status === 'In Progress' && <Clock className="w-4 h-4 text-sky-600" />}
                            {task.status === 'Pending' && <Circle className="w-4 h-4 text-slate-400" />}
                            <ChevronDown className="w-2.5 h-2.5 opacity-40 group-hover/statusbtn:opacity-100 transition-opacity" />
                          </button>

                          {/* 3-Option Dropdown Menu */}
                          {openStatusMenuId === task.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenStatusMenuId(null);
                                }} 
                              />
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200/90 dark:border-slate-700 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                              >
                                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700 mb-1">
                                  Task Status
                                </div>

                                {/* Option 1: Completed */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateTaskField(task.id, 'status', 'Completed');
                                    setOpenStatusMenuId(null);
                                  }}
                                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer ${
                                    task.status === 'Completed'
                                      ? 'font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                                      : 'text-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Completed</span>
                                  </div>
                                  {task.status === 'Completed' && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  )}
                                </button>

                                {/* Option 2: In Progress */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateTaskField(task.id, 'status', 'In Progress');
                                    setOpenStatusMenuId(null);
                                  }}
                                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-sky-50/80 dark:hover:bg-sky-950/40 transition-colors cursor-pointer ${
                                    task.status === 'In Progress'
                                      ? 'font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50'
                                      : 'text-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                                    <span>In Progress</span>
                                  </div>
                                  {task.status === 'In Progress' && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                                  )}
                                </button>

                                {/* Option 3: Pending */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateTaskField(task.id, 'status', 'Pending');
                                    setOpenStatusMenuId(null);
                                  }}
                                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-amber-50/80 dark:hover:bg-amber-950/40 transition-colors cursor-pointer ${
                                    task.status === 'Pending'
                                      ? 'font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50'
                                      : 'text-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Circle className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Pending</span>
                                  </div>
                                  {task.status === 'Pending' && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                  )}
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className={`font-medium ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                            {task.title}
                          </p>
                          {task.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">
                              {task.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded ${catStyle.pillBg} ${catStyle.pillText}`}>
                        {task.category}
                      </span>
                    </td>

                    {/* Priority (Click to toggle) */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <button
                        onClick={() => {
                          const nextPriority: Record<TaskPriority, TaskPriority> = {
                            High: 'Medium',
                            Medium: 'Low',
                            Low: 'High'
                          };
                          onUpdateTaskField(task.id, 'priority', nextPriority[task.priority]);
                        }}
                        title="Click to cycle priority (High -> Medium -> Low)"
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border cursor-pointer ${getPriorityStyle(task.priority)}`}
                      >
                        {task.priority}
                      </button>
                    </td>

                    {/* Status (Click to cycle) */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <button
                        onClick={() => {
                          const nextStatus: Record<TaskStatus, TaskStatus> = {
                            Pending: 'In Progress',
                            'In Progress': 'Completed',
                            Completed: 'Pending',
                          };
                          onUpdateTaskField(task.id, 'status', nextStatus[task.status]);
                        }}
                        title="Click to advance status"
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded border cursor-pointer ${getStatusStyle(task.status)}`}
                      >
                        {task.status}
                      </button>
                    </td>

                    {/* Follow-up Date */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {task.followUpDate ? (
                        <span className={`inline-flex items-center gap-1 font-mono-numbers text-[11px] px-1.5 py-0.5 rounded ${
                          hasFollowUpOverdue && !isCompleted
                            ? 'text-rose-700 bg-rose-50 font-semibold'
                            : hasFollowUpToday && !isCompleted
                            ? 'text-amber-800 bg-amber-50 font-semibold'
                            : 'text-slate-600'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          <span>{formatDateFriendly(task.followUpDate)}</span>
                          {hasFollowUpToday && !isCompleted && (
                            <span className="text-[10px] text-amber-700 uppercase tracking-wider font-bold">Today</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Row Actions */}
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditTask(task)}
                          title="Edit task"
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDuplicateTask(task)}
                          title="Duplicate task"
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onRequestDeleteTask(task)}
                          title="Delete task"
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with task counters */}
      <div className="px-4 py-3 bg-slate-50/75 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono-numbers">{sortedTasks.length}</span> of <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono-numbers">{tasks.length}</span> total tasks
        </div>
        <div className="flex items-center gap-3">
          <span>Completed: <strong className="text-slate-800 dark:text-slate-200 font-mono-numbers">{tasks.filter(t => t.status === 'Completed').length}</strong></span>
          <span>·</span>
          <span>Pending: <strong className="text-slate-800 dark:text-slate-200 font-mono-numbers">{tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length}</strong></span>
        </div>
      </div>
    </div>
  );

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-md overflow-y-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Full Screen Top Navigation Banner */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 px-5 py-3.5 rounded-xl shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Maximize2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>HR Task Management & Excel Data Table</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Full Screen Mode
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Full-width table view · Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono shadow-2xs">Esc</kbd> or <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono shadow-2xs">F</kbd> to exit
                </p>
              </div>
            </div>
            {onToggleFullScreen && (
              <button
                onClick={onToggleFullScreen}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Full Screen</span>
              </button>
            )}
          </div>

          {/* Table Card */}
          {tableCard}

          {/* Down Side in Full Screen */}
          {downsideSlot && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3 px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Down Side · Daily Focus & Controls
                </h3>
              </div>
              {downsideSlot}
            </div>
          )}
        </div>
      </div>
    );
  }

  return tableCard;
};
