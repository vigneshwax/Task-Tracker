import React, { useState, useEffect, useMemo } from 'react';
import { HRTask, KeepNote } from '../types/hrTask';
import { 
  getStoredSheetsUrl, 
  saveStoredSheetsUrl, 
  getStoredLastSync,
  getStoredApiKey,
  saveStoredApiKey,
  getStoredSpreadsheetId,
  saveStoredSpreadsheetId,
  getStoredSyncMode,
  saveStoredSyncMode,
  GoogleSheetsSyncMode,
  pushDatabaseToGoogleSheet, 
  pullDatabaseFromGoogleSheet, 
  pullFromGoogleSheetsApi,
  simulatedPushToSheet,
  simulatedPullFromSheet,
  APPS_SCRIPT_DATABASE_CODE,
  APPS_SCRIPT_INITIALIZER_CODE,
  GoogleSheetsPullResult,
  normalizeAndValidateScriptUrl,
  extractSpreadsheetId,
  getStoredAutoSyncEnabled,
  saveStoredAutoSyncEnabled,
  getStoredAutoPullEnabled,
  saveStoredAutoPullEnabled,
  getStoredLastPull,
  hasConnectedCloudDatabase
} from '../utils/googleSheetsDatabase';
import { exportTasksToExcel } from '../utils/excel';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Check, 
  Copy, 
  ExternalLink, 
  HelpCircle, 
  RefreshCw, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  Database,
  ArrowRight,
  Layers,
  AlertTriangle,
  Key,
  Sparkles,
  ShieldAlert,
  Wrench,
  BookOpen,
  Zap,
  ArrowDownCircle
} from 'lucide-react';

interface GoogleSheetsDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: HRTask[];
  notes: KeepNote[];
  onApplyPulledData: (tasks: HRTask[], notes: KeepNote[]) => void;
  showToast: (msg: string) => void;
  onCloudConfigured?: () => void;
  isAutoSyncing?: boolean;
  lastAutoSyncTime?: string | null;
  isAutoPulling?: boolean;
  lastPullTime?: string | null;
}

