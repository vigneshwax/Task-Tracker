import React, { useState, useRef } from 'react';
import { HRTask, ExcelColumnMapping } from '../types/hrTask';
import { formatTimeCompact } from '../utils/storage';
import { 
  parseUploadedExcel, 
  convertRowsToTasks, 
  ParsedSpreadsheet, 
  EXCEL_STANDARD_COLUMNS,
  getUserSampleParsedSpreadsheet,
  downloadExcelTemplate
} from '../utils/excel';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  HelpCircle,
  RefreshCw,
  Download,
  Sparkles
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCompleted: (importedTasks: HRTask[], count: number) => void;
  existingTasks: HRTask[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportCompleted,
  existingTasks,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [parsedData, setParsedData] = useState<ParsedSpreadsheet | null>(null);
  
  // Custom column mapping state
  const [mapping, setMapping] = useState<ExcelColumnMapping>({
    date: '',
    time: '',
    title: '',
    description: '',
    category: '',
    priority: '',
    status: '',
    assignedTo: '',
    notes: '',
    followUpDate: '',
  });

  const [importStrategy, setImportStrategy] = useState<'add' | 'update'>('add');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg('');
    setLoading(true);

    try {
      const parsed = await parseUploadedExcel(selected);
      if (parsed.rawRows.length === 0) {
        throw new Error('The selected spreadsheet does not contain any data rows.');
      }
      setParsedData(parsed);
      setMapping(parsed.detectedMapping);
    } catch (err: any) {
      console.error('Spreadsheet parse error', err);
      setErrorMsg(err.message || 'Failed to parse file. Please verify it is a valid .xlsx, .xls, or .csv document.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setErrorMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData) return;
    if (!mapping.title) {
      setErrorMsg('Please select a column to map to "Task / Activity" before importing.');
      return;
    }

    try {
      const newTasks = convertRowsToTasks(
        parsedData.rawRows,
        mapping,
        existingTasks,
        importStrategy
      );
      const addedCount = newTasks.length - (importStrategy === 'update' ? existingTasks.length : 0);
      onImportCompleted(newTasks, Math.max(addedCount, parsedData.rawRows.length));
      onClose();
    } catch (err: any) {
      setErrorMsg(`Import failed: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Import Tasks from Excel / CSV</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Supports .xlsx, .xls, and .csv spreadsheets</p>
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
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: File Upload */}
          {!parsedData ? (
            <div className="space-y-4">
              {/* Quick Sample Table Loader from User's Spreadsheet */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50 dark:from-indigo-950/40 dark:via-slate-800/80 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      My Sample Import Excel File Table
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono-numbers">
                      10 Rows
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Accounts Candidate, Pace Active, Junior Merchandiser, Viji, Purchase, Intern Mail, System Admin, Randsad, Consultant, Roshini Offer.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => downloadExcelTemplate()}
                    title="Download this exact sample spreadsheet (.xlsx)"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download .xlsx</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = getUserSampleParsedSpreadsheet();
                      setParsedData(sample);
                      setMapping(sample.detectedMapping);
                      setErrorMsg('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Load & Preview</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <label 
                htmlFor="excel-upload-input"
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80"
              >
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-3 shadow-2xs">
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {loading ? 'Analyzing spreadsheet...' : 'Click to select or drag and drop Excel file'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  .xlsx, .xls, or .csv up to 10MB
                </p>
                <input
                  id="excel-upload-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Tips for seamless Excel import:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1">
                  <li>Your sheet should have a header row with column names.</li>
                  <li>Common headers like <span className="font-mono text-slate-800 dark:text-slate-200">Date</span>, <span className="font-mono text-slate-800 dark:text-slate-200">Time</span>, <span className="font-mono text-slate-800 dark:text-slate-200">Task / Activity</span>, <span className="font-mono text-slate-800 dark:text-slate-200">Category</span>, <span className="font-mono text-slate-800 dark:text-slate-200">Priority</span>, and <span className="font-mono text-slate-800 dark:text-slate-200">Status</span> are automatically detected.</li>
                  <li>Time values formatted with dots (e.g. <span className="font-mono text-slate-800 dark:text-slate-200">10.40 AM</span>) or colons are automatically standardized.</li>
                  <li>You will be able to review column mapping and preview rows before confirming.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">{parsedData.fileName}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600 dark:text-slate-300 font-mono-numbers">{parsedData.rawRows.length} rows detected</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium cursor-pointer"
                >
                  Choose another file
                </button>
              </div>

              {/* Step 2: Column Mapping */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
                  1. Map Excel Columns to HR Task Fields
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  {/* Task / Activity (Required) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Task / Activity <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={mapping.title}
                      onChange={(e) => setMapping({ ...mapping, title: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                    >
                      <option value="">-- Select Column --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Description / Details
                    </label>
                    <select
                      value={mapping.description}
                      onChange={(e) => setMapping({ ...mapping, description: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                    >
                      <option value="">-- None / Empty --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Date
                    </label>
                    <select
                      value={mapping.date}
                      onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                    >
                      <option value="">-- Defaults to Today --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Time
                    </label>
                    <select
                      value={mapping.time}
                      onChange={(e) => setMapping({ ...mapping, time: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                    >
                      <option value="">-- Defaults to 09:00 AM --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={mapping.category}
                      onChange={(e) => setMapping({ ...mapping, category: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                    >
                      <option value="">-- Defaults to HR Operations --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={mapping.priority}
                      onChange={(e) => setMapping({ ...mapping, priority: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                    >
                      <option value="">-- Defaults to Medium --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={mapping.status}
                      onChange={(e) => setMapping({ ...mapping, status: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                    >
                      <option value="">-- Defaults to Pending --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned To
                    </label>
                    <select
                      value={mapping.assignedTo}
                      onChange={(e) => setMapping({ ...mapping, assignedTo: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                    >
                      <option value="">-- Defaults to Me --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Follow-up Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Follow-up Date
                    </label>
                    <select
                      value={mapping.followUpDate}
                      onChange={(e) => setMapping({ ...mapping, followUpDate: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                    >
                      <option value="">-- None --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Notes
                    </label>
                    <select
                      value={mapping.notes}
                      onChange={(e) => setMapping({ ...mapping, notes: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                    >
                      <option value="">-- None --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 3: Import Mode Option */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  2. Import Strategy
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-colors ${
                    importStrategy === 'add' 
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-slate-800' 
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}>
                    <input
                      type="radio"
                      name="importStrategy"
                      checked={importStrategy === 'add'}
                      onChange={() => setImportStrategy('add')}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Add as new tasks</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Appends all spreadsheet rows as fresh tasks without altering existing entries.</p>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-colors ${
                    importStrategy === 'update' 
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-slate-800' 
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}>
                    <input
                      type="radio"
                      name="importStrategy"
                      checked={importStrategy === 'update'}
                      onChange={() => setImportStrategy('update')}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Update matching tasks</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Updates tasks with identical title and date; appends any non-matching tasks.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 4: Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    3. Preview Rows ({Math.min(parsedData.rawRows.length, 10)} of {parsedData.rawRows.length})
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Verify mapped fields below
                  </span>
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto bg-white dark:bg-slate-800 text-xs">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800/90 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Time</th>
                        <th className="px-3 py-2 text-left">Task / Activity</th>
                        <th className="px-3 py-2 text-left">Description</th>
                        <th className="px-3 py-2 text-left">Category</th>
                        <th className="px-3 py-2 text-left">Priority</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Assigned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono-numbers text-xs">
                      {parsedData.rawRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 font-sans">
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300 font-mono-numbers whitespace-nowrap">
                            {mapping.date ? String(row[mapping.date] || 'Today') : 'Today'}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300 font-mono-numbers whitespace-nowrap">
                            {mapping.time ? formatTimeCompact(String(row[mapping.time] || '09:00 AM')) : '09:00 AM'}
                          </td>
                          <td className="px-3 py-2 text-slate-900 dark:text-white font-medium max-w-xs truncate">
                            {mapping.title ? String(row[mapping.title] || '—') : '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                            {mapping.description ? String(row[mapping.description] || '—') : '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {mapping.category ? String(row[mapping.category] || 'HR Operations') : 'HR Operations'}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {mapping.priority ? String(row[mapping.priority] || 'Medium') : 'Medium'}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {mapping.status ? String(row[mapping.status] || 'Pending') : 'Pending'}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {mapping.assignedTo ? String(row[mapping.assignedTo] || 'Me') : 'Me'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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

          {parsedData && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Import {parsedData.rawRows.length} Tasks</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
