import React, { useState } from 'react';
import { HRTask, KeepNote } from '../types/hrTask';
import { exportTasksToExcel, exportNotesToExcel } from '../utils/excel';
import { isDateToday } from '../utils/storage';
import { X, Download, FileSpreadsheet, CheckCircle2, StickyNote, Layers, Sparkles } from 'lucide-react';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTasks: HRTask[];
  filteredTasks: HRTask[];
  selectedTaskIds: string[];
  notes?: KeepNote[];
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  allTasks,
  filteredTasks,
  selectedTaskIds,
  notes = [],
}) => {
  const [scope, setScope] = useState<'all' | 'today' | 'filtered' | 'selected' | 'completed' | 'pending' | 'notes_only'>('all');
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [includeNotesSheet, setIncludeNotesSheet] = useState<boolean>(true);

  if (!isOpen) return null;

  const todayTasks = allTasks.filter(t => isDateToday(t.date));
  const completedTasks = allTasks.filter(t => t.status === 'Completed');
  const pendingTasks = allTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress');
  const selectedTasks = allTasks.filter(t => selectedTaskIds.includes(t.id));

  const getTargetTasks = (): { tasks: HRTask[]; label: string } => {
    switch (scope) {
      case 'today':
        return { tasks: todayTasks, label: 'Today_Tasks' };
      case 'filtered':
        return { tasks: filteredTasks, label: 'Filtered_Tasks' };
      case 'selected':
        return { tasks: selectedTasks, label: 'Selected_Tasks' };
      case 'completed':
        return { tasks: completedTasks, label: 'Completed_Tasks' };
      case 'pending':
        return { tasks: pendingTasks, label: 'Pending_Tasks' };
      case 'notes_only':
        return { tasks: [], label: 'Notes_Only' };
      case 'all':
      default:
        return { tasks: allTasks, label: 'All_HR_Tasks' };
    }
  };

  const handleExport = () => {
    if (scope === 'notes_only') {
      if (notes.length === 0) {
        alert('You have no notes to export.');
        return;
      }
      exportNotesToExcel(notes);
      onClose();
      return;
    }

    const { tasks, label } = getTargetTasks();
    if (tasks.length === 0 && (!includeNotesSheet || notes.length === 0)) {
      alert('No tasks match the selected export criteria.');
      return;
    }

    exportTasksToExcel(tasks, label, format, notes, includeNotesSheet && format === 'xlsx');
    onClose();
  };

  const targetCount = getTargetTasks().tasks.length;
  const isNotesOnly = scope === 'notes_only';
  const willIncludeNotes = format === 'xlsx' && includeNotesSheet && notes.length > 0 && !isNotesOnly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Export Workspace to Excel</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Stores tasks and standalone notes in separate sheets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Format Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`py-2.5 px-3 text-xs font-medium rounded-xl border text-center transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  format === 'xlsx'
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Excel (.xlsx) · Multi-Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`py-2.5 px-3 text-xs font-medium rounded-xl border text-center transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  format === 'csv'
                    ? 'border-slate-900 dark:border-indigo-500 bg-slate-900 dark:bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>CSV (.csv) · Single Sheet</span>
              </button>
            </div>
            {format === 'csv' && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                Note: CSV files only support 1 sheet (Tasks only). Use Excel (.xlsx) to store Notes in a separate sheet.
              </p>
            )}
          </div>

          {/* Scope Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Select Export Scope
            </label>
            <div className="space-y-2">
              <label className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                scope === 'all' 
                  ? 'border-slate-900 dark:border-indigo-500 bg-slate-50 dark:bg-slate-800/80 font-medium text-slate-900 dark:text-white' 
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                  />
                  <span>All Tasks in Database</span>
                </div>
                <span className="font-mono-numbers text-slate-500 dark:text-slate-400">{allTasks.length} tasks</span>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                scope === 'today' 
                  ? 'border-slate-900 dark:border-indigo-500 bg-slate-50 dark:bg-slate-800/80 font-medium text-slate-900 dark:text-white' 
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={scope === 'today'}
                    onChange={() => setScope('today')}
                  />
                  <span>Today's Tasks Only</span>
                </div>
                <span className="font-mono-numbers text-slate-500 dark:text-slate-400">{todayTasks.length} tasks</span>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                scope === 'completed' 
                  ? 'border-slate-900 dark:border-indigo-500 bg-slate-50 dark:bg-slate-800/80 font-medium text-slate-900 dark:text-white' 
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={scope === 'completed'}
                    onChange={() => setScope('completed')}
                  />
                  <span>Completed Tasks Only</span>
                </div>
                <span className="font-mono-numbers text-slate-500 dark:text-slate-400">{completedTasks.length} tasks</span>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                scope === 'pending' 
                  ? 'border-slate-900 dark:border-indigo-500 bg-slate-50 dark:bg-slate-800/80 font-medium text-slate-900 dark:text-white' 
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={scope === 'pending'}
                    onChange={() => setScope('pending')}
                  />
                  <span>Pending / In Progress Only</span>
                </div>
                <span className="font-mono-numbers text-slate-500 dark:text-slate-400">{pendingTasks.length} tasks</span>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                scope === 'filtered' 
                  ? 'border-slate-900 dark:border-indigo-500 bg-slate-50 dark:bg-slate-800/80 font-medium text-slate-900 dark:text-white' 
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={scope === 'filtered'}
                    onChange={() => setScope('filtered')}
                  />
                  <span>Current Filtered View</span>
                </div>
                <span className="font-mono-numbers text-slate-500 dark:text-slate-400">{filteredTasks.length} tasks</span>
              </label>

              {selectedTaskIds.length > 0 && (
                <label className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                  scope === 'selected' 
                    ? 'border-slate-900 dark:border-indigo-500 bg-slate-50 dark:bg-slate-800/80 font-medium text-slate-900 dark:text-white' 
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={scope === 'selected'}
                      onChange={() => setScope('selected')}
                    />
                    <span>Selected Checked Rows</span>
                  </div>
                  <span className="font-mono-numbers text-slate-500 dark:text-slate-400">{selectedTasks.length} tasks</span>
                </label>
              )}

              {/* Standalone Notes Only Option */}
              <label className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                scope === 'notes_only' 
                  ? 'border-amber-600 dark:border-amber-500 bg-amber-50/80 dark:bg-amber-950/30 font-medium text-amber-900 dark:text-amber-200' 
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={scope === 'notes_only'}
                    onChange={() => setScope('notes_only')}
                  />
                  <span className="flex items-center gap-1.5 font-medium">
                    <StickyNote className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Notes Only (Standalone Sheet)</span>
                  </span>
                </div>
                <span className="font-mono-numbers text-amber-600 dark:text-amber-400 font-semibold">{notes.length} notes</span>
              </label>
            </div>
          </div>

          {/* Multi-Sheet Organization Preview Card (when Excel .xlsx is chosen) */}
          {format === 'xlsx' && !isNotesOnly && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Separate Sheets in Workbook</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {willIncludeNotes ? '2 Sheets' : '1 Sheet'}
                </span>
              </div>

              {/* Sheet 1: HR Tasks */}
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Sheet 1
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">HR Tasks</span>
                  <span className="text-[11px] text-slate-500">({targetCount} rows)</span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Included</span>
              </div>

              {/* Sheet 2: Notes (Separate Sheet Option) */}
              <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs cursor-pointer hover:border-amber-400 transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeNotesSheet}
                    onChange={(e) => setIncludeNotesSheet(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    Sheet 2
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">Notes</span>
                  <span className="text-[11px] text-slate-500">({notes.length} standalone notes)</span>
                </div>
                <span className={`text-[11px] font-semibold ${includeNotesSheet ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                  {includeNotesSheet ? 'Enabled' : 'Excluded'}
                </span>
              </label>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Stores your Google Keep style notes, checklists, and tags into a dedicated <strong>"Notes"</strong> sheet alongside your tasks.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!isNotesOnly && targetCount === 0 && (!includeNotesSheet || notes.length === 0)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-700 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isNotesOnly 
                ? `Export ${notes.length} Note${notes.length === 1 ? '' : 's'} (Excel)`
                : willIncludeNotes 
                ? `Export ${targetCount} Tasks + ${notes.length} Notes (2 Sheets)`
                : `Export ${targetCount} Task${targetCount === 1 ? '' : 's'}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

