import { HRTask, KeepNote } from '../types/hrTask';

export const GOOGLE_SHEETS_URL_KEY = 'google_sheets_database_url_v1';
export const GOOGLE_SHEETS_LAST_SYNC_KEY = 'google_sheets_last_sync_time_v1';
export const GOOGLE_SHEETS_LINK_KEY = 'google_sheets_sheet_url_v1';
export const GOOGLE_SHEETS_API_KEY_KEY = 'google_sheets_api_key_v1';
export const GOOGLE_SHEETS_SPREADSHEET_ID_KEY = 'google_sheets_spreadsheet_id_v1';
export const GOOGLE_SHEETS_MODE_KEY = 'google_sheets_sync_mode_v1';
export const SIMULATED_GOOGLE_SHEET_KEY = 'simulated_google_sheet_database_v1';
export const GOOGLE_SHEETS_AUTO_SYNC_KEY = 'google_sheets_auto_sync_enabled_v1';
export const GOOGLE_SHEETS_AUTO_PULL_KEY = 'google_sheets_auto_pull_enabled_v1';
export const GOOGLE_SHEETS_LAST_PULL_KEY = 'google_sheets_last_pull_time_v1';

export type GoogleSheetsSyncMode = 'appscript' | 'apikey' | 'simulator';

export interface GoogleSheetsSyncResult {
  success: boolean;
  message: string;
  is404Error?: boolean;
  errorCategory?: '404_not_found' | 'invalid_url' | 'cors_network' | 'permission_denied' | 'other';
  tasksCount?: number;
  notesCount?: number;
  timestamp?: string;
}

export interface GoogleSheetsPullResult {
  success: boolean;
  message: string;
  is404Error?: boolean;
  errorCategory?: '404_not_found' | 'invalid_url' | 'cors_network' | 'permission_denied' | 'other';
  tasks?: HRTask[];
  notes?: KeepNote[];
  timestamp?: string;
}

/**
 * Pre-written, complete Google Apps Script code to paste into Extensions > Apps Script.
 * Uses the exact same multi-sheet format as the Excel (.xlsx) export:
 * Sheet 1: 'HR Tasks' (Date, Time, Task / Activity, Description, Category, Priority, Status, Assigned To, Notes, Follow-up Date)
 * Sheet 2: 'Notes' (Note Title, Content / Details, Type, Checklist Items, Checklist Progress, Tags / Category, Pinned, Color, Created Date, Last Updated)
 */
