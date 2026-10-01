import React, { useState } from 'react';
import { ThemeMode } from '../utils/theme';
import { TaskPriority, UserProfileSettings, HRTask } from '../types/hrTask';
import { 
  Sun, 
  Moon, 
  Monitor, 
  User, 
  Sliders, 
  Tag, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface SettingsViewProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  userProfile: UserProfileSettings;
  onUpdateUserProfile: (profile: UserProfileSettings) => void;
  categories: string[];
  onAddCategory: (cat: string) => void;
  onDeleteCategory: (cat: string) => void;
  tasks: HRTask[];
  onRestoreBackup: (tasks: HRTask[]) => void;
  onResetDemoData: () => void;
  onClearCompletedTasks: () => void;
  showToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentTheme,
  onThemeChange,
  userProfile,
  onUpdateUserProfile,
  categories,
  onAddCategory,
  onDeleteCategory,
  tasks,
  onRestoreBackup,
  onResetDemoData,
  onClearCompletedTasks,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'profile' | 'categories' | 'data'>('appearance');

  // Profile Form State
  const [profileForm, setProfileForm] = useState<UserProfileSettings>(userProfile);
  const [isSavedProfile, setIsSavedProfile] = useState(false);

  // New Category State
  const [newCatInput, setNewCatInput] = useState('');

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile(profileForm);
    if (profileForm.defaultDateFilter) {
      localStorage.setItem('hr_default_date_filter', profileForm.defaultDateFilter);
    }
    setIsSavedProfile(true);
    showToast('Profile and preferences updated successfully');
    setTimeout(() => setIsSavedProfile(false), 2000);
  };

  // Add Category Handler
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    onAddCategory(newCatInput.trim());
    setNewCatInput('');
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      app: 'HR Task Tracker',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tasks,
      categories,
      userProfile,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hr-tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON downloaded successfully');
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          onRestoreBackup(parsed.tasks);
          showToast(`Successfully restored ${parsed.tasks.length} tasks from backup`);
        } else {
          showToast('Invalid backup file structure');
        }
      } catch (err) {
        console.error('Failed to parse backup', err);
        showToast('Error reading backup JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
      
      {/* Settings Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings & Workstation Preferences
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your themes, personal profile, workflow defaults, and manage your task backups.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'appearance'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Appearance & Theme</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Personal Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Category Manager</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'data'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Data & Backups</span>
        </button>
      </div>

      {/* Tab 1: Appearance & Theme */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Theme Mode
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select your preferred visual style. Changes apply immediately across the entire workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Light Theme Card */}
              <button
                type="button"
                onClick={() => onThemeChange('light')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                  currentTheme === 'light'
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  {currentTheme === 'light' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Light Theme
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Crisp, bright interfaces for daytime productivity
                  </p>
                </div>
              </button>

              {/* Dark Theme Card */}
              <button
                type="button"
                onClick={() => onThemeChange('dark')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                  currentTheme === 'dark'
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-slate-900 text-white'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-300 flex items-center justify-center">
                    <Moon className="w-4 h-4" />
                  </div>
                  {currentTheme === 'dark' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Dark Theme
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Deep slate tones optimized for low-light focus
                  </p>
                </div>
              </button>

              {/* System Preference Card */}
              <button
                type="button"
                onClick={() => onThemeChange('system')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                  currentTheme === 'system'
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                    <Monitor className="w-4 h-4" />
                  </div>
                  {currentTheme === 'system' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    System Preference
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Automatically match your OS light/dark schedule
                  </p>
                </div>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Personal Profile & Workstation */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Personal Identity & Role
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Used in greetings, exports, and personalized dashboard briefings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Title / Designation
                </label>
                <input
                  type="text"
                  value={profileForm.role}
                  onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Function
                </label>
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Hours / Schedule
                </label>
                <input
                  type="text"
                  placeholder="e.g. 09:00 AM – 06:00 PM"
                  value={profileForm.workHours}
                  onChange={(e) => setProfileForm({ ...profileForm, workHours: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Task Filter
                </label>
                <select
                  value={profileForm.defaultDateFilter || 'today'}
                  onChange={(e) => setProfileForm({ ...profileForm, defaultDateFilter: e.target.value as 'today' | 'all' })}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                >
                  <option value="today">Today's Tasks (Default)</option>
                  <option value="all">All Dates</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Automatically loads Today's tasks by default when opening the task list.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSavedProfile ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{isSavedProfile ? 'Saved' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Category Manager */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                HR Categories
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Organize your tasks into structured recruitment and HR workstreams.
              </p>
            </div>

            {/* Add New Category Input */}
            <form onSubmit={handleAddCategorySubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter new category name..."
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!newCatInput.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
              >
                Add Category
              </button>
            </form>

            {/* Existing Categories List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2">
              {categories.map((cat) => (
                <div key={cat} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {cat}
                  </span>
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteCategory(cat)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                      title="Remove category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Data & Backups */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Data Backup & Archival
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download snapshots of your tasks, notes, and categories or restore from previous JSON backups.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Backup Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download Backup (.json)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Export all {tasks.length} tasks and preferences as a portable JSON file.
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Export Snapshot
                </button>
              </div>

              {/* Restore Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Restore from Backup</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Load tasks from a previously saved JSON snapshot.
                </p>
                <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <span>Select JSON File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Maintenance & Reset
              </h4>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/40 dark:bg-rose-950/20 text-xs">
                <div>
                  <p className="font-semibold text-rose-900 dark:text-rose-300">
                    Clear Completed Tasks
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Removes all tasks marked as "Completed" to keep your daily tracker neat and focused.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClearCompletedTasks}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 font-medium cursor-pointer shrink-0"
                >
                  Clear Completed
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-200">
                    Reset to Demo Sample Data
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Populates the tracker with initial sample recruitment & HR tasks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onResetDemoData}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 font-medium cursor-pointer shrink-0"
                >
                  Reset Sample Data
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
