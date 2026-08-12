import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  FileText, 
  CheckSquare, 
  MessageSquareReply, 
  Bot, 
  User, 
  Loader2, 
  Copy, 
  Check, 
  ArrowRight,
  BrainCircuit,
  Zap,
  Download
} from 'lucide-react';
import { TaskItem, AppSettings } from '../../types/electron';

interface AICopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTaskItem: (task: Omit<TaskItem, 'id' | 'completed' | 'createdAt'>) => void;
  settings: AppSettings | null;
  onFetchActiveChatText?: () => Promise<string>;
  activeServiceName?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

export const AICopilotPanel: React.FC<AICopilotPanelProps> = ({
  isOpen,
  onClose,
  onAddTaskItem,
  settings,
  onFetchActiveChatText,
  activeServiceName = 'App Chat',
}) => {
  const [activeTab, setActiveTab] = useState<'copilot' | 'summarize' | 'tasks' | 'reply'>('copilot');
  const [inputText, setInputText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'gemini',
      text: 'Xin chào! Tôi là Trợ lý Gemini AI trong Boxx. Bấm "⚡ Đọc & Phân tích Chat" để đọc nội dung cuộc trò chuyện đang mở!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [readingDom, setReadingDom] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [replyStyle, setReplyStyle] = useState('Chuyên nghiệp & Lịch sự');

  if (!isOpen) return null;

  const currentModel = settings?.geminiModel || 'gemini-3.5-flash';

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCaptureActiveChat = async () => {
    if (!onFetchActiveChatText || readingDom) return '';
    setReadingDom(true);
    try {
      const extracted = await onFetchActiveChatText();
      if (!extracted || extracted.trim().length === 0) {
        alert('Không tìm thấy nội dung chat trên trang web hiện tại. Bạn có thể bôi đen văn bản cần đọc hoặc chuyển sang tab chat mong muốn.');
        return '';
      }
      setInputText(extracted);
      return extracted;
    } catch (err: any) {
      alert(`Lỗi khi đọc hội thoại: ${err.message || err}`);
      return '';
    } finally {
      setReadingDom(false);
    }
  };

  const handleQuickSummarizeActiveChat = async () => {
    let textToUse = inputText;
    if (!textToUse || textToUse.trim().length === 0) {
      textToUse = await handleCaptureActiveChat();
    }
    if (!textToUse || textToUse.trim().length === 0) return;

    setLoading(true);
    try {
      const res = await window.electronAPI.summarizeChat(textToUse);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'user',
          text: `[Đọc & Tóm tắt từ ${activeServiceName}]\n${textToUse.slice(0, 150)}...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: (Date.now() + 1).toString(),
          sender: 'gemini',
          text: res,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setActiveTab('copilot');
    } catch (err: any) {
      alert(`Lỗi tóm tắt: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setLoading(true);

    try {
      const response = await window.electronAPI.callGemini(currentInput);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'gemini',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'gemini',
          text: `Lỗi: ${err.message || err}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    try {
      const res = await window.electronAPI.summarizeChat(inputText);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'user',
          text: `[Yêu cầu Tóm tắt]\n${inputText.slice(0, 100)}...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: (Date.now() + 1).toString(),
          sender: 'gemini',
          text: res,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setActiveTab('copilot');
    } catch (err: any) {
      alert(`Lỗi tóm tắt: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractTasks = async () => {
    let textToUse = inputText;
    if (!textToUse || textToUse.trim().length === 0) {
      textToUse = await handleCaptureActiveChat();
    }
    if (!textToUse || textToUse.trim().length === 0) return;

    setLoading(true);
    try {
      const tasks = await window.electronAPI.extractTasks(textToUse);
      if (tasks && tasks.length > 0) {
        tasks.forEach((t) => {
          onAddTaskItem({
            title: t.title,
            deadline: t.deadline,
            assignee: t.assignee,
            priority: t.priority || 'medium',
          });
        });
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'gemini',
            text: `✅ Đã đọc hội thoại ${activeServiceName} và trích xuất thành công ${tasks.length} công việc mới vào danh sách To-Do của bạn!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setActiveTab('copilot');
      } else {
        alert('Không tìm thấy công việc nào trong đoạn chat trên.');
      }
    } catch (err: any) {
      alert(`Lỗi trích xuất: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReply = async () => {
    let textToUse = inputText;
    if (!textToUse || textToUse.trim().length === 0) {
      textToUse = await handleCaptureActiveChat();
    }
    if (!textToUse || textToUse.trim().length === 0) return;

    setLoading(true);
    try {
      const res = await window.electronAPI.generateReply(textToUse, replyStyle);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'user',
          text: `[Soạn câu trả lời từ ${activeServiceName}]\n${textToUse.slice(0, 80)}...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: (Date.now() + 1).toString(),
          sender: 'gemini',
          text: res,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setActiveTab('copilot');
    } catch (err: any) {
      alert(`Lỗi tạo phản hồi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-96 bg-slate-950/95 border-l border-slate-800 flex flex-col h-full z-20 shadow-2xl backdrop-blur-xl">
      {/* Copilot Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Gemini AI Copilot
              <span className="text-[10px] bg-purple-900/60 text-purple-300 font-mono px-2 py-0.5 rounded-full border border-purple-700/50">
                {currentModel}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Đang xem: <strong className="text-indigo-300">{activeServiceName}</strong></p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* One-Click Smart Auto-Read Banner */}
      <div className="p-2.5 bg-indigo-950/40 border-b border-indigo-900/40 flex items-center justify-between gap-2 px-3">
        <button
          onClick={handleQuickSummarizeActiveChat}
          disabled={loading || readingDom}
          className="flex-1 py-1.5 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
        >
          {readingDom || loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          )}
          Đọc & Tóm tắt Chat hiện tại
        </button>
      </div>

      {/* Feature Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 gap-1">
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'copilot'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          Chat AI
        </button>
        <button
          onClick={() => setActiveTab('summarize')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'summarize'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Tóm tắt
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Tạo Task
        </button>
        <button
          onClick={() => setActiveTab('reply')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'reply'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <MessageSquareReply className="w-3.5 h-3.5" />
          Trả lời
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'copilot' ? (
          /* Chat AI Interface */
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'gemini' && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-inner'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-white/10 text-[10px] opacity-70">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'gemini' && (
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="hover:text-white flex items-center gap-1"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 p-2 bg-indigo-950/30 rounded-xl border border-indigo-900/50 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gemini đang phân tích hội thoại...
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Hỏi Gemini hoặc yêu cầu phân tích..."
                  className="flex-1 bg-slate-950 text-xs text-white placeholder-slate-500 rounded-xl px-3 py-2.5 border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSendChat}
                  disabled={loading || !chatInput.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Text Action Tool (Summarize / Tasks / Reply) */
          <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Nội dung hội thoại ({activeServiceName}):
              </label>
              <button
                onClick={handleCaptureActiveChat}
                disabled={readingDom}
                className="text-[11px] bg-slate-900 hover:bg-slate-800 text-indigo-400 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1 transition-all"
              >
                {readingDom ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                Lấy tin nhắn từ app
              </button>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Nhấn "Lấy tin nhắn từ app" hoặc dán đoạn chat từ ${activeServiceName} vào đây...`}
              rows={7}
              className="w-full bg-slate-950 text-xs text-slate-200 placeholder-slate-600 rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono resize-none"
            />

            {activeTab === 'reply' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Phong cách phản hồi:</label>
                <select
                  value={replyStyle}
                  onChange={(e) => setReplyStyle(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-slate-200 rounded-xl p-2.5 border border-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Chuyên nghiệp & Lịch sự">Chuyên nghiệp & Lịch sự</option>
                  <option value="Thân thiện & Cởi mở">Thân thiện & Cởi mở</option>
                  <option value="Ngắn gọn & Đi thẳng vào vấn đề">Ngắn gọn & Đi thẳng vào vấn đề</option>
                  <option value="Từ chối khéo léo">Từ chối khéo léo</option>
                </select>
              </div>
            )}

            <div className="pt-2">
              {activeTab === 'summarize' && (
                <button
                  onClick={handleSummarize}
                  disabled={loading || !inputText.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Tóm tắt với Gemini 3.5 Flash
                </button>
              )}

              {activeTab === 'tasks' && (
                <button
                  onClick={handleExtractTasks}
                  disabled={loading || !inputText.trim()}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                  Trích xuất To-Do Tasks
                </button>
              )}

              {activeTab === 'reply' && (
                <button
                  onClick={handleGenerateReply}
                  disabled={loading || !inputText.trim()}
                  className="w-full py-2.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquareReply className="w-4 h-4" />}
                  Tạo câu trả lời mẫu
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
