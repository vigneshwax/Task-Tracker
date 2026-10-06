import React, { useState, useRef, useEffect, useMemo } from 'react';
import { KeepNote, KeepNoteColor, KeepChecklistItem } from '../types/hrTask';
import { KEEP_COLOR_MAP } from '../utils/keepNotesStorage';
import { 
  Pin, 
  CheckSquare, 
  Palette, 
  Trash2, 
  Search, 
  Plus, 
  X, 
  Tag, 
  Copy, 
  LayoutGrid, 
  List, 
  Check, 
  FileText,
  Sparkles,
  Archive,
  ArrowRight,
  Download,
  Upload
} from 'lucide-react';

interface KeepNotesViewProps {
  notes: KeepNote[];
  onAddNote: (note: Omit<KeepNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (note: KeepNote) => void;
  onDeleteNote: (id: string) => void;
  onRestoreNotes?: (notes: KeepNote[]) => void;
  onClearAllNotes?: () => void;
  showToast: (msg: string) => void;
}

export const KeepNotesView: React.FC<KeepNotesViewProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onRestoreNotes,
  onClearAllNotes,
  showToast,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [selectedColor, setSelectedColor] = useState<KeepNoteColor | 'all'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'pinned' | 'checklists'>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Top Creator State
  const [isCreatingExpanded, setIsCreatingExpanded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newIsChecklist, setNewIsChecklist] = useState(false);
  const [newChecklistItems, setNewChecklistItems] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newChecklistInput, setNewChecklistInput] = useState('');
  const [newColor, setNewColor] = useState<KeepNoteColor>('default');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Edit Note Modal State
  const [editingNote, setEditingNote] = useState<KeepNote | null>(null);
  const [editColorPickerOpen, setEditColorPickerOpen] = useState(false);
  const [editTagInput, setEditTagInput] = useState('');
  const [editNewItemText, setEditNewItemText] = useState('');

  const creatorRef = useRef<HTMLDivElement>(null);
  const newContentRef = useRef<HTMLTextAreaElement>(null);

  // Close creator when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (creatorRef.current && !creatorRef.current.contains(e.target as Node)) {
        if (isCreatingExpanded) {
          handleSaveNewNote();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCreatingExpanded, newTitle, newContent, newChecklistItems, newColor, newIsPinned, newTags, newIsChecklist]);

  // Extract all unique tags across all notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(n => (n.tags || []).forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }, [notes]);

  // Handle Save New Note
  const handleSaveNewNote = () => {
    const hasText = Boolean(newTitle.trim() || newContent.trim());
    const hasItems = newChecklistItems.length > 0;

    if (hasText || hasItems) {
      onAddNote({
        title: newTitle.trim(),
        content: newContent.trim(),
        isChecklist: newIsChecklist,
        checklistItems: newChecklistItems,
        color: newColor,
        isPinned: newIsPinned,
        tags: newTags,
      });
      showToast('Note added');
    }

    // Reset Creator
    setNewTitle('');
    setNewContent('');
    setNewIsChecklist(false);
    setNewChecklistItems([]);
    setNewChecklistInput('');
    setNewColor('default');
    setNewIsPinned(false);
    setNewTags([]);
    setNewTagInput('');
    setIsCreatingExpanded(false);
    setIsColorPickerOpen(false);
  };

  // Add Item to New Checklist
  const handleAddNewChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistInput.trim()) return;
    setNewChecklistItems(prev => [
      ...prev,
      { id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, text: newChecklistInput.trim(), completed: false }
    ]);
    setNewChecklistInput('');
  };

  // Toggle item in New Checklist
  const handleToggleNewItem = (id: string) => {
    setNewChecklistItems(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  // Remove item from New Checklist
  const handleRemoveNewItem = (id: string) => {
    setNewChecklistItems(prev => prev.filter(item => item.id !== id));
  };

  // Add tag to New Note
  const handleAddNewTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && newTagInput.trim()) {
      e.preventDefault();
      const tag = newTagInput.trim().replace(/^#/, '');
      if (tag && !newTags.includes(tag)) {
        setNewTags(prev => [...prev, tag]);
      }
      setNewTagInput('');
    }
  };

  // Quick toggle checkbox directly on card
  const handleToggleCardChecklistItem = (e: React.MouseEvent, note: KeepNote, itemId: string) => {
    e.stopPropagation();
    const updatedItems = note.checklistItems.map(it => 
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );
    onUpdateNote({
      ...note,
      checklistItems: updatedItems,
      updatedAt: Date.now(),
    });
  };

  // Quick toggle pin on card
  const handleTogglePin = (e: React.MouseEvent, note: KeepNote) => {
    e.stopPropagation();
    onUpdateNote({
      ...note,
      isPinned: !note.isPinned,
      updatedAt: Date.now(),
    });
    showToast(note.isPinned ? 'Note unpinned' : 'Note pinned to top');
  };

  // Quick change card color
  const handleChangeCardColor = (e: React.MouseEvent, note: KeepNote, color: KeepNoteColor) => {
    e.stopPropagation();
    onUpdateNote({
      ...note,
      color,
      updatedAt: Date.now(),
    });
  };

  // Duplicate note
  const handleDuplicateNote = (e: React.MouseEvent, note: KeepNote) => {
    e.stopPropagation();
    onAddNote({
      title: note.title ? `${note.title} (Copy)` : 'Copy of note',
      content: note.content,
      isChecklist: note.isChecklist,
      checklistItems: note.checklistItems.map(it => ({ ...it, id: `copy-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` })),
      color: note.color,
      isPinned: false,
      tags: [...note.tags],
    });
    showToast('Note duplicated');
  };

  // Export Standalone Notes Backup (.json)
  const handleExportNotes = () => {
    const dataStr = JSON.stringify({
      app: 'Google Keep Style Standalone Notes',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes,
    }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keep-notes-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${notes.length} notes to backup`);
  };

  // Import Standalone Notes Backup (.json)
  const handleImportNotes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedList = Array.isArray(parsed) 
          ? parsed 
          : (parsed.notes && Array.isArray(parsed.notes) ? parsed.notes : null);
        if (importedList && onRestoreNotes) {
          onRestoreNotes(importedList);
          showToast(`Successfully restored ${importedList.length} notes`);
        } else {
          showToast('Invalid notes backup file');
        }
      } catch (err) {
        showToast('Error reading notes JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Copy note text to clipboard
  const handleCopyNoteContent = (e: React.MouseEvent, note: KeepNote) => {
    e.stopPropagation();
    let text = note.title ? `${note.title}\n\n` : '';
    if (note.isChecklist) {
      text += note.checklistItems.map(it => `[${it.completed ? 'x' : ' '}] ${it.text}`).join('\n');
    } else {
      text += note.content;
    }
    if (note.tags?.length) {
      text += `\n\nLabels: ${note.tags.map(t => `#${t}`).join(' ')}`;
    }
    navigator.clipboard?.writeText(text);
    showToast('Note copied to clipboard');
  };

  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (n.title || '').toLowerCase().includes(q);
        const matchContent = (n.content || '').toLowerCase().includes(q);
        const matchTags = (n.tags || []).some(t => t.toLowerCase().includes(q));
        const matchItems = (n.checklistItems || []).some(it => it.text.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchTags && !matchItems) return false;
      }
      // Tag
      if (selectedTag !== 'All') {
        if (!(n.tags || []).includes(selectedTag)) return false;
      }
      // Color
      if (selectedColor !== 'all') {
        if (n.color !== selectedColor) return false;
      }
      // Filter Mode
      if (filterMode === 'pinned' && !n.isPinned) return false;
      if (filterMode === 'checklists' && !n.isChecklist) return false;

      return true;
    });
  }, [notes, searchQuery, selectedTag, selectedColor, filterMode]);

  const pinnedNotes = useMemo(() => filteredNotes.filter(n => n.isPinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter(n => !n.isPinned), [filteredNotes]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-150">
      
      {/* 1. Header Toolbar (Search, Filter, Layout) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        
        {/* Search Input Box */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, checklists, labels..."
            className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/70"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Options & Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Mode */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({notes.length})
            </button>
            <button
              onClick={() => setFilterMode('pinned')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterMode === 'pinned'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Pinned</span>
            </button>
            <button
              onClick={() => setFilterMode('checklists')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterMode === 'checklists'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare className="w-3 h-3 text-indigo-500" />
              <span>Checklists</span>
            </button>
          </div>

          {/* Grid / List Layout Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setViewLayout('grid')}
              title="Grid view"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewLayout === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewLayout('list')}
              title="List view"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewLayout === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Separate Notes Storage Actions: Export, Import & Clear */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs gap-0.5">
            <button
              type="button"
              onClick={handleExportNotes}
              title="Export Standalone Notes Backup (.json)"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {onRestoreNotes && (
              <label
                title="Restore Standalone Notes (.json)"
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportNotes}
                  className="hidden"
                />
              </label>
            )}

            {onClearAllNotes && notes.length > 0 && (
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(true)}
                title="Clear all notes"
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Filter Chips: Tags and Colors */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Tag Badges Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold uppercase tracking-wider mr-1">
            Tags:
          </span>
          <button
            onClick={() => setSelectedTag('All')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              selectedTag === 'All'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Tags
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? 'All' : tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Color Palette Filter Dots */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-full text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mr-1">
            Colors:
          </span>
          <button
            type="button"
            onClick={() => setSelectedColor('all')}
            title="All colors"
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer ${
              selectedColor === 'all'
                ? 'text-slate-900 dark:text-white font-bold underline'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All
          </button>
          {(Object.keys(KEEP_COLOR_MAP) as KeepNoteColor[]).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(selectedColor === c ? 'all' : c)}
              title={KEEP_COLOR_MAP[c].name}
              className={`w-3.5 h-3.5 rounded-full border cursor-pointer transition-transform hover:scale-125 ${
                KEEP_COLOR_MAP[c].swatch
              } ${selectedColor === c ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* 2. Google Keep Style Note Creator Input */}
      <div className="max-w-xl mx-auto" ref={creatorRef}>
        <div className={`transition-all duration-200 rounded-2xl border shadow-md overflow-hidden ${
          KEEP_COLOR_MAP[newColor].bg
        } ${KEEP_COLOR_MAP[newColor].darkBg} ${KEEP_COLOR_MAP[newColor].border} ${KEEP_COLOR_MAP[newColor].darkBorder}`}>
          
          {!isCreatingExpanded ? (
            /* Collapsed State */
            <div 
              onClick={() => {
                setIsCreatingExpanded(true);
                setTimeout(() => newContentRef.current?.focus(), 50);
              }}
              className="flex items-center justify-between p-3.5 cursor-text text-slate-500 dark:text-slate-400"
            >
              <span className="text-sm font-medium pl-1">Take a note...</span>
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingExpanded(true);
                    setNewIsChecklist(true);
                  }}
                  title="New checklist"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingExpanded(true);
                    setIsColorPickerOpen(true);
                  }}
                  title="Note color"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  <Palette className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Expanded Creator State */
            <div className="p-4 space-y-3">
              
              {/* Title & Pin Icon */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm font-semibold bg-transparent text-slate-900 dark:text-white focus:outline-hidden placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setNewIsPinned(!newIsPinned)}
                  title={newIsPinned ? 'Unpin note' : 'Pin note'}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    newIsPinned 
                      ? 'text-amber-500 bg-amber-100/60 dark:bg-amber-950/40' 
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Pin className={`w-4 h-4 ${newIsPinned ? 'fill-amber-500' : ''}`} />
                </button>
              </div>

              {/* Text Body or Checklist Items */}
              {!newIsChecklist ? (
                <textarea
                  ref={newContentRef}
                  placeholder="Take a note..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  className="w-full text-xs bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none leading-relaxed"
                />
              ) : (
                <div className="space-y-2 text-xs">
                  {newChecklistItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 group">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleNewItem(item.id)}
                        className="rounded accent-indigo-600 cursor-pointer"
                      />
                      <span className={`flex-1 ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {item.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <form onSubmit={handleAddNewChecklistItem} className="flex items-center gap-2 pt-1">
                    <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Add list item (press Enter)..."
                      value={newChecklistInput}
                      onChange={(e) => setNewChecklistInput(e.target.value)}
                      className="w-full text-xs bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </form>
                </div>
              )}

              {/* Tags Display */}
              {newTags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {newTags.map(tag => (
                    <span 
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-black/5 dark:bg-white/10 rounded-full text-slate-700 dark:text-slate-300"
                    >
                      #{tag}
                      <button 
                        type="button" 
                        onClick={() => setNewTags(prev => prev.filter(t => t !== tag))}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Tag Input Field */}
              <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Add label (press Enter)..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddNewTag}
                  className="w-full text-[11px] bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden placeholder:text-slate-400"
                />
              </div>

              {/* Bottom Toolbar & Action Row */}
              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center gap-1">
                  
                  {/* Color Picker Button & Popover */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                      title="Background options"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    >
                      <Palette className="w-4 h-4" />
                    </button>
                    {isColorPickerOpen && (
                      <div className="absolute left-0 bottom-full mb-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 z-20 animate-in fade-in zoom-in-95">
                        {(Object.keys(KEEP_COLOR_MAP) as KeepNoteColor[]).map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setNewColor(c);
                              setIsColorPickerOpen(false);
                            }}
                            title={KEEP_COLOR_MAP[c].name}
                            className={`w-5 h-5 rounded-full border cursor-pointer transition-transform hover:scale-115 ${
                              KEEP_COLOR_MAP[c].swatch
                            } ${newColor === c ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Toggle Checklist Mode Button */}
                  <button
                    type="button"
                    onClick={() => setNewIsChecklist(!newIsChecklist)}
                    title={newIsChecklist ? 'Switch to text note' : 'Switch to checklist'}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      newIsChecklist 
                        ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' 
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>

                </div>

                {/* Close & Save Button */}
                <button
                  type="button"
                  onClick={handleSaveNewNote}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* 3. Empty State if no notes match */}
      {filteredNotes.length === 0 && (
        <div className="text-center py-16 px-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {searchQuery || selectedTag !== 'All' || selectedColor !== 'all' ? 'No notes match your filter' : 'No notes yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {searchQuery || selectedTag !== 'All' || selectedColor !== 'all'
              ? 'Try clearing your search query, color, or selecting "All Tags".'
              : 'Create personal notes, thoughts, reminders, or checklists in Google Keep style.'}
          </p>
        </div>
      )}

      {/* 4. PINNED NOTES SECTION */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              PINNED
            </h4>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-full">
              {pinnedNotes.length}
            </span>
          </div>

          <div className={viewLayout === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" : "space-y-3"}>
            {pinnedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onOpenEdit={() => setEditingNote(note)}
                onTogglePin={(e) => handleTogglePin(e, note)}
                onChangeColor={(e, color) => handleChangeCardColor(e, note, color)}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteNote(note.id);
                  showToast('Note deleted');
                }}
                onDuplicate={(e) => handleDuplicateNote(e, note)}
                onCopy={(e) => handleCopyNoteContent(e, note)}
                onToggleChecklistItem={(e, itemId) => handleToggleCardChecklistItem(e, note, itemId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. OTHER NOTES SECTION */}
      {otherNotes.length > 0 && (
        <div className="space-y-2.5">
          {pinnedNotes.length > 0 && (
            <div className="flex items-center gap-2 px-1 pt-2">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                OTHERS
              </h4>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-full">
                {otherNotes.length}
              </span>
            </div>
          )}

          <div className={viewLayout === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" : "space-y-3"}>
            {otherNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onOpenEdit={() => setEditingNote(note)}
                onTogglePin={(e) => handleTogglePin(e, note)}
                onChangeColor={(e, color) => handleChangeCardColor(e, note, color)}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteNote(note.id);
                  showToast('Note deleted');
                }}
                onDuplicate={(e) => handleDuplicateNote(e, note)}
                onCopy={(e) => handleCopyNoteContent(e, note)}
                onToggleChecklistItem={(e, itemId) => handleToggleCardChecklistItem(e, note, itemId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 6. EDIT NOTE MODAL */}
      {editingNote && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => {
            onUpdateNote(editingNote);
            setEditingNote(null);
          }}
        >
          <div 
            className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-150 ${
              KEEP_COLOR_MAP[editingNote.color].bg
            } ${KEEP_COLOR_MAP[editingNote.color].darkBg} ${KEEP_COLOR_MAP[editingNote.color].border} ${KEEP_COLOR_MAP[editingNote.color].darkBorder}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 space-y-3.5">
              
              {/* Modal Title + Pin */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Title"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full text-base font-bold bg-transparent text-slate-900 dark:text-white focus:outline-hidden placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setEditingNote({ ...editingNote, isPinned: !editingNote.isPinned })}
                  title={editingNote.isPinned ? 'Unpin note' : 'Pin note'}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    editingNote.isPinned 
                      ? 'text-amber-500 bg-amber-100/60 dark:bg-amber-950/40' 
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Pin className={`w-4 h-4 ${editingNote.isPinned ? 'fill-amber-500' : ''}`} />
                </button>
              </div>

              {/* Text Area or Checklist */}
              {!editingNote.isChecklist ? (
                <textarea
                  rows={6}
                  placeholder="Take a note..."
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  className="w-full text-xs bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden placeholder:text-slate-400 resize-none leading-relaxed"
                />
              ) : (
                <div className="space-y-2 text-xs max-h-72 overflow-y-auto pr-1">
                  {editingNote.checklistItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 group">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {
                          const updated = editingNote.checklistItems.map(it => 
                            it.id === item.id ? { ...it, completed: !it.completed } : it
                          );
                          setEditingNote({ ...editingNote, checklistItems: updated });
                        }}
                        className="rounded accent-indigo-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const updated = editingNote.checklistItems.map(it => 
                            it.id === item.id ? { ...it, text: e.target.value } : it
                          );
                          setEditingNote({ ...editingNote, checklistItems: updated });
                        }}
                        className={`flex-1 bg-transparent focus:outline-hidden ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = editingNote.checklistItems.filter(it => it.id !== item.id);
                          setEditingNote({ ...editingNote, checklistItems: filtered });
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!editNewItemText.trim()) return;
                      setEditingNote({
                        ...editingNote,
                        checklistItems: [
                          ...editingNote.checklistItems,
                          { id: `item-${Date.now()}`, text: editNewItemText.trim(), completed: false }
                        ]
                      });
                      setEditNewItemText('');
                    }}
                    className="flex items-center gap-2 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Add list item (press Enter)..."
                      value={editNewItemText}
                      onChange={(e) => setEditNewItemText(e.target.value)}
                      className="w-full text-xs bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden placeholder:text-slate-400"
                    />
                  </form>
                </div>
              )}

              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {(editingNote.tags || []).map(tag => (
                  <span 
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-black/5 dark:bg-white/10 rounded-full text-slate-700 dark:text-slate-300"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setEditingNote({ ...editingNote, tags: editingNote.tags.filter(t => t !== tag) })}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Tag Input */}
              <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Add label (press Enter)..."
                  value={editTagInput}
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && editTagInput.trim()) {
                      e.preventDefault();
                      const t = editTagInput.trim().replace(/^#/, '');
                      if (t && !editingNote.tags.includes(t)) {
                        setEditingNote({ ...editingNote, tags: [...editingNote.tags, t] });
                      }
                      setEditTagInput('');
                    }
                  }}
                  className="w-full text-[11px] bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden placeholder:text-slate-400"
                />
              </div>

              {/* Bottom Toolbar & Save */}
              <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center gap-1">
                  
                  {/* Palette Picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setEditColorPickerOpen(!editColorPickerOpen)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    >
                      <Palette className="w-4 h-4" />
                    </button>
                    {editColorPickerOpen && (
                      <div className="absolute left-0 bottom-full mb-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 z-20 animate-in fade-in zoom-in-95">
                        {(Object.keys(KEEP_COLOR_MAP) as KeepNoteColor[]).map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setEditingNote({ ...editingNote, color: c });
                              setEditColorPickerOpen(false);
                            }}
                            className={`w-5 h-5 rounded-full border cursor-pointer hover:scale-115 ${
                              KEEP_COLOR_MAP[c].swatch
                            } ${editingNote.color === c ? 'ring-2 ring-indigo-500' : ''}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Toggle checklist mode */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingNote.isChecklist) {
                        // convert lines to items
                        const lines = editingNote.content.split('\n').filter(Boolean);
                        const items = lines.map((l, i) => ({ id: `it-${i}`, text: l, completed: false }));
                        setEditingNote({ ...editingNote, isChecklist: true, checklistItems: items, content: '' });
                      } else {
                        // convert items to content text
                        const text = editingNote.checklistItems.map(it => it.text).join('\n');
                        setEditingNote({ ...editingNote, isChecklist: false, content: text });
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>

                  {/* Delete note */}
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteNote(editingNote.id);
                      setEditingNote(null);
                      showToast('Note deleted');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateNote({ ...editingNote, updatedAt: Date.now() });
                    setEditingNote(null);
                    showToast('Note updated');
                  }}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  Save & Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 7. Clear All Notes Confirmation Modal */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Clear All Notes?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This will remove all {notes.length} standalone notes from storage. Your tasks will remain completely untouched.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearAllNotes) {
                    onClearAllNotes();
                  }
                  setIsConfirmClearOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Yes, Clear All Notes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

/* Sub-component: Individual Note Card */
interface NoteCardProps {
  note: KeepNote;
  onOpenEdit: () => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onChangeColor: (e: React.MouseEvent, color: KeepNoteColor) => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onCopy?: (e: React.MouseEvent) => void;
  onToggleChecklistItem: (e: React.MouseEvent, itemId: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onOpenEdit,
  onTogglePin,
  onChangeColor,
  onDelete,
  onDuplicate,
  onCopy,
  onToggleChecklistItem,
}) => {
  const [showPalette, setShowPalette] = useState(false);
  const colorMeta = KEEP_COLOR_MAP[note.color || 'default'];

  return (
    <div
      onClick={onOpenEdit}
      className={`group relative rounded-2xl border p-4 transition-all duration-150 hover:shadow-md cursor-pointer flex flex-col justify-between ${
        colorMeta.bg
      } ${colorMeta.darkBg} ${colorMeta.border} ${colorMeta.darkBorder}`}
    >
      {/* Top Header: Title & Pin Button */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          {note.title ? (
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
              {note.title}
            </h4>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onTogglePin}
            title={note.isPinned ? 'Unpin note' : 'Pin note'}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              note.isPinned
                ? 'opacity-100 text-amber-500 bg-amber-100/70 dark:bg-amber-950/50'
                : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Note Body (Text or Checklist items) */}
        {!note.isChecklist ? (
          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-8 leading-relaxed">
            {note.content}
          </p>
        ) : (
          <div className="space-y-1.5 text-xs">
            {note.checklistItems.slice(0, 7).map(item => (
              <div 
                key={item.id} 
                className="flex items-start gap-2"
                onClick={(e) => onToggleChecklistItem(e, item.id)}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => {}} // handled by div click
                  className="mt-0.5 rounded accent-indigo-600 cursor-pointer shrink-0"
                />
                <span className={`line-clamp-2 leading-tight ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                  {item.text}
                </span>
              </div>
            ))}
            {note.checklistItems.length > 7 && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium pl-5 pt-0.5">
                +{note.checklistItems.length - 7} more items
              </p>
            )}
          </div>
        )}

        {/* Tags / Labels */}
        {(note.tags || []).length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-3">
            {note.tags.map(t => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover Action Toolbar */}
      <div 
        className="flex items-center justify-between pt-3 mt-3 border-t border-black/5 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1">
          
          {/* Palette button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPalette(!showPalette)}
              title="Change color"
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            {showPalette && (
              <div className="absolute left-0 bottom-full mb-1 p-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 z-30">
                {(Object.keys(KEEP_COLOR_MAP) as KeepNoteColor[]).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={(e) => {
                      onChangeColor(e, c);
                      setShowPalette(false);
                    }}
                    title={KEEP_COLOR_MAP[c].name}
                    className={`w-4 h-4 rounded-full border cursor-pointer hover:scale-115 ${
                      KEEP_COLOR_MAP[c].swatch
                    } ${note.color === c ? 'ring-2 ring-indigo-500' : ''}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Copy button */}
          {onCopy && (
            <button
              type="button"
              onClick={onCopy}
              title="Copy note text"
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Duplicate button */}
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicate note"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={onDelete}
          title="Delete note"
          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
