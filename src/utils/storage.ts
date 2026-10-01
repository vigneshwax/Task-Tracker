import { HRTask, DailyNoteData } from '../types/hrTask';

export const TASKS_STORAGE_KEY = 'hr_daily_tasks_records_v1';
export const DAILY_NOTE_STORAGE_KEY = 'hr_daily_note_records_v1';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDateCompact(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const month = MONTH_NAMES_SHORT[m - 1] || '';
    const day = String(d).padStart(2, '0');
    return `${day} ${month} ${y}`;
  } catch {
    return dateStr;
  }
}

export interface ParsedTimeResult {
  timeFormatted: string; // e.g. "10:40 AM"
  timeOnly: string;      // e.g. "10:40"
  ampm: 'AM' | 'PM';     // "AM" or "PM"
}

export function parseTimeParts(val: any): ParsedTimeResult {
  if (val === undefined || val === null || val === '') {
    return { timeFormatted: '09:00 AM', timeOnly: '09:00', ampm: 'AM' };
  }

  // Handle Excel numeric serial fraction (e.g. 0.444444 = 10:40 AM, 0.583333 = 02:00 PM)
  if (typeof val === 'number' || (!isNaN(Number(val)) && Number(val) > 0 && Number(val) < 1 && !String(val).includes(':'))) {
    const num = Number(val);
    const totalMinutes = Math.round(num * 24 * 60);
    let h24 = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const ampm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const timeOnly = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    return { timeFormatted: `${timeOnly} ${ampm}`, timeOnly, ampm };
  }

  const raw = String(val).trim();
  if (!raw || raw === '—') {
    return { timeFormatted: '—', timeOnly: '—', ampm: 'AM' };
  }

  // Normalize "A.M." / "P.M." / "am" / "pm" / "a.m." / "p.m."
  let str = raw
    .replace(/a\.m\./gi, 'AM')
    .replace(/p\.m\./gi, 'PM')
    .replace(/\s+/g, ' ')
    .trim();

  // Check if explicit AM or PM exists
  const hasAm = /am/i.test(str);
  const hasPm = /pm/i.test(str);

  // Extract digits (supports "10.40 AM", "10:40 AM", "10.40", "14:00", "10:40:00", "9:30")
  const digitsMatch = str.match(/^(\d{1,2})[.:](\d{2})(?::\d{2})?/);
  if (digitsMatch) {
    let hours = parseInt(digitsMatch[1], 10);
    const minutes = digitsMatch[2];
    let ampm: 'AM' | 'PM' = 'AM';

    if (hasPm) {
      ampm = 'PM';
      if (hours === 0) hours = 12;
      else if (hours > 12) hours = hours % 12;
    } else if (hasAm) {
      ampm = 'AM';
      if (hours === 0) hours = 12;
      else if (hours > 12) hours = hours % 12;
    } else {
      // 24-hour inference
      if (hours >= 12) {
        ampm = 'PM';
        hours = hours % 12 || 12;
      } else {
        ampm = 'AM';
        hours = hours % 12 || 12;
      }
    }

    const timeOnly = `${String(hours).padStart(2, '0')}:${minutes}`;
    return {
      timeFormatted: `${timeOnly} ${ampm}`,
      timeOnly,
      ampm,
    };
  }

  // Check if single hour e.g. "9 AM", "2 PM", "14", "9"
  const singleHourMatch = str.match(/^(\d{1,2})/);
  if (singleHourMatch) {
    let hours = parseInt(singleHourMatch[1], 10);
    let ampm: 'AM' | 'PM' = 'AM';
    if (hasPm) {
      ampm = 'PM';
      if (hours === 0) hours = 12;
      else if (hours > 12) hours = hours % 12;
    } else if (hasAm) {
      ampm = 'AM';
      if (hours === 0) hours = 12;
      else if (hours > 12) hours = hours % 12;
    } else {
      if (hours >= 12) {
        ampm = 'PM';
        hours = hours % 12 || 12;
      } else {
        ampm = 'AM';
        hours = hours % 12 || 12;
      }
    }
    const timeOnly = `${String(hours).padStart(2, '0')}:00`;
    return {
      timeFormatted: `${timeOnly} ${ampm}`,
      timeOnly,
      ampm,
    };
  }

  return { timeFormatted: str, timeOnly: str, ampm: 'AM' };
}

