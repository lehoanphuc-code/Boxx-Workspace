import React from 'react';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Users, 
  Mail, 
  Settings, 
  Sparkles, 
  CheckSquare,
  Search,
  RefreshCw,
  Paperclip,
} from 'lucide-react';
import { AppSettings } from '../../types/electron';

export interface ServiceConfig {
  id: string;
  name: string;
  url: string;
  partition: string;
  badge?: number;
  color: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeServiceId: string;
  onSelectService: (serviceId: string) => void;
  isAiOpen: boolean;
  onToggleAi: () => void;
  isTasksOpen: boolean;
  onToggleTasks: () => void;
  onOpenSettings: () => void;
  onOpenCommandPalette: () => void;
  onReloadCurrentWebview: () => void;
  onSelectFile?: () => void;
  settings: AppSettings | null;
  unreadCounts?: Record<string, number>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeServiceId,
  onSelectService,
  isAiOpen,
  onToggleAi,
  isTasksOpen,
  onToggleTasks,
  onOpenSettings,
  onOpenCommandPalette,
  onReloadCurrentWebview,
  onSelectFile,
  settings,
  unreadCounts = {},
}) => {
  const ALL_SERVICES: ServiceConfig[] = [
    {
      id: 'zalo',
      name: 'Zalo Web',
      url: 'https://chat.zalo.me/',
      partition: 'persist:zalo',
      color: 'bg-blue-600 text-white hover:bg-blue-500',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.02 2 10.98c0 2.82 1.45 5.34 3.72 7.02l-.93 3.44a.75.75 0 00.95.91l3.96-1.57A10.8 10.8 0 0012 21.02c5.523 0 10-4.02 10-8.98S17.523 2 12 2zm-4.25 6h4.5a.75.75 0 010 1.5h-2.69l2.84 3.93a.75.75 0 01-.61 1.19h-4.5a.75.75 0 010-1.5h2.69L7.14 9.19A.75.75 0 017.75 8z"/>
        </svg>
      ),
    },
    {
      id: 'messenger',
      name: 'Facebook Messenger',
      url: 'https://www.messenger.com/',
      partition: 'persist:messenger',
      color: 'bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 text-white',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.45 5.513 3.717 7.247V22l3.376-1.854c.919.255 1.895.394 2.907.394 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.2 12.053l-2.583-2.759-5.04 2.759 5.544-5.88 2.637 2.759 4.986-2.759-5.544 5.88z"/>
        </svg>
      ),
    },
    {
      id: 'telegram',
      name: 'Telegram Web',
      url: 'https://web.telegram.org/k/',
      partition: 'persist:telegram',
      color: 'bg-sky-500 text-white hover:bg-sky-400',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
        </svg>
      ),
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Web',
      url: 'https://web.whatsapp.com/',
      partition: 'persist:whatsapp',
      color: 'bg-emerald-600 text-white hover:bg-emerald-500',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.81 9.81 0 0012.04 2zm5.79 14.12c-.24.68-1.2 1.3-1.66 1.38-.45.08-1.03.11-1.66-.09-.39-.12-.89-.28-1.54-.56-2.71-1.17-4.48-3.92-4.61-4.1-.14-.18-1.1-1.46-1.1-2.79 0-1.33.7-1.98.95-2.25.24-.26.54-.33.72-.33.18 0 .36.01.52.01.17.01.4.06.6.53.24.58.82 2.01.89 2.15.07.15.11.32.02.5-.09.18-.14.29-.27.45-.14.16-.29.35-.41.47-.14.14-.29.3-.13.58.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.41.29.15.46.12.63-.07.17-.18.73-.85.92-1.14.2-.29.39-.24.65-.15.26.09 1.66.78 1.95.92.29.15.48.22.55.34.07.13.07.75-.17 1.43z"/>
        </svg>
      ),
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      url: 'https://teams.live.com/v2',
      partition: 'persist:teams',
      color: 'bg-indigo-600 text-white hover:bg-indigo-500',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M19.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm1.5 1.5h-3c-.83 0-1.5.67-1.5 1.5v4.5h6V9.5c0-.83-.67-1.5-1.5-1.5zM13 5a3 3 0 100-6 3 3 0 000 6zm2 2H11c-1.1 0-2 .9-2 2v7.5h8V9c0-1.1-.9-2-2-2z"/>
        </svg>
      ),
    },
    {
      id: 'mail',
      name: 'Mail / Gmail',
      url: 'https://mail.google.com/',
      partition: 'persist:mail',
      color: 'bg-rose-600 text-white hover:bg-rose-500',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M20 4H4c-1.1 0-2 .9-2 2v.8l10 6.25L22 6.8V6c0-1.1-.9-2-2-2z"/>
          <path fill="#4285F4" d="M12 13.05L2 6.8V18c0 1.1.9 2 2 2h4v-7.5l4 .55z"/>
          <path fill="#34A853" d="M22 6.8l-10 6.25v.55L16 12.5V20h4c1.1 0 2-.9 2-2V6.8z"/>
          <path fill="#FBBC05" d="M12 13.05l-4-1.1V20h4v-6.95z"/>
        </svg>
      ),
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT Web',
      url: 'https://chatgpt.com/',
      partition: 'persist:chatgpt',
      color: 'bg-emerald-700 text-white hover:bg-emerald-600',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M22.28 9.37a6 6 0 00-.52-4.88 6.09 6.09 0 00-6.19-3.03 6.07 6.07 0 00-4.57-2 6.09 6.09 0 00-5.8 4.07 6.07 6.07 0 00-4.06 2.93 6.09 6.09 0 00.74 6.86 6 6 0 00.52 4.88 6.09 6.09 0 006.19 3.03 6.07 6.07 0 004.57 2 6.09 6.09 0 005.8-4.07 6.07 6.07 0 004.06-2.93 6.09 6.09 0 00-.74-6.86zm-9.35 11.75a4.57 4.57 0 01-2.91-1.04l.15-.09 3.63-2.1a.75.75 0 00.38-.65V12.1l1.52.88a.73.73 0 00.37.1.75.75 0 00.38-.1l3.63-2.1a4.57 4.57 0 01.76 5.17 4.59 4.59 0 01-3.64 2.57 4.54 4.54 0 01-4.27-2.5zm-8.31-4.8a4.57 4.57 0 01.55-3.04l.14.09 3.63 2.1a.75.75 0 00.75 0l4.47-2.58v1.76a.75.75 0 00.38.65l3.63 2.1a4.57 4.57 0 01-2.3 5.43 4.59 4.59 0 01-4.45-.08 4.54 4.54 0 01-2.75-3.83zm-1.06-9.6a4.57 4.57 0 013.46-2l-.01.17v4.2a.75.75 0 00.38.65l4.47 2.58-1.52.88a.75.75 0 00-.38.65v4.2a4.57 4.57 0 01-3.06-2.86 4.59 4.59 0 01.66-4.44zm14.39-1.28l-3.63 2.1a.75.75 0 00-.38.65v5.16l-1.52-.88a.75.75 0 00-.75 0l-3.63 2.1a4.57 4.57 0 01-.76-5.17 4.59 4.59 0 013.64-2.57 4.54 4.54 0 014.27 2.5zm1.06 9.6a4.57 4.57 0 01-3.46 2l.01-.17v-4.2a.75.75 0 00-.38-.65l-4.47-2.58 1.52-.88a.75.75 0 00.38-.65v-4.2a4.57 4.57 0 013.06 2.86 4.59 4.59 0 01-.66 4.44z"/>
        </svg>
      ),
    },
    {
      id: 'geminiweb',
      name: 'Gemini Web Chat',
      url: 'https://gemini.google.com/',
      partition: 'persist:geminiweb',
      color: 'bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 text-white',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 7.523 7.523 12 2 12C7.523 12 12 16.477 12 22C12 16.477 16.477 12 22 12C16.477 12 12 7.523 12 2Z" fill="url(#sidebar-gemini-grad)"/>
          <defs>
            <linearGradient id="sidebar-gemini-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8"/>
              <stop offset="0.5" stopColor="#818CF8"/>
              <stop offset="1" stopColor="#C084FC"/>
            </linearGradient>
          </defs>
        </svg>
      ),
    },
    {
      id: 'transferit',
      name: 'Transfer.it File Share',
      url: 'https://transfer.it/',
      partition: 'persist:transferit',
      color: 'bg-amber-600 text-white hover:bg-amber-500',
      icon: (
        <svg className="w-5 h-5 fill-current text-amber-300" viewBox="0 0 24 24">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2zm0 3.86l4.64 11.27L12 15.17l-4.64 2.01L12 5.86z"/>
        </svg>
      ),
    },
  ];

  const enabledServices = ALL_SERVICES.filter(
    (s) => !settings || settings.enabledServices[s.id as keyof typeof settings.enabledServices] !== false
  );

  return (
    <aside className="w-18 bg-slate-950/90 border-r border-slate-800/80 flex flex-col items-center py-3 select-none z-30 shrink-0 shadow-2xl">
      {/* App Logo */}
      <div className="mb-4 group relative flex items-center justify-center">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <span className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 tracking-wider">
              B
            </span>
          </div>
        </div>
        <span className="absolute left-16 bg-slate-900 text-xs font-semibold px-2.5 py-1 rounded-md text-white border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Boxx Workspace
        </span>
      </div>

      {/* Quick Tools */}
      <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-slate-800/80 w-full items-center px-2">
        <button
          onClick={onOpenCommandPalette}
          title="Tìm kiếm toàn cục (Ctrl + K)"
          className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 flex items-center justify-center border border-slate-800 transition-all hover:scale-105 group relative"
        >
          <Search className="w-4 h-4" />
          <span className="absolute left-14 bg-slate-900 text-xs font-medium px-2 py-1 rounded text-slate-200 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Tìm kiếm (Ctrl + K)
          </span>
        </button>

        <button
          onClick={onReloadCurrentWebview}
          title="Tải lại trang hiện tại"
          className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center border border-slate-800 transition-all hover:scale-105 group relative"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="absolute left-14 bg-slate-900 text-xs font-medium px-2 py-1 rounded text-slate-200 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Tải lại tab
          </span>
        </button>

        {onSelectFile && (
          <button
            onClick={onSelectFile}
            title="Đính kèm / Gửi tệp"
            className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 flex items-center justify-center border border-slate-800 transition-all hover:scale-105 group relative"
          >
            <Paperclip className="w-4 h-4" />
            <span className="absolute left-14 bg-slate-900 text-xs font-medium px-2 py-1 rounded text-slate-200 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Đính kèm / Gửi File
            </span>
          </button>
        )}
      </div>

      {/* Chat App Icons List */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto overflow-x-hidden w-full items-center px-2 py-1">
        {enabledServices.map((service) => {
          const isActive = activeServiceId === service.id;
          const unread = unreadCounts[service.id] || 0;

          return (
            <div key={service.id} className="relative group flex items-center justify-center">
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute -left-2 w-1.5 h-7 bg-indigo-500 rounded-r-full shadow-lg shadow-indigo-500/50" />
              )}

              {/* Pulsing Ring Effect for Unread Messages */}
              {unread > 0 && !isActive && (
                <span className="absolute inset-0 rounded-2xl ring-2 ring-rose-500/80 animate-ping opacity-60 pointer-events-none" />
              )}

              <button
                onClick={() => onSelectService(service.id)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md relative ${
                  isActive
                    ? `${service.color} ring-2 ring-indigo-400/50 scale-105`
                    : unread > 0
                    ? 'bg-slate-900 text-slate-100 border border-rose-600/70 shadow-rose-500/20 shadow-lg'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800 hover:scale-105 border border-slate-800'
                }`}
              >
                {service.icon}

                {/* Red Unread Badge Pill */}
                {unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-rose-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center border-2 border-slate-950 shadow-xl animate-bounce">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>

              {/* Tooltip */}
              <div className="absolute left-16 bg-slate-900 text-xs font-medium px-2.5 py-1.5 rounded-lg text-slate-100 border border-slate-700 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 flex items-center gap-2">
                <span>{service.name}</span>
                {unread > 0 && (
                  <span className="text-[10px] bg-rose-900/80 text-rose-300 px-1.5 py-0.5 rounded font-bold">
                    {unread} tin mới
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Panel Actions: AI Copilot, To-Do Tasks, Settings */}
      <div className="flex flex-col gap-2 pt-3 border-t border-slate-800/80 w-full items-center px-2">
        {/* Gemini AI Copilot Toggle */}
        <div className="relative group">
          <button
            onClick={onToggleAi}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-lg ${
              isAiOpen
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white ring-2 ring-purple-400/50 scale-105'
                : 'bg-slate-900 text-purple-400 hover:bg-purple-950/40 hover:text-purple-300 border border-purple-900/40'
            }`}
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
          </button>
          <span className="absolute left-16 bg-slate-900 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-purple-300 border border-purple-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Gemini AI Copilot
          </span>
        </div>

        {/* To-Do List Toggle */}
        <div className="relative group">
          <button
            onClick={onToggleTasks}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isTasksOpen
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
          </button>
          <span className="absolute left-16 bg-slate-900 text-xs font-medium px-2.5 py-1.5 rounded-lg text-slate-200 border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Danh sách To-Do
          </span>
        </div>

        {/* Settings Button */}
        <div className="relative group">
          <button
            onClick={onOpenSettings}
            className="w-11 h-11 rounded-2xl bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 flex items-center justify-center border border-slate-800 transition-all hover:scale-105"
          >
            <Settings className="w-5 h-5" />
          </button>
          <span className="absolute left-16 bg-slate-900 text-xs font-medium px-2.5 py-1.5 rounded-lg text-slate-200 border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Cài đặt (⚙️)
          </span>
        </div>
      </div>
    </aside>
  );
};
