import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Sparkles, Settings, CheckSquare, RefreshCw, X, ArrowRight } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'Chat Apps' | 'AI & Tools';
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (id: string) => void;
  onToggleAi: () => void;
  onToggleTasks: () => void;
  onOpenSettings: () => void;
  onReload: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectService,
  onToggleAi,
  onToggleTasks,
  onOpenSettings,
  onReload,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands: CommandItem[] = [
    {
      id: 'zalo',
      title: 'Mở Zalo Web',
      category: 'Chat Apps',
      icon: <MessageSquare className="w-4 h-4 text-blue-400" />,
      action: () => {
        onSelectService('zalo');
        onClose();
      },
    },
    {
      id: 'messenger',
      title: 'Mở Facebook Messenger',
      category: 'Chat Apps',
      icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
      action: () => {
        onSelectService('messenger');
        onClose();
      },
    },
    {
      id: 'telegram',
      title: 'Mở Telegram Web',
      category: 'Chat Apps',
      icon: <MessageSquare className="w-4 h-4 text-sky-400" />,
      action: () => {
        onSelectService('telegram');
        onClose();
      },
    },
    {
      id: 'whatsapp',
      title: 'Mở WhatsApp Web',
      category: 'Chat Apps',
      icon: <MessageSquare className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onSelectService('whatsapp');
        onClose();
      },
    },
    {
      id: 'teams',
      title: 'Mở Microsoft Teams',
      category: 'Chat Apps',
      icon: <MessageSquare className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onSelectService('teams');
        onClose();
      },
    },
    {
      id: 'mail',
      title: 'Mở Webmail / Gmail',
      category: 'Chat Apps',
      icon: <MessageSquare className="w-4 h-4 text-rose-400" />,
      action: () => {
        onSelectService('mail');
        onClose();
      },
    },
    {
      id: 'chatgpt',
      title: 'Mở ChatGPT Web',
      category: 'Chat Apps',
      icon: <MessageSquare className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onSelectService('chatgpt');
        onClose();
      },
    },
    {
      id: 'geminiweb',
      title: 'Mở Gemini Web Chat',
      category: 'Chat Apps',
      icon: <Sparkles className="w-4 h-4 text-sky-400" />,
      action: () => {
        onSelectService('geminiweb');
        onClose();
      },
    },
    {
      id: 'facebook',
      title: 'Mở Facebook Web',
      category: 'Chat Apps',
      icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
      action: () => {
        onSelectService('facebook');
        onClose();
      },
    },
    {
      id: 'instagram',
      title: 'Mở Instagram Web',
      category: 'Chat Apps',
      icon: <MessageSquare className="w-4 h-4 text-pink-400" />,
      action: () => {
        onSelectService('instagram');
        onClose();
      },
    },
    {
      id: 'youtube',
      title: 'Mở YouTube',
      category: 'Chat Apps',
      icon: <MessageSquare className="w-4 h-4 text-red-500" />,
      action: () => {
        onSelectService('youtube');
        onClose();
      },
    },
    {
      id: 'transferit',
      title: 'Mở Transfer.it File Share',
      category: 'Chat Apps',
      icon: <MessageSquare className="w-4 h-4 text-amber-400" />,
      action: () => {
        onSelectService('transferit');
        onClose();
      },
    },
    {
      id: 'ai-copilot',
      title: 'Mở Trợ lý Gemini AI Copilot',
      category: 'AI & Tools',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      action: () => {
        onToggleAi();
        onClose();
      },
    },
    {
      id: 'tasks',
      title: 'Xem danh sách To-Do Tasks',
      category: 'AI & Tools',
      icon: <CheckSquare className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onToggleTasks();
        onClose();
      },
    },
    {
      id: 'settings',
      title: 'Mở Cài đặt Gemini & App (⚙️)',
      category: 'AI & Tools',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      action: () => {
        onOpenSettings();
        onClose();
      },
    },
    {
      id: 'reload',
      title: 'Tải lại trang Webview hiện tại',
      category: 'AI & Tools',
      icon: <RefreshCw className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onReload();
        onClose();
      },
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm ứng dụng, lệnh Gemini AI..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <kbd className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              Không tìm thấy lệnh nào phù hợp với "{query}".
            </div>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 flex items-center justify-between text-xs text-slate-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-slate-700">
                    {cmd.icon}
                  </div>
                  <span className="font-medium">{cmd.title}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-300">
                  <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {cmd.category}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