export const APPS_SCRIPT_DATABASE_CODE = `/**
 * Google Apps Script - Two-Way Database for HR Tracker & Google Keep Notes
 * Uses the EXACT same multi-sheet format as Excel (.xlsx) export:
 * - Sheet 1: "HR Tasks"
 * - Sheet 2: "Notes"
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = { status: "success", tasks: [], notes: [] };

    // --- 1. Read 'HR Tasks' tab ---
    var tasksSheet = ss.getSheetByName("HR Tasks") || ss.getSheetByName("Tasks") || ss.getSheets()[0];
    if (tasksSheet && tasksSheet.getLastRow() > 1) {
      var taskRows = tasksSheet.getDataRange().getValues();
      var headers = taskRows[0].map(function(h) { return String(h).toLowerCase().trim(); });

      // Find column indexes (fallback to standard Excel export order: 0 to 9)
      var colDate = headers.indexOf("date") !== -1 ? headers.indexOf("date") : 0;
      var colTime = headers.indexOf("time") !== -1 ? headers.indexOf("time") : 1;
      var colTitle = headers.indexOf("task / activity") !== -1 ? headers.indexOf("task / activity") : (headers.indexOf("task") !== -1 ? headers.indexOf("task") : 2);
      var colDesc = headers.indexOf("description") !== -1 ? headers.indexOf("description") : 3;
      var colCat = headers.indexOf("category") !== -1 ? headers.indexOf("category") : 4;
      var colPrio = headers.indexOf("priority") !== -1 ? headers.indexOf("priority") : 5;
      var colStat = headers.indexOf("status") !== -1 ? headers.indexOf("status") : 6;
      var colAssign = headers.indexOf("assigned to") !== -1 ? headers.indexOf("assigned to") : 7;
      var colNotes = headers.indexOf("notes") !== -1 ? headers.indexOf("notes") : 8;
      var colFollow = headers.indexOf("follow-up date") !== -1 ? headers.indexOf("follow-up date") : 9;

      for (var i = 1; i < taskRows.length; i++) {
        var row = taskRows[i];
        var titleVal = String(row[colTitle] || '').trim();
        if (!titleVal) continue; // Skip blank rows

        var dateVal = row[colDate] instanceof Date 
          ? Utilities.formatDate(row[colDate], Session.getScriptTimeZone(), "yyyy-MM-dd")
          : String(row[colDate] || '');
        
        var followVal = row[colFollow] instanceof Date 
          ? Utilities.formatDate(row[colFollow], Session.getScriptTimeZone(), "yyyy-MM-dd")
          : String(row[colFollow] || '');

        result.tasks.push({
          id: 'task-gs-' + (Date.now() - (taskRows.length - i) * 1000) + '-' + i,
          date: dateVal || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
          time: String(row[colTime] || '09:00 AM'),
          title: titleVal,
          description: String(row[colDesc] || ''),
          category: String(row[colCat] || 'HR Operations'),
          priority: String(row[colPrio] || 'Medium'),
          status: String(row[colStat] || 'Pending'),
          assignedTo: String(row[colAssign] || 'Me'),
          notes: String(row[colNotes] || ''),
          followUpDate: followVal,
          createdAt: Date.now() - (taskRows.length - i) * 60000,
          updatedAt: Date.now()
        });
      }
    }

    // --- 2. Read 'Notes' tab ---
    var notesSheet = ss.getSheetByName("Notes") || ss.getSheetByName("HR Notes") || ss.getSheetByName("Keep Notes");
    if (notesSheet && notesSheet.getLastRow() > 1) {
      var noteRows = notesSheet.getDataRange().getValues();
      var nHeaders = noteRows[0].map(function(h) { return String(h).toLowerCase().trim(); });

      var colNTitle = nHeaders.indexOf("note title") !== -1 ? nHeaders.indexOf("note title") : (nHeaders.indexOf("title") !== -1 ? nHeaders.indexOf("title") : 0);
      var colNContent = nHeaders.indexOf("content / details") !== -1 ? nHeaders.indexOf("content / details") : (nHeaders.indexOf("content") !== -1 ? nHeaders.indexOf("content") : 1);
      var colNType = nHeaders.indexOf("type") !== -1 ? nHeaders.indexOf("type") : 2;
      var colNItems = nHeaders.indexOf("checklist items") !== -1 ? nHeaders.indexOf("checklist items") : 3;
      var colNTags = nHeaders.indexOf("tags / category") !== -1 ? nHeaders.indexOf("tags / category") : (nHeaders.indexOf("tags") !== -1 ? nHeaders.indexOf("tags") : 5);
      var colNPinned = nHeaders.indexOf("pinned") !== -1 ? nHeaders.indexOf("pinned") : 6;
      var colNColor = nHeaders.indexOf("color") !== -1 ? nHeaders.indexOf("color") : 7;

      for (var j = 1; j < noteRows.length; j++) {
        var nRow = noteRows[j];
        var nTitle = String(nRow[colNTitle] || '').trim();
        var nContent = String(nRow[colNContent] || '').trim();
        var nChecklistStr = String(nRow[colNItems] || '').trim();
        var nType = String(nRow[colNType] || '').toLowerCase();

        if (!nTitle && !nContent && !nChecklistStr) continue;

        var isChecklist = nType.indexOf("check") !== -1 || (nChecklistStr !== "" && nChecklistStr !== "—");
        var checklistItems = [];

        if (nChecklistStr && nChecklistStr !== "—") {
          var lines = nChecklistStr.split("\\n");
          for (var k = 0; k < lines.length; k++) {
            var line = lines[k].trim();
            if (!line) continue;
            var isDone = line.indexOf("[✓]") === 0 || line.indexOf("[x]") === 0 || line.indexOf("[X]") === 0;
            var text = line.replace(/^\\[[✓xX\\s]\\]\\s*/, '').trim();
            checklistItems.push({
              id: 'item-gs-' + j + '-' + k,
              text: text || line,
              completed: isDone
            });
          }
        }

        var tags = [];
        var rawTags = String(nRow[colNTags] || '').trim();
        if (rawTags) {
          tags = rawTags.split(",").map(function(t) { return t.trim(); }).filter(Boolean);
        }

        var rawPin = String(nRow[colNPinned] || '').toLowerCase();
        var isPinned = (rawPin === 'yes' || rawPin === 'true' || rawPin === '1');
        var colorVal = String(nRow[colNColor] || 'default').toLowerCase().trim();

        result.notes.push({
          id: 'keep-gs-' + (Date.now() - (noteRows.length - j) * 1000) + '-' + j,
          title: nTitle || 'Imported Note',
          content: nContent,
          isChecklist: isChecklist && checklistItems.length > 0,
          checklistItems: checklistItems,
          color: colorVal || 'default',
          isPinned: isPinned,
          tags: tags,
          createdAt: Date.now() - (noteRows.length - j) * 60000,
          updatedAt: Date.now()
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = JSON.parse(e.postData.contents);

    // ==========================================
    // --- 1. Write 'HR Tasks' Tab (Exact Excel Export Format) ---
    // ==========================================
    var tasksSheet = ss.getSheetByName("HR Tasks");
    if (!tasksSheet) {
      tasksSheet = ss.getSheetByName("Tasks");
      if (tasksSheet) {
        tasksSheet.setName("HR Tasks");
      } else {
        tasksSheet = ss.insertSheet("HR Tasks", 0);
      }
    }
    tasksSheet.clear();

    // Exact 10 standard columns matching Excel export
    var taskHeaders = [
      "Date", "Time", "Task / Activity", "Description", "Category", 
      "Priority", "Status", "Assigned To", "Notes", "Follow-up Date"
    ];
    tasksSheet.appendRow(taskHeaders);
    
    // Style header row (Dark slate background, white bold text)
    tasksSheet.getRange(1, 1, 1, taskHeaders.length)
      .setFontWeight("bold")
      .setBackground("#0f172a")
      .setFontColor("#ffffff")
      .setVerticalAlignment("middle");

    if (payload.tasks && payload.tasks.length > 0) {
      var taskRows = payload.tasks.map(function(t) {
        return [
          t.date || "",
          t.time || "09:00 AM",
          t.title || "",
          t.description || "",
          t.category || "HR Operations",
          t.priority || "Medium",
          t.status || "Pending",
          t.assignedTo || "Me",
          t.notes || "",
          t.followUpDate || ""
        ];
      });
      tasksSheet.getRange(2, 1, taskRows.length, taskRows[0].length).setValues(taskRows);
    }
    tasksSheet.setFrozenRows(1);
    tasksSheet.autoResizeColumns(1, taskHeaders.length);

    // ==========================================
    // --- 2. Write 'Notes' Tab (Exact Excel Export Format) ---
    // ==========================================
    var notesSheet = ss.getSheetByName("Notes");
    if (!notesSheet) {
      notesSheet = ss.insertSheet("Notes", 1);
    }
    notesSheet.clear();

    // Exact 10 standard columns matching Excel export
    var noteHeaders = [
      "Note Title", "Content / Details", "Type", "Checklist Items", 
      "Checklist Progress", "Tags / Category", "Pinned", "Color", 
      "Created Date", "Last Updated"
    ];
    notesSheet.appendRow(noteHeaders);

    // Style header row (Warm amber background, white bold text)
    notesSheet.getRange(1, 1, 1, noteHeaders.length)
      .setFontWeight("bold")
      .setBackground("#b45309")
      .setFontColor("#ffffff")
      .setVerticalAlignment("middle");

    if (payload.notes && payload.notes.length > 0) {
      var noteRows = payload.notes.map(function(n) {
        var checklistStr = "";
        var progressStr = "";
        if (n.isChecklist && n.checklistItems && n.checklistItems.length > 0) {
          var completedCount = n.checklistItems.filter(function(item) { return item.completed; }).length;
          progressStr = completedCount + "/" + n.checklistItems.length + " completed (" + Math.round((completedCount / n.checklistItems.length) * 100) + "%)";
          checklistStr = n.checklistItems.map(function(item) {
            return (item.completed ? "[✓] " : "[ ] ") + item.text;
          }).join("\\n");
        }

        var mainContent = n.content || (n.isChecklist ? checklistStr : "");
        var tagsStr = (n.tags && n.tags.length > 0) ? n.tags.join(", ") : "";
        var createdStr = n.createdAt ? Utilities.formatDate(new Date(n.createdAt), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm") : "";
        var updatedStr = n.updatedAt ? Utilities.formatDate(new Date(n.updatedAt), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm") : "";
        var colorFormatted = n.color ? (n.color.charAt(0).toUpperCase() + n.color.slice(1)) : "Default";

        return [
          n.title || "Untitled Note",
          mainContent,
          n.isChecklist ? "Checklist" : "Text Note",
          checklistStr || "—",
          progressStr || "—",
          tagsStr,
          n.isPinned ? "Yes" : "No",
          colorFormatted,
          createdStr,
          updatedStr
        ];
      });
      notesSheet.getRange(2, 1, noteRows.length, noteRows[0].length).setValues(noteRows);
    }
    notesSheet.setFrozenRows(1);
    notesSheet.autoResizeColumns(1, noteHeaders.length);

    var response = {
      status: "success",
      tasksCount: payload.tasks ? payload.tasks.length : 0,
      notesCount: payload.notes ? payload.notes.length : 0,
      timestamp: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

/**
 * 1-Click Spreadsheet Initializer Script for API Key & Spreadsheet ID users.
 * Automatically formats the active Google Spreadsheet with:
 * - "HR Tasks" tab (10 standard columns, dark slate header)
 * - "Notes" tab (10 standard columns, warm amber header)
 */
export const APPS_SCRIPT_INITIALIZER_CODE = `/**
 * Google Sheets Auto-Initializer for API Key & Spreadsheet ID
 * Prepares your Google Sheet for direct API database usage.
 * Automatically creates and styles:
 * 1. "HR Tasks" (10 columns matching Excel export)
 * 2. "Notes" (10 columns for Google Keep style notes)
 */

function setupSpreadsheetDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Create or format 'HR Tasks' sheet
  var tasksSheet = ss.getSheetByName("HR Tasks") || ss.getSheetByName("Tasks");
  if (!tasksSheet) {
    tasksSheet = ss.insertSheet("HR Tasks", 0);
  } else {
    tasksSheet.setName("HR Tasks");
  }

  var taskHeaders = [
    "Date", "Time", "Task / Activity", "Description", "Category", 
    "Priority", "Status", "Assigned To", "Notes", "Follow-up Date"
  ];
  
  tasksSheet.clear();
  tasksSheet.appendRow(taskHeaders);
  tasksSheet.getRange(1, 1, 1, taskHeaders.length)
    .setFontWeight("bold")
    .setBackground("#0f172a")
    .setFontColor("#ffffff")
    .setVerticalAlignment("middle");
  tasksSheet.setFrozenRows(1);
  tasksSheet.autoResizeColumns(1, taskHeaders.length);

  // 2. Create or format 'Notes' sheet
  var notesSheet = ss.getSheetByName("Notes") || ss.getSheetByName("HR Notes");
  if (!notesSheet) {
    notesSheet = ss.insertSheet("Notes", 1);
  } else {
    notesSheet.setName("Notes");
  }

  var noteHeaders = [
    "Note Title", "Content / Details", "Type", "Checklist Items", 
    "Checklist Progress", "Tags / Category", "Pinned", "Color", 
    "Created Date", "Last Updated"
  ];

  notesSheet.clear();
  notesSheet.appendRow(noteHeaders);
  notesSheet.getRange(1, 1, 1, noteHeaders.length)
    .setFontWeight("bold")
    .setBackground("#b45309")
    .setFontColor("#ffffff")
    .setVerticalAlignment("middle");
  notesSheet.setFrozenRows(1);
  notesSheet.autoResizeColumns(1, noteHeaders.length);

  SpreadsheetApp.getUi().alert("✅ Success! Your Google Sheet database tabs ('HR Tasks' and 'Notes') are formatted and ready for your API Key and Spreadsheet ID!");
}
`;

export interface UrlValidationResult {
  valid: boolean;
  cleanUrl: string;
  isSpreadsheetUrl: boolean;
  error?: string;
}

/**
 * Normalizes and validates Google Apps Script Web App URL
 */
export function normalizeAndValidateScriptUrl(rawUrl: string): UrlValidationResult {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return {
      valid: false,
      cleanUrl: '',
      isSpreadsheetUrl: false,
      error: 'Please enter your Google Apps Script Web App URL.'
    };
  }

  // Check if user accidentally pasted the spreadsheet document URL
  if (trimmed.includes('docs.google.com/spreadsheets')) {
    return {
      valid: false,
      cleanUrl: trimmed,
      isSpreadsheetUrl: true,
      error: 'You entered a Google Sheets document link (docs.google.com/spreadsheets) instead of the Apps Script Web App URL. Web requests to spreadsheet links return HTTP 404 because spreadsheets do not process API calls directly. To get your Web App URL, open Extensions → Apps Script → Deploy → New deployment → Web app, and copy the URL ending in /exec.'
    };
  }

  // Check if user pasted the Apps Script editor project link
  if (trimmed.includes('script.google.com/home') || trimmed.includes('/edit')) {
    return {
      valid: false,
      cleanUrl: trimmed,
      isSpreadsheetUrl: false,
      error: 'You entered the Apps Script editor URL. You must deploy it: click Deploy (top right) → New deployment → select Web app → set "Who has access: Anyone", and copy the Web App URL ending in /exec.'
    };
  }

  let normalized = trimmed;
  // If ended in /dev, convert to /exec
  if (normalized.endsWith('/dev')) {
    normalized = normalized.slice(0, -4) + '/exec';
  } else if (!normalized.endsWith('/exec') && normalized.includes('/macros/s/')) {
    normalized = normalized.replace(/\/?$/, '/exec');
  }

  if (!normalized.startsWith('https://script.google.com/macros/s/')) {
    return {
      valid: false,
      cleanUrl: normalized,
      isSpreadsheetUrl: false,
      error: 'Invalid Web App URL. The URL must start with "https://script.google.com/macros/s/" and end with "/exec".'
    };
  }

  return {
    valid: true,
    cleanUrl: normalized,
    isSpreadsheetUrl: false
  };
}

/**
 * Extract Google Spreadsheet ID from a URL or raw ID
 */
export function extractSpreadsheetId(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Check if it's already a naked ID (typically 30-50 characters of letters, numbers, hyphens, underscores)
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

/**
 * Get stored Webhook URL from localStorage
 */
export function getStoredSheetsUrl(): string {
  return localStorage.getItem(GOOGLE_SHEETS_URL_KEY) || '';
}

/**
 * Save Webhook URL to localStorage
 */
export function saveStoredSheetsUrl(url: string): void {
  const trimmed = url.trim();
  localStorage.setItem(GOOGLE_SHEETS_URL_KEY, trimmed);
  if (trimmed) {
    // When Apps Script is added, turn off auto-download on refresh and turn ON auto-sync!
    localStorage.setItem('hr_auto_extract_on_close', 'false');
    saveStoredAutoSyncEnabled(true);
  }
}

/**
 * Get stored API key from localStorage
 */
export function getStoredApiKey(): string {
  return localStorage.getItem(GOOGLE_SHEETS_API_KEY_KEY) || '';
}

/**
 * Save API key to localStorage
 */
export function saveStoredApiKey(key: string): void {
  const trimmed = key.trim();
  localStorage.setItem(GOOGLE_SHEETS_API_KEY_KEY, trimmed);
  if (trimmed) {
    // When API Key is added, turn off auto-download on refresh and turn ON auto-sync!
    localStorage.setItem('hr_auto_extract_on_close', 'false');
    saveStoredAutoSyncEnabled(true);
  }
}

/**
 * Get stored Spreadsheet ID from localStorage
 */
export function getStoredSpreadsheetId(): string {
  return localStorage.getItem(GOOGLE_SHEETS_SPREADSHEET_ID_KEY) || '';
}

/**
 * Save Spreadsheet ID to localStorage
 */
export function saveStoredSpreadsheetId(id: string): void {
  const extracted = extractSpreadsheetId(id);
  localStorage.setItem(GOOGLE_SHEETS_SPREADSHEET_ID_KEY, extracted);
  if (extracted) {
    // When Spreadsheet ID is added, turn off auto-download on refresh and turn ON auto-sync!
    localStorage.setItem('hr_auto_extract_on_close', 'false');
    saveStoredAutoSyncEnabled(true);
  }
}

/**
 * Get stored sync mode ('appscript' | 'apikey' | 'simulator')
 */
export function getStoredSyncMode(): GoogleSheetsSyncMode {
  const mode = localStorage.getItem(GOOGLE_SHEETS_MODE_KEY);
  if (mode === 'apikey' || mode === 'simulator' || mode === 'appscript') {
    return mode;
  }
  return 'appscript';
}

/**
 * Save sync mode
 */
export function saveStoredSyncMode(mode: GoogleSheetsSyncMode): void {
  localStorage.setItem(GOOGLE_SHEETS_MODE_KEY, mode);
  if (mode === 'simulator') {
    localStorage.setItem('hr_auto_extract_on_close', 'false');
    saveStoredAutoSyncEnabled(true);
  }
}

/**
 * Get stored last sync timestamp
 */
export function getStoredLastSync(): string | null {
  return localStorage.getItem(GOOGLE_SHEETS_LAST_SYNC_KEY);
}

/**
 * Save last sync timestamp
 */
export function setStoredLastSync(timestamp: string): void {
  localStorage.setItem(GOOGLE_SHEETS_LAST_SYNC_KEY, timestamp);
}

/**
 * Check if auto-sync to Google Sheets is enabled
 */
export function getStoredAutoSyncEnabled(): boolean {
  const val = localStorage.getItem(GOOGLE_SHEETS_AUTO_SYNC_KEY);
  if (val !== null) {
    return val === 'true';
  }
  // Default to true
  return true;
}

/**
 * Save auto-sync preference
 */
export function saveStoredAutoSyncEnabled(enabled: boolean): void {
  localStorage.setItem(GOOGLE_SHEETS_AUTO_SYNC_KEY, String(enabled));
}

/**
 * Check if auto-pull from Google Sheets is enabled (reflects sheet edits in the app)
 */
export function getStoredAutoPullEnabled(): boolean {
  const val = localStorage.getItem(GOOGLE_SHEETS_AUTO_PULL_KEY);
  if (val !== null) {
    return val === 'true';
  }
  // Default to true for live two-way sync
  return true;
}

/**
 * Save auto-pull preference
 */
export function saveStoredAutoPullEnabled(enabled: boolean): void {
  localStorage.setItem(GOOGLE_SHEETS_AUTO_PULL_KEY, String(enabled));
}

/**
 * Get stored last pull timestamp
 */
export function getStoredLastPull(): string | null {
  return localStorage.getItem(GOOGLE_SHEETS_LAST_PULL_KEY);
}

/**
 * Save last pull timestamp
 */
export function setStoredLastPull(timestamp: string): void {
  localStorage.setItem(GOOGLE_SHEETS_LAST_PULL_KEY, timestamp);
}

/**
 * Check whether any cloud database credentials (API key, script URL, spreadsheet ID) are configured
 */
export function isCloudConfigured(): boolean {
  const url = getStoredSheetsUrl();
  const apiKey = getStoredApiKey();
  const spreadsheetId = getStoredSpreadsheetId();
  const mode = getStoredSyncMode();
  return Boolean(url || (apiKey && spreadsheetId) || apiKey || mode === 'simulator');
}

/**
 * Check if the user has an active cloud database configured
 */
export function hasConnectedCloudDatabase(): boolean {
  const mode = getStoredSyncMode();
  if (mode === 'simulator') return true;
  const hasUrl = Boolean(getStoredSheetsUrl());
  const hasApiKey = Boolean(getStoredApiKey() && getStoredSpreadsheetId());
  if (mode === 'apikey') return hasApiKey || hasUrl;
  return hasUrl || hasApiKey;
}

/**
 * Unified Auto-Sync: Automatically syncs tasks and notes to the user's connected Google Sheet / Cloud Database
 */
export async function autoSyncDatabaseToCloud(
  tasks: HRTask[],
  notes: KeepNote[]
): Promise<GoogleSheetsSyncResult> {
  const mode = getStoredSyncMode();
  const sheetsUrl = getStoredSheetsUrl();
  const apiKey = getStoredApiKey();
  const spreadsheetId = getStoredSpreadsheetId();

  if (mode === 'simulator') {
    return await simulatedPushToSheet(tasks, notes);
  }

  // If user has Apps Script Web App URL (in either mode), push directly to their Google Sheet
  if (sheetsUrl) {
    return await pushDatabaseToGoogleSheet(sheetsUrl, tasks, notes);
  }

  // If user has API Key & Spreadsheet ID but hasn't entered Web App URL yet:
  if (apiKey && spreadsheetId) {
    // Save to local cloud cache so data is safely preserved
    const cacheRes = await simulatedPushToSheet(tasks, notes);
    return {
      success: true,
      message: `Auto-cached ${tasks.length} tasks and ${notes.length} notes. (Add Web App Script URL for direct sheet push)`,
      tasksCount: tasks.length,
      notesCount: notes.length,
      timestamp: cacheRes.timestamp
    };
  }

  return {
    success: false,
    message: 'No active Google Sheet database connection found.',
    errorCategory: 'other'
  };
}

/**
 * Unified Auto-Pull: Fetches latest tasks and notes from Google Sheet to reflect any spreadsheet changes in the app
 */
export async function autoPullDatabaseFromCloud(): Promise<GoogleSheetsPullResult> {
  const mode = getStoredSyncMode();
  const sheetsUrl = getStoredSheetsUrl();
  const apiKey = getStoredApiKey();
  const spreadsheetId = getStoredSpreadsheetId();

  if (mode === 'simulator') {
    return await simulatedPullFromSheet();
  }

  // If user has Apps Script Web App URL, pull directly from Apps Script
  if (sheetsUrl) {
    return await pullDatabaseFromGoogleSheet(sheetsUrl);
  }

  // If user has API Key and Spreadsheet ID, pull via Google Sheets API v4
  if (apiKey && spreadsheetId) {
    return await pullFromGoogleSheetsApi(spreadsheetId, apiKey);
  }

  return {
    success: false,
    message: 'No active Google Sheet database connection found.',
    errorCategory: 'other'
  };
}

/**
 * Compare current app tasks & notes with pulled data to detect if changes were made in Google Sheet
 */
export function hasGoogleSheetDataChanged(
  currentTasks: HRTask[],
  pulledTasks: HRTask[],
  currentNotes: KeepNote[],
  pulledNotes: KeepNote[]
): boolean {
  if (currentTasks.length !== pulledTasks.length) return true;
  if (currentNotes.length !== pulledNotes.length) return true;

  // Check tasks for modifications (title, status, priority, category, notes, time, date, followUpDate, assignedTo, description)
  for (let i = 0; i < pulledTasks.length; i++) {
    const pt = pulledTasks[i];
    // Find corresponding task by ID, by row index if equal length, or by title
    const ct = currentTasks.find(t => t.id === pt.id) ||
               (currentTasks.length === pulledTasks.length ? currentTasks[i] : undefined) ||
               currentTasks.find(t => t.title.trim().toLowerCase() === pt.title.trim().toLowerCase() && t.date === pt.date) ||
               currentTasks.find(t => t.title.trim().toLowerCase() === pt.title.trim().toLowerCase());
    if (!ct) return true;
    if (
      ct.title.trim() !== pt.title.trim() ||
      ct.status !== pt.status ||
      ct.priority !== pt.priority ||
      ct.category !== pt.category ||
      ct.time !== pt.time ||
      (ct.date || '') !== (pt.date || '') ||
      (ct.assignedTo || '').trim() !== (pt.assignedTo || '').trim() ||
      (ct.notes || '').trim() !== (pt.notes || '').trim() ||
      (ct.followUpDate || '') !== (pt.followUpDate || '') ||
      (ct.description || '').trim() !== (pt.description || '').trim()
    ) {
      return true;
    }
  }

  // Check notes for modifications
  for (let j = 0; j < pulledNotes.length; j++) {
    const pn = pulledNotes[j];
    const cn = currentNotes.find(n => n.id === pn.id) ||
               (currentNotes.length === pulledNotes.length ? currentNotes[j] : undefined) ||
               currentNotes.find(n => n.title.trim().toLowerCase() === pn.title.trim().toLowerCase());
    if (!cn) return true;
    if (
      cn.title.trim() !== pn.title.trim() ||
      cn.content.trim() !== pn.content.trim() ||
      Boolean(cn.isPinned) !== Boolean(pn.isPinned) ||
      cn.color !== pn.color ||
      (cn.checklistItems?.length || 0) !== (pn.checklistItems?.length || 0)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Reconciles incoming pulled tasks with existing local tasks to preserve stable IDs,
 * keeping table selections, open modal dialogs, and React keys stable while updating values.
 */
export function reconcilePulledTasks(currentTasks: HRTask[], incomingTasks: HRTask[]): HRTask[] {
  return incomingTasks.map((inc, index) => {
    // 1. Direct ID match
    const matchById = currentTasks.find(c => c.id === inc.id);
    if (matchById) {
      return {
        ...inc,
        id: matchById.id,
        createdAt: matchById.createdAt,
        updatedAt: Date.now()
      };
    }

    // 2. Exact match by title and date
    const matchByTitleDate = currentTasks.find(c => c.title.trim().toLowerCase() === inc.title.trim().toLowerCase() && c.date === inc.date);
    if (matchByTitleDate) {
      return {
        ...inc,
        id: matchByTitleDate.id,
        createdAt: matchByTitleDate.createdAt,
        updatedAt: Date.now()
      };
    }

    // 3. Positional match if count aligns
    if (currentTasks.length === incomingTasks.length && currentTasks[index]) {
      return {
        ...inc,
        id: currentTasks[index].id,
        createdAt: currentTasks[index].createdAt,
        updatedAt: Date.now()
      };
    }

    // 4. Match by title alone
    const matchByTitle = currentTasks.find(c => c.title.trim().toLowerCase() === inc.title.trim().toLowerCase());
    if (matchByTitle) {
      return {
        ...inc,
        id: matchByTitle.id,
        createdAt: matchByTitle.createdAt,
        updatedAt: Date.now()
      };
    }

    // 5. Newly added row from Google Sheet
    return inc;
  });
}

/**
 * Reconciles incoming pulled notes with existing local notes
 */
export function reconcilePulledNotes(currentNotes: KeepNote[], incomingNotes: KeepNote[]): KeepNote[] {
  return incomingNotes.map((inc, index) => {
    const matchById = currentNotes.find(c => c.id === inc.id);
    if (matchById) {
      return {
        ...inc,
        id: matchById.id,
        createdAt: matchById.createdAt,
        updatedAt: Date.now()
      };
    }
    const matchByTitle = currentNotes.find(c => c.title.trim().toLowerCase() === inc.title.trim().toLowerCase());
    if (matchByTitle) {
      return {
        ...inc,
        id: matchByTitle.id,
        createdAt: matchByTitle.createdAt,
        updatedAt: Date.now()
      };
    }
    if (currentNotes.length === incomingNotes.length && currentNotes[index]) {
      return {
        ...inc,
        id: currentNotes[index].id,
        createdAt: currentNotes[index].createdAt,
        updatedAt: Date.now()
      };
    }
    return inc;
  });
}

/**
 * Simulated / Demo Cloud Sheet Database Push (works offline and instantly with zero 404s)
 */
export async function simulatedPushToSheet(
  tasks: HRTask[],
  notes: KeepNote[]
): Promise<GoogleSheetsSyncResult> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 400));
  try {
    const payload = {
      tasks,
      notes,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(SIMULATED_GOOGLE_SHEET_KEY, JSON.stringify(payload));
    const nowIso = new Date().toISOString();
    setStoredLastSync(nowIso);
    return {
      success: true,
      message: `Demo Cloud Sheet: Saved ${tasks.length} tasks and ${notes.length} notes successfully!`,
      tasksCount: tasks.length,
      notesCount: notes.length,
      timestamp: nowIso
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to save to Simulated Cloud Sheet.',
      errorCategory: 'other'
    };
  }
}

/**
 * Simulated / Demo Cloud Sheet Database Pull
 */
export async function simulatedPullFromSheet(): Promise<GoogleSheetsPullResult> {
  await new Promise(resolve => setTimeout(resolve, 400));
  try {
    const raw = localStorage.getItem(SIMULATED_GOOGLE_SHEET_KEY);
    if (!raw) {
      return {
        success: false,
        message: 'No saved data in Demo Cloud Sheet yet. Please click "Push Data to Sheet" first to save your data.',
        errorCategory: 'other'
      };
    }
    const parsed = JSON.parse(raw);
    const tasks: HRTask[] = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const notes: KeepNote[] = Array.isArray(parsed.notes) ? parsed.notes : [];
    const nowIso = new Date().toISOString();
    setStoredLastSync(nowIso);
    return {
      success: true,
      message: `Demo Cloud Sheet: Retrieved ${tasks.length} tasks and ${notes.length} notes.`,
      tasks,
      notes,
      timestamp: nowIso
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to load from Demo Cloud Sheet.',
      errorCategory: 'other'
    };
  }
}

/**
 * Pull both Tasks and Notes from Google Sheets using Google Sheets API v4
 */
export async function pullFromGoogleSheetsApi(
  spreadsheetIdInput: string,
  apiKeyInput: string
): Promise<GoogleSheetsPullResult> {
  const sheetId = extractSpreadsheetId(spreadsheetIdInput);
  const apiKey = apiKeyInput.trim();

  if (!sheetId) {
    return {
      success: false,
      message: 'Please enter a valid Google Spreadsheet ID or full document URL.',
      errorCategory: 'invalid_url'
    };
  }

  if (!apiKey) {
    return {
      success: false,
      message: 'Please enter your Google Cloud API Key with Google Sheets API enabled.',
      errorCategory: 'invalid_url'
    };
  }

  try {
    // 1. Fetch metadata or sheet names (always fresh, no-store)
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title&key=${apiKey}&_t=${Date.now()}`;
    const metaRes = await fetch(metaUrl, { cache: 'no-store' });

    if (metaRes.status === 404) {
      return {
        success: false,
        is404Error: true,
        errorCategory: '404_not_found',
        message: 'Google Sheets API returned HTTP 404 (Not Found). Possible reasons:\n1. Spreadsheet ID is incorrect.\n2. The Google Sheet is not shared with "Anyone with the link can view". In Google Sheets, click Share (top-right) → General access → Anyone with the link.'
      };
    }

    if (metaRes.status === 403) {
      return {
        success: false,
        errorCategory: 'permission_denied',
        message: 'Google Sheets API returned HTTP 403 (Permission Denied / Forbidden). Please ensure:\n1. The Google Sheets API is enabled in Google Cloud Console.\n2. Your API key has no restrictive HTTP referrers that block web app calls.\n3. The spreadsheet is shared with "Anyone with the link can view".'
      };
    }

    if (!metaRes.ok) {
      return {
        success: false,
        errorCategory: 'other',
        message: `Google Sheets API returned HTTP ${metaRes.status}: ${metaRes.statusText}`
      };
    }

    const metaData = await metaRes.json();
    const sheetTitles: string[] = (metaData.sheets || []).map((s: any) => s.properties?.title || '');

    // Identify tasks and notes sheets
    const taskSheetName = sheetTitles.find(t => t.toLowerCase() === 'hr tasks' || t.toLowerCase() === 'tasks') || sheetTitles[0] || 'Sheet1';
    const notesSheetName = sheetTitles.find(t => t.toLowerCase() === 'notes' || t.toLowerCase() === 'hr notes' || t.toLowerCase() === 'keep notes');

    // 2. Fetch Tasks values (fresh timestamp, no-store)
    const tasksUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(taskSheetName)}!A1:Z1000?key=${apiKey}&_t=${Date.now()}`;
    const tasksRes = await fetch(tasksUrl, { cache: 'no-store' });
    const tasksData = tasksRes.ok ? await tasksRes.json() : { values: [] };
    const taskRows: any[][] = tasksData.values || [];

    const parsedTasks: HRTask[] = [];
    if (taskRows.length > 1) {
      const headers = taskRows[0].map(h => String(h).toLowerCase().trim());
      const colDate = headers.indexOf('date') !== -1 ? headers.indexOf('date') : 0;
      const colTime = headers.indexOf('time') !== -1 ? headers.indexOf('time') : 1;
      const colTitle = headers.indexOf('task / activity') !== -1 ? headers.indexOf('task / activity') : (headers.indexOf('task') !== -1 ? headers.indexOf('task') : 2);
      const colDesc = headers.indexOf('description') !== -1 ? headers.indexOf('description') : 3;
      const colCat = headers.indexOf('category') !== -1 ? headers.indexOf('category') : 4;
      const colPrio = headers.indexOf('priority') !== -1 ? headers.indexOf('priority') : 5;
      const colStat = headers.indexOf('status') !== -1 ? headers.indexOf('status') : 6;
      const colAssign = headers.indexOf('assigned to') !== -1 ? headers.indexOf('assigned to') : 7;
      const colNotes = headers.indexOf('notes') !== -1 ? headers.indexOf('notes') : 8;
      const colFollow = headers.indexOf('follow-up date') !== -1 ? headers.indexOf('follow-up date') : 9;

      for (let i = 1; i < taskRows.length; i++) {
        const row = taskRows[i];
        const titleVal = String(row[colTitle] || '').trim();
        if (!titleVal) continue;

        parsedTasks.push({
          id: `task-api-${i}`,
          date: String(row[colDate] || new Date().toISOString().split('T')[0]),
          time: String(row[colTime] || '09:00 AM'),
          title: titleVal,
          description: String(row[colDesc] || ''),
          category: String(row[colCat] || 'HR Operations'),
          priority: (String(row[colPrio] || 'Medium')) as any,
          status: (String(row[colStat] || 'Pending')) as any,
          assignedTo: String(row[colAssign] || 'Me'),
          notes: String(row[colNotes] || ''),
          followUpDate: String(row[colFollow] || ''),
          createdAt: Date.now() - (taskRows.length - i) * 60000,
          updatedAt: Date.now()
        });
      }
    }

    // 3. Fetch Notes values if sheet exists (fresh timestamp, no-store)
    const parsedNotes: KeepNote[] = [];
    if (notesSheetName) {
      const notesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(notesSheetName)}!A1:Z1000?key=${apiKey}&_t=${Date.now()}`;
      const notesRes = await fetch(notesUrl, { cache: 'no-store' });
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        const noteRows: any[][] = notesData.values || [];
        if (noteRows.length > 1) {
          const nHeaders = noteRows[0].map(h => String(h).toLowerCase().trim());
          const colNTitle = nHeaders.indexOf('note title') !== -1 ? nHeaders.indexOf('note title') : (nHeaders.indexOf('title') !== -1 ? nHeaders.indexOf('title') : 0);
          const colNContent = nHeaders.indexOf('content / details') !== -1 ? nHeaders.indexOf('content / details') : (nHeaders.indexOf('content') !== -1 ? nHeaders.indexOf('content') : 1);
          const colNType = nHeaders.indexOf('type') !== -1 ? nHeaders.indexOf('type') : 2;
          const colNItems = nHeaders.indexOf('checklist items') !== -1 ? nHeaders.indexOf('checklist items') : 3;
          const colNTags = nHeaders.indexOf('tags / category') !== -1 ? nHeaders.indexOf('tags / category') : (nHeaders.indexOf('tags') !== -1 ? nHeaders.indexOf('tags') : 5);
          const colNPinned = nHeaders.indexOf('pinned') !== -1 ? nHeaders.indexOf('pinned') : 6;
          const colNColor = nHeaders.indexOf('color') !== -1 ? nHeaders.indexOf('color') : 7;

          for (let j = 1; j < noteRows.length; j++) {
            const nRow = noteRows[j];
            const nTitle = String(nRow[colNTitle] || '').trim();
            const nContent = String(nRow[colNContent] || '').trim();
            const nChecklistStr = String(nRow[colNItems] || '').trim();
            const nType = String(nRow[colNType] || '').toLowerCase();

            if (!nTitle && !nContent && !nChecklistStr) continue;

            const isChecklist = nType.includes('check') || (nChecklistStr !== '' && nChecklistStr !== '—');
            const checklistItems: any[] = [];

            if (nChecklistStr && nChecklistStr !== '—') {
              const lines = nChecklistStr.split('\n');
              lines.forEach((line, k) => {
                const tLine = line.trim();
                if (!tLine) return;
                const isDone = tLine.startsWith('[✓]') || tLine.startsWith('[x]') || tLine.startsWith('[X]');
                const text = tLine.replace(/^\[[✓xX\s]\]\s*/, '').trim();
                checklistItems.push({
                  id: `item-api-${j}-${k}`,
                  text: text || tLine,
                  completed: isDone
                });
              });
            }

            const rawTags = String(nRow[colNTags] || '').trim();
            const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : [];
            const rawPin = String(nRow[colNPinned] || '').toLowerCase();
            const isPinned = rawPin === 'yes' || rawPin === 'true' || rawPin === '1';
            const colorVal = String(nRow[colNColor] || 'default').toLowerCase().trim();

            parsedNotes.push({
              id: `keep-api-${Date.now()}-${j}`,
              title: nTitle || 'Imported Note',
              content: nContent,
              isChecklist: isChecklist && checklistItems.length > 0,
              checklistItems,
              color: colorVal as any,
              isPinned,
              tags,
              createdAt: Date.now() - (noteRows.length - j) * 60000,
              updatedAt: Date.now()
            });
          }
        }
      }
    }

    const nowIso = new Date().toISOString();
    setStoredLastSync(nowIso);

    return {
      success: true,
      message: `Successfully loaded ${parsedTasks.length} tasks and ${parsedNotes.length} notes directly from Google Sheets API!`,
      tasks: parsedTasks,
      notes: parsedNotes,
      timestamp: nowIso
    };
  } catch (err: any) {
    const errMsg = err?.message || 'Failed to connect to Google Sheets API';
    if (errMsg.includes('404')) {
      return {
        success: false,
        is404Error: true,
        errorCategory: '404_not_found',
        message: 'Google Sheets API returned HTTP 404 (Not Found). Ensure the spreadsheet exists and is shared with "Anyone with the link can view".'
      };
    }
    return {
      success: false,
      errorCategory: 'cors_network',
      message: errMsg || 'Network or CORS error connecting to Google Sheets API.'
    };
  }
}