export function formatTimeCompact(timeStr: string): string {
  const parsed = parseTimeParts(timeStr);
  return parsed.timeFormatted;
}

export function timeTo24Hour(timeStr: string): string {
  if (!timeStr) return '';
  const parsed = parseTimeParts(timeStr);
  if (parsed.timeOnly === '—') return '';
  const [hStr, mStr] = parsed.timeOnly.split(':');
  let h = parseInt(hStr, 10);
  if (parsed.ampm === 'PM' && h < 12) h += 12;
  if (parsed.ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${mStr || '00'}`;
}

export function formatDateFriendly(dateStr: string): string {
  return formatDateCompact(dateStr);
}

export function isDateToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

export function isDateOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  return dateStr < getTodayDateString();
}

export function isDateUpcoming(dateStr: string): boolean {
  if (!dateStr) return false;
  return dateStr > getTodayDateString();
}

// Initial realistic sample data based on the prompt's examples
export function getInitialSampleTasks(): HRTask[] {
  const today = getTodayDateString();
  const now = Date.now();
  
  // Create relative dates
  const twoDaysAgoDate = new Date();
  twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
  const twoDaysAgo = twoDaysAgoDate.toISOString().split('T')[0];

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  const nextWeekDate = new Date();
  nextWeekDate.setDate(nextWeekDate.getDate() + 4);
  const nextWeek = nextWeekDate.toISOString().split('T')[0];

  return [
    {
      id: 'task-1',
      date: today,
      time: '09:00 AM',
      title: 'Fabric Sourcing Manager – Resume screening & profile sharing',
      description: 'Shortlist top 5 profiles from LinkedIn Talent Hub; focus on supply chain & textile experience.',
      category: 'Resume Screening',
      priority: 'High',
      status: 'In Progress',
      assignedTo: 'Me',
      notes: 'Hiring manager prefers candidates with international sourcing exposure.',
      followUpDate: today,
      createdAt: now - 3600000 * 5,
      updatedAt: now - 3600000 * 2,
    },
    {
      id: 'task-2',
      date: today,
      time: '10:30 AM',
      title: 'Marketing Consultant – Technical round interview coordination',
      description: 'Coordinate panel availability for technical deep dive and case presentation.',
      category: 'Interview Coordination',
      priority: 'High',
      status: 'Completed',
      assignedTo: 'Me',
      notes: 'Google Meet link shared with Panelist Vikram and Candidate Anita. Calendar invites confirmed.',
      followUpDate: '',
      completedDate: today,
      createdAt: now - 3600000 * 8,
      updatedAt: now - 3600000 * 1,
    },
    {
      id: 'task-3',
      date: today,
      time: '11:45 AM',
      title: 'BGV – Candidate document verification & police clearance check',
      description: 'Follow up on OnGrid portal for address confirmation and previous employer reference relief letter.',
      category: 'BGV',
      priority: 'Medium',
      status: 'Pending',
      assignedTo: 'Me',
      notes: 'Awaiting passport copy and address verification from OnGrid partner portal.',
      followUpDate: today,
      createdAt: now - 3600000 * 6,
      updatedAt: now - 3600000 * 3,
    },
    {
      id: 'task-4',
      date: today,
      time: '02:00 PM',
      title: 'Candidate interview confirmations & prep note dispatch',
      category: 'Candidate Follow-up',
      priority: 'Medium',
      status: 'Completed',
      assignedTo: 'Me',
      notes: '3 candidates for Senior Frontend Role notified regarding design round expectations.',
      followUpDate: tomorrow,
      completedDate: today,
      createdAt: now - 3600000 * 7,
      updatedAt: now - 3600000 * 2,
    },
    {
      id: 'task-5',
      date: today,
      time: '04:00 PM',
      title: 'Recruitment tracker update & hiring manager pipeline briefing',
      category: 'Reporting',
      priority: 'Low',
      status: 'Pending',
      assignedTo: 'Me',
      notes: 'Update open requisitions, interview stages, and time-to-hire metrics in weekly spreadsheet.',
      followUpDate: '',
      createdAt: now - 3600000 * 4,
      updatedAt: now - 3600000 * 4,
    },
    {
      id: 'task-6',
      date: yesterday,
      time: '03:00 PM',
      title: 'Staff Software Engineer – Offer letter preparation & salary structuring',
      category: 'Offer / Joining',
      priority: 'High',
      status: 'Completed',
      assignedTo: 'Me',
      notes: 'Compensation structure signed off by VP Eng. Offer rollout deadline met.',
      followUpDate: '',
      completedDate: yesterday,
      createdAt: now - 86400000,
      updatedAt: now - 3600000 * 20,
    },
    {
      id: 'task-7-hist',
      date: twoDaysAgo,
      time: '11:00 AM',
      title: 'HR Policy handbook revision & maternity leave clause compliance check',
      category: 'Policy & Compliance',
      priority: 'Medium',
      status: 'Completed',
      assignedTo: 'Me',
      notes: 'Reviewed statutory requirements and published version 3.2 to internal intranet.',
      followUpDate: '',
      completedDate: twoDaysAgo,
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
    },
    {
      id: 'task-8',
      date: tomorrow,
      time: '09:30 AM',
      title: 'New hire onboarding session & IT equipment readiness review',
      category: 'HR Operations',
      priority: 'Medium',
      status: 'Pending',
      assignedTo: 'Me',
      notes: '4 joining next Monday. Verify laptop shipping tracking IDs and Okta accounts.',
      followUpDate: tomorrow,
      createdAt: now - 3600000 * 12,
      updatedAt: now - 3600000 * 12,
    },
    {
      id: 'task-9',
      date: nextWeek,
      time: '02:30 PM',
      title: 'Monthly payroll inputs reconciliation & overtime audit',
      category: 'Payroll',
      priority: 'High',
      status: 'Pending',
      assignedTo: 'Me',
      notes: 'Coordinate with finance team for attendance regularization and bonus payouts.',
      followUpDate: nextWeek,
      createdAt: now - 3600000 * 24,
      updatedAt: now - 3600000 * 24,
    }
  ];
}

export function loadTasksFromStorage(): HRTask[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSampleTasks();
      saveTasksToStorage(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const normalized = parsed
        .filter(t => t.id !== 'task-7')
        .map(t => ({
          ...t,
          time: formatTimeCompact(t.time || '09:00 AM'),
          assignedTo: 'Me',
          completedDate: t.status === 'Completed' ? (t.completedDate || t.date) : t.completedDate,
        }));
      saveTasksToStorage(normalized);
      return normalized;
    }
    return getInitialSampleTasks();
  } catch (err) {
    console.error('Failed to load tasks from local storage', err);
    return getInitialSampleTasks();
  }
}

export function saveTasksToStorage(tasks: HRTask[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to local storage', err);
  }
}

export function loadDailyNote(): DailyNoteData {
  const today = getTodayDateString();
  const defaultNote: DailyNoteData = {
    focusGoal: 'Screen 15 Fabric Sourcing candidates & finalize Marketing consultant panel round',
    content: `### 🎯 Morning Standup Notes
- Coordinate with hiring manager on Fabric Sourcing role expectations (min 6 yrs apparel supply chain).
- 2 candidates pending BGV clarification on previous employment relief letters.

### 💡 Candidate Pipeline Feedback
- Vikram gave positive review for Anita (Marketing Consultant) - Recommended for leadership round.
- Offer letter for Rahul (Staff Engineer) accepted; joining scheduled for next Monday.`,
    lastUpdated: today,
  };

  try {
    const raw = localStorage.getItem(DAILY_NOTE_STORAGE_KEY);
    if (!raw) return defaultNote;
    const parsed = JSON.parse(raw);
    return { ...defaultNote, ...parsed };
  } catch {
    return defaultNote;
  }
}

export function saveDailyNote(note: DailyNoteData): void {
  try {
    localStorage.setItem(DAILY_NOTE_STORAGE_KEY, JSON.stringify(note));
  } catch (err) {
    console.error('Failed to save daily note', err);
  }
}
