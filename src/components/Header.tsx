import React from 'react';
import { ViewMode } from '../types/hrTask';
import { ThemeMode } from '../utils/theme';
import { 
  Plus, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckSquare, 
  Kanban, 
  Calendar as CalendarIcon, 
  BarChart3, 
  BookOpen,
  BellRing,
  LayoutDashboard,
  Settings as SettingsIcon,
  Sun,
  Moon
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenAddTask: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onDownloadTemplate: () => void;
  followUpAlertCount: number;
  onOpenFollowUpBanner: () => void;
  currentTheme: ThemeMode;
  onToggleTheme: () => void;
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  onOpenAddTask,
  onOpenImport,
  onOpenExport,
  onDownloadTemplate,
  followUpAlertCount,
  onOpenFollowUpBanner,
  currentTheme,
  onToggleTheme,
  userName = 'HR Workspace',
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
      {/* Top Banner & Quick Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
          
          {/* Brand & Greeting Zone */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shadow-xs font-bold text-sm tracking-tight shrink-0">
              HR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  HR Command Center
                </h1>
                {followUpAlertCount > 0 && (
                  <button
                    onClick={onOpenFollowUpBanner}
                    title={`${followUpAlertCount} follow-ups due today or overdue`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <BellRing className="w-3 h-3 text-amber-500 animate-pulse" />
                    <span>{followUpAlertCount} Due</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {userName} · <span className="font-mono-numbers">{todayFormatted}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons Zone + Theme Toggle */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Quick Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {currentTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <button
              onClick={onDownloadTemplate}
              title="Download empty Excel template (.xlsx)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Template</span>
            </button>

            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Import</span>
            </button>

            <button
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Export</span>
            </button>

            <button
              onClick={onOpenAddTask}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 text-[10px] bg-slate-800 dark:bg-indigo-700 text-slate-300 rounded font-mono">N</kbd>
            </button>
          </div>
        </div>

        {/* View Mode Tabs Navigation */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <nav className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl overflow-x-auto max-w-full">
            
            {/* 1. Dashboard Tab */}
            <button
              onClick={() => onSelectView('dashboard')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            {/* 2. Task List Tab */}
            <button
              onClick={() => onSelectView('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tasks Table</span>
            </button>

            {/* 3. Kanban Tab */}
            <button
              onClick={() => onSelectView('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>

            {/* 4. Calendar Tab */}
            <button
              onClick={() => onSelectView('calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>

            {/* 5. Analytics Tab */}
            <button
              onClick={() => onSelectView('analytics')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'analytics'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            {/* 6. Daily Planner Tab */}
            <button
              onClick={() => onSelectView('daily-note')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'daily-note'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Daily Planner</span>
            </button>

            {/* 7. Settings Tab */}
            <button
              onClick={() => onSelectView('settings')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'settings'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </nav>

          <div className="hidden xl:flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[10px]">K</kbd> to quick search</span>
          </div>
        </div>
      </div>
    </header>
  );
};
