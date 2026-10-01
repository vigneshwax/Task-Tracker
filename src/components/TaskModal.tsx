import React, { useState, useEffect } from 'react';
import { HRTask, TaskPriority, TaskStatus } from '../types/hrTask';
import { getTodayDateString } from '../utils/storage';
import { 
  X, 
  Calendar, 
  Clock, 
  Tag, 
  Flag, 
  AlertCircle, 
  FileText 
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<HRTask, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo'> & { assignedTo?: string }) => void;
  taskToEdit?: HRTask | null;
  categories: string[];
  onAddCustomCategory: (categoryName: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  categories,
  onAddCustomCategory,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Recruitment');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  
  // Custom category addition
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setDate(taskToEdit.date);
      setTime(taskToEdit.time || '');
      setCategory(taskToEdit.category);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setNotes(taskToEdit.notes || '');
      setFollowUpDate(taskToEdit.followUpDate || '');
    } else {
      setTitle('');
      setDescription('');
      setDate(getTodayDateString());
      setTime('');
      setCategory(categories[0] || 'Recruitment');
      setPriority('Medium');
      setStatus('Pending');
      setNotes('');
      setFollowUpDate('');
    }
    setErrorMsg('');
    setShowAddCat(false);
    setNewCatInput('');
  }, [taskToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Task / Activity title is required.');
      return;
    }
    if (!date) {
      setErrorMsg('Task date is required.');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      date,
      time: time.trim(),
      category,
      priority,
      status,
      notes: notes.trim(),
      followUpDate: followUpDate || '',
      assignedTo: 'Me',
    });
    onClose();
  };

  const handleCreateCategory = () => {
    if (!newCatInput.trim()) return;
    const trimmed = newCatInput.trim();
    onAddCustomCategory(trimmed);
    setCategory(trimmed);
    setNewCatInput('');
    setShowAddCat(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {taskToEdit ? 'Edit Task' : 'Add New HR Task'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {taskToEdit ? 'Update details, schedule, or notes' : 'Log a recruitment, verification, or operational task'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - fitted properly to screen with internal scroll and pinned footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1 min-h-0">
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Task / Activity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Task / Activity <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fabric Sourcing Manager – Resume screening & profile sharing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full box-border px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
              />
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Task Description / Summary</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">Displayed below title</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Shortlist top 5 profiles from LinkedIn Talent Hub; focus on supply chain & textile experience."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full box-border px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Row 1: Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 font-mono-numbers"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Time</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 font-mono-numbers"
                />
              </div>
            </div>

            {/* Row 2: Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>Category</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCat(!showAddCat)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    {showAddCat ? 'Cancel' : '+ Custom'}
                  </button>
                </div>

                {showAddCat ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="New category name..."
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Priority</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Row 3: Status & Follow-up Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>Follow-up Date (Optional)</span>
                  </label>
                  {followUpDate && (
                    <button
                      type="button"
                      onClick={() => setFollowUpDate('')}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 font-mono-numbers"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Notes & Details</span>
              </label>
              <textarea
                rows={3}
                placeholder="Candidate contact info, interview links, screening feedback, background verification ticket number..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full box-border px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
              />
            </div>
          </div>

          {/* Modal Actions - pinned to bottom */}
          <div className="flex items-center justify-end gap-2.5 px-5 py-3 sm:px-6 sm:py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
            >
              {taskToEdit ? 'Save Changes' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
