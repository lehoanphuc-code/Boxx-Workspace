import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
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
  const [linkToast, setLinkToast] = useState<{ url: string; browser: string } | null>(null);

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
    { id: 'mail', name: 'Mail / Gmail', url: 'https://mail.google.com/mail/u/0/', partition: 'persist:mail' },
    { id: 'chatgpt', name: 'ChatGPT Web', url: 'https://chatgpt.com/', partition: 'persist:chatgpt' },
    { id: 'geminiweb', name: 'Gemini Web Chat', url: 'https://gemini.google.com/', partition: 'persist:geminiweb' },
    { id: 'facebook', name: 'Facebook', url: 'https://www.facebook.com/', partition: 'persist:facebook' },
    { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com/', partition: 'persist:instagram' },
    { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/', partition: 'persist:youtube' },
    { id: 'transferit', name: 'Transfer.it', url: 'https://transfer.it/', partition: 'persist:transferit' },
  ];

  // Initial Data Loading & Auto Update Listener
  useEffect(() => {
    loadSettings();
    loadTasks();

    if (window.electronAPI?.onAutoUpdateStatus) {
      window.electronAPI.onAutoUpdateStatus((status) => {
        if (status.status === 'available' || status.status === 'downloading' || status.status === 'ready') {
          setUpdateStatus(status);
        }
      });
    }

    if (window.electronAPI?.onLinkOpenedLog) {
      window.electronAPI.onLinkOpenedLog((data) => {
        setLinkToast(data);
        setTimeout(() => setLinkToast(null), 4000);
      });
    }

    // Auto check for update 3s after launch
    const timer = setTimeout(() => {
      if (window.electronAPI?.checkForUpdates) {
        window.electronAPI.checkForUpdates();
      }
    }, 3000);

    return () => clearTimeout(timer);
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

      {/* Floating Link Opened Visual Toast Indicator */}
      {linkToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 border border-emerald-500/80 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-3 backdrop-blur-md animate-fade-in text-xs max-w-lg">
          <span className="text-emerald-400 font-bold text-base">🔗</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white truncate">Đã mở liên kết ngoài trên {linkToast.browser === 'msedge' ? 'Microsoft Edge' : linkToast.browser}</h4>
            <p className="text-[11px] text-emerald-200/80 truncate">{linkToast.url}</p>
          </div>
          <button onClick={() => setLinkToast(null)} className="text-emerald-400 hover:text-white p-1">
            ✕
          </button>
        </div>
      )}

      {/* Floating Modern Update Popup Modal */}
      {updateStatus && (updateStatus.status === 'available' || updateStatus.status === 'downloading' || updateStatus.status === 'ready') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <div className="bg-slate-900 border border-indigo-500/50 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative p-6 space-y-5">
            {/* Header Icon & Tag */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-6 h-6 animate-pulse text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">Cập nhật Boxx Workspace</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      v{updateStatus.version || ''}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-300/80">Phát hiện phiên bản phát hành mới trên GitHub</p>
                </div>
              </div>

              <button
                onClick={() => setUpdateStatus(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Progress / Status Message */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                {updateStatus.status === 'ready'
                  ? `🚀 Bản v${updateStatus.version || ''} đã được tải về sẵn sàng 100%! Bấm nút bên dưới để Khởi chạy lại & Cập nhật ngay.`
                  : updateStatus.status === 'downloading'
                  ? `📥 Đang tự động tải ngầm bản mới v${updateStatus.version || ''}... (${updateStatus.percent || 0}%)`
                  : `🎉 Phát hiện bản phát hành mới v${updateStatus.version || ''}! Hãy nâng cấp ngay để trải nghiệm các cải tiến mới nhất.`}
              </p>

              {updateStatus.status === 'downloading' && (
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${updateStatus.percent || 0}%` }}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => window.electronAPI?.openExternalLink(`https://github.com/lehoanphuc-code/Boxx-Workspace/releases/tag/v${updateStatus.version || ''}`)}
                className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-4 flex items-center gap-1"
              >
                🌐 Tải trên Trình duyệt
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUpdateStatus(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Để Sau
                </button>

                {updateStatus.status === 'ready' ? (
                  <button
                    onClick={() => window.electronAPI?.restartAndInstallUpdate(updateStatus.exePath)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 animate-pulse"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Khởi chạy lại & Cập nhật
                  </button>
                ) : updateStatus.status === 'downloading' ? (
                  <button
                    disabled
                    className="px-5 py-2.5 bg-indigo-700 opacity-90 text-white font-bold rounded-xl text-xs flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang tải ({updateStatus.percent || 0}%)
                  </button>
                ) : (
                  <button
                    onClick={() => updateStatus.version && window.electronAPI?.downloadUpdate(updateStatus.version)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                  >
                    📥 Tải & Cập nhật v{updateStatus.version || ''}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
