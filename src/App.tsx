import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { HRTask, ViewMode, TaskFilterState, TaskStatus, DailyNoteData, UserProfileSettings, KeepNote } from './types/hrTask';
import { 
  loadTasksFromStorage, 
  saveTasksToStorage, 
  loadDailyNote, 
  saveDailyNote,
  getTodayDateString,
  isDateToday,
  isDateOverdue,
  getInitialSampleTasks,
  formatTimeCompact,
  parseTimeParts
} from './utils/storage';
import { getStoredCategories, saveStoredCategories } from './utils/categories';
import { downloadExcelTemplate, autoExtractExcelOnExit } from './utils/excel';
import { getInitialTheme, applyTheme, ThemeMode } from './utils/theme';
import { loadKeepNotesFromStorage, saveKeepNotesToStorage } from './utils/keepNotesStorage';
import { 
  getStoredSheetsUrl, 
  getStoredSyncMode, 
  getStoredAutoSyncEnabled, 
  getStoredAutoPullEnabled,
  hasConnectedCloudDatabase, 
  isCloudConfigured,
  autoSyncDatabaseToCloud,
  autoPullDatabaseFromCloud,
  hasGoogleSheetDataChanged,
  pushDatabaseToGoogleSheet, 
  simulatedPushToSheet 
} from './utils/googleSheetsDatabase';

// Components
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { TaskTable } from './components/TaskTable';
import { KanbanView } from './components/KanbanView';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { DailyNoteView } from './components/DailyNoteView';
import { KeepNotesView } from './components/KeepNotesView';
import { DashboardSidebar } from './components/DashboardSidebar';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { TaskModal } from './components/TaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ExcelExportModal } from './components/ExcelExportModal';
import { ConfirmModal } from './components/ConfirmModal';
import { FollowUpSection } from './components/FollowUpSection';
import { CloseWebsiteModal } from './components/CloseWebsiteModal';
import { GoogleSheetsDatabaseModal } from './components/GoogleSheetsDatabaseModal';

