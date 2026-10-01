import * as XLSX from 'xlsx';
import { HRTask, ExcelColumnMapping, TaskPriority, TaskStatus } from '../types/hrTask';
import { getTodayDateString, formatTimeCompact } from './storage';

export const EXCEL_STANDARD_COLUMNS = [
  'Date',
  'Time',
  'Task / Activity',
  'Description',
  'Category',
  'Priority',
  'Status',
  'Assigned To',
  'Notes',
  'Follow-up Date'
];

/**
 * Exact sample Excel rows from the user's template spreadsheet
 */
export const USER_SAMPLE_EXCEL_ROWS: Record<string, any>[] = [
  {
    'Date': '2026-10-01',
    'Time': '10.40 AM',
    'Task / Activity': 'Accounts Candidate - K Govind Reddy',
    'Description': '9063020840',
    'Category': 'BGV',
    'Priority': 'Low',
    'Status': 'Pending',
    'Assigned To': 'Me',
    'Notes': '',
    'Follow-up Date': '',
  },
  {
    'Date': '2026-10-01',
    'Time': '10.35 AM',
    'Task / Activity': 'Pace Active Candidate',
    'Description': '9791836166',
    'Category': 'BGV',
    'Priority': 'Medium',
    'Status': 'Pending',
    'Assigned To': 'Me',
    'Notes': '',
    'Follow-up Date': '',
  },
  {
    'Date': '2026-10-01',
    'Time': '11.00 AM',
    'Task / Activity': 'Junior Merchandiser - Pushpa',
    'Description': '',
    'Category': 'Resume Share',
    'Priority': 'High',
    'Status': 'Pending',
    'Assigned To': 'Me',
    'Notes': '',
    'Follow-up Date': '',
  },
  {
    'Date': '2026-10-01',
    'Time': '11.30 AM',
    'Task / Activity': 'Merchandiser , AM Merch - Viji',
    'Description': '',
    'Category': 'Resume Share',
    'Priority': 'High',
    'Status': 'Pending',
    'Assigned To': 'Me',
    'Notes': '',
    'Follow-up Date': '',
  },
  {
    'Date': '2026-10-01',
    'Time': '12.00 PM',
    'Task / Activity': 'Purchase candidate',
    'Description': '',
    'Category': 'Resume Screening',
    'Priority': 'High',
    'Status': 'Pending',
    'Assigned To': 'Me',
    'Notes': '',
    'Follow-up Date': '',
  },
  {
    'Date': '2026-10-01',
    'Time': '02.00 PM',
    'Task / Activity': 'Intern Drop Mail - Suprana',
    'Description': '',
    'Category': 'Update',
    'Priority': 'Medium',
    'Status': 'Pending',
    'Assigned To': 'Me',
    'Notes': '',
    'Follow-up Date': '',
  },
  {
    'Date': '2026-10-01',
    'Time': '03.00 PM',
    'Task / Activity': 'System Admin',
    'Description': '',
    'Category': 'Negotiation',
    'Priority': 'Medium',
    'Status': 'Pending',
    'Assigned To': 'Me',
    'Notes': '',
    'Follow-up Date': '',
  },
  {
    'Date': '2026-10-01',
    'Time': '04.00 PM',
    'Task / Activity': 'Randsad Update',
    'Description': '',
    'Category': 'Follow-up',
    'Priority': 'Medium',
    'Status': 'Pending',
    'Assigned To': 'Me',
    'Notes': '',
    'Follow-up Date': '',
  },
  {
    'Date': '2026-10-01',
    'Time': '01.30 AM',
    'Task / Activity': 'Consultant Resume screen',
    'Description': '',
    'Category': 'Resume Screening',
    'Priority': 'High',
    'Status': 'Pending',
    'Assigned To': 'Me',
    'Notes': '',
    'Follow-up Date': '',
  },
  {
    'Date': '2026-10-02',
    'Time': '10.30 AM',
    'Task / Activity': 'Roshini - Offer',
    'Description': '93844 71447',
    'Category': 'Follow-up',
    'Priority': 'High',
    'Status': 'Pending',
    'Assigned To': 'Me',
    'Notes': '',
    'Follow-up Date': '',
  },
];

