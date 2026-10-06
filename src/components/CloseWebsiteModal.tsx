import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  Download, 
  Power, 
  X, 
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface CloseWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskCount: number;
  onExtractAgain: () => void;
}

export const CloseWebsiteModal: React.FC<CloseWebsiteModalProps> = ({
  isOpen,
  onClose,
  taskCount,
  onExtractAgain,
}) => {
  const [attemptedClose, setAttemptedClose] = useState(false);

  if (!isOpen) return null;

  const handleCloseTab = () => {
    setAttemptedClose(true);
    // In browsers, window.close() only works if opened by script, but we attempt it
    window.close();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Emerald Accent Bar */}
        <div className="h-2 w-full bg-emerald-500" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Excel Automatically Extracted
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Saved
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your workspace backup was successfully extracted before closing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Return to tracker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="font-medium">Total Tasks Exported:</span>
              <span className="font-bold font-mono-numbers text-slate-900 dark:text-white text-sm">
                {taskCount} tasks
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="font-medium">File Format:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                Microsoft Excel (.xlsx)
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="font-medium">Storage Safety:</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Synced to Local Storage</span>
              </span>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            The Excel file has been downloaded to your computer's <strong>Downloads</strong> folder. All your latest modifications, dates, AM/PM timings, and follow-up notes are safely preserved.
          </p>

          {attemptedClose && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 leading-relaxed animate-in fade-in">
              <p className="font-semibold mb-0.5">Note from your browser:</p>
              <span>
                Modern browsers prevent websites from directly closing tabs without manual user action. You can now safely close this browser tab by pressing <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded text-[10px] font-mono font-bold shadow-2xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded text-[10px] font-mono font-bold shadow-2xs">W</kbd> (or <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded text-[10px] font-mono font-bold shadow-2xs">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded text-[10px] font-mono font-bold shadow-2xs">W</kbd>) or clicking the <strong>✕</strong> on the tab.
              </span>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExtractAgain}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Download another copy of the Excel spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Re-extract Excel</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <span>Keep Working</span>
            </button>

            <button
              type="button"
              onClick={handleCloseTab}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Close Tab / Window</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
