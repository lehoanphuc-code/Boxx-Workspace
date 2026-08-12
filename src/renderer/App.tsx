import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { WebviewContainer, ServiceItem } from './components/WebviewContainer';
import { AICopilotPanel } from './components/AICopilotPanel';
import { TodoWidget } from './components/TodoWidget';
import { SettingsModal } from './components/SettingsModal';
import { CommandPalette } from './components/CommandPalette';
import { TaskItem, AppSettings, UpdateStatus } from '../types/electron';
import { playNotificationSound } from './utils/audio';

export const App: React.FC = () => {
  const [activeServiceId, setActiveServiceId] = useState<string>('zalo');
  const [isAiOpen, setIsAiOpen] = useState<boolean>(true);
  const [isTasksOpen, setIsTasksOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);

  const reloadFnRef = useRef<(() => void) | null>(null);
  const getTextFnRef = useRef<(() => Promise<string>) | null>(null);
  const triggerAttachRef = useRef<(() => Promise<void>) | null>(null);
  const prevUnreadCountsRef = useRef<Record<string, number>>({});

  const ALL_SERVICES: ServiceItem[] = [
    { id: 'zalo', name: 'Zalo Web', url: 'https://chat.zalo.me/', partition: 'persist:zalo' },
    { id: 'messenger', name: 'Facebook Messenger', url: 'https://www.messenger.com/', partition: 'persist:messenger' },
    { id: 'telegram', name: 'Telegram Web', url: 'https://web.telegram.org/k/', partition: 'persist:telegram' },
    { id: 'whatsapp', name: 'WhatsApp Web', url: 'https://web.whatsapp.com/', partition: 'persist:whatsapp' },
    { id: 'teams', name: 'Microsoft Teams', url: 'https://teams.live.com/v2', partition: 'persist:teams' },
    { id: 'mail', name: 'Mail / Gmail', url: 'https://mail.google.com/', partition: 'persist:mail' },
    { id: 'chatgpt', name: 'ChatGPT Web', url: 'https://chatgpt.com/', partition: 'persist:chatgpt' },
    { id: 'geminiweb', name: 'Gemini Web Chat', url: 'https://gemini.google.com/', partition: 'persist:geminiweb' },
    { id: 'transferit', name: 'Transfer.it', url: 'https://transfer.it/', partition: 'persist:transferit' },
  ];

  // Initial Data Loading
  useEffect(() => {
    loadSettings();
    loadTasks();
  }, []);

  const loadSettings = async () => {
    try {
      if (window.electronAPI) {
        const s = await window.electronAPI.getSettings();
        setSettings(s);
      }
    } catch (err) {
      console.error('Failed to load settings in App:', err);
    }
  };

  const loadTasks = async () => {
    try {
      if (window.electronAPI) {
        const t = await window.electronAPI.getTasks();
        if (Array.isArray(t)) setTasks(t);
      }
    } catch (err) {
      console.error('Failed to load tasks in App:', err);
    }
  };

  const handleSaveTasks = async (newTasks: TaskItem[]) => {
    setTasks(newTasks);
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveTasks(newTasks);
      }
    } catch (err) {
      console.error('Failed to save tasks:', err);
    }
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    handleSaveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    handleSaveTasks(updated);
  };

  const handleAddTask = (task: Omit<TaskItem, 'id' | 'completed' | 'createdAt'>) => {
    const newTask: TaskItem = {
      ...task,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    handleSaveTasks([newTask, ...tasks]);
  };

  const handleClearCompleted = () => {
    const updated = tasks.filter((t) => !t.completed);
    handleSaveTasks(updated);
  };

  const handleReloadCurrentWebview = () => {
    if (reloadFnRef.current) {
      reloadFnRef.current();
    }
  };

  const handleFetchActiveText = async (): Promise<string> => {
    if (getTextFnRef.current) {
      return await getTextFnRef.current();
    }
    return '';
  };

  const handleSelectAndSendFile = async () => {
    try {
      if (window.electronAPI?.selectFile) {
        const files = await window.electronAPI.selectFile();
        if (files && files.length > 0) {
          if (triggerAttachRef.current) {
            await triggerAttachRef.current();
          }
        }
      }
    } catch (err) {
      console.error('Error selecting file:', err);
    }
  };

  const handleUnreadCountUpdate = (serviceId: string, newCount: number) => {
    // If the service is currently being viewed by user, lock unread count to 0
    const finalCount = serviceId === activeServiceId ? 0 : newCount;
    const prevCount = prevUnreadCountsRef.current[serviceId] || 0;

    // Trigger sound ONLY if new unread messages arrived for a background tab
    if (serviceId !== activeServiceId && finalCount > prevCount && settings?.soundEnabled !== false) {
      playNotificationSound();
    }

    prevUnreadCountsRef.current[serviceId] = finalCount;

    setUnreadCounts((prev) => {
      if (prev[serviceId] === finalCount) return prev;
      return {
        ...prev,
        [serviceId]: finalCount,
      };
    });
  };

  const activeServiceObj = ALL_SERVICES.find((s) => s.id === activeServiceId);

  const enabledServices = ALL_SERVICES.filter(
    (s) => !settings || settings.enabledServices[s.id as keyof typeof settings.enabledServices] !== false
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Left Sidebar */}
      <Sidebar
        activeServiceId={activeServiceId}
        onSelectService={(id) => {
          setActiveServiceId(id);
          handleUnreadCountUpdate(id, 0);
        }}
        isAiOpen={isAiOpen}
        onToggleAi={() => {
          setIsAiOpen(!isAiOpen);
          if (!isAiOpen) setIsTasksOpen(false);
        }}
        isTasksOpen={isTasksOpen}
        onToggleTasks={() => {
          setIsTasksOpen(!isTasksOpen);
          if (!isTasksOpen) setIsAiOpen(false);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onReloadCurrentWebview={handleReloadCurrentWebview}
        onSelectFile={handleSelectAndSendFile}
        settings={settings}
        unreadCounts={unreadCounts}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 h-full relative overflow-hidden flex">
        <WebviewContainer
          services={enabledServices}
          activeServiceId={activeServiceId}
          soundEnabled={settings?.soundEnabled !== false}
          onWebviewReloadRef={(fn) => {
            reloadFnRef.current = fn;
          }}
          onGetActiveTextRef={(fn) => {
            getTextFnRef.current = fn;
          }}
          onTriggerAttachRef={(fn) => {
            triggerAttachRef.current = fn;
          }}
          onUnreadCountUpdate={handleUnreadCountUpdate}
        />

        {/* Gemini AI Copilot Drawer Panel */}
        <AICopilotPanel
          isOpen={isAiOpen}
          onClose={() => setIsAiOpen(false)}
          onAddTaskItem={handleAddTask}
          settings={settings}
          onFetchActiveChatText={handleFetchActiveText}
          activeServiceName={activeServiceObj?.name || 'App Chat'}
        />

        {/* To-Do Task List Drawer Panel */}
        <TodoWidget
          isOpen={isTasksOpen}
          onClose={() => setIsTasksOpen(false)}
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleAddTask}
          onClearCompleted={handleClearCompleted}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={() => loadSettings()}
      />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectService={(id) => setActiveServiceId(id)}
        onToggleAi={() => setIsAiOpen(true)}
        onToggleTasks={() => setIsTasksOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReload={handleReloadCurrentWebview}
      />

      {/* Floating Auto-Update Notification Banner */}
      {updateStatus && (updateStatus.status === 'available' || updateStatus.status === 'downloading' || updateStatus.status === 'ready') && (
        <div className="fixed top-4 right-6 z-50 bg-slate-900/95 border border-indigo-500/80 shadow-2xl rounded-2xl p-4 flex items-center gap-4 backdrop-blur-xl text-xs max-w-md animate-bounce-short">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-400 shrink-0">
            <RefreshCw className={`w-5 h-5 ${updateStatus.status === 'downloading' ? 'animate-spin text-indigo-400' : 'text-emerald-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white flex items-center gap-2">
              {updateStatus.status === 'ready' && '🚀 Đã sẵn sàng cập nhật bản mới!'}
              {updateStatus.status === 'downloading' && `📥 Đang tải bản cập nhật ngầm... (${updateStatus.percent || 0}%)`}
              {updateStatus.status === 'available' && `🎉 Đã tìm thấy bản cập nhật v${updateStatus.version || ''}!`}
            </h4>
            <p className="text-[11px] text-slate-400 truncate">
              {updateStatus.status === 'ready'
                ? 'Nhấn nút để khởi động lại và trải nghiệm phiên bản mới.'
                : `Phiên bản mới v${updateStatus.version || ''} đang được nạp.`}
            </p>
          </div>
          {updateStatus.status === 'ready' && (
            <button
              onClick={() => window.electronAPI?.restartAndInstallUpdate()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors shrink-0 shadow-lg shadow-indigo-600/30"
            >
              Cập nhật ngay
            </button>
          )}
          <button
            onClick={() => setUpdateStatus(null)}
            className="text-slate-500 hover:text-slate-300 text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