/**
 * Downloads a clean Excel template pre-populated with the user's sample HR tasks
 */
export function downloadExcelTemplate(): void {
  const ws = XLSX.utils.json_to_sheet(USER_SAMPLE_EXCEL_ROWS, { header: EXCEL_STANDARD_COLUMNS });
  
  // Set nice column widths
  ws['!cols'] = [
    { wch: 14 }, // Date
    { wch: 12 }, // Time
    { wch: 42 }, // Task / Activity
    { wch: 22 }, // Description (Phone / Details)
    { wch: 22 }, // Category
    { wch: 12 }, // Priority
    { wch: 12 }, // Status
    { wch: 16 }, // Assigned To
    { wch: 30 }, // Notes
    { wch: 16 }, // Follow-up Date
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'HR Tasks');

  // Add Instructions Sheet
  const instructions = [
    { 'Field': 'Date', 'Format': 'YYYY-MM-DD (e.g. 2026-10-01)', 'Required': 'Yes' },
    { 'Field': 'Time', 'Format': '10.40 AM or 10:40 AM', 'Required': 'No' },
    { 'Field': 'Task / Activity', 'Format': 'Role or Activity title (e.g. Accounts Candidate - K Govind Reddy)', 'Required': 'Yes' },
    { 'Field': 'Description', 'Format': 'Contact number, candidate details, or notes (e.g. 9063020840)', 'Required': 'No' },
    { 'Field': 'Category', 'Format': 'BGV, Resume Share, Resume Screening, Update, Negotiation, Follow-up, etc.', 'Required': 'No' },
    { 'Field': 'Priority', 'Format': 'High, Medium, or Low', 'Required': 'No (Defaults to Medium)' },
    { 'Field': 'Status', 'Format': 'Pending, In Progress, or Completed', 'Required': 'No (Defaults to Pending)' },
    { 'Field': 'Assigned To', 'Format': 'Me or recruiter name', 'Required': 'No' },
    { 'Field': 'Notes', 'Format': 'Free text comments or links', 'Required': 'No' },
    { 'Field': 'Follow-up Date', 'Format': 'YYYY-MM-DD for tracking follow-ups', 'Required': 'No' },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(instructions);
  wsGuide['!cols'] = [{ wch: 20 }, { wch: 65 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Guide & Instructions');

  XLSX.writeFile(wb, 'My_Sample_HR_Tasks.xlsx');
}

/**
 * Returns pre-configured parsed spreadsheet for the user's sample table
 */
export function getUserSampleParsedSpreadsheet(): ParsedSpreadsheet {
  return {
    fileName: 'My_Sample_Import_excel_file_table.xlsx',
    sheetNames: ['HR Tasks'],
    headers: [...EXCEL_STANDARD_COLUMNS],
    rawRows: [...USER_SAMPLE_EXCEL_ROWS],
    detectedMapping: {
      date: 'Date',
      time: 'Time',
      title: 'Task / Activity',
      description: 'Description',
      category: 'Category',
      priority: 'Priority',
      status: 'Status',
      assignedTo: 'Assigned To',
      notes: 'Notes',
      followUpDate: 'Follow-up Date',
    },
  };
}

export interface ParsedSpreadsheet {
  fileName: string;
  sheetNames: string[];
  headers: string[];
  rawRows: Record<string, any>[];
  detectedMapping: ExcelColumnMapping;
}

/**
 * Smart detection of spreadsheet columns to HR task fields
 */
export function detectColumnMapping(headers: string[]): ExcelColumnMapping {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const findHeader = (candidates: string[]): string => {
    for (const h of headers) {
      const normH = normalize(h);
      for (const c of candidates) {
        if (normH === normalize(c)) return h;
      }
    }
    for (const h of headers) {
      const normH = normalize(h);
      for (const c of candidates) {
        if (normH.includes(normalize(c))) return h;
      }
    }
    return '';
  };

  return {
    date: findHeader(['Date', 'Task Date', 'Scheduled Date', 'Due Date', 'Day']),
    time: findHeader(['Time', 'Scheduled Time', 'Task Time', 'Hour', 'Slot']),
    title: findHeader(['Task / Activity', 'Task', 'Activity', 'Title', 'Task Name', 'Work', 'Item']),
    description: findHeader(['Description', 'Task Details', 'Detail', 'Summary', 'Job Description', 'Task Description']),
    category: findHeader(['Category', 'Department', 'HR Category', 'Type', 'Area', 'Function']),
    priority: findHeader(['Priority', 'Urgency', 'Importance', 'Level']),
    status: findHeader(['Status', 'State', 'Progress', 'Task Status']),
    assignedTo: findHeader(['Assigned To', 'Assignee', 'Owner', 'Person Responsible', 'Assigned', 'Lead', 'Staff']),
    notes: findHeader(['Notes', 'Additional Details', 'Remarks', 'Comments', 'Details']),
    followUpDate: findHeader(['Follow-up Date', 'Followup Date', 'Follow Up', 'Next Follow-up', 'Follow-up', 'Reminder Date']),
  };
}

/**
 * Reads an uploaded Excel (.xlsx, .xls) or CSV file
 */
export async function parseUploadedExcel(file: File): Promise<ParsedSpreadsheet> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    cellDates: true,
    cellText: false,
    dateNF: 'yyyy-mm-dd'
  });

  const firstSheetName = workbook.SheetNames[0] || '';
  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    throw new Error('No readable sheets found in the spreadsheet.');
  }

  // Get raw JSON rows
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd'
  });

  // Extract all unique headers across the sheet
  const headersSet = new Set<string>();
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
    if (cell && cell.v !== undefined && cell.v !== null) {
      headersSet.add(String(cell.v).trim());
    }
  }

  // Also verify against row keys in case headers are merged or dynamic
  rawRows.slice(0, 10).forEach(row => {
    Object.keys(row).forEach(k => headersSet.add(k.trim()));
  });

  const headers = Array.from(headersSet).filter(Boolean);
  const detectedMapping = detectColumnMapping(headers);

  return {
    fileName: file.name,
    sheetNames: workbook.SheetNames,
    headers,
    rawRows,
    detectedMapping,
  };
}

