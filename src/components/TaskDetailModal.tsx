import React, { useState, useEffect } from 'react';
import { HRTask, TaskStatus, TaskPriority } from '../types/hrTask';
import { 
  formatDateFriendly, 
  parseTimeParts, 
  isDateToday, 
  isDateOverdue, 
  getTodayDateString 
} from '../utils/storage';
import { getCategoryStyles } from '../utils/categories';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Circle, 
  Calendar, 
  Tag, 
  Flag, 
  User, 
  FileText, 
  Edit3, 
  Trash2, 
  Copy, 
  BellRing,
  Check,
  Save,
  ChevronRight
} from 'lucide-react';

interface TaskDetailModalProps {
  task: HRTask | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onUpdateNotes: (taskId: string, newNotes: string) => void;
  onEditTask: (task: HRTask) => void;
  onDeleteTask?: (task: HRTask) => void;
  onDuplicateTask?: (task: HRTask) => void;
  onRescheduleFollowUp?: (taskId: string, newDate: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
  onRescheduleFollowUp,
}) => {
  const [editedNotes, setEditedNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  useEffect(() => {
    if (task) {
      setEditedNotes(task.notes || '');
      setIsEditingNotes(false);
      setNoteSavedFeedback(false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const catStyle = getCategoryStyles(task.category);
  const parsedTime = parseTimeParts(task.time);
  const isAm = parsedTime.ampm === 'AM';
  const isToday = isDateToday(task.date);
  const isFollowUpDue = task.followUpDate && (isDateToday(task.followUpDate) || isDateOverdue(task.followUpDate));

  const handleSaveNotes = () => {
    onUpdateNotes(task.id, editedNotes.trim());
    setIsEditingNotes(false);
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 2000);
  };

  const handleSnooze = (days: number) => {
    if (!onRescheduleFollowUp) return;
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split('T')[0];
    onRescheduleFollowUp(task.id, dateStr);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-2xl my-6 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Color Bar */}
        <div className={`h-2 w-full ${
          task.status === 'Completed'
            ? 'bg-emerald-500'
            : task.status === 'In Progress'
            ? 'bg-sky-500'
            : 'bg-amber-500'
        }`} />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="space-y-2 min-w-0 flex-1">
            {/* Category, Priority & Scheduled Day Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-md ${catStyle.pillBg} ${catStyle.pillText} border ${catStyle.accentBorder}`}>
                <Tag className="w-3 h-3 mr-1 opacity-70" />
                {task.category}
              </span>

              <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border ${
                task.priority === 'High'
                  ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
                  : task.priority === 'Medium'
                  ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'
                  : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}>
                <Flag className="w-3 h-3 mr-1 opacity-70" />
                {task.priority} Priority
              </span>

              {isToday && (
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md">
                  Scheduled Today
                </span>
              )}
            </div>

            {/* BIG Task Name */}
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight break-words">
              {task.title}
            </h2>

            {/* Description / Candidate info / Details */}
            {task.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60 leading-relaxed font-sans">
                {task.description}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Close popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* SEPARATED 3-OPTION STATUS SELECTOR */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Update Status</span>
                <span className="text-[11px] font-normal text-slate-500 lowercase">(select an option below)</span>
              </label>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Current: <strong className="text-slate-900 dark:text-white">{task.status}</strong>
              </span>
            </div>

            {/* 3 Separate Big Interactive Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Completed */}
              <button
                type="button"
                onClick={() => onUpdateStatus(task.id, 'Completed')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative overflow-hidden group ${
                  task.status === 'Completed'
                    ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    task.status === 'Completed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  {task.status === 'Completed' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-200/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    Completed
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Activity finished & logged
                  </p>
                </div>
              </button>

              {/* Option 2: In Progress */}
              <button
                type="button"
                onClick={() => onUpdateStatus(task.id, 'In Progress')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative overflow-hidden group ${
                  task.status === 'In Progress'
                    ? 'ring-2 ring-sky-500 dark:ring-sky-400 bg-sky-50/90 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-800 hover:bg-sky-50/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    task.status === 'In Progress'
                      ? 'bg-sky-600 text-white'
                      : 'bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400'
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  {task.status === 'In Progress' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-200/70 dark:bg-sky-900/60 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors">
                    In Progress
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Currently being worked on
                  </p>
                </div>
              </button>

              {/* Option 3: Pending */}
              <button
                type="button"
                onClick={() => onUpdateStatus(task.id, 'Pending')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative overflow-hidden group ${
                  task.status === 'Pending'
                    ? 'ring-2 ring-amber-500 dark:ring-amber-400 bg-amber-50/90 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-800 hover:bg-amber-50/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    task.status === 'Pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                  }`}>
                    <Circle className="w-4 h-4" />
                  </div>
                  {task.status === 'Pending' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-200/70 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    Pending
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Queued / awaiting response
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* SCHEDULE, TIME & DETAILS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Scheduled Date & Time */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/70 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Scheduled Time & Date</span>
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap pt-1">
                {/* AM / PM Badge */}
                {task.time ? (
                  <span className={`inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg border shadow-2xs ${
                    isAm
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-slate-800 dark:text-slate-200'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-slate-800 dark:text-slate-200'
                  }`}>
                    <Clock className={`w-3.5 h-3.5 shrink-0 ${isAm ? 'text-amber-500' : 'text-indigo-500'}`} />
                    <span className="font-bold text-sm text-slate-900 dark:text-white font-mono-numbers">
                      {parsedTime.timeOnly}
                    </span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider font-sans ${
                      isAm 
                        ? 'bg-amber-200 text-amber-950 dark:bg-amber-800 dark:text-amber-100' 
                        : 'bg-indigo-200 text-indigo-950 dark:bg-indigo-800 dark:text-indigo-100'
                    }`}>
                      {parsedTime.ampm}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}

                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono-numbers bg-white dark:bg-slate-700/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                  {formatDateFriendly(task.date)}
                </span>
              </div>

              {task.completedDate && task.status === 'Completed' && (
                <div className="pt-2 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-medium border-t border-slate-200/60 dark:border-slate-700/60 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Completed on {formatDateFriendly(task.completedDate)}</span>
                </div>
              )}
            </div>

            {/* Follow-up Reminder */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isFollowUpDue 
                ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80' 
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/70'
            }`}>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <BellRing className={`w-3.5 h-3.5 ${isFollowUpDue ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>Follow-up Date</span>
                </span>
                {isFollowUpDue && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.2 rounded">
                    Due Soon
                  </span>
                )}
              </div>

              <div className="pt-1">
                {task.followUpDate ? (
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono-numbers bg-white dark:bg-slate-700/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                      {formatDateFriendly(task.followUpDate)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSnooze(1)}
                        className="text-[10px] font-medium px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-600 cursor-pointer transition-colors"
                        title="Reschedule to Tomorrow"
                      >
                        +1 Day
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSnooze(3)}
                        className="text-[10px] font-medium px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-600 cursor-pointer transition-colors"
                        title="Reschedule in 3 Days"
                      >
                        +3 Days
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>No follow-up scheduled</span>
                    <button
                      type="button"
                      onClick={() => handleSnooze(1)}
                      className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      + Set Tomorrow
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* NOTES & REMARKS SECTION (SHOW IN FULL) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Notes & Remarks</span>
              </label>
              
              <div className="flex items-center gap-2">
                {noteSavedFeedback && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" /> Note Saved!
                  </span>
                )}
                {!isEditingNotes ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{task.notes ? 'Edit Note' : '+ Add Note'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditedNotes(task.notes || '');
                        setIsEditingNotes(false);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium px-2 py-0.5 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-md font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Note</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isEditingNotes ? (
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Enter updates, interview notes, candidate response, or next steps..."
                rows={4}
                className="w-full p-3.5 text-sm bg-white dark:bg-slate-800 border-2 border-indigo-500 dark:border-indigo-400 rounded-xl text-slate-900 dark:text-white focus:outline-hidden font-sans resize-y"
                autoFocus
              />
            ) : task.notes ? (
              <div className="p-4 bg-amber-50/60 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700/80 rounded-xl text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans shadow-2xs whitespace-pre-wrap">
                {task.notes}
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingNotes(true)}
                className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 dark:text-slate-500 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>No notes recorded for this task yet. Click to add a note.</span>
              </div>
            )}
          </div>

          {/* ASSIGNED & SYSTEM AUDIT */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Assigned To: <strong className="text-slate-700 dark:text-slate-300">{task.assignedTo || 'Me'}</strong></span>
            </div>
            <div>
              <span>ID: <code className="font-mono text-[11px] text-slate-400">{task.id}</code></span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            {onDeleteTask && (
              <button
                type="button"
                onClick={() => {
                  onDeleteTask(task);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            {onDuplicateTask && (
              <button
                type="button"
                onClick={() => {
                  onDuplicateTask(task);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditTask(task);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit All Details</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <span>Done / Close</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
