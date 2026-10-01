export interface CategoryConfig {
  name: string;
  color: string; // hex or tailwind badge style
  accentBorder: string;
  pillBg: string;
  pillText: string;
}

export const DEFAULT_HR_CATEGORIES: CategoryConfig[] = [
  { name: 'Recruitment', color: '#6366f1', accentBorder: 'border-indigo-200', pillBg: 'bg-indigo-50', pillText: 'text-indigo-700' },
  { name: 'Resume Screening', color: '#0ea5e9', accentBorder: 'border-sky-200', pillBg: 'bg-sky-50', pillText: 'text-sky-700' },
  { name: 'Interview Coordination', color: '#8b5cf6', accentBorder: 'border-purple-200', pillBg: 'bg-purple-50', pillText: 'text-purple-700' },
  { name: 'Candidate Follow-up', color: '#ec4899', accentBorder: 'border-pink-200', pillBg: 'bg-pink-50', pillText: 'text-pink-700' },
  { name: 'BGV', color: '#f59e0b', accentBorder: 'border-amber-200', pillBg: 'bg-amber-50', pillText: 'text-amber-700' },
  { name: 'Offer / Joining', color: '#10b981', accentBorder: 'border-emerald-200', pillBg: 'bg-emerald-50', pillText: 'text-emerald-700' },
  { name: 'HR Operations', color: '#64748b', accentBorder: 'border-slate-200', pillBg: 'bg-slate-50', pillText: 'text-slate-700' },
  { name: 'Payroll', color: '#059669', accentBorder: 'border-teal-200', pillBg: 'bg-teal-50', pillText: 'text-teal-700' },
  { name: 'Employee Relations', color: '#d97706', accentBorder: 'border-orange-200', pillBg: 'bg-orange-50', pillText: 'text-orange-700' },
  { name: 'Documentation', color: '#3b82f6', accentBorder: 'border-blue-200', pillBg: 'bg-blue-50', pillText: 'text-blue-700' },
  { name: 'Reporting', color: '#475569', accentBorder: 'border-zinc-200', pillBg: 'bg-zinc-50', pillText: 'text-zinc-700' },
  { name: 'Other', color: '#71717a', accentBorder: 'border-neutral-200', pillBg: 'bg-neutral-50', pillText: 'text-neutral-700' },
];

export const CATEGORY_STORAGE_KEY = 'hr_tracker_custom_categories_v1';

export function getStoredCategories(): string[] {
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) return DEFAULT_HR_CATEGORIES.map(c => c.name);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load categories', e);
  }
  return DEFAULT_HR_CATEGORIES.map(c => c.name);
}

export function saveStoredCategories(categories: string[]): void {
  try {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories', e);
  }
}

export function getCategoryStyles(categoryName: string) {
  const found = DEFAULT_HR_CATEGORIES.find(
    c => c.name.toLowerCase() === categoryName.trim().toLowerCase()
  );
  if (found) return found;

  // Stable pseudo-random pastel for custom categories
  const hues = [
    { color: '#8b5cf6', accentBorder: 'border-purple-200', pillBg: 'bg-purple-50', pillText: 'text-purple-700' },
    { color: '#0ea5e9', accentBorder: 'border-sky-200', pillBg: 'bg-sky-50', pillText: 'text-sky-700' },
    { color: '#10b981', accentBorder: 'border-emerald-200', pillBg: 'bg-emerald-50', pillText: 'text-emerald-700' },
    { color: '#f59e0b', accentBorder: 'border-amber-200', pillBg: 'bg-amber-50', pillText: 'text-amber-700' },
    { color: '#ec4899', accentBorder: 'border-pink-200', pillBg: 'bg-pink-50', pillText: 'text-pink-700' },
    { color: '#6366f1', accentBorder: 'border-indigo-200', pillBg: 'bg-indigo-50', pillText: 'text-indigo-700' },
  ];
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const picked = hues[Math.abs(hash) % hues.length];
  return {
    name: categoryName,
    ...picked,
  };
}