/**
 * Normalizes date to YYYY-MM-DD
 */
export function normalizeDate(val: any): string {
  if (!val) return getTodayDateString();
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  // Check if matches YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // Try standard parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return getTodayDateString();
}

/**
 * Normalizes Time format to always output AM/PM (supports 10.40 AM, 10:40 AM, 14:00, etc.)
 */
export function normalizeTime(val: any): string {
  if (val === undefined || val === null || val === '') return '09:00 AM';
  const formatted = formatTimeCompact(String(val));
  return formatted === '—' ? '09:00 AM' : formatted;
}

/**
 * Normalizes Priority
 */
export function normalizePriority(val: any): TaskPriority {
  const s = String(val || '').toLowerCase().trim();
  if (s.includes('high') || s.includes('urgent') || s.includes('p1')) return 'High';
  if (s.includes('low') || s.includes('minor') || s.includes('p3')) return 'Low';
  return 'Medium';
}

/**
 * Normalizes Status
 */
export function normalizeStatus(val: any): TaskStatus {
  const s = String(val || '').toLowerCase().trim();
  if (s.includes('comp') || s.includes('done') || s.includes('finish') || s.includes('closed') || s === 'yes') return 'Completed';
  if (s.includes('prog') || s.includes('doing') || s.includes('work') || s.includes('active')) return 'In Progress';
  return 'Pending';
}

/**
 * Converts raw parsed rows to HRTask objects
 */