/**
 * Push both Tasks and Notes to the Google Sheet database
 */
export async function pushDatabaseToGoogleSheet(
  url: string,
  tasks: HRTask[],
  notes: KeepNote[]
): Promise<GoogleSheetsSyncResult> {
  const validation = normalizeAndValidateScriptUrl(url);
  if (!validation.valid) {
    return {
      success: false,
      is404Error: validation.isSpreadsheetUrl,
      errorCategory: validation.isSpreadsheetUrl ? 'invalid_url' : 'invalid_url',
      message: validation.error || 'Invalid Google Apps Script Web App URL.',
    };
  }

  const cleanUrl = validation.cleanUrl;

  const payload = {
    action: 'save_database',
    tasks,
    notes,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (response.status === 404) {
      return {
        success: false,
        is404Error: true,
        errorCategory: '404_not_found',
        message: 'Google Apps Script returned HTTP 404 (Not Found). This happens when the Web App deployment is not found or was not published with "Who has access: Anyone". In Apps Script: click Deploy → Manage deployments → edit active deployment, ensure "Who has access" is set to "Anyone", and click Deploy!',
      };
    }

    if (!response.ok && response.status !== 0) {
      return {
        success: false,
        errorCategory: 'other',
        message: `Google Apps Script returned HTTP ${response.status}. Please check your deployment settings.`,
      };
    }

    await response.json().catch(() => null);
    const nowIso = new Date().toISOString();
    setStoredLastSync(nowIso);

    return {
      success: true,
      message: `Successfully synced ${tasks.length} tasks and ${notes.length} notes to your Google Sheet!`,
      tasksCount: tasks.length,
      notesCount: notes.length,
      timestamp: nowIso,
    };
  } catch (err: any) {
    const errMsg = err?.message || 'Failed to connect to Google Sheet';
    if (errMsg.includes('404')) {
      return {
        success: false,
        is404Error: true,
        errorCategory: '404_not_found',
        message: 'Google Apps Script returned HTTP 404 (Not Found). In Apps Script, open Deploy → Manage deployments, ensure the deployment is active, published with "Who has access: Anyone", and ends in /exec.',
      };
    }
    return {
      success: false,
      errorCategory: 'cors_network',
      message: errMsg || 'Failed to connect to Google Sheet. Check your Web App URL and permissions.',
    };
  }
}

