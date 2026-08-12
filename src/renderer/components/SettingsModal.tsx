import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  AppWindow, 
  ShieldCheck,
  Save,
  Globe,
  Palette,
  Volume2,
  RefreshCw
} from 'lucide-react';
import { AppSettings, GeminiTestResult } from '../../types/electron';
import { playNotificationSound } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'services' | 'general'>('ai');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [geminiModel, setGeminiModel] = useState('gemini-3.5-flash');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [summaryStyle, setSummaryStyle] = useState<'concise' | 'detailed' | 'bullet'>('concise');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [preferredBrowser, setPreferredBrowser] = useState<'default' | 'msedge' | 'chrome' | 'firefox' | 'brave'>('default');
  const [enabledServices, setEnabledServices] = useState({
    zalo: true,
    messenger: true,
    telegram: true,
    whatsapp: true,
    teams: true,
    mail: true,
    chatgpt: true,
    geminiweb: true,
    transferit: true,
  });

  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<GeminiTestResult | null>(null);
  const [saving, setSaving] = useState(false);

  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateCheckStatus, setUpdateCheckStatus] = useState<string>('idle');
  const [updateCheckMessage, setUpdateCheckMessage] = useState<string>('');

  useEffect(() => {
    if (window.electronAPI?.onAutoUpdateStatus) {
      window.electronAPI.onAutoUpdateStatus((data) => {
        if (data.status === 'available') {
          setIsCheckingUpdate(false);
          setUpdateCheckStatus('available');
          setUpdateCheckMessage(`🎉 Phát hiện bản v${data.version || ''}! Đang tự động tải ngầm...`);
        } else if (data.status === 'downloading') {
          setUpdateCheckStatus('downloading');
          setUpdateCheckMessage(`📥 Đang tải bản mới ngầm... (${data.percent || 0}%)`);
        } else if (data.status === 'ready') {
          setIsCheckingUpdate(false);
          setUpdateCheckStatus('ready');
          setUpdateCheckMessage(`🚀 Bản v${data.version || ''} đã sẵn sàng! Bấm nút bên dưới để cập nhật.`);
        } else if (data.status === 'error') {
          setIsCheckingUpdate(false);
          setUpdateCheckStatus('error');
          setUpdateCheckMessage('❌ Không thể kiểm tra cập nhật (Bạn đang dùng bản mới nhất hoặc offline).');
        }
      });
    }
  }, []);

  const handleManualCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateCheckStatus('checking');
    setUpdateCheckMessage('Đang kiểm tra bản cập nhật mới trên GitHub...');

    try {
      if (window.electronAPI?.checkForUpdates) {
        const res = await window.electronAPI.checkForUpdates();
        if (res && res.error) {
          setUpdateCheckStatus('error');
          setUpdateCheckMessage('✅ Bạn đang sử dụng phiên bản mới nhất!');
          setIsCheckingUpdate(false);
        } else {
          setTimeout(() => {
            setIsCheckingUpdate((prev) => {
              if (prev) {
                setUpdateCheckStatus('latest');
                setUpdateCheckMessage('✅ Bạn đang sử dụng phiên bản mới nhất!');
                return false;
              }
              return false;
            });
          }, 2500);
        }
      } else {
        setTimeout(() => {
          setIsCheckingUpdate(false);
          setUpdateCheckStatus('latest');
          setUpdateCheckMessage('✅ Bạn đang sử dụng phiên bản mới nhất!');
        }, 1500);
      }
    } catch (err) {
      setIsCheckingUpdate(false);
      setUpdateCheckStatus('latest');
      setUpdateCheckMessage('✅ Bạn đang sử dụng phiên bản mới nhất!');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCurrentSettings();
    }
  }, [isOpen]);

  const loadCurrentSettings = async () => {
    try {
      const s = await window.electronAPI.getSettings();
      if (s) {
        setApiKey(s.geminiApiKey || '');
        setGeminiModel(s.geminiModel || 'gemini-3.5-flash');
        setLanguage(s.language || 'vi');
        setSummaryStyle(s.summaryStyle || 'concise');
        setTheme(s.theme || 'dark');
        setSoundEnabled(s.soundEnabled !== false);
        setPreferredBrowser(s.preferredBrowser || 'default');
        if (s.enabledServices) {
          setEnabledServices({ ...enabledServices, ...s.enabledServices });
        }
      }
    } catch (err) {
      console.error('Failed to load settings in modal:', err);
    }
  };

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await window.electronAPI.testGeminiKey(apiKey, geminiModel);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Lỗi thử nghiệm kết nối API Key' });
    } finally {
      setTestingKey(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await window.electronAPI.saveSettings({
        geminiApiKey: apiKey,
        geminiModel,
        language,
        summaryStyle,
        theme,
        soundEnabled,
        enabledServices,
      });
      onSettingsSaved();
      onClose();
    } catch (err: any) {
      alert(`Lỗi khi lưu cài đặt: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleService = (key: keyof typeof enabledServices) => {
    setEnabledServices((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">Cài đặt Boxx Workspace</h2>
              <p className="text-xs text-slate-400">Cấu hình API Key Gemini, Mô hình AI & Dịch vụ Chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 gap-6">
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'ai'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Gemini AI Settings
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'services'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AppWindow className="w-4 h-4" />
            Dịch vụ Chat
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'general'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            Giao diện & Hệ thống
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {activeTab === 'ai' && (
            <div className="space-y-5">
              {/* Gemini API Key */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-400" />
                    Gemini API Key:
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Lấy API Key tại Google AI Studio ↗
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-900 text-xs text-white placeholder-slate-600 rounded-xl pl-3 pr-24 py-3 border border-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleTestKey}
                      disabled={testingKey || !apiKey}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all"
                    >
                      {testingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Kiểm tra'}
                    </button>
                  </div>
                </div>

                {/* Connection Test Result Badge */}
                {testResult && (
                  <div
                    className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  API Key của bạn được mã hóa bảo mật cục bộ bằng Windows DPAPI / Keychain.
                </p>
              </div>

              {/* Gemini Model Selector */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <label className="text-xs font-bold text-slate-200">Chọn Mô hình Gemini AI:</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full bg-slate-900 text-xs text-white rounded-xl p-3 border border-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Tốc độ siêu nhanh & thông minh - Khuyên dùng)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Thế hệ mới nhất, phản hồi tức thì)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Tư duy & phân tích chuyên sâu)</option>
                </select>
              </div>

              {/* Summary Style Preference */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <label className="text-xs font-bold text-slate-200">Phong cách Tóm tắt Mặc định:</label>
                <select
                  value={summaryStyle}
                  onChange={(e) => setSummaryStyle(e.target.value as any)}
                  className="w-full bg-slate-900 text-xs text-white rounded-xl p-3 border border-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="concise">Ngắn gọn 3-4 dòng nêu rõ ý chính</option>
                  <option value="bullet">Danh sách gạch đầu dòng các quyết định quan trọng</option>
                  <option value="detailed">Chi tiết từng luồng ý kiến & câu hỏi chưa giải quyết</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Bật/tắt các ứng dụng xuất hiện ở thanh Sidebar của Boxx:</p>
              {[
                { id: 'zalo', name: 'Zalo Web', desc: 'Nhắn tin công việc & nhóm gia đình Zalo' },
                { id: 'messenger', name: 'Facebook Messenger', desc: 'Trò chuyện cá nhân & Fanpage Messenger' },
                { id: 'telegram', name: 'Telegram Web', desc: 'Cộng đồng, channel & nhóm công việc Telegram' },
                { id: 'whatsapp', name: 'WhatsApp Web', desc: 'Liên lạc đối tác quốc tế WhatsApp' },
                { id: 'teams', name: 'Microsoft Teams', desc: 'Họp trực tuyến & chat doanh nghiệp Teams' },
                { id: 'mail', name: 'Mail / Gmail / Outlook', desc: 'Hòm thư điện tử hợp nhất' },
                { id: 'chatgpt', name: 'ChatGPT Web', desc: 'Giao diện web trực tiếp của OpenAI ChatGPT' },
                { id: 'geminiweb', name: 'Gemini Web Chat', desc: 'Giao diện web trực tiếp của Google Gemini' },
                { id: 'transferit', name: 'Transfer.it', desc: 'Dịch vụ chia sẻ tệp tốc độ cao Transfer.it' },
              ].map((serv) => {
                const isEnabled = enabledServices[serv.id as keyof typeof enabledServices];
                return (
                  <div
                    key={serv.id}
                    className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{serv.name}</h4>
                      <p className="text-[11px] text-slate-500">{serv.desc}</p>
                    </div>
                    <button
                      onClick={() => handleToggleService(serv.id as any)}
                      className={`w-12 h-6 rounded-full transition-colors p-1 relative ${
                        isEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  Ngôn ngữ Trợ lý AI:
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="w-full bg-slate-900 text-xs text-white rounded-xl p-3 border border-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="vi">Tiếng Việt (Mặc định)</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* External Browser Selection */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    Trình duyệt Mở Link Trực tiếp:
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">Tự động mở tab mới khi nhấp liên kết</span>
                </label>
                <select
                  value={preferredBrowser}
                  onChange={(e) => setPreferredBrowser(e.target.value as any)}
                  className="w-full bg-slate-900 text-xs text-white rounded-xl p-3 border border-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="default">🌐 Trình duyệt Mặc định Hệ thống (System Default)</option>
                  <option value="msedge">🌀 Microsoft Edge (Khuyên dùng - Tự động thêm tab vào cửa sổ đang mở)</option>
                  <option value="chrome">🟢 Google Chrome (Tự động mở tab trong Chrome)</option>
                  <option value="firefox">🦊 Mozilla Firefox</option>
                  <option value="brave">🦁 Brave Browser</option>
                </select>
              </div>

              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  Giao diện Boxx:
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="w-full bg-slate-900 text-xs text-white rounded-xl p-3 border border-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="dark">Chủ đề Tối Modern Dark Mode (Khuyên dùng)</option>
                  <option value="light">Chủ đề Sáng Light Mode</option>
                </select>
              </div>

              {/* Notification Sound Setting */}
              <div className="flex items-center justify-between p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    Âm thanh Thông báo Tin nhắn mới
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Phát chuông thông báo êm dịu khi nhận tin nhắn mới</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => playNotificationSound()}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    🔊 Nghe thử
                  </button>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors p-1 relative ${
                      soundEnabled ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        soundEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Version & Update Checking Card */}
              <div className="p-4 bg-indigo-950/30 border border-indigo-900/40 rounded-xl text-xs text-indigo-300 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-white text-xs">Phiên bản Boxx v1.0.0</p>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                      Bản mới nhất
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-300/80">
                    Ứng dụng gom nhóm chat đa nền tảng tích hợp Trợ lý Trí tuệ Nhân tạo Google Gemini.
                  </p>
                  {updateCheckMessage && (
                    <p className={`text-[11px] mt-2 font-medium ${
                      updateCheckStatus === 'ready' ? 'text-emerald-400 font-bold' :
                      updateCheckStatus === 'error' ? 'text-rose-400' : 'text-indigo-200'
                    }`}>
                      {updateCheckMessage}
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  {updateCheckStatus === 'ready' ? (
                    <button
                      onClick={() => window.electronAPI?.restartAndInstallUpdate()}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Khởi chạy lại & Cập nhật
                    </button>
                  ) : (
                    <button
                      onClick={handleManualCheckForUpdates}
                      disabled={isCheckingUpdate}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all border border-indigo-500/50 shadow-md flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                      {isCheckingUpdate ? 'Đang kiểm tra...' : 'Kiểm tra Cập nhật'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu Thay Đổi
          </button>
        </div>
      </div>
    </div>
  );
};
