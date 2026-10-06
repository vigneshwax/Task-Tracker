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
  FileText,
  Database,
  RefreshCw
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenAddTask: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onDownloadTemplate: () => void;
  onOpenGoogleSheetsDatabase?: () => void;
  followUpAlertCount: number;
  onOpenFollowUpBanner: () => void;
  currentTheme: ThemeMode;
  onToggleTheme: () => void;
  onCloseWebsite?: () => void;
  userName?: string;
  notesCount?: number;
  isAutoSyncing?: boolean;
  isAutoPulling?: boolean;
  hasCloudConnected?: boolean;
  onSyncFromGoogleSheet?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  onOpenAddTask,
  onOpenImport,
  onOpenExport,
  onDownloadTemplate,
  onOpenGoogleSheetsDatabase,
  followUpAlertCount,
  onOpenFollowUpBanner,
  currentTheme,
  onToggleTheme,
  onCloseWebsite,
  userName = 'HR Workspace',
  notesCount = 0,
  isAutoSyncing = false,
  isAutoPulling = false,
  hasCloudConnected = false,
  onSyncFromGoogleSheet,
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

          {/* Action Buttons Zone + Theme Toggle - Properly Grouped & Aligned */}
          <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 shrink-0">
            
            {/* Group 1: Spreadsheet Tools (Template, Import, Export) */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <button
                onClick={onDownloadTemplate}
                title="Download Excel template with Tasks & Notes sheets (.xlsx)"
                aria-label="Download Excel Template"
                className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700/90 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden md:inline">Template</span>
              </button>

              <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

              <button
                onClick={onOpenImport}
                title="Import tasks and notes from Excel / CSV (.xlsx, .xls, .csv)"
                aria-label="Import Tasks from Excel"
                className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700/90 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden md:inline">Import</span>
              </button>

              <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

              <button
                onClick={onOpenExport}
                title="Export tasks & notes to multi-sheet Excel (.xlsx) or CSV"
                aria-label="Export Tasks to Excel"
                className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/90 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span className="hidden md:inline">Export</span>
              </button>
            </div>

            {/* Group 2: Google Sheets Live Sync Group */}
            {onOpenGoogleSheetsDatabase && (
              <div className="flex items-center bg-emerald-50/80 dark:bg-emerald-950/50 p-1 rounded-xl border border-emerald-200/90 dark:border-emerald-800/80 shadow-2xs">
                <button
                  onClick={onOpenGoogleSheetsDatabase}
                  title={isAutoSyncing ? "Auto-syncing to Google Sheet..." : (hasCloudConnected ? "Google Sheet Database Connected (Two-Way Sync Active)" : "Google Sheet Database Center (Two-Way Sync)")}
                  aria-label="Google Sheet Database"
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Database className={`w-3.5 h-3.5 ${isAutoSyncing ? 'animate-pulse text-emerald-500' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  <span className="hidden sm:inline">Google Sheet</span>
                  {hasCloudConnected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shrink-0" />
                  )}
                </button>

                {hasCloudConnected && onSyncFromGoogleSheet && (
                  <>
                    <div className="w-px h-3.5 bg-emerald-200 dark:bg-emerald-800 mx-0.5" />
                    <button
                      onClick={onSyncFromGoogleSheet}
                      title={isAutoPulling ? "Fetching latest changes from Google Sheet..." : "Sync latest changes from Google Sheet (Pull)"}
                      aria-label="Sync from Google Sheet"
                      className="p-1 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 rounded-lg transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAutoPulling ? 'animate-spin' : ''}`} />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Group 3: Primary Add Task Action */}
            <button
              onClick={onOpenAddTask}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
              <kbd className="hidden lg:inline-block ml-0.5 px-1.5 py-0.2 text-[10px] bg-slate-800 dark:bg-indigo-700 text-slate-300 rounded font-mono">N</kbd>
            </button>

            {/* Group 4: Quick Theme & Exit Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onToggleTheme}
                title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} mode`}
                aria-label="Toggle theme"
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
              >
                {currentTheme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                )}
              </button>

              {onCloseWebsite && (
                <button
                  onClick={onCloseWebsite}
                  title="Extract Excel backup and close website"
                  aria-label="Extract Excel and Close Website"
                  className="p-2 text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

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
