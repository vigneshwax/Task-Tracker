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
  Moon,
  Power,
  FileText
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
  onCloseWebsite?: () => void;
  userName?: string;
  notesCount?: number;
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
  onCloseWebsite,
  userName = 'HR Workspace',
  notesCount = 0,
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

          {/* Action Buttons Zone + Theme Toggle - Single Line */}
          <div className="flex items-center flex-nowrap gap-1.5 sm:gap-2 shrink-0 overflow-x-auto max-w-full">
            
            {/* Quick Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
            >
              {currentTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Template Button */}
            <button
              onClick={onDownloadTemplate}
              title="Download empty Excel template (.xlsx)"
              aria-label="Download Excel Template"
              className="p-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors cursor-pointer shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>

            {/* Import Button */}
            <button
              onClick={onOpenImport}
              title="Import tasks from Excel / CSV (.xlsx, .xls, .csv)"
              aria-label="Import Tasks from Excel"
              className="p-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>

            {/* Export Button */}
            <button
              onClick={onOpenExport}
              title="Export tasks to Excel or CSV report"
              aria-label="Export Tasks to Excel"
              className="p-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>

            {/* Add Task Primary Action */}
            <button
              onClick={onOpenAddTask}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
              <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 text-[10px] bg-slate-800 dark:bg-indigo-700 text-slate-300 rounded font-mono">N</kbd>
            </button>

            {/* Close Website Button */}
            {onCloseWebsite && (
              <button
                onClick={onCloseWebsite}
                title="Extract Excel backup and close website"
                aria-label="Extract Excel and Close Website"
                className="p-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0"
              >
                <Power className="w-4 h-4" />
              </button>
            )}
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

            {/* 6. Notes Option (Google Keep style) */}
            <button
              onClick={() => onSelectView('notes')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'notes'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${currentView === 'notes' ? 'text-amber-500' : 'text-slate-400 group-hover:text-amber-500'}`} />
              <span>Notes</span>
              {notesCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                  {notesCount}
                </span>
              )}
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
