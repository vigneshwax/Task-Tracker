import React from 'react';
import { HRTask, TaskStatus } from '../types/hrTask';
import { CheckCircle2, Clock, ListChecks, AlertCircle, TrendingUp } from 'lucide-react';

interface KpiCardsProps {
  tasks: HRTask[];
  activeStatusFilter: TaskStatus | 'All';
  onFilterByStatus: (status: TaskStatus | 'All') => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  tasks,
  activeStatusFilter,
  onFilterByStatus,
}) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const pending = tasks.filter(t => t.status === 'Pending').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const cards = [
    {
      label: 'Total Tasks',
      value: total,
      subtext: 'Active pipeline',
      icon: ListChecks,
      statusKey: 'All' as const,
      colorClass: 'text-slate-900 dark:text-slate-100',
      bgHover: 'hover:border-slate-400 dark:hover:border-slate-600',
      isActive: activeStatusFilter === 'All',
    },
    {
      label: 'Completed',
      value: completed,
      subtext: `${completionRate}% closed`,
      icon: CheckCircle2,
      statusKey: 'Completed' as const,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgHover: 'hover:border-emerald-300 dark:hover:border-emerald-700',
      isActive: activeStatusFilter === 'Completed',
    },
    {
      label: 'In Progress',
      value: inProgress,
      subtext: 'Under execution',
      icon: Clock,
      statusKey: 'In Progress' as const,
      colorClass: 'text-sky-600 dark:text-sky-400',
      bgHover: 'hover:border-sky-300 dark:hover:border-sky-700',
      isActive: activeStatusFilter === 'In Progress',
    },
    {
      label: 'Pending',
      value: pending,
      subtext: 'Awaiting action',
      icon: AlertCircle,
      statusKey: 'Pending' as const,
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgHover: 'hover:border-amber-300 dark:hover:border-amber-700',
      isActive: activeStatusFilter === 'Pending',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 my-6">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <button
            key={card.label}
            onClick={() => onFilterByStatus(card.statusKey)}
            className={`text-left p-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-slate-900 relative overflow-hidden ${
              card.isActive
                ? 'ring-2 ring-slate-900 dark:ring-indigo-500 border-transparent shadow-xs'
                : `border-slate-200/90 dark:border-slate-800 shadow-2xs ${card.bgHover}`
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
              <IconComponent className={`w-4 h-4 ${card.colorClass}`} />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono-numbers">
                {card.value}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {card.subtext}
            </p>
          </button>
        );
      })}

      {/* Completion Rate KPI Card */}
      <div className="col-span-2 md:col-span-1 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Completion Rate
          </span>
          <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-mono-numbers">
            {completionRate}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