/**
 * Pull both Tasks and Notes from the Google Sheet database
 */
export async function pullDatabaseFromGoogleSheet(
  url: string
): Promise<GoogleSheetsPullResult> {
  const validation = normalizeAndValidateScriptUrl(url);
  if (!validation.valid) {
    return {
      success: false,
      is404Error: validation.isSpreadsheetUrl,
      errorCategory: validation.isSpreadsheetUrl ? 'invalid_url' : 'invalid_url',
      message: validation.error || 'Invalid Google Apps Script Web App URL.',
    };
  }

  const cleanUrl = validation.cleanUrl;

  try {
    const separator = cleanUrl.includes('?') ? '&' : '?';
    const fetchUrl = `${cleanUrl}${separator}_t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      cache: 'no-store',
      redirect: 'follow',
    });

    if (response.status === 404) {
      return {
        success: false,
        is404Error: true,
        errorCategory: '404_not_found',
        message: 'Google Apps Script returned HTTP 404 (Not Found). Ensure your Web App is deployed with "Who has access: Anyone" and ends in /exec.',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        errorCategory: 'other',
        message: `Google Apps Script returned HTTP ${response.status}. Check your Web App deployment.`,
      };
    }

    const data = await response.json();
    if (data.status === 'error') {
      return {
        success: false,
        errorCategory: 'other',
        message: data.message || 'Google Sheet returned an error',
      };
    }

    const tasks: HRTask[] = Array.isArray(data.tasks) ? data.tasks : [];
    const notes: KeepNote[] = Array.isArray(data.notes) ? data.notes : [];
    const nowIso = new Date().toISOString();
    setStoredLastSync(nowIso);

    return {
      success: true,
      message: `Successfully loaded ${tasks.length} tasks and ${notes.length} notes from Google Sheet.`,
      tasks,
      notes,
      timestamp: nowIso,
    };
  } catch (err: any) {
    const errMsg = err?.message || 'Failed to fetch data from Google Sheet';
    if (errMsg.includes('404')) {
      return {
        success: false,
        is404Error: true,
        errorCategory: '404_not_found',
        message: 'Google Apps Script returned HTTP 404 (Not Found). Ensure your Web App is deployed with "Who has access: Anyone" and ends in /exec.',
      };
    }
    return {
      success: false,
      errorCategory: 'cors_network',
      message: errMsg || 'Failed to fetch data from Google Sheet. Check URL or sheet deployment.',
    };
  }
}
