import React, { useState } from 'react';
import { HRTask } from '../types/hrTask';
import { getTodayDateString, formatDateFriendly, formatTimeCompact } from '../utils/storage';
import { getCategoryStyles } from '../utils/categories';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Plus 
} from 'lucide-react';

interface CalendarViewProps {
  tasks: HRTask[];
  onEditTask: (task: HRTask) => void;
  onOpenAddTaskForDate: (dateStr: string) => void;
  onViewDateInList?: (dateStr: string, status?: 'All' | 'Completed') => void;
}

type CalendarMode = 'month' | 'week' | 'day';

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onEditTask,
  onOpenAddTaskForDate,
  onViewDateInList,
}) => {
  const [mode, setMode] = useState<CalendarMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const todayStr = getTodayDateString();

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (mode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (mode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (mode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (mode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month View calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // First day of month (0 = Sun, 1 = Mon, etc.)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Days array for Month grid
  const monthDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
  
  // Previous month trailing days
  const prevMonthDaysCount = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = prevMonthDaysCount - i;
    const prevMonthDate = new Date(year, month - 1, d);
    const dateStr = prevMonthDate.toISOString().split('T')[0];
    monthDays.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const dateStr = curDate.toISOString().split('T')[0];
    monthDays.push({ dateStr, dayNum: d, isCurrentMonth: true });
  }

  // Next month leading days to complete 35 or 42 grid cells
  const remainingCells = (7 - (monthDays.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthDate = new Date(year, month + 1, d);
    const dateStr = nextMonthDate.toISOString().split('T')[0];
    monthDays.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  // Week View calculations
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays: { dateStr: string; dayName: string; dayNum: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push({
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Calendar Header Controls */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {monthName}
          </h2>

          <button
            onClick={handleToday}
            className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* View Mode Toggle: Day / Week / Month */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setMode('month')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              mode === 'month' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setMode('week')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              mode === 'week' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setMode('day')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              mode === 'day' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {mode === 'month' && (
        <div>
          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[560px]">
            {monthDays.map((cell, idx) => {
              const dayTasks = tasks.filter(t => t.date === cell.dateStr);
              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  onClick={() => onOpenAddTaskForDate(cell.dateStr)}
                  className={`p-1.5 sm:p-2 min-h-[95px] flex flex-col justify-between transition-colors hover:bg-slate-50/70 group cursor-pointer ${
                    !cell.isCurrentMonth ? 'bg-slate-50/40 text-slate-400' : 'bg-white text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full font-mono-numbers ${
                        isToday
                          ? 'bg-slate-900 text-white font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddTaskForDate(cell.dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 p-0.5 rounded transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Tasks on this day */}
                  <div className="space-y-1 overflow-y-auto max-h-24">
                    {dayTasks.slice(0, 3).map(task => {
                      const catStyle = getCategoryStyles(task.category);
                      const isCompleted = task.status === 'Completed';

                      return (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(task);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-medium truncate flex items-center gap-1 border transition-shadow hover:shadow-2xs ${
                            isCompleted
                              ? 'bg-slate-100 text-slate-400 line-through border-slate-200'
                              : `${catStyle.pillBg} ${catStyle.pillText} ${catStyle.accentBorder}`
                          }`}
                        >
                          <span className="font-mono-numbers text-[9px] shrink-0 text-slate-400">{formatTimeCompact(task.time)}</span>
                          <span className="truncate">{task.title}</span>
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-slate-500 font-medium pl-1">
                        +{dayTasks.length - 3} more
                      </span>
                    )}

                    {dayTasks.length > 0 && (
                      <div className="pt-1 mt-0.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                        {dayTasks.some(t => t.status === 'Completed') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewDateInList) {
                                onViewDateInList(cell.dateStr, 'Completed');
                              }
                            }}
                            title="Click to view tasks completed on this date"
                            className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>{dayTasks.filter(t => t.status === 'Completed').length} done</span>
                          </button>
                        )}
                        {onViewDateInList && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDateInList(cell.dateStr, 'All');
                            }}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-auto hover:underline cursor-pointer"
                          >
                            View date
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {mode === 'week' && (
        <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[500px]">
          {weekDays.map(day => {
            const dayTasks = tasks.filter(t => t.date === day.dateStr);
            const isToday = day.dateStr === todayStr;

            return (
              <div key={day.dateStr} className="flex flex-col">
                <div className={`p-3 border-b border-slate-100 text-center ${
                  isToday ? 'bg-indigo-50/50' : 'bg-slate-50/70'
                }`}>
                  <p className="text-[11px] font-medium text-slate-500 uppercase">{day.dayName}</p>
                  <p className={`text-base font-bold font-mono-numbers mt-0.5 ${
                    isToday ? 'text-indigo-600' : 'text-slate-900'
                  }`}>
                    {day.dayNum}
                  </p>
                </div>

                <div 
                  className="p-2 space-y-2 flex-1 overflow-y-auto"
                  onClick={() => onOpenAddTaskForDate(day.dateStr)}
                >
                  {dayTasks.map(task => {
                    const catStyle = getCategoryStyles(task.category);
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTask(task);
                        }}
                        className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer text-xs"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span className="font-mono-numbers">{formatTimeCompact(task.time)}</span>
                          <span className={`px-1 rounded text-[9px] ${catStyle.pillBg} ${catStyle.pillText}`}>
                            {task.category}
                          </span>
                        </div>
                        <p className={`font-semibold text-slate-900 ${task.status === 'Completed' ? 'line-through text-slate-400' : ''}`}>
                          {task.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DAY VIEW */}
      {mode === 'day' && (
        <div className="p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <p className="text-xs text-slate-500">
                Detailed day schedule and time slots
              </p>
            </div>
            <button
              onClick={() => onOpenAddTaskForDate(currentDate.toISOString().split('T')[0])}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add for this Day</span>
            </button>
          </div>

          <div className="space-y-3">
            {tasks.filter(t => t.date === currentDate.toISOString().split('T')[0]).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                No tasks scheduled for this day. Click above to add an activity!
              </div>
            ) : (
              tasks
                .filter(t => t.date === currentDate.toISOString().split('T')[0])
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(task => {
                  const catStyle = getCategoryStyles(task.category);
                  return (
                    <div
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-mono-numbers text-xs font-semibold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                          {formatTimeCompact(task.time)}
                        </span>
                        <div>
                          <h4 className={`text-xs font-semibold text-slate-900 ${task.status === 'Completed' ? 'line-through text-slate-400' : ''}`}>
                            {task.title}
                          </h4>
                          {task.notes && <p className="text-[11px] text-slate-500 mt-0.5">{task.notes}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${catStyle.pillBg} ${catStyle.pillText}`}>
                          {task.category}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
