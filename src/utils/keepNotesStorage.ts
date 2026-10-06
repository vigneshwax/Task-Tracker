import { KeepNote, KeepNoteColor } from '../types/hrTask';

const KEEP_NOTES_STORAGE_KEY = 'hr_google_keep_notes_v1';

export const KEEP_COLOR_MAP: Record<KeepNoteColor, {
  name: string;
  bg: string;
  darkBg: string;
  border: string;
  darkBorder: string;
  swatch: string;
}> = {
  default: {
    name: 'Default',
    bg: 'bg-white',
    darkBg: 'dark:bg-slate-900',
    border: 'border-slate-200/90',
    darkBorder: 'dark:border-slate-800',
    swatch: 'bg-white dark:bg-slate-800 border-slate-300',
  },
  sand: {
    name: 'Amber',
    bg: 'bg-amber-50/90',
    darkBg: 'dark:bg-amber-950/40',
    border: 'border-amber-200',
    darkBorder: 'dark:border-amber-800/60',
    swatch: 'bg-amber-200 border-amber-300',
  },
  peach: {
    name: 'Orange',
    bg: 'bg-orange-50/90',
    darkBg: 'dark:bg-orange-950/40',
    border: 'border-orange-200',
    darkBorder: 'dark:border-orange-800/60',
    swatch: 'bg-orange-200 border-orange-300',
  },
  coral: {
    name: 'Coral',
    bg: 'bg-rose-50/90',
    darkBg: 'dark:bg-rose-950/40',
    border: 'border-rose-200',
    darkBorder: 'dark:border-rose-800/60',
    swatch: 'bg-rose-200 border-rose-300',
  },
  mint: {
    name: 'Mint',
    bg: 'bg-emerald-50/90',
    darkBg: 'dark:bg-emerald-950/40',
    border: 'border-emerald-200',
    darkBorder: 'dark:border-emerald-800/60',
    swatch: 'bg-emerald-200 border-emerald-300',
  },
  sage: {
    name: 'Teal',
    bg: 'bg-teal-50/90',
    darkBg: 'dark:bg-teal-950/40',
    border: 'border-teal-200',
    darkBorder: 'dark:border-teal-800/60',
    swatch: 'bg-teal-200 border-teal-300',
  },
  fog: {
    name: 'Sky Blue',
    bg: 'bg-sky-50/90',
    darkBg: 'dark:bg-sky-950/40',
    border: 'border-sky-200',
    darkBorder: 'dark:border-sky-800/60',
    swatch: 'bg-sky-200 border-sky-300',
  },
  storm: {
    name: 'Indigo',
    bg: 'bg-indigo-50/90',
    darkBg: 'dark:bg-indigo-950/40',
    border: 'border-indigo-200',
    darkBorder: 'dark:border-indigo-800/60',
    swatch: 'bg-indigo-200 border-indigo-300',
  },
  dusk: {
    name: 'Purple',
    bg: 'bg-purple-50/90',
    darkBg: 'dark:bg-purple-950/40',
    border: 'border-purple-200',
    darkBorder: 'dark:border-purple-800/60',
    swatch: 'bg-purple-200 border-purple-300',
  },
  blossom: {
    name: 'Pink',
    bg: 'bg-pink-50/90',
    darkBg: 'dark:bg-pink-950/40',
    border: 'border-pink-200',
    darkBorder: 'dark:border-pink-800/60',
    swatch: 'bg-pink-200 border-pink-300',
  },
  clay: {
    name: 'Warm Slate',
    bg: 'bg-stone-50/90',
    darkBg: 'dark:bg-stone-900/50',
    border: 'border-stone-200',
    darkBorder: 'dark:border-stone-800/60',
    swatch: 'bg-stone-300 border-stone-400',
  },
};

export const INITIAL_SAMPLE_KEEP_NOTES: KeepNote[] = [
  {
    id: 'keep-1',
    title: 'Candidate Screening Quick Checklist',
    content: '',
    isChecklist: true,
    checklistItems: [
      { id: 'c1', text: 'Confirm exact notice period (30 vs 60 days)', completed: true },
      { id: 'c2', text: 'Verify current in-hand vs expected CTC', completed: true },
      { id: 'c3', text: 'Ask about willingness for hybrid workstation (Bangalore office)', completed: false },
      { id: 'c4', text: 'Confirm previous organization resignation copy / offer letter', completed: false },
      { id: 'c5', text: 'Initiate background verification check with reference', completed: false },
    ],
    color: 'sand',
    isPinned: true,
    tags: ['Recruitment', 'Screening'],
    createdAt: Date.now() - 3600000 * 24 * 2,
    updatedAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'keep-2',
    title: 'Senior Merchandiser - Candidate Shortlist',
    content: '1. Pushpa: 6 yrs experience in garment export, ready to join in 15 days.\n2. Viji: Strong buying house background, asking 7.2 LPA.\n3. Follow up with VP of Operations regarding final panel interview slot.',
    isChecklist: false,
    checklistItems: [],
    color: 'mint',
    isPinned: true,
    tags: ['Hiring', 'Merchandising'],
    createdAt: Date.now() - 3600000 * 20,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'keep-3',
    title: 'Vendor Staffing Rates & Contacts',
    content: 'Randstad staffing agency contact: Deepa R. (email: deepa@randstad.partner)\nStandard fee: 8.33% with 90-day replacement warranty.\nPace Active point of contact: 9791836166.',
    isChecklist: false,
    checklistItems: [],
    color: 'fog',
    isPinned: false,
    tags: ['Vendors', 'Contacts'],
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 12,
  },
  {
    id: 'keep-4',
    title: 'Behavioral Questions for HRBP Interview',
    content: '',
    isChecklist: true,
    checklistItems: [
      { id: 'q1', text: 'Tell me about a high-conflict salary negotiation you managed.', completed: true },
      { id: 'q2', text: 'How do you convince key talent not to take a competing counter-offer?', completed: false },
      { id: 'q3', text: 'Walk through your onboarding workflow for engineering leads.', completed: false },
    ],
    color: 'dusk',
    isPinned: false,
    tags: ['Interview', 'Questions'],
    createdAt: Date.now() - 3600000 * 30,
    updatedAt: Date.now() - 3600000 * 10,
  },
  {
    id: 'keep-5',
    title: 'Accounts Executive Offer Details',
    content: 'Candidate: K Govind Reddy (9063020840)\nOffered CTC: 4.8 LPA\nTarget DOJ: Oct 15th\nBGV Status: Documents verified, pending previous employer verification check.',
    isChecklist: false,
    checklistItems: [],
    color: 'peach',
    isPinned: false,
    tags: ['Offers', 'Accounts'],
    createdAt: Date.now() - 3600000 * 15,
    updatedAt: Date.now() - 3600000 * 1,
  },
];

export function loadKeepNotesFromStorage(): KeepNote[] {
  try {
    const raw = localStorage.getItem(KEEP_NOTES_STORAGE_KEY);
    if (!raw) {
      return INITIAL_SAMPLE_KEEP_NOTES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_SAMPLE_KEEP_NOTES;
  } catch (err) {
    console.error('Failed to load Keep notes', err);
    return INITIAL_SAMPLE_KEEP_NOTES;
  }
}

export function saveKeepNotesToStorage(notes: KeepNote[]): void {
  try {
    localStorage.setItem(KEEP_NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save Keep notes', err);
  }
}
