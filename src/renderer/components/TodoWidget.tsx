import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  X, 
  AlertCircle, 
  CheckCircle2,
  ListTodo,
  Check
} from 'lucide-react';
import { TaskItem } from '../../types/electron';

interface TodoWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (task: Omit<TaskItem, 'id' | 'completed' | 'createdAt'>) => void;
  onClearCompleted: () => void;
}

export const TodoWidget: React.FC<TodoWidgetProps> = ({
  isOpen,
  onClose,
  tasks,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onClearCompleted,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');

  if (!isOpen) return null;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask({
      title: newTitle.trim(),
      deadline: newDeadline.trim() || undefined,
      assignee: newAssignee.trim() || undefined,
      priority: newPriority,
    });
    setNewTitle('');
    setNewDeadline('');
    setNewAssignee('');
    setNewPriority('medium');
    setShowAddForm(false);
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <aside className="w-80 bg-slate-950/95 border-l border-slate-800 flex flex-col h-full z-20 shadow-2xl backdrop-blur-xl">
      {/* Widget Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Danh sách Công việc
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                {completedCount}/{tasks.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Tasks trích xuất từ AI Copilot</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Add Task Quick Action */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-indigo-400 font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Thêm công việc thủ công
          </button>
        ) : (
          <form onSubmit={handleCreateTask} className="space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Tên công việc..."
              className="w-full bg-slate-950 text-xs text-white placeholder-slate-500 rounded-lg p-2 border border-slate-700 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                placeholder="Deadline (VD: 15h hôm nay)..."
                className="flex-1 bg-slate-950 text-[11px] text-white placeholder-slate-500 rounded-lg p-1.5 border border-slate-700 focus:outline-none"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="bg-slate-950 text-[11px] text-white rounded-lg p-1.5 border border-slate-700 focus:outline-none"
              >
                <option value="high">🔴 Cao</option>
                <option value="medium">🟡 Thường</option>
                <option value="low">🟢 Thấp</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold"
              >
                Thêm Task
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Task List Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto opacity-30 text-indigo-400" />
            <p className="text-xs font-medium">Chưa có công việc nào.</p>
            <p className="text-[11px]">Sử dụng Trợ lý Gemini AI để tự động trích xuất To-Do từ nội dung chat!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-xl border transition-all ${
                task.completed
                  ? 'bg-slate-950/40 border-slate-900 opacity-60'
                  : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <button
                  onClick={() => onToggleTask(task.id)}
                  className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors shrink-0"
                >
                  {task.completed ? (
                    <div className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <div className="flex-1 space-y-1 overflow-hidden">
                  <p
                    className={`text-xs font-medium leading-snug break-words ${
                      task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {task.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    {/* Priority Badge */}
                    <span
                      className={`px-1.5 py-0.5 rounded font-medium ${
                        task.priority === 'high'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                          : task.priority === 'medium'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                      }`}
                    >
                      {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Thường' : 'Thấp'}
                    </span>

                    {task.deadline && (
                      <span className="flex items-center gap-1 text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        {task.deadline}
                      </span>
                    )}

                    {task.assignee && (
                      <span className="flex items-center gap-1 text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        <User className="w-3 h-3 text-indigo-400" />
                        {task.assignee}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="text-slate-600 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-800 rounded transition-all"
                  title="Xóa công việc"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Widget Footer */}
      {completedCount > 0 && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClearCompleted}
            className="w-full py-1.5 text-[11px] text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Dọn dẹp công việc đã hoàn thành ({completedCount})
          </button>
        </div>
      )}
    </aside>
  );
};