export function convertRowsToTasks(
  rawRows: Record<string, any>[],
  mapping: ExcelColumnMapping,
  existingTasks: HRTask[],
  strategy: 'add' | 'update'
): HRTask[] {
  const now = Date.now();
  const createdTasks: HRTask[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rawTitle = mapping.title ? String(row[mapping.title] || '').trim() : '';
    if (!rawTitle) continue; // skip empty task rows

    const dateVal = mapping.date ? normalizeDate(row[mapping.date]) : getTodayDateString();
    const timeVal = mapping.time ? normalizeTime(row[mapping.time]) : '09:00 AM';
    const rawDesc = mapping.description ? row[mapping.description] : '';
    const descVal = (rawDesc !== undefined && rawDesc !== null) ? String(rawDesc).trim() : '';
    const rawCat = mapping.category ? String(row[mapping.category] || '').trim() : '';
    const categoryVal = rawCat || 'HR Operations';
    const priorityVal = mapping.priority ? normalizePriority(row[mapping.priority]) : 'Medium';
    const statusVal = mapping.status ? normalizeStatus(row[mapping.status]) : 'Pending';
    const assignedVal = mapping.assignedTo ? String(row[mapping.assignedTo] || '').trim() || 'Me' : 'Me';
    const notesVal = mapping.notes ? String(row[mapping.notes] || '').trim() : '';
    const followUpVal = mapping.followUpDate && row[mapping.followUpDate] ? normalizeDate(row[mapping.followUpDate]) : '';

    if (strategy === 'update') {
      // Find matching task by identical title & date
      const matchIndex = existingTasks.findIndex(
        t => t.title.toLowerCase() === rawTitle.toLowerCase() && t.date === dateVal
      );
      if (matchIndex >= 0) {
        existingTasks[matchIndex] = {
          ...existingTasks[matchIndex],
          time: timeVal || existingTasks[matchIndex].time,
          description: descVal || existingTasks[matchIndex].description,
          category: categoryVal || existingTasks[matchIndex].category,
          priority: priorityVal,
          status: statusVal,
          assignedTo: assignedVal || existingTasks[matchIndex].assignedTo,
          notes: notesVal || existingTasks[matchIndex].notes,
          followUpDate: followUpVal || existingTasks[matchIndex].followUpDate,
          updatedAt: now,
        };
        continue;
      }
    }

    createdTasks.push({
      id: `task-${now}-${i}-${Math.random().toString(36).substr(2, 5)}`,
      date: dateVal,
      time: timeVal,
      title: rawTitle,
      description: descVal,
      category: categoryVal,
      priority: priorityVal,
      status: statusVal,
      assignedTo: assignedVal,
      notes: notesVal,
      followUpDate: followUpVal,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (strategy === 'update') {
    return [...existingTasks, ...createdTasks];
  }

  return [...existingTasks, ...createdTasks];
}

/**
 * Exports tasks to Excel (.xlsx or .csv)
 */
export function exportTasksToExcel(
  tasks: HRTask[],
  exportScopeName: string = 'Tasks',
  format: 'xlsx' | 'csv' = 'xlsx'
): void {
  const exportData = tasks.map(t => ({
    'Date': t.date,
    'Time': formatTimeCompact(t.time),
    'Task / Activity': t.title,
    'Description': t.description || '',
    'Category': t.category,
    'Priority': t.priority,
    'Status': t.status,
    'Assigned To': t.assignedTo,
    'Notes': t.notes || '',
    'Follow-up Date': t.followUpDate || '',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData, { header: EXCEL_STANDARD_COLUMNS });

  ws['!cols'] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 48 },
    { wch: 50 },
    { wch: 24 },
    { wch: 12 },
    { wch: 14 },
    { wch: 28 },
    { wch: 50 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'HR Tasks');

  const dateTag = getTodayDateString();
  const sanitizedScope = exportScopeName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `HR_Daily_Tasks_${sanitizedScope}_${dateTag}.${format}`;

  XLSX.writeFile(wb, filename, { bookType: format });
}
