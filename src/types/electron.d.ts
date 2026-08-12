export interface AppSettings {
  geminiApiKey: string;
  geminiModel: string; // 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-2.0-flash'
  language: 'vi' | 'en';
  summaryStyle: 'concise' | 'detailed' | 'bullet';
  theme: 'dark' | 'light';
  soundEnabled?: boolean;
  preferredBrowser?: 'default' | 'msedge' | 'chrome' | 'firefox' | 'brave';
  enabledServices: {
    zalo: boolean;
    messenger: boolean;
    telegram: boolean;
    whatsapp: boolean;
    teams: boolean;
    mail: boolean;
    chatgpt: boolean;
    geminiweb: boolean;
    transferit: boolean;
  };
}

export interface TaskItem {
  id: string;
  title: string;
  deadline?: string;
  assignee?: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  sourceService?: string;
  createdAt: string;
}

export interface GeminiTestResult {
  success: boolean;
  message: string;
}

export interface UpdateStatus {
  status: 'checking' | 'available' | 'downloading' | 'ready' | 'latest' | 'error';
  version?: string;
  percent?: number;
  message?: string;
  exePath?: string;
}

export interface ElectronAPI {
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<boolean>;
  testGeminiKey: (apiKey: string, model?: string) => Promise<GeminiTestResult>;
  callGemini: (prompt: string, systemInstruction?: string) => Promise<string>;
  summarizeChat: (text: string) => Promise<string>;
  extractTasks: (text: string) => Promise<TaskItem[]>;
  generateReply: (text: string, style?: string) => Promise<string>;
  getTasks: () => Promise<TaskItem[]>;
  saveTasks: (tasks: TaskItem[]) => Promise<boolean>;
  selectFile: () => Promise<string[] | null>;
  openExternalLink: (url: string) => Promise<boolean>;
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<any>;
  downloadUpdate: (version: string) => Promise<void>;
  restartAndInstallUpdate: (targetPath?: string) => Promise<void>;
  onAutoUpdateStatus: (callback: (data: UpdateStatus) => void) => void;
  onLinkOpenedLog: (callback: (data: { url: string; browser: string }) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
  namespace JSX {
    interface IntrinsicElements {
      webview: any;
    }
  }
}