export const GoogleSheetsDatabaseModal: React.FC<GoogleSheetsDatabaseModalProps> = ({
  isOpen,
  onClose,
  tasks,
  notes,
  onApplyPulledData,
  showToast,
  onCloudConfigured,
  isAutoSyncing = false,
  lastAutoSyncTime,
  isAutoPulling = false,
  lastPullTime,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'format' | 'setup'>('sync');
  const [syncMode, setSyncMode] = useState<GoogleSheetsSyncMode>('appscript');
  
  // Apps Script Web App state
  const [scriptUrl, setScriptUrl] = useState('');
  
  // Google Sheets API Key mode state
  const [apiKey, setApiKey] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');

  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInitCode, setCopiedInitCode] = useState(false);
  const [setupView, setSetupView] = useState<'appscript' | 'apikey'>('appscript');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => getStoredAutoSyncEnabled());
  const [autoPullEnabled, setAutoPullEnabled] = useState(() => getStoredAutoPullEnabled());
  
  // Status & Error details
  const [statusMessage, setStatusMessage] = useState<{ 
    type: 'success' | 'error' | 'info'; 
    text: string;
    is404?: boolean;
  } | null>(null);
  
  // Flag indicating if a 404 error was triggered
  const [has404Error, setHas404Error] = useState(false);

  // Stored pulled preview waiting for user confirmation
  const [pullPreview, setPullPreview] = useState<GoogleSheetsPullResult | null>(null);

  const urlValidation = useMemo(() => {
    if (!scriptUrl.trim()) return null;
    return normalizeAndValidateScriptUrl(scriptUrl);
  }, [scriptUrl]);

  const handleDownloadExcelForGoogleSheets = () => {
    exportTasksToExcel(tasks, 'Google_Sheets_Database', 'xlsx', notes, true);
    showToast('Downloaded multi-sheet Excel file! Open sheets.new and click File → Import → Upload.');
  };

  useEffect(() => {
    if (isOpen) {
      setScriptUrl(getStoredSheetsUrl());
      setApiKey(getStoredApiKey());
      setSpreadsheetId(getStoredSpreadsheetId());
      setSyncMode(getStoredSyncMode());
      setLastSync(getStoredLastSync());
      setStatusMessage(null);
      setHas404Error(false);
      setPullPreview(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleAutoSync = () => {
    setAutoSyncEnabled(prev => {
      const next = !prev;
      saveStoredAutoSyncEnabled(next);
      showToast(next ? 'Auto-sync to Google Sheet enabled' : 'Auto-sync to Google Sheet disabled');
      return next;
    });
  };

  const handleToggleAutoPull = () => {
    setAutoPullEnabled(prev => {
      const next = !prev;
      saveStoredAutoPullEnabled(next);
      showToast(next ? 'Auto-pull from Google Sheet enabled (reflects sheet edits)' : 'Auto-pull from Google Sheet disabled');
      return next;
    });
  };

  const handleSaveSettings = () => {
    if (syncMode === 'appscript') {
      saveStoredSheetsUrl(scriptUrl);
      showToast('Saved Web App URL! Two-way live sync is ON. Auto-download on refresh is OFF.');
    } else if (syncMode === 'apikey') {
      saveStoredApiKey(apiKey);
      saveStoredSpreadsheetId(spreadsheetId);
      if (scriptUrl.trim()) {
        saveStoredSheetsUrl(scriptUrl);
      }
      showToast('Saved API Key & Spreadsheet ID! Two-way live sync is ON. Auto-download on refresh is OFF.');
    }
    saveStoredSyncMode(syncMode);
    saveStoredAutoSyncEnabled(true);
    saveStoredAutoPullEnabled(true);
    localStorage.setItem('hr_auto_extract_on_close', 'false');
    onCloudConfigured?.();
  };

  const handleCopyScript = () => {
    navigator.clipboard?.writeText(APPS_SCRIPT_DATABASE_CODE);
    setCopiedCode(true);
    showToast('Copied Apps Script code to clipboard!');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyInitScript = () => {
    navigator.clipboard?.writeText(APPS_SCRIPT_INITIALIZER_CODE);
    setCopiedInitCode(true);
    showToast('Copied Spreadsheet Initializer Script to clipboard!');
    setTimeout(() => setCopiedInitCode(false), 2500);
  };

  const handleSwitchToDemoMode = async () => {
    setSyncMode('simulator');
    saveStoredSyncMode('simulator');
    setHas404Error(false);
    setStatusMessage({
      type: 'info',
      text: 'Switched to Demo / Local Cloud Sheet mode! You can now test two-way Push and Pull instantly with zero network errors.'
    });
    showToast('Switched to Demo Cloud Sheet mode');
  };

  const handlePush = async () => {
    setHas404Error(false);

    if (syncMode === 'simulator') {
      setIsPushing(true);
      setStatusMessage({ type: 'info', text: 'Saving data to Demo Cloud Sheet database...' });
      const res = await simulatedPushToSheet(tasks, notes);
      setIsPushing(false);
      if (res.success) {
        setLastSync(res.timestamp || new Date().toISOString());
        setStatusMessage({
          type: 'success',
          text: `Success! Saved ${tasks.length} tasks and ${notes.length} notes to Demo Cloud Sheet.`
        });
        showToast('Successfully synced to Demo Cloud Sheet!');
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
      return;
    }

    if (syncMode === 'apikey') {
      if (scriptUrl.trim()) {
        saveStoredSheetsUrl(scriptUrl);
        setIsPushing(true);
        setStatusMessage({ type: 'info', text: 'Syncing tasks and notes to Google Sheet database...' });
        const res = await pushDatabaseToGoogleSheet(scriptUrl, tasks, notes);
        setIsPushing(false);
        if (res.success) {
          setHas404Error(false);
          setLastSync(res.timestamp || new Date().toISOString());
          setStatusMessage({ 
            type: 'success', 
            text: `Success! Synced ${tasks.length} tasks and ${notes.length} notes to your Google Sheet database.` 
          });
          showToast('Successfully synced to Google Sheet database!');
        } else {
          if (res.is404Error || res.message.includes('404')) {
            setHas404Error(true);
          }
          setStatusMessage({ 
            type: 'error', 
            is404: res.is404Error,
            text: res.message 
          });
        }
        return;
      }

      setIsPushing(true);
      const res = await simulatedPushToSheet(tasks, notes);
      setIsPushing(false);
      setLastSync(res.timestamp || new Date().toISOString());
      setStatusMessage({
        type: 'info',
        text: 'Data saved to local cloud cache. To push directly to your live Google Sheet, paste your Web App URL below or use the 1-click script!'
      });
      showToast('Data cached. Add Web App URL for live auto-sync to sheet.');
      return;
    }

    // Apps Script Web App Mode
    if (!scriptUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Google Apps Script Web App URL first.' });
      return;
    }

    // If user entered a spreadsheet link instead of Web App
    if (scriptUrl.includes('docs.google.com/spreadsheets')) {
      setHas404Error(true);
      setStatusMessage({
        type: 'error',
        is404: true,
        text: 'Spreadsheet Link Detected: You entered a "docs.google.com/spreadsheets" document link instead of an Apps Script Web App URL. Web requests to spreadsheet links return HTTP 404 because spreadsheets do not accept API calls directly.'
      });
      return;
    }

    saveStoredSheetsUrl(scriptUrl);
    setIsPushing(true);
    setStatusMessage({ type: 'info', text: 'Syncing tasks and notes to Google Sheet database...' });

    const res = await pushDatabaseToGoogleSheet(scriptUrl, tasks, notes);
    setIsPushing(false);

    if (res.success) {
      setHas404Error(false);
      setLastSync(res.timestamp || new Date().toISOString());
      setStatusMessage({ 
        type: 'success', 
        text: `Success! Synced ${tasks.length} tasks and ${notes.length} notes to your Google Sheet database.` 
      });
      showToast('Successfully synced to Google Sheet database!');
    } else {
      if (res.is404Error || res.message.includes('404')) {
        setHas404Error(true);
      }
      setStatusMessage({ 
        type: 'error', 
        is404: res.is404Error,
        text: res.message 
      });
    }
  };

  const handlePull = async () => {
    setHas404Error(false);

    if (syncMode === 'simulator') {
      setIsPulling(true);
      setStatusMessage({ type: 'info', text: 'Fetching tasks and notes from Demo Cloud Sheet...' });
      const res = await simulatedPullFromSheet();
      setIsPulling(false);
      if (res.success && res.tasks && res.notes) {
        setPullPreview(res);
        setStatusMessage({
          type: 'info',
          text: `Found ${res.tasks.length} tasks and ${res.notes.length} notes in Demo Cloud Sheet. Click "Apply to Tracker" below to load them.`
        });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
      return;
    }

    if (syncMode === 'apikey') {
      if (!spreadsheetId.trim() || !apiKey.trim()) {
        setStatusMessage({ type: 'error', text: 'Please enter both your Google Spreadsheet ID and API Key.' });
        return;
      }
      saveStoredApiKey(apiKey);
      saveStoredSpreadsheetId(spreadsheetId);
      setIsPulling(true);
      setStatusMessage({ type: 'info', text: 'Connecting to Google Sheets API v4...' });

      const res = await pullFromGoogleSheetsApi(spreadsheetId, apiKey);
      setIsPulling(false);

      if (res.success && res.tasks && res.notes) {
        setPullPreview(res);
        setStatusMessage({
          type: 'info',
          text: `Found ${res.tasks.length} tasks and ${res.notes.length} notes via Google Sheets API! Click "Apply to Tracker" below to load them.`
        });
      } else {
        if (res.is404Error || res.message.includes('404')) {
          setHas404Error(true);
        }
        setStatusMessage({ type: 'error', is404: res.is404Error, text: res.message });
      }
      return;
    }

    // Apps Script Mode
    if (!scriptUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Google Apps Script Web App URL first.' });
      return;
    }

    if (scriptUrl.includes('docs.google.com/spreadsheets')) {
      setHas404Error(true);
      setStatusMessage({
        type: 'error',
        is404: true,
        text: 'Spreadsheet Link Detected: You entered a "docs.google.com/spreadsheets" document link instead of an Apps Script Web App URL. Web requests to spreadsheet links return HTTP 404 because spreadsheets do not accept API calls directly.'
      });
      return;
    }

    saveStoredSheetsUrl(scriptUrl);
    setIsPulling(true);
    setStatusMessage({ type: 'info', text: 'Fetching tasks and notes from Google Sheet...' });

    const res = await pullDatabaseFromGoogleSheet(scriptUrl);
    setIsPulling(false);

    if (res.success && res.tasks && res.notes) {
      setHas404Error(false);
      setPullPreview(res);
      setStatusMessage({
        type: 'info',
        text: `Found ${res.tasks.length} tasks and ${res.notes.length} notes in your Google Sheet. Click "Apply to Tracker" below to load them.`
      });
    } else {
      if (res.is404Error || res.message.includes('404')) {
        setHas404Error(true);
      }
      setStatusMessage({ 
        type: 'error', 
        is404: res.is404Error,
        text: res.message 
      });
    }
  };

  const handleConfirmApply = () => {
    if (!pullPreview?.tasks || !pullPreview?.notes) return;
    onApplyPulledData(pullPreview.tasks, pullPreview.notes);
    showToast(`Loaded ${pullPreview.tasks.length} tasks and ${pullPreview.notes.length} notes from Google Sheet!`);
    setPullPreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Google Sheet Database Center
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Two-Way Database
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Store and retrieve your tasks and notes directly using your Google Sheet as a live database.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-white dark:bg-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Sync & Actions</span>
          </button>
          <button
            onClick={() => setActiveTab('format')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'format'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sheet Format & Schema</span>
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === 'setup'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Setup & Code Guide</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* TAB 1: SYNC & DATABASE ACTIONS */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              
              {/* Connection Mode Selector */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 px-2">
                  Connection Method:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSyncMode('appscript');
                      saveStoredSyncMode('appscript');
                      setHas404Error(false);
                      setStatusMessage(null);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                      syncMode === 'appscript'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Apps Script Web App
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSyncMode('apikey');
                      saveStoredSyncMode('apikey');
                      setHas404Error(false);
                      setStatusMessage(null);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                      syncMode === 'apikey'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    API Key Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSyncMode('simulator');
                      saveStoredSyncMode('simulator');
                      setHas404Error(false);
                      setStatusMessage(null);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      syncMode === 'simulator'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Demo Cloud Sheet</span>
                  </button>
                </div>
              </div>

              {/* MODE 1: APPS SCRIPT WEB APP INPUT */}
              {syncMode === 'appscript' && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>Google Apps Script Web App URL</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('setup')}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Need the script? Setup guide</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={scriptUrl}
                      onChange={(e) => {
                        setScriptUrl(e.target.value);
                        setHas404Error(false);
                      }}
                      onBlur={handleSaveSettings}
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg hover:bg-slate-800 cursor-pointer shrink-0"
                    >
                      Save
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <p>
                      Connects directly to your Google Sheet without OAuth.
                    </p>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Auto-download on refresh: OFF · Auto-sync: ON
                    </span>
                  </div>
                </div>
              )}

              {/* MODE 2: GOOGLE SHEETS API KEY & SPREADSHEET ID INPUT */}
              {syncMode === 'apikey' && (
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-950 dark:text-indigo-200">
                        <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Google Sheets API Key & Spreadsheet ID</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-medium">
                        Direct API v4
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('setup');
                        setSetupView('apikey');
                      }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Need the script? Setup guide</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Google Cloud API Key:
                      </label>
                      <input
                        type="text"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        onBlur={handleSaveSettings}
                        placeholder="AIzaSy..."
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Spreadsheet ID or Google Sheet URL:
                      </label>
                      <input
                        type="text"
                        value={spreadsheetId}
                        onChange={(e) => setSpreadsheetId(e.target.value)}
                        onBlur={handleSaveSettings}
                        placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms or paste docs.google.com link"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          Apps Script Web App URL (for live Auto-Sync writes to your Sheet):
                        </label>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                          Auto-syncs updates directly
                        </span>
                      </div>
                      <input
                        type="url"
                        value={scriptUrl}
                        onChange={(e) => setScriptUrl(e.target.value)}
                        onBlur={handleSaveSettings}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-indigo-200/60 dark:border-indigo-900/60 text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400">
                      Need the script to auto-format your spreadsheet tabs?
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyInitScript}
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer"
                    >
                      {copiedInitCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedInitCode ? 'Copied script!' : 'Copy Auto-Setup Script'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-indigo-900 dark:text-indigo-300 pt-0.5">
                    <p>
                      Shared with <strong>"Anyone with link can view"</strong>.
                    </p>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Auto-download on refresh: OFF · Auto-sync: ON
                    </span>
                  </div>
                </div>
              )}

              {/* MODE 3: SIMULATED DEMO CLOUD SHEET BANNER */}
              {syncMode === 'simulator' && (
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                      Demo Cloud Sheet Database Mode Active
                    </h4>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Simulates a live multi-sheet Google Sheet database in your browser. Perfect for testing instant two-way synchronization without setting up Google Cloud permissions or Apps Script.
                  </p>
                </div>
              )}

              {/* Auto-Sync & Refresh Download Behavior Card */}
              <div className="p-3.5 rounded-xl border border-emerald-200/90 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                {/* 1. Auto-Push (App -> Google Sheet) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          Auto-Push Changes (App → Google Sheet)
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          autoSyncEnabled 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {autoSyncEnabled ? (isAutoSyncing ? 'Pushing now...' : 'Active') : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Automatically pushes data to your Google Sheet whenever you add, edit, or complete tasks & notes in the app.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAutoSync}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      autoSyncEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        autoSyncEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Auto-Pull (Google Sheet -> App) */}
                <div className="flex items-center justify-between pt-2.5 border-t border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                      <ArrowDownCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          Auto-Reflect Changes (Google Sheet → App)
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          autoPullEnabled 
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {autoPullEnabled ? (isAutoPulling ? 'Fetching now...' : 'Active') : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Automatically reflects any row, status, or note edits you make in Google Sheet back into this app (on tab switch & every 30s).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAutoPull}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      autoPullEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        autoPullEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Status Badges & Refresh Download */}
                <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[11px] text-slate-600 dark:text-slate-300 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Auto-download Excel on page refresh / reload:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/50 px-1.5 py-0.2 rounded">
                      OFF (Disabled)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-mono-numbers">
                    {lastAutoSyncTime && <span>Push: {lastAutoSyncTime}</span>}
                    {lastPullTime && <span>· Pull: {lastPullTime}</span>}
                  </div>
                </div>
              </div>

              {/* 404 RESOLUTION & TROUBLESHOOTING CARD */}
              {has404Error && (
                <div className="p-4 rounded-xl border-2 border-rose-300 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/50 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        HTTP 404 Resolution Center (Google Sheet Sync)
                      </h4>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                        The Google server returned <strong>HTTP 404 (Not Found)</strong>. Here is why this happens and how to resolve it immediately:
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/90 dark:bg-slate-900/90 rounded-lg p-3 border border-rose-200 dark:border-rose-900 space-y-2 text-[11px]">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-rose-600 shrink-0">1.</span>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Deployment Permission (Most Common):</strong> In Google Apps Script, click <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">Deploy → Manage deployments</code>. Ensure <strong>"Who has access"</strong> is set to <strong>"Anyone"</strong>. If set to "Only myself", Google blocks external requests with 404.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-rose-600 shrink-0">2.</span>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong>Entered Spreadsheet Link:</strong> If you pasted a <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">docs.google.com/spreadsheets</code> link, spreadsheets don't accept direct POST requests. You must use the Apps Script Web App URL ending in <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">/exec</code>.
                      </p>
                    </div>
                  </div>

                  {/* Quick Fix Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSwitchToDemoMode}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Switch to Demo Cloud Sheet (Instant Fix)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadExcelForGoogleSheets}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Download Multi-Sheet Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('setup')}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      View 2-Min Setup Guide
                    </button>
                  </div>
                </div>
              )}

              {/* Status Banner */}
              {statusMessage && !has404Error && (
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  statusMessage.type === 'success' 
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                    : statusMessage.type === 'error'
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                    : 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-800 dark:text-indigo-300'
                }`}>
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : statusMessage.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  ) : (
                    <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600 animate-spin" />
                  )}
                  <div className="flex-1 text-xs whitespace-pre-line">
                    <p className="font-semibold">{statusMessage.text}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Push to Google Sheet (Upload) */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs mb-1">
                      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span>Push to Google Sheet (Save)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Uploads current records into two dedicated tabs (<code className="font-mono text-emerald-600 font-semibold">HR Tasks</code> and <code className="font-mono text-amber-600 font-semibold">Notes</code>).
                    </p>
                    <div className="mt-2.5 flex items-center gap-3 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      <span>• {tasks.length} Tasks</span>
                      <span>• {notes.length} Standalone Notes</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePush}
                    disabled={isPushing || (syncMode === 'appscript' && !scriptUrl.trim())}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {isPushing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Sheet...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Push Data to Sheet</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2. Pull from Google Sheet (Download) */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs mb-1">
                      <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                        <Download className="w-4 h-4" />
                      </div>
                      <span>Pull from Google Sheet (Load)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Reads all tasks and notes stored in your Google Sheet database and updates your workspace.
                    </p>
                    <div className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Last Synced: </span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePull}
                    disabled={isPulling || (syncMode === 'appscript' && !scriptUrl.trim()) || (syncMode === 'apikey' && (!apiKey.trim() || !spreadsheetId.trim()))}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:opacity-40 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {isPulling ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading from Sheet...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Pull Data from Sheet</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Direct Excel for Google Sheets fallback */}
              <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      Direct Excel for Google Sheets
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Downloads multi-sheet file ready to open in Google Sheets via File → Import → Upload.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-1"
                  >
                    <span>sheets.new</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={handleDownloadExcelForGoogleSheets}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download .xlsx</span>
                  </button>
                </div>
              </div>

              {/* Pull Preview Confirmation Banner */}
              {pullPreview && (
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                        Ready to Apply Data from Google Sheet
                      </h4>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                        Fetched {pullPreview.tasks?.length || 0} tasks and {pullPreview.notes?.length || 0} standalone notes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPullPreview(null)}
                      className="text-indigo-400 hover:text-indigo-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60">
                    <button
                      type="button"
                      onClick={() => setPullPreview(null)}
                      className="px-3 py-1.5 text-xs text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100/60 rounded-lg font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmApply}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply to Tracker</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: SHEET SCHEMA & FORMAT (MATCHING EXCEL EXACTLY) */}
          {activeTab === 'format' && (
            <div className="space-y-4">
              
              {/* Info Header Banner */}
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      100% Identical Format to Excel Export (.xlsx)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadExcelForGoogleSheets}
                    className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Starter Sheet</span>
                  </button>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Both your Excel exports and your Google Sheet database follow the <strong>exact same multi-sheet structure and 10-column layout</strong>. 
                  You can either use the Apps Script webhook to sync live, or upload your exported Excel file directly to Google Sheets (<code className="font-mono bg-emerald-100/80 dark:bg-emerald-900/60 px-1 py-0.5 rounded">File → Import → Upload</code>) and it will open with both tabs perfectly arranged.
                </p>
              </div>

              {/* Sheet 1: HR Tasks Schema */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-900 text-white dark:bg-indigo-600">
                      Sheet 1
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      HR Tasks (10 Columns)
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText("Date\tTime\tTask / Activity\tDescription\tCategory\tPriority\tStatus\tAssigned To\tNotes\tFollow-up Date");
                      showToast('Copied HR Tasks headers to clipboard!');
                    }}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Headers</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                      <tr>
                        <th className="p-2 border-r border-slate-200 dark:border-slate-800 w-8">#</th>
                        <th className="p-2 border-r border-slate-200 dark:border-slate-800">Column Name</th>
                        <th className="p-2 border-r border-slate-200 dark:border-slate-800">Format / Type</th>
                        <th className="p-2">Example Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">1</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">Date</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono text-[10px]">YYYY-MM-DD</td>
                        <td className="p-2 text-slate-500">2026-10-01</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">2</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">Time</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono text-[10px]">hh:mm AM/PM</td>
                        <td className="p-2 text-slate-500">10.40 AM</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">3</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">Task / Activity</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">Candidate / Role / Title</td>
                        <td className="p-2 text-slate-500">Accounts Candidate - K Govind Reddy</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">4</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">Description</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">Phone or Details</td>
                        <td className="p-2 text-slate-500">9063020840</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">5</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">Category</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">HR Function / Stage</td>
                        <td className="p-2 text-slate-500">BGV, Resume Share, Interview</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">6</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">Priority</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">High / Medium / Low</td>
                        <td className="p-2 text-slate-500">High</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">7</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">Status</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">Pending / In Progress / Completed</td>
                        <td className="p-2 text-slate-500">Pending</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">8</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">Assigned To</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">Recruiter / Owner</td>
                        <td className="p-2 text-slate-500">Me</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">9</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">Notes</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800">Freeform comments</td>
                        <td className="p-2 text-slate-500">Verified previous employer documents</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-slate-200 dark:border-slate-800">10</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">Follow-up Date</td>
                        <td className="p-2 border-r border-slate-200 dark:border-slate-800 font-mono text-[10px]">YYYY-MM-DD or empty</td>
                        <td className="p-2 text-slate-500">2026-10-05</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sheet 2: Notes Schema */}
              <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-600 text-white">
                      Sheet 2
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      Notes (Google Keep Style · 10 Columns)
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText("Note Title\tContent / Details\tType\tChecklist Items\tChecklist Progress\tTags / Category\tPinned\tColor\tCreated Date\tLast Updated");
                      showToast('Copied Notes headers to clipboard!');
                    }}
                    className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Headers</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-amber-200 dark:border-amber-900/60 rounded-lg">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold">
                      <tr>
                        <th className="p-2 border-r border-amber-200 dark:border-amber-900/60 w-8">#</th>
                        <th className="p-2 border-r border-amber-200 dark:border-amber-900/60">Column Name</th>
                        <th className="p-2 border-r border-amber-200 dark:border-amber-900/60">Format / Type</th>
                        <th className="p-2">Example Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 dark:divide-amber-950/40 text-slate-600 dark:text-slate-300">
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-amber-200 dark:border-amber-900/60">1</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-amber-200 dark:border-amber-900/60">Note Title</td>
                        <td className="p-2 border-r border-amber-200 dark:border-amber-900/60">Title / Header</td>
                        <td className="p-2 text-slate-500">Candidate Screening Checklist</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-amber-200 dark:border-amber-900/60">2</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-amber-200 dark:border-amber-900/60">Content / Details</td>
                        <td className="p-2 border-r border-amber-200 dark:border-amber-900/60">Text body or checklist text</td>
                        <td className="p-2 text-slate-500">Notice period 30 vs 60 days...</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-amber-200 dark:border-amber-900/60">3</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-amber-200 dark:border-amber-900/60">Type</td>
                        <td className="p-2 border-r border-amber-200 dark:border-amber-900/60">Checklist or Text Note</td>
                        <td className="p-2 text-slate-500">Checklist</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-amber-200 dark:border-amber-900/60">4</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-amber-200 dark:border-amber-900/60">Checklist Items</td>
                        <td className="p-2 border-r border-amber-200 dark:border-amber-900/60 font-mono text-[10px]">[✓] item \n [ ] item</td>
                        <td className="p-2 text-slate-500 font-mono text-[10px]">[✓] Confirm notice period</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-amber-200 dark:border-amber-900/60">5</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-amber-200 dark:border-amber-900/60">Checklist Progress</td>
                        <td className="p-2 border-r border-amber-200 dark:border-amber-900/60">Completed count & %</td>
                        <td className="p-2 text-slate-500">2/5 completed (40%)</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-amber-200 dark:border-amber-900/60">6</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-amber-200 dark:border-amber-900/60">Tags / Category</td>
                        <td className="p-2 border-r border-amber-200 dark:border-amber-900/60">Comma-separated labels</td>
                        <td className="p-2 text-slate-500">Recruitment, Screening</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-amber-200 dark:border-amber-900/60">7</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-amber-200 dark:border-amber-900/60">Pinned</td>
                        <td className="p-2 border-r border-amber-200 dark:border-amber-900/60">Yes or No</td>
                        <td className="p-2 text-slate-500">Yes</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-amber-200 dark:border-amber-900/60">8</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-amber-200 dark:border-amber-900/60">Color</td>
                        <td className="p-2 border-r border-amber-200 dark:border-amber-900/60">Keep color name</td>
                        <td className="p-2 text-slate-500">Amber, Mint, Peach, Default</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-amber-200 dark:border-amber-900/60">9</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-amber-200 dark:border-amber-900/60">Created Date</td>
                        <td className="p-2 border-r border-amber-200 dark:border-amber-900/60">Timestamp</td>
                        <td className="p-2 text-slate-500">2026-10-04 14:30</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono text-slate-400 border-r border-amber-200 dark:border-amber-900/60">10</td>
                        <td className="p-2 font-semibold text-slate-900 dark:text-white border-r border-amber-200 dark:border-amber-900/60">Last Updated</td>
                        <td className="p-2 border-r border-amber-200 dark:border-amber-900/60">Timestamp</td>
                        <td className="p-2 text-slate-500">2026-10-06 10:15</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SETUP GUIDE & APPS SCRIPT CODE */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              
              {/* Setup Sub-view Switcher */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 px-2">
                  Select Guide:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSetupView('appscript')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                      setupView === 'appscript'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Apps Script Web App
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetupView('apikey')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      setupView === 'apikey'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>API Key & Spreadsheet ID</span>
                  </button>
                </div>
              </div>

              {/* VIEW 1: APPS SCRIPT WEB APP */}
              {setupView === 'appscript' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Method 1: Google Apps Script Web App (Recommended for Two-Way Sync)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Read + Write
                      </span>
                    </div>
                    
                    <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                      <li>
                        Open Google Sheets at{' '}
                        <a 
                          href="https://sheets.new" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>sheets.new</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>{' '}
                        to create your spreadsheet.
                      </li>
                      <li>
                        In the spreadsheet menu, click <strong className="font-semibold text-slate-900 dark:text-white">Extensions → Apps Script</strong>.
                      </li>
                      <li>
                        Replace the code in the editor with the pre-written script below (click <strong className="font-semibold text-emerald-600">Copy Script Code</strong>).
                      </li>
                      <li>
                        Click <strong className="font-semibold text-slate-900 dark:text-white">Deploy → New deployment</strong>.
                      </li>
                      <li>
                        Under <em>Select type</em> choose <strong className="font-semibold text-slate-900 dark:text-white">Web app</strong>. Set <em>Execute as</em>: <strong className="font-semibold text-slate-900 dark:text-white">Me</strong>, and <span className="bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded font-bold border border-amber-300 dark:border-amber-800">Who has access: Anyone</span>.
                        <span className="block text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 pl-3">
                          ⚠️ Note: Setting this to "Anyone" prevents HTTP 404 errors when connecting.
                        </span>
                      </li>
                      <li>
                        Click <strong className="font-semibold text-slate-900 dark:text-white">Deploy</strong>, copy your <strong className="font-semibold text-emerald-600">Web App URL</strong> (ending in <code className="font-mono">/exec</code>), and paste it into the <em>Sync</em> tab!
                      </li>
                    </ol>
                  </div>

                  {/* Code Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Apps Script Database Code (doGet + doPost)
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied!' : 'Copy Script Code'}</span>
                      </button>
                    </div>

                    <div className="relative">
                      <pre className="p-3.5 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60 leading-normal border border-slate-800">
                        {APPS_SCRIPT_DATABASE_CODE}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: API KEY & SPREADSHEET ID GUIDE & SCRIPT */}
              {setupView === 'apikey' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* API Key Guide (Answers User Question #3) */}
                  <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Method 2: Google Cloud API Key & Spreadsheet ID</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                        Read / Pull
                      </span>
                    </div>

                    <p className="text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed">
                      Follow these 4 simple steps to connect using your Google Cloud API key:
                    </p>

                    <ol className="list-decimal list-inside space-y-2 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      <li>
                        In <a href="https://console.cloud.google.com/apis/library/sheets.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">Google Cloud Console</a>, search for and enable the <strong>Google Sheets API</strong>.
                      </li>
                      <li>
                        Go to <strong>APIs & Services → Credentials</strong>, click <strong>Create Credentials → API Key</strong>, and copy your key.
                      </li>
                      <li>
                        In your Google Sheet, click <strong>Share</strong> (top right) and set General access to <strong className="text-indigo-600 dark:text-indigo-400">"Anyone with the link can view"</strong> (this allows your API key to read data).
                      </li>
                      <li>
                        Paste your <strong>API Key</strong> and <strong>Spreadsheet ID</strong> (or sheet URL) into the <strong>API Key Mode</strong> tab to pull tasks and notes anytime!
                      </li>
                    </ol>
                  </div>

                  {/* Auto-Initializer Script for Spreadsheet */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-600 text-white">
                            Helper Script
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            Spreadsheet Auto-Initializer Script
                          </h5>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Paste this in your Google Sheet (<code className="font-mono">Extensions → Apps Script</code>) to format both <strong>HR Tasks</strong> and <strong>Notes</strong> tabs automatically.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyInitScript}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
                      >
                        {copiedInitCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedInitCode ? 'Copied!' : 'Copy Initializer Script'}</span>
                      </button>
                    </div>

                    <div className="relative">
                      <pre className="p-3.5 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-52 leading-normal border border-slate-800">
                        {APPS_SCRIPT_INITIALIZER_CODE}
                      </pre>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 text-indigo-900 dark:text-indigo-300 text-[11px] leading-relaxed">
                    💡 <strong>How to write/push data?</strong> Google Sheets API v4 forbids direct write operations without OAuth authorization for user safety. To push/write data from your browser, switch to the <strong>Apps Script Web App</strong> tab or download the formatted multi-sheet Excel file.
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {lastSync ? `Last database sync: ${new Date(lastSync).toLocaleDateString()} at ${new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Ready to connect'}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