import { BellRing, CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);

  const handleThemeChange = useCallback((newTheme: ThemeMode) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  }, []);

  // User Profile Settings State
  const [userProfile, setUserProfile] = useState<UserProfileSettings>(() => {
    try {
      const saved = localStorage.getItem('hr_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load profile', e);
    }
    return {
      name: 'Vigneshwaran',
      role: 'Talent Acquisition & HR Operations Specialist',
      department: 'People & Culture',
      email: 'vigneshwaran.ofcl@gmail.com',
      workHours: '09:00 AM – 06:00 PM',
      defaultPriority: 'High',
      defaultCategory: 'Recruitment',
      defaultDateFilter: 'today',
    };
  });

  const handleUpdateUserProfile = useCallback((updated: UserProfileSettings) => {
    setUserProfile(updated);
    try {
      localStorage.setItem('hr_user_profile', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  }, []);

  // State: Tasks, Categories, Daily Note
  const [tasks, setTasks] = useState<HRTask[]>(() => loadTasksFromStorage());
  const [categories, setCategories] = useState<string[]>(() => getStoredCategories());
  const [dailyNote, setDailyNote] = useState<DailyNoteData>(() => loadDailyNote());

  // View Mode - defaults to premier executive 'dashboard'
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  // Multi-select for bulk actions
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Filter State - Default to 'today' as requested
  const [filterState, setFilterState] = useState<TaskFilterState>(() => {
    const savedFilter = localStorage.getItem('hr_default_date_filter');
    const defaultRange = (savedFilter === 'all' || savedFilter === 'today') ? savedFilter : 'today';
    return {
      search: '',
      dateRange: defaultRange,
      status: 'All',
      priority: 'All',
      category: 'All',
      assignedTo: 'All',
      hasFollowUpOnly: false,
      followUpFilter: 'all',
    };
  });

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<HRTask | null>(null);
  const [taskForDetail, setTaskForDetail] = useState<HRTask | null>(null);

  const activeTaskForDetail = useMemo(() => {
    if (!taskForDetail) return null;
    return tasks.find(t => t.id === taskForDetail.id) || taskForDetail;
  }, [taskForDetail, tasks]);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [isCloseWebsiteModalOpen, setIsCloseWebsiteModalOpen] = useState(false);
  const [showFollowUpBanner, setShowFollowUpBanner] = useState(false);
  const [isTableFullScreen, setIsTableFullScreen] = useState(false);

  // Success Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Preference: Auto-extract Excel on exit/close
  // If user has added API Key or Apps Script (cloud connected), auto-download on refresh/exit is OFF!
  const [autoExtractOnClose, setAutoExtractOnClose] = useState<boolean>(() => {
    if (hasConnectedCloudDatabase() || isCloudConfigured()) {
      return false; // Turn off auto-download on refresh/exit when API key or Apps Script is configured
    }
    const saved = localStorage.getItem('hr_auto_extract_on_close');
    return saved !== null ? saved === 'true' : false;
  });

  const handleToggleAutoExtractOnClose = useCallback(() => {
    setAutoExtractOnClose(prev => {
      const next = !prev;
      localStorage.setItem('hr_auto_extract_on_close', String(next));
      showToast(next ? 'Auto-extract Excel on exit enabled' : 'Auto-extract Excel on exit disabled');
      return next;
    });
  }, [showToast]);

  const handleCloudConfigured = useCallback(() => {
    setAutoExtractOnClose(false);
    localStorage.setItem('hr_auto_extract_on_close', 'false');
    showToast('Auto-download on refresh turned OFF · Auto-sync to Google Sheet enabled');
  }, [showToast]);

  // Delete Confirm State
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  // Google Keep Style Notes State
  const [keepNotes, setKeepNotes] = useState<KeepNote[]>(() => loadKeepNotesFromStorage());
  const lastLocalEditTime = useRef<number>(0);
  const lastPullAttemptTime = useRef<number>(0);

  const handleAddKeepNote = useCallback((newNoteData: Omit<KeepNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    lastLocalEditTime.current = Date.now();
    const newNote: KeepNote = {
      ...newNoteData,
      id: `keep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setKeepNotes(prev => {
      const updated = [newNote, ...prev];
      saveKeepNotesToStorage(updated);
      return updated;
    });
  }, []);

  const handleUpdateKeepNote = useCallback((updatedNote: KeepNote) => {
    lastLocalEditTime.current = Date.now();
    setKeepNotes(prev => {
      const updated = prev.map(n => n.id === updatedNote.id ? updatedNote : n);
      saveKeepNotesToStorage(updated);
      return updated;
    });
  }, []);

  const handleDeleteKeepNote = useCallback((id: string) => {
    lastLocalEditTime.current = Date.now();
    setKeepNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveKeepNotesToStorage(updated);
      return updated;
    });
  }, []);

  const handleRestoreKeepNotes = useCallback((restored: KeepNote[]) => {
    lastLocalEditTime.current = Date.now();
    setKeepNotes(restored);
    saveKeepNotesToStorage(restored);
  }, []);

  const handleClearAllKeepNotes = useCallback(() => {
    lastLocalEditTime.current = Date.now();
    setKeepNotes([]);
    saveKeepNotesToStorage([]);
    showToast('Cleared all standalone notes');
  }, [showToast]);

  // Save tasks on modification
  const updateTasks = useCallback((newTasks: HRTask[]) => {
    lastLocalEditTime.current = Date.now();
    setTasks(newTasks);
    saveTasksToStorage(newTasks);
  }, []);

  // Apply full database load from Google Sheets (both tasks and standalone notes)
  const handleApplyGoogleSheetsData = useCallback((pulledTasks: HRTask[], pulledNotes: KeepNote[]) => {
    updateTasks(pulledTasks);
    setKeepNotes(pulledNotes);
    saveKeepNotesToStorage(pulledNotes);
  }, [updateTasks]);

  // Ensure any existing tasks always have proper AM/PM formatted times
  useEffect(() => {
    let hasUnformatted = false;
    const sanitized = tasks.map(t => {
      const parsed = parseTimeParts(t.time);
      if (t.time !== parsed.timeFormatted) {
        hasUnformatted = true;
        return { ...t, time: parsed.timeFormatted };
      }
      return t;
    });
    if (hasUnformatted) {
      updateTasks(sanitized);
    }
  }, []);

  // Add custom category
  const handleAddCustomCategory = useCallback((catName: string) => {
    if (!catName || categories.includes(catName)) return;
    const updated = [...categories, catName];
    setCategories(updated);
    saveStoredCategories(updated);
    showToast(`Added category "${catName}"`);
  }, [categories, showToast]);

  // Delete custom category
  const handleDeleteCategory = useCallback((catName: string) => {
    const updated = categories.filter(c => c !== catName);
    setCategories(updated);
    saveStoredCategories(updated);
    showToast(`Removed category "${catName}"`);
  }, [categories, showToast]);

  // Save daily note
  const handleSaveDailyNote = useCallback((note: DailyNoteData) => {
    setDailyNote(note);
    saveDailyNote(note);
  }, []);

  // Keyboard shortcut listener ('N' for new task)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.tagName === 'SELECT';
      
      if (!isInput) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          setTaskToEdit(null);
          setIsTaskModalOpen(true);
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          searchInput?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Urgent follow-ups count
  const followUpAlertCount = useMemo(() => {
    return tasks.filter(
      t => t.followUpDate && (isDateToday(t.followUpDate) || isDateOverdue(t.followUpDate)) && t.status !== 'Completed'
    ).length;
  }, [tasks]);

  // Task Operations
  const handleSaveTask = (
    taskData: Omit<HRTask, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo'> & { assignedTo?: string }
  ) => {
    const now = Date.now();
    if (taskToEdit) {
      const updatedList = tasks.map(t => {
        if (t.id === taskToEdit.id) {
          return {
            ...t,
            ...taskData,
            assignedTo: 'Me',
            updatedAt: now,
          };
        }
        return t;
      });
      updateTasks(updatedList);
      showToast('Task details updated successfully');
    } else {
      const newTask: HRTask = {
        ...taskData,
        id: `task-${Date.now()}`,
        assignedTo: 'Me',
        createdAt: now,
        updatedAt: now,
      };
      updateTasks([newTask, ...tasks]);
      showToast('New task logged to your tracker');
    }
    setIsTaskModalOpen(false);
    setTaskToEdit(null);
  };

  // Toggle Complete / Advance Status
  const handleToggleComplete = useCallback((task: HRTask) => {
    const nextStatus: TaskStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    const today = getTodayDateString();
    const updated = tasks.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          status: nextStatus,
          completedDate: nextStatus === 'Completed' ? (t.completedDate || today) : undefined,
          updatedAt: Date.now(),
        };
      }
      return t;
    });
    updateTasks(updated);
    showToast(`Task marked as ${nextStatus}`);
  }, [tasks, updateTasks, showToast]);

  // Inline field update (priority, status, notes)
  const handleUpdateTaskField = useCallback((taskId: string, field: keyof HRTask, value: any) => {
    const today = getTodayDateString();
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const isNowCompleted = field === 'status' && value === 'Completed';
        const isNoLongerCompleted = field === 'status' && value !== 'Completed';
        return {
          ...t,
          [field]: field === 'time' && value ? formatTimeCompact(value) : value,
          completedDate: isNowCompleted 
            ? (t.completedDate || today) 
            : isNoLongerCompleted 
            ? undefined 
            : t.completedDate,
          updatedAt: Date.now(),
        };
      }
      return t;
    });
    updateTasks(updated);
  }, [tasks, updateTasks]);

  // Duplicate task
  const handleDuplicateTask = useCallback((task: HRTask) => {
    const now = Date.now();
    const duplicated: HRTask = {
      ...task,
      id: `task-${now}`,
      title: `${task.title} (Copy)`,
      status: 'Pending',
      completedDate: undefined,
      createdAt: now,
      updatedAt: now,
    };
    updateTasks([duplicated, ...tasks]);
    showToast('Task duplicated');
  }, [tasks, updateTasks, showToast]);

  // Single task delete prompt
  const handlePromptDeleteTask = useCallback((task: HRTask) => {
    setConfirmDeleteModal({
      isOpen: true,
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      action: () => {
        const filtered = tasks.filter(t => t.id !== task.id);
        updateTasks(filtered);
        setSelectedTaskIds(prev => prev.filter(id => id !== task.id));
        setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
        showToast('Task deleted');
      },
    });
  }, [tasks, updateTasks, showToast]);

  // Bulk status update
  const handleBulkUpdateStatus = useCallback((taskIds: string[], newStatus: TaskStatus) => {
    const today = getTodayDateString();
    const updated = tasks.map(t => {
      if (taskIds.includes(t.id)) {
        return {
          ...t,
          status: newStatus,
          completedDate: newStatus === 'Completed' ? (t.completedDate || today) : undefined,
          updatedAt: Date.now(),
        };
      }
      return t;
    });
    updateTasks(updated);
    showToast(`Updated ${taskIds.length} tasks to ${newStatus}`);
    setSelectedTaskIds([]);
  }, [tasks, updateTasks, showToast]);

  // Bulk delete prompt
  const handlePromptBulkDelete = useCallback((taskIds: string[]) => {
    setConfirmDeleteModal({
      isOpen: true,
      title: `Delete ${taskIds.length} Tasks`,
      message: `Are you sure you want to delete ${taskIds.length} selected tasks? This action cannot be undone.`,
      action: () => {
        const filtered = tasks.filter(t => !taskIds.includes(t.id));
        updateTasks(filtered);
        setSelectedTaskIds([]);
        setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
        showToast(`Deleted ${taskIds.length} tasks`);
      },
    });
  }, [tasks, updateTasks, showToast]);

  // Clear completed tasks
  const handleClearCompletedTasks = useCallback(() => {
    const remaining = tasks.filter(t => t.status !== 'Completed');
    updateTasks(remaining);
    showToast('Cleared completed tasks');
  }, [tasks, updateTasks, showToast]);

  // Clear all tasks
  const handlePromptClearAllTasks = useCallback(() => {
    setConfirmDeleteModal({
      isOpen: true,
      title: 'Clear All Tasks',
      message: `Are you sure you want to clear all ${tasks.length} tasks? This will completely empty your task list and reset local storage. This action cannot be undone.`,
      action: () => {
        updateTasks([]);
        setSelectedTaskIds([]);
        setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
        showToast('All tasks cleared successfully');
      },
    });
  }, [tasks.length, updateTasks, showToast]);

  // Reset to initial demo data
  const handleResetDemoData = useCallback(() => {
    const initial = getInitialSampleTasks();
    updateTasks(initial);
    showToast('Restored default HR task tracker data');
  }, [updateTasks, showToast]);

  // Restore backup
  const handleRestoreBackup = useCallback((restoredTasks: HRTask[]) => {
    updateTasks(restoredTasks);
  }, [updateTasks]);

  // Follow-up actions
  const handleMarkFollowUpDone = useCallback((taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          followUpDate: '',
          updatedAt: Date.now(),
        };
      }
      return t;
    });
    updateTasks(updated);
    showToast('Follow-up marked as completed');
  }, [tasks, updateTasks, showToast]);

  const handleRescheduleFollowUp = useCallback((taskId: string, newDate: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          followUpDate: newDate,
          updatedAt: Date.now(),
        };
      }
      return t;
    });
    updateTasks(updated);
    showToast(`Follow-up rescheduled to ${newDate}`);
  }, [tasks, updateTasks, showToast]);

  // Selection handlers
  const handleToggleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  }, []);

  const handleSelectAllVisible = useCallback((visibleIds: string[]) => {
    setSelectedTaskIds(visibleIds);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedTaskIds([]);
  }, []);

  // Auto-sync to Google Sheet whenever tasks or notes are updated
  const isInitialMount = useRef(true);
  const autoSyncTimerRef = useRef<any>(null);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [isAutoPulling, setIsAutoPulling] = useState(false);
  const [lastAutoSyncTime, setLastAutoSyncTime] = useState<string | null>(null);
  const [lastPullTime, setLastPullTime] = useState<string | null>(null);

  useEffect(() => {
    // Skip on first mount to avoid pushing immediately on page load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const isAutoSyncEnabled = getStoredAutoSyncEnabled();
    if (!isAutoSyncEnabled) return;

    const hasCloud = hasConnectedCloudDatabase() || isCloudConfigured();
    if (!hasCloud) {
      return;
    }

    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current);
    }

    autoSyncTimerRef.current = setTimeout(async () => {
      setIsAutoSyncing(true);
      try {
        const res = await autoSyncDatabaseToCloud(tasks, keepNotes);
        if (res.success) {
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastAutoSyncTime(timeStr);
          showToast(`Auto-synced to Google Sheet at ${timeStr}`);
        } else if (res.message && !res.message.includes('No active Google Sheet')) {
          console.warn('Auto-sync notice:', res.message);
        }
      } catch (err) {
        console.error('Auto-sync error:', err);
      } finally {
        setIsAutoSyncing(false);
      }
    }, 1200);

    return () => {
      if (autoSyncTimerRef.current) {
        clearTimeout(autoSyncTimerRef.current);
      }
    };
  }, [tasks, keepNotes, showToast]);

  // Pull latest data from Google Sheet to reflect any spreadsheet changes in the app
  const handlePullFromGoogleSheets = useCallback(async (silent = false) => {
    const hasCloud = hasConnectedCloudDatabase() || isCloudConfigured();
    if (!hasCloud) {
      if (!silent) {
        showToast('Please connect your Google Sheet in the Database Center first');
      }
      return;
    }

    // Guard: Don't pull if local changes were made in the last 3.5 seconds
    if (Date.now() - lastLocalEditTime.current < 3500) {
      return;
    }

    // Guard: Don't pull if already pulling or pushing
    if (isAutoPulling || isAutoSyncing) {
      return;
    }

    lastPullAttemptTime.current = Date.now();
    setIsAutoPulling(true);

    try {
      const res = await autoPullDatabaseFromCloud();
      if (res.success && (res.tasks || res.notes)) {
        const pulledTasks = res.tasks || [];
        const pulledNotes = res.notes || [];

        // Check if data actually changed in Google Sheet
        const changed = hasGoogleSheetDataChanged(tasks, pulledTasks, keepNotes, pulledNotes);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastPullTime(timeStr);

        if (changed) {
          if (pulledTasks.length > 0 || tasks.length === 0) {
            setTasks(pulledTasks);
            saveTasksToStorage(pulledTasks);
          }
          if (pulledNotes.length > 0 || keepNotes.length === 0) {
            setKeepNotes(pulledNotes);
            saveKeepNotesToStorage(pulledNotes);
          }
          showToast(`Reflected changes from Google Sheet (${pulledTasks.length} tasks, ${pulledNotes.length} notes)`);
        } else if (!silent) {
          showToast(`Google Sheet is up to date (${pulledTasks.length} tasks synced)`);
        }
      } else if (!silent && res.message) {
        showToast(res.message);
      }
    } catch (err) {
      if (!silent) {
        console.error('Failed to pull from Google Sheet:', err);
        showToast('Could not fetch updates from Google Sheet');
      }
    } finally {
      setIsAutoPulling(false);
    }
  }, [tasks, keepNotes, isAutoPulling, isAutoSyncing, showToast]);

  // Trigger 1: On initial app mount, fetch latest data from Google Sheet so offline edits reflect immediately
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasConnectedCloudDatabase() || isCloudConfigured()) {
        handlePullFromGoogleSheets(true);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [handlePullFromGoogleSheets]);

  // Trigger 2: When user returns/switches back to this tab after editing Google Sheet
  useEffect(() => {
    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastPullAttemptTime.current > 5000 && (hasConnectedCloudDatabase() || isCloudConfigured())) {
          handlePullFromGoogleSheets(true);
        }
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);
    return () => {
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [handlePullFromGoogleSheets]);

  // Trigger 3: Periodic background polling every 25 seconds while active
  useEffect(() => {
    const interval = setInterval(() => {
      const isAutoPullEnabled = getStoredAutoPullEnabled();
      if (!isAutoPullEnabled) return;
      if (!hasConnectedCloudDatabase() && !isCloudConfigured()) return;
      if (Date.now() - lastLocalEditTime.current < 4000) return;
      handlePullFromGoogleSheets(true);
    }, 25000);

    return () => clearInterval(interval);
  }, [handlePullFromGoogleSheets]);

  // Before closing the page / tab: automatically extract Excel spreadsheet ONLY if enabled and cloud is NOT connected
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If user has API Key or Apps Script or Cloud Database connected, do not auto-download on refresh
      const isCloudActive = hasConnectedCloudDatabase() || isCloudConfigured();
      if (isCloudActive || !autoExtractOnClose) {
        // Auto-download on refresh/reload is completely OFF!
        return;
      }
      if (tasks.length > 0 || keepNotes.length > 0) {
        try {
          autoExtractExcelOnExit(tasks, keepNotes);
        } catch (err) {
          console.error('Failed to auto-extract Excel on beforeunload', err);
        }
        e.preventDefault();
        e.returnValue = 'Extracting your Excel spreadsheet backup. Are you sure you want to close?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [tasks, keepNotes, autoExtractOnClose]);

  // Handler for explicit "Close Website" action
  const handleCloseWebsite = useCallback(() => {
    const success = autoExtractExcelOnExit(tasks, keepNotes);
    if (success) {
      showToast('Excel spreadsheet extracted & saved to Downloads!');
    }
    setIsCloseWebsiteModalOpen(true);
  }, [tasks, keepNotes, showToast]);

  // Filter tasks for export
  const filteredTasksForExport = useMemo(() => {
    return tasks.filter(t => {
      if (filterState.status !== 'All' && t.status !== filterState.status) return false;
      if (filterState.priority !== 'All' && t.priority !== filterState.priority) return false;
      if (filterState.category !== 'All' && t.category !== filterState.category) return false;
      return true;
    });
  }, [tasks, filterState]);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Global Header */}
      <Header
        currentView={viewMode}
        onSelectView={setViewMode}
        onOpenAddTask={() => {
          setTaskToEdit(null);
          setIsTaskModalOpen(true);
        }}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onDownloadTemplate={() => downloadExcelTemplate(keepNotes)}
        onOpenGoogleSheetsDatabase={() => setIsGoogleSheetsModalOpen(true)}
        followUpAlertCount={followUpAlertCount}
        onOpenFollowUpBanner={() => setShowFollowUpBanner(!showFollowUpBanner)}
        currentTheme={theme}
        onToggleTheme={handleToggleTheme}
        onCloseWebsite={handleCloseWebsite}
        userName={userProfile.name}
        notesCount={keepNotes.length}
        isAutoSyncing={isAutoSyncing}
        isAutoPulling={isAutoPulling}
        hasCloudConnected={hasConnectedCloudDatabase()}
        onSyncFromGoogleSheet={() => handlePullFromGoogleSheets(false)}
      />

      {/* App Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Urgent Follow-up Banner (expandable on click) */}
        {showFollowUpBanner && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2">
            <FollowUpSection
              tasks={tasks}
              onClose={() => setShowFollowUpBanner(false)}
              onOpenEditTask={(task) => {
                setTaskToEdit(task);
                setIsTaskModalOpen(true);
              }}
              onMarkFollowUpDone={handleMarkFollowUpDone}
              onRescheduleFollowUp={handleRescheduleFollowUp}
            />
          </div>
        )}

        {/* VIEW 0: EXECUTIVE COMMAND CENTER DASHBOARD */}
        {viewMode === 'dashboard' && (
          <DashboardView
            tasks={tasks}
            onOpenAddTask={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            onOpenImport={() => setIsImportModalOpen(true)}
            onSelectView={setViewMode}
            onUpdateTaskField={handleUpdateTaskField}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onViewTaskDetail={setTaskForDetail}
            userName={userProfile.name}
            userRole={userProfile.role}
          />
        )}

        {/* VIEW 1: Task List (Full Width Table with Downside Focus & Scratchpad Cards) */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            
            {/* Full Width Task Table (Excel Import Data) */}
            <div className="w-full">
              <TaskTable
                tasks={tasks}
                onToggleComplete={handleToggleComplete}
                onUpdateTaskField={handleUpdateTaskField}
                onEditTask={(task) => {
                  setTaskToEdit(task);
                  setIsTaskModalOpen(true);
                }}
                onViewTaskDetail={setTaskForDetail}
                onDuplicateTask={handleDuplicateTask}
                onRequestDeleteTask={handlePromptDeleteTask}
                onRequestBulkDelete={handlePromptBulkDelete}
                onBulkUpdateStatus={handleBulkUpdateStatus}
                categories={categories}
                filterState={filterState}
                onFilterChange={setFilterState}
                selectedTaskIds={selectedTaskIds}
                onToggleSelectTask={handleToggleSelectTask}
                onSelectAllVisible={handleSelectAllVisible}
                onClearSelection={handleClearSelection}
                onOpenAddTask={() => {
                  setTaskToEdit(null);
                  setIsTaskModalOpen(true);
                }}
                isFullScreen={isTableFullScreen}
                onToggleFullScreen={() => setIsTableFullScreen(prev => !prev)}
                downsideSlot={
                  <DashboardSidebar
                    tasks={tasks}
                    onOpenEditTask={(task) => {
                      setTaskToEdit(task);
                      setIsTaskModalOpen(true);
                    }}
                    onQuickToggleComplete={handleToggleComplete}
                    onOpenAddTask={() => {
                      setTaskToEdit(null);
                      setIsTaskModalOpen(true);
                    }}
                    onSelectView={setViewMode}
                    dailyNote={dailyNote}
                    onUpdateDailyNote={handleSaveDailyNote}
                    onAddKeepNote={handleAddKeepNote}
                    layout="horizontal"
                  />
                }
              />
            </div>

            {/* Down Side: Today's Focus, Urgent Follow-ups, and Quick Scratchpad Cards */}
            {!isTableFullScreen && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Daily Focus, Follow-ups & Scratchpad
                    </h3>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono-numbers">
                      · Downside Hub
                    </span>
                  </div>
                </div>

                <DashboardSidebar
                  tasks={tasks}
                  onOpenEditTask={(task) => {
                    setTaskToEdit(task);
                    setIsTaskModalOpen(true);
                  }}
                  onQuickToggleComplete={handleToggleComplete}
                  onOpenAddTask={() => {
                    setTaskToEdit(null);
                    setIsTaskModalOpen(true);
                  }}
                  onSelectView={setViewMode}
                  dailyNote={dailyNote}
                  onUpdateDailyNote={handleSaveDailyNote}
                  onAddKeepNote={handleAddKeepNote}
                  layout="horizontal"
                />
              </div>
            )}

            {/* Bottom Dashboard Section: Task Status & Productivity Overview */}
            {!isTableFullScreen && (
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <AnalyticsView tasks={tasks} />
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Kanban View */}
        {viewMode === 'kanban' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Pipeline Kanban Board</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Drag or advance tasks across execution stages</p>
              </div>
              <button
                onClick={() => {
                  setTaskToEdit(null);
                  setIsTaskModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
              >
                + Add Task
              </button>
            </div>
            <KanbanView
              tasks={tasks}
              onUpdateTaskField={handleUpdateTaskField}
              onEditTask={(task) => {
                setTaskToEdit(task);
                setIsTaskModalOpen(true);
              }}
              onOpenAddTask={(defaultStatus) => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 3: Calendar View */}
        {viewMode === 'calendar' && (
          <div className="space-y-6">
            <CalendarView
              tasks={tasks}
              onEditTask={(task) => {
                setTaskToEdit(task);
                setIsTaskModalOpen(true);
              }}
              onOpenAddTaskForDate={(dateStr) => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              onViewDateInList={(dateStr, status = 'All') => {
                setFilterState(prev => ({
                  ...prev,
                  dateRange: 'specific-date',
                  specificDate: dateStr,
                  status,
                }));
                setViewMode('list');
              }}
            />
          </div>
        )}

        {/* VIEW 4: Analytics View */}
        {viewMode === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsView tasks={tasks} />
          </div>
        )}

        {/* VIEW 5: Daily Planner View */}
        {viewMode === 'daily-note' && (
          <div className="space-y-6">
            <DailyNoteView
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              onEditTask={(task) => {
                setTaskToEdit(task);
                setIsTaskModalOpen(true);
              }}
              onOpenAddTask={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              dailyNote={dailyNote}
              onSaveDailyNote={handleSaveDailyNote}
            />
          </div>
        )}

        {/* VIEW 6: Google Keep Style Notes View */}
        {viewMode === 'notes' && (
          <div className="space-y-6">
            <KeepNotesView
              notes={keepNotes}
              onAddNote={handleAddKeepNote}
              onUpdateNote={handleUpdateKeepNote}
              onDeleteNote={handleDeleteKeepNote}
              onRestoreNotes={handleRestoreKeepNotes}
              onClearAllNotes={handleClearAllKeepNotes}
              showToast={showToast}
            />
          </div>
        )}

        {/* VIEW 6: SETTINGS & CONFIGURATION PAGE */}
        {viewMode === 'settings' && (
          <SettingsView
            currentTheme={theme}
            onThemeChange={handleThemeChange}
            userProfile={userProfile}
            onUpdateUserProfile={handleUpdateUserProfile}
            categories={categories}
            onAddCategory={handleAddCustomCategory}
            onDeleteCategory={handleDeleteCategory}
            tasks={tasks}
            onRestoreBackup={handleRestoreBackup}
            onResetDemoData={handleResetDemoData}
            onClearCompletedTasks={handleClearCompletedTasks}
            onClearAllTasks={handlePromptClearAllTasks}
            autoExtractOnClose={autoExtractOnClose}
            onToggleAutoExtractOnClose={handleToggleAutoExtractOnClose}
            onCloseWebsite={handleCloseWebsite}
            onOpenGoogleSheetsDatabase={() => setIsGoogleSheetsModalOpen(true)}
            keepNotes={keepNotes}
            onRestoreKeepNotes={handleRestoreKeepNotes}
            onClearAllKeepNotes={handleClearAllKeepNotes}
            showToast={showToast}
          />
        )}
      </main>

      {/* Add / Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        categories={categories}
        onAddCustomCategory={handleAddCustomCategory}
      />

      {/* Big Task Detail Popup Modal */}
      <TaskDetailModal
        task={activeTaskForDetail}
        isOpen={Boolean(taskForDetail)}
        onClose={() => setTaskForDetail(null)}
        onUpdateStatus={(taskId, newStatus) => {
          handleUpdateTaskField(taskId, 'status', newStatus);
        }}
        onUpdateNotes={(taskId, newNotes) => {
          handleUpdateTaskField(taskId, 'notes', newNotes);
        }}
        onEditTask={(task) => {
          setTaskForDetail(null);
          setTaskToEdit(task);
          setIsTaskModalOpen(true);
        }}
        onDeleteTask={handlePromptDeleteTask}
        onDuplicateTask={handleDuplicateTask}
        onRescheduleFollowUp={handleRescheduleFollowUp}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingTasks={tasks}
        onImportCompleted={(newTasks, count, importedNotes) => {
          updateTasks(newTasks);
          if (importedNotes && importedNotes.length > 0) {
            setKeepNotes(prev => {
              const merged = [...importedNotes, ...prev];
              saveKeepNotesToStorage(merged);
              return merged;
            });
            showToast(`Imported ${count} tasks and ${importedNotes.length} notes from spreadsheet!`);
          } else {
            showToast(`Successfully imported ${count} tasks from spreadsheet!`);
          }
        }}
      />

      {/* Excel Export Modal */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allTasks={tasks}
        filteredTasks={filteredTasksForExport}
        selectedTaskIds={selectedTaskIds}
        notes={keepNotes}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={() => setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDeleteModal.action}
        title={confirmDeleteModal.title}
        message={confirmDeleteModal.message}
        confirmLabel="Delete"
        isDestructive={true}
      />

      {/* Close Website & Auto-Extract Modal */}
      <CloseWebsiteModal
        isOpen={isCloseWebsiteModalOpen}
        onClose={() => setIsCloseWebsiteModalOpen(false)}
        taskCount={tasks.length}
        notesCount={keepNotes.length}
        onExtractAgain={handleCloseWebsite}
      />

      {/* Google Sheets Database Center Modal */}
      <GoogleSheetsDatabaseModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        tasks={tasks}
        notes={keepNotes}
        onApplyPulledData={handleApplyGoogleSheetsData}
        showToast={showToast}
        onCloudConfigured={handleCloudConfigured}
        isAutoSyncing={isAutoSyncing}
        lastAutoSyncTime={lastAutoSyncTime}
        isAutoPulling={isAutoPulling}
        lastPullTime={lastPullTime}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 py-4 mt-12 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} HR Command Center · Personal Daily Tracker</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Local Storage Active</span>
            <span>·</span>
            <span>Excel 97-365 Compatible</span>
            <span>·</span>
            <span>Dark & Light Themes</span>
            <span>·</span>
            <button
              onClick={handleCloseWebsite}
              className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline cursor-pointer font-medium"
              title="Extract Excel backup and close website"
            >
              Close Website & Extract Excel
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
