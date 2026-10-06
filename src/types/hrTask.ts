export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface HRTask {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm or HH:mm AM/PM (e.g. "09:30 AM" or "14:00")
  title: string; // Task / Activity
  description?: string; // Task details/description
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
  notes: string;
  followUpDate: string; // YYYY-MM-DD or ""
  completedDate?: string; // YYYY-MM-DD when marked completed
  createdAt: number;
  updatedAt: number;
}

export type ViewMode = 'dashboard' | 'list' | 'kanban' | 'calendar' | 'analytics' | 'daily-note' | 'notes' | 'settings';

export interface UserProfileSettings {
  name: string;
  role: string;
  department: string;
  email: string;
  workHours: string;
  defaultPriority: TaskPriority;
  defaultCategory: string;
  defaultDateFilter?: 'today' | 'all';
}

export interface TaskFilterState {
  search: string;
  dateRange: 'all' | 'today' | 'tomorrow' | 'this-week' | 'overdue' | 'custom' | 'specific-date';
  specificDate?: string;
  customDateStart?: string;
  customDateEnd?: string;
  status: TaskStatus | 'All';
  priority: TaskPriority | 'All';
  category: string | 'All';
  assignedTo: string | 'All';
  hasFollowUpOnly: boolean;
  followUpFilter: 'all' | 'today' | 'overdue' | 'upcoming';
  completionFilter?: 'all' | 'completed' | 'pending';
}

export interface CategoryMeta {
  name: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeDot: string;
}

export interface ExcelColumnMapping {
  date: string;
  time: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: string;
  notes: string;
  followUpDate: string;
}

export interface DailyNoteData {
  focusGoal: string;
  content: string;
  lastUpdated: string;
}

export type KeepNoteColor = 
  | 'default'
  | 'sand'
  | 'peach'
  | 'coral'
  | 'mint'
  | 'sage'
  | 'fog'
  | 'storm'
  | 'dusk'
  | 'blossom'
  | 'clay';

export interface KeepChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface KeepNote {
  id: string;
  title: string;
  content: string;
  isChecklist: boolean;
  checklistItems: KeepChecklistItem[];
  color: KeepNoteColor;
  isPinned: boolean;
  isArchived?: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

