import React, { useState } from 'react';
import { HRTask } from '../types/hrTask';
import { exportTasksToExcel } from '../utils/excel';
import { isDateToday } from '../utils/storage';
import { X, Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTasks: HRTask[];
  filteredTasks: HRTask[];
  selectedTaskIds: string[];
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  allTasks,
  filteredTasks,
  selectedTaskIds,
}) => {
  const [scope, setScope] = useState<'all' | 'today' | 'filtered' | 'selected' | 'completed' | 'pending'>('all');
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');

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
      case 'all':
      default:
        return { tasks: allTasks, label: 'All_HR_Tasks' };
    }
  };

  const handleExport = () => {
    const { tasks, label } = getTargetTasks();
    if (tasks.length === 0) {
      alert('No tasks match the selected export criteria.');
      return;
    }
    exportTasksToExcel(tasks, label, format);
    onClose();
  };

  const targetCount = getTargetTasks().tasks.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Export HR Tasks</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Download formatted Excel or CSV report</p>
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
        <div className="p-6 space-y-4">
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
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                  format === 'xlsx'
                    ? 'border-slate-900 dark:border-indigo-500 bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                  format === 'csv'
                    ? 'border-slate-900 dark:border-indigo-500 bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                CSV (.csv)
              </button>
            </div>
          </div>
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
            disabled={targetCount === 0}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export {targetCount} Task{targetCount === 1 ? '' : 's'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
