import React, { useState, useMemo } from 'react';
import { HRTask } from '../types/hrTask';
import { getTodayDateString } from '../utils/storage';
import { getCategoryStyles } from '../utils/categories';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp
} from 'lucide-react';

interface AnalyticsViewProps {
  tasks: HRTask[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks }) => {
  const [dateScope, setDateScope] = useState<'current-month' | 'previous-month' | 'all'>('current-month');

  // Filter tasks based on month selection
  const scopedTasks = useMemo(() => {
    if (dateScope === 'all') return tasks;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    if (dateScope === 'current-month') {
      return tasks.filter(t => {
        if (!t.date) return false;
        const [y, m] = t.date.split('-').map(Number);
        return y === currentYear && m === currentMonth + 1;
      });
    }

    if (dateScope === 'previous-month') {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return tasks.filter(t => {
        if (!t.date) return false;
        const [y, m] = t.date.split('-').map(Number);
        return y === prevYear && m === prevMonth + 1;
      });
    }

    return tasks;
  }, [tasks, dateScope]);

  // Status metrics
  const total = scopedTasks.length;
  const completed = scopedTasks.filter(t => t.status === 'Completed').length;
  const inProgress = scopedTasks.filter(t => t.status === 'In Progress').length;
  const pending = scopedTasks.filter(t => t.status === 'Pending').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Status breakdown array
  const statusCounts = [
    { label: 'Completed', count: completed, color: '#10b981', bgClass: 'bg-emerald-500' },
    { label: 'In Progress', count: inProgress, color: '#0ea5e9', bgClass: 'bg-sky-500' },
    { label: 'Pending', count: pending, color: '#f59e0b', bgClass: 'bg-amber-500' },
  ];

  // Category breakdown
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    scopedTasks.forEach(t => {
      const cat = t.category || 'Other';
      map[cat] = (map[cat] || 0) + 1;
    });

    return Object.entries(map)
      .map(([category, count]) => ({
        category,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
        styles: getCategoryStyles(category),
      }))
      .sort((a, b) => b.count - a.count);
  }, [scopedTasks, total]);

  const topCategory = categoryCounts[0]?.category || 'General';

  // Last 7 days productivity throughput
  const dailyProductivityTrend = useMemo(() => {
    const days: { label: string; dateStr: string; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      
      const count = tasks.filter(t => t.date === dateStr && t.status === 'Completed').length;
      days.push({ label, dateStr, count });
    }
    return days;
  }, [tasks]);

  const maxDailyCount = Math.max(1, ...dailyProductivityTrend.map(d => d.count));

  // Compute SVG Donut circle parameters
  const radius = 60;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const donutSlices = statusCounts.map(item => {
    const percent = total > 0 ? item.count / total : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercent * circumference;
    cumulativePercent += percent;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="space-y-6">
      {/* Analytics Header & Scope Switcher */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>HR Productivity & Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time pipeline metrics, department categories, and velocity insights
          </p>
        </div>

        {/* Date Scope Filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setDateScope('current-month')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              dateScope === 'current-month'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Current Month
          </button>
          <button
            onClick={() => setDateScope('previous-month')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              dateScope === 'previous-month'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Previous Month
          </button>
          <button
            onClick={() => setDateScope('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              dateScope === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Productivity Scorecard Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Tasks In Scope
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono-numbers">
            {total}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Logged operations</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Completed Tasks
          </span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono-numbers">
            {completed}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{completionRate}% fulfillment</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            In Progress / Pending
          </span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono-numbers">
            {inProgress + pending}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active queue</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Leading HR Category
          </span>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1 truncate">
            {topCategory}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Highest volume</p>
        </div>
      </div>

      {/* Charts Grid: Donut + Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Task Status Donut Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Task Status Breakdown</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-numbers">{total} items</span>
            </div>

            {total === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                No tasks logged for this period
              </div>
            ) : (
              <div className="py-6 flex flex-col sm:flex-row items-center justify-center gap-6">
                {/* SVG Donut */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth={strokeWidth}
                    />
                    {donutSlices.map((slice, i) => (
                      <circle
                        key={i}
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono-numbers">
                      {completionRate}%
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      Completed
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2.5 text-xs w-full sm:w-auto">
                  {statusCounts.map(item => (
                    <div key={item.label} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.bgClass}`} />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono-numbers">
                        <span className="font-semibold text-slate-900 dark:text-white">{item.count}</span>
                        <span className="text-[11px] text-slate-400">
                          ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Automatically recalculated as task states transition.
          </div>
        </div>

        {/* Tasks by Category Bar Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Tasks by Category</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {categoryCounts.length} active departments
              </span>
            </div>

            {categoryCounts.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                No category data available
              </div>
            ) : (
              <div className="space-y-3">
                {categoryCounts.slice(0, 6).map(item => {
                  const maxCount = categoryCounts[0]?.count || 1;
                  const barWidth = Math.max(8, Math.round((item.count / maxCount) * 100));

                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-2 font-mono-numbers">
                          <span className="font-semibold text-slate-900 dark:text-white">{item.count} tasks</span>
                          <span className="text-[11px] text-slate-400">({item.percent}%)</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: item.styles.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 mt-4">
            Highlights recruiting, background verification, onboarding & compliance workload.
          </div>
        </div>
      </div>

      {/* Daily Productivity Trend (Last 7 Days) */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Daily Productivity Trend (Tasks Completed Last 7 Days)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualizes daily throughput of accomplished recruitment rounds & HR operations
            </p>
          </div>
        </div>

        {/* Clean SVG Bar Chart with values */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pt-4 px-2">
          {dailyProductivityTrend.map((d) => {
            const heightPercent = maxDailyCount > 0 ? Math.round((d.count / maxDailyCount) * 100) : 0;
            const isToday = d.dateStr === getTodayDateString();

            return (
              <div key={d.dateStr} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono-numbers opacity-80 group-hover:opacity-100 transition-opacity">
                  {d.count}
                </span>

                <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-t-lg h-32 flex items-end overflow-hidden p-0.5">
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isToday ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-800 dark:bg-slate-600 hover:bg-slate-700 dark:hover:bg-slate-500'
                    }`}
                    style={{ height: `${Math.max(d.count > 0 ? 12 : 2, heightPercent)}%` }}
                  />
                </div>

                <span className={`text-[10px] font-medium text-center truncate w-full ${
                  isToday ? 'font-bold text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
