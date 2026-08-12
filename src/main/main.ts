import { app, BrowserWindow, ipcMain, safeStorage, session, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { autoUpdater } from 'electron-updater';

// Standard User-Agent for modern Chrome on Windows
const CUSTOM_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36';

// Ultra RAM & Process Optimization Switches
app.commandLine.appendSwitch('process-per-site');
app.commandLine.appendSwitch('renderer-process-limit', '4');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256');
app.commandLine.appendSwitch(
  'enable-features',
  'MemorySaverMode,TabDiscarding,CalculateNativeWinOcclusion,PurgeAndSuspend'
);
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');

let mainWindow: BrowserWindow | null = null;

// Paths for data storage
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'boxx_settings.json');
const tasksPath = path.join(userDataPath, 'boxx_tasks.json');

// Interface for stored settings
interface StoredSettings {
  geminiApiKeyEncrypted?: string;
  geminiApiKeyPlain?: string; // Fallback if safeStorage not available
  geminiModel: string;
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

const DEFAULT_SETTINGS: StoredSettings = {
  geminiModel: 'gemini-3.5-flash',
  language: 'vi',
  summaryStyle: 'concise',
  theme: 'dark',
  soundEnabled: true,
  preferredBrowser: 'default',
  enabledServices: {
    zalo: true,
    messenger: true,
    telegram: true,
    whatsapp: true,
    teams: true,
    mail: true,
    chatgpt: true,
    geminiweb: true,
    transferit: true,
  },
};

// Helper to get decrypted API key
function getDecryptedApiKey(settings: StoredSettings): string {
  if (settings.geminiApiKeyEncrypted && safeStorage.isEncryptionAvailable()) {
    try {
      const buffer = Buffer.from(settings.geminiApiKeyEncrypted, 'base64');
      return safeStorage.decryptString(buffer);
    } catch (e) {
      console.error('Failed to decrypt API key:', e);
    }
  }
  return settings.geminiApiKeyPlain || '';
}

// Read settings
function loadSettings(): StoredSettings {
  try {
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
  return { ...DEFAULT_SETTINGS };
}

// Save settings
function saveSettings(newSettings: Partial<StoredSettings> & { geminiApiKey?: string }): boolean {
  try {
    const current = loadSettings();
    const updated = { ...current, ...newSettings };

    if (newSettings.geminiApiKey !== undefined) {
      const apiKey = newSettings.geminiApiKey.trim();
      if (apiKey) {
        if (safeStorage.isEncryptionAvailable()) {
          const encrypted = safeStorage.encryptString(apiKey);
          updated.geminiApiKeyEncrypted = encrypted.toString('base64');
          delete updated.geminiApiKeyPlain;
        } else {
          updated.geminiApiKeyPlain = apiKey;
          delete updated.geminiApiKeyEncrypted;
        }
      } else {
        delete updated.geminiApiKeyEncrypted;
        delete updated.geminiApiKeyPlain;
      }
      delete (updated as any).geminiApiKey;
    }

    fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving settings:', err);
    return false;
  }
}

// Load / Save Tasks
function loadTasks(): any[] {
  try {
    if (fs.existsSync(tasksPath)) {
      return JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading tasks:', err);
  }
  return [];
}

function saveTasks(tasks: any[]): boolean {
  try {
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving tasks:', err);
    return false;
  }
}

// Helper to call Gemini API
async function executeGeminiCall(prompt: string, systemInstruction?: string, modelOverride?: string) {
  const settings = loadSettings();
  const apiKey = getDecryptedApiKey(settings);

  if (!apiKey) {
    throw new Error('Chưa cấu hình Gemini API Key. Vui lòng vào Cài đặt (⚙️) để nhập API Key.');
  }

  const modelName = modelOverride || settings.geminiModel || 'gemini-3.5-flash';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction || 'Bạn là Trợ lý AI thông minh tích hợp trong ứng dụng Boxx Desktop Workspace. Hãy hỗ trợ người dùng phân tích, tóm tắt và trích xuất thông tin một cách ngắn gọn, chính xác bằng Tiếng Việt.',
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: 'Boxx - Multi-Chat Workspace & AI Copilot',
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

// Standard User-Agent strings
const CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36';
const FIREFOX_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0';

// Helper to apply clean headers to session partitions
function applyCleanHeadersToSession(ses: Electron.Session) {
  ses.setUserAgent(CHROME_USER_AGENT);
  try {
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      const url = details.url.toLowerCase();
      // If request is targeting Google Accounts / Google Auth, use Firefox UA and strip Chromium Client Hints
      if (url.includes('accounts.google.com') || url.includes('google.com/o/oauth') || url.includes('accounts.youtube.com')) {
        details.requestHeaders['User-Agent'] = FIREFOX_USER_AGENT;
        delete details.requestHeaders['Sec-CH-UA'];
        delete details.requestHeaders['Sec-CH-UA-Mobile'];
        delete details.requestHeaders['Sec-CH-UA-Platform'];
        delete details.requestHeaders['X-Electron-Ver'];
      } else {
        details.requestHeaders['User-Agent'] = CHROME_USER_AGENT;
      }
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    });
  } catch (e) {
    // Listener already attached
  }
}

  applyCleanHeadersToSession(session.defaultSession);

  const STRICT_AUTH_DOMAINS = [
    'accounts.google.com',
    'login.microsoftonline.com',
    'login.live.com',
    'appleid.apple.com',
    'auth.zalo.me',
    'id.zalo.me',
    'facebook.com/login',
    'm.facebook.com/login',
  ];

  // Set User-Agent & Client Hints for webview partitions when created
  app.on('web-contents-created', (_, contents) => {
    if (contents.getType() === 'webview') {
      applyCleanHeadersToSession(contents.session);

      // Mask navigator.webdriver & navigator.userAgentData to allow Google OAuth login
      contents.on('dom-ready', () => {
        contents
          .executeJavaScript(`
            try {
              Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
              if (navigator.userAgentData) {
                Object.defineProperty(navigator, 'userAgentData', {
                  get: () => ({
                    brands: [
                      { brand: 'Not(A:Brand', version: '99' },
                      { brand: 'Google Chrome', version: '133' },
                      { brand: 'Chromium', version: '133' }
                    ],
                    mobile: false,
                    platform: 'Windows'
                  })
                });
              }
            } catch(e) {}
          `)
          .catch(() => {});
      });

      // Handle window open (e.g. popups / auth links / external link clicks) inside webview
      contents.setWindowOpenHandler(({ url }) => {
        try {
          let targetUrl = url;
          const parsedUrl = new URL(url);

          // Unwrap Zalo, Facebook, Google link wrapper redirects
          const searchParams = parsedUrl.searchParams;
          const rawTarget = searchParams.get('u') || searchParams.get('url') || searchParams.get('q') || searchParams.get('target');
          if (rawTarget && (rawTarget.startsWith('http://') || rawTarget.startsWith('https://'))) {
            targetUrl = rawTarget;
          }

          const isStrictAuth = STRICT_AUTH_DOMAINS.some(
            (domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain) || (parsedUrl.hostname + parsedUrl.pathname).includes(domain)
          );

          if (isStrictAuth) {
            return { action: 'allow' };
          }

          openUrlInPreferredBrowser(targetUrl);
          return { action: 'deny' };
        } catch {
          openUrlInPreferredBrowser(url);
          return { action: 'deny' };
        }
      });

      // Catch webview navigation away from service base host
      contents.on('will-navigate', (event, url) => {
        try {
          if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) return;
          let targetUrl = url;
          const parsedUrl = new URL(url);

          // Unwrap Zalo, Facebook, Google link wrapper redirects
          const searchParams = parsedUrl.searchParams;
          const rawTarget = searchParams.get('u') || searchParams.get('url') || searchParams.get('q') || searchParams.get('target');
          if (rawTarget && (rawTarget.startsWith('http://') || rawTarget.startsWith('https://'))) {
            targetUrl = rawTarget;
          }

          const isStrictAuth = STRICT_AUTH_DOMAINS.some(
            (domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain) || (parsedUrl.hostname + parsedUrl.pathname).includes(domain)
          );

          if (!isStrictAuth) {
            // Check if navigating to an external page
            const serviceDomains = ['chat.zalo.me', 'messenger.com', 'facebook.com', 'web.telegram.org', 'web.whatsapp.com', 'teams.microsoft.com', 'chatgpt.com', 'gemini.google.com', 'mail.google.com', 'transfer.it'];
            const isMainServiceHost = serviceDomains.some(sd => parsedUrl.hostname.includes(sd));
            
            if (!isMainServiceHost || searchParams.has('u') || searchParams.has('url') || searchParams.has('q')) {
              event.preventDefault();
              openUrlInPreferredBrowser(targetUrl);
            }
          }
        } catch {}
      });
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

// Helper to open link in preferred external browser
function openUrlInPreferredBrowser(url: string) {
  if (!url || typeof url !== 'string') return;
  const cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) return;

  const settings = loadSettings();
  const browser = settings.preferredBrowser || 'default';

  try {
    const { execFile } = require('child_process');
    if (browser === 'msedge') {
      execFile('cmd.exe', ['/c', 'start', '', 'msedge', cleanUrl], (err: any) => {
        if (err) shell.openExternal(cleanUrl);
      });
    } else if (browser === 'chrome') {
      execFile('cmd.exe', ['/c', 'start', '', 'chrome', cleanUrl], (err: any) => {
        if (err) shell.openExternal(cleanUrl);
      });
    } else if (browser === 'firefox') {
      execFile('cmd.exe', ['/c', 'start', '', 'firefox', cleanUrl], (err: any) => {
        if (err) shell.openExternal(cleanUrl);
      });
    } else if (browser === 'brave') {
      execFile('cmd.exe', ['/c', 'start', '', 'brave', cleanUrl], (err: any) => {
        if (err) shell.openExternal(cleanUrl);
      });
    } else {
      shell.openExternal(cleanUrl);
    }
  } catch (err) {
    console.error('Failed to open external browser:', err);
    shell.openExternal(cleanUrl);
  }
}

// Setup IPC Handlers
function setupIpcHandlers() {
  // Settings Handlers
  ipcMain.handle('get-settings', async () => {
    const stored = loadSettings();
    const apiKey = getDecryptedApiKey(stored);
    return {
      geminiApiKey: apiKey ? '••••••••' + apiKey.slice(-4) : '',
      geminiModel: stored.geminiModel,
      language: stored.language,
      summaryStyle: stored.summaryStyle,
      theme: stored.theme,
      soundEnabled: stored.soundEnabled !== false,
      preferredBrowser: stored.preferredBrowser || 'default',
      enabledServices: stored.enabledServices,
    };
  });

  ipcMain.handle('save-settings', async (_, newSettings) => {
    return saveSettings(newSettings);
  });

  // Open External Link
  ipcMain.handle('open-external-link', async (_, url: string) => {
    openUrlInPreferredBrowser(url);
    return true;
  });

  // Get App Version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

function isVersionNewer(latest: string, current: string): boolean {
  const parse = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0);
  const l = parse(latest);
  const c = parse(current);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const numL = l[i] || 0;
    const numC = c[i] || 0;
    if (numL > numC) return true;
    if (numL < numC) return false;
  }
  return false;
}

  // Auto Updater Handlers
  ipcMain.handle('check-for-updates', async () => {
    const currentVersion = app.getVersion();
    mainWindow?.webContents.send('auto-update-status', { status: 'checking' });

    try {
      const https = require('https');
      const req = https.request('https://github.com/lehoanphuc-code/Boxx-Workspace/releases/latest', {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, (res: any) => {
        const redirectUrl = res.headers.location || '';
        const match = redirectUrl.match(/\/tag\/v?([0-9.]+)/);
        const latestVersion = match ? match[1] : '';

        if (latestVersion && isVersionNewer(latestVersion, currentVersion)) {
          mainWindow?.webContents.send('auto-update-status', {
            status: 'available',
            version: latestVersion,
            message: `🎉 Đã tìm thấy phiên bản mới v${latestVersion} trên GitHub!`
          });
          if (app.isPackaged) {
            autoUpdater.checkForUpdates().catch(() => {});
          }
        } else {
          mainWindow?.webContents.send('auto-update-status', {
            status: 'latest',
            version: currentVersion,
            message: `✅ Bạn đang sử dụng phiên bản mới nhất (v${currentVersion})!`
          });
        }
      });

      req.on('error', (err: any) => {
        console.error('Check update error:', err);
        mainWindow?.webContents.send('auto-update-status', {
          status: 'latest',
          version: currentVersion,
          message: `✅ Bạn đang sử dụng phiên bản mới nhất (v${currentVersion})!`
        });
      });

      req.end();
      return { status: 'checking' };
    } catch (err: any) {
      mainWindow?.webContents.send('auto-update-status', {
        status: 'latest',
        version: currentVersion,
        message: `✅ Bạn đang sử dụng phiên bản mới nhất (v${currentVersion})!`
      });
      return { status: 'latest' };
    }
  });

  let isDownloadingUpdate = false;

  ipcMain.handle('download-update', async (_, version: string) => {
    if (isDownloadingUpdate) return;
    isDownloadingUpdate = true;

    const https = require('https');
    const fs = require('fs');
    const path = require('path');

    const downloadUrl = `https://github.com/lehoanphuc-code/Boxx-Workspace/releases/download/v${version}/Boxx-Workspace.exe`;
    const updateExePath = path.join(app.getPath('temp'), `Boxx-Workspace-v${version}.exe`);

    const downloadFile = (url: string) => {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res: any) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadFile(res.headers.location);
        }

        const totalSize = parseInt(res.headers['content-length'] || '0', 10);
        let downloaded = 0;
        const fileStream = fs.createWriteStream(updateExePath);

        res.on('data', (chunk: any) => {
          downloaded += chunk.length;
          fileStream.write(chunk);
          if (totalSize > 0) {
            const percent = Math.floor((downloaded / totalSize) * 100);
            mainWindow?.webContents.send('auto-update-status', {
              status: 'downloading',
              percent,
              version
            });
          }
        });

        res.on('end', () => {
          fileStream.end();
          isDownloadingUpdate = false;
          mainWindow?.webContents.send('auto-update-status', {
            status: 'ready',
            version,
            exePath: updateExePath,
            message: `🚀 Bản v${version} đã tải xong 100%! Bấm để Khởi chạy ngay.`
          });
        });
      }).on('error', (err: any) => {
        isDownloadingUpdate = false;
        mainWindow?.webContents.send('auto-update-status', {
          status: 'error',
          message: '❌ Lỗi tải file cập nhật. Vui lòng thử lại.'
        });
      });
    };

    downloadFile(downloadUrl);
  });

  ipcMain.handle('restart-and-install-update', (_, targetPath?: string) => {
    const fs = require('fs');
    const { spawn } = require('child_process');
    
    if (targetPath && fs.existsSync(targetPath)) {
      spawn(targetPath, [], { detached: true, stdio: 'ignore' }).unref();
      app.quit();
    } else {
      if (app.isPackaged) {
        autoUpdater.quitAndInstall(false, true);
      }
    }
  });

  // Select File Dialog
  ipcMain.handle('select-file', async () => {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    if (!win) return null;
    win.focus();
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile', 'multiSelections'],
      title: 'Chọn tệp để gửi qua Boxx Workspace',
    });
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) return null;
    return result.filePaths;
  });

  // Test Gemini Key
  ipcMain.handle('test-gemini-key', async (_, apiKey: string, modelName?: string) => {
    try {
      const keyToTest = apiKey.includes('••••') ? getDecryptedApiKey(loadSettings()) : apiKey;
      if (!keyToTest) {
        return { success: false, message: 'API Key không được để trống.' };
      }

      const genAI = new GoogleGenerativeAI(keyToTest.trim());
      const model = genAI.getGenerativeModel({ model: modelName || 'gemini-3.5-flash' });
      const result = await model.generateContent('Trả lời ngắn gọn "OK" để xác nhận kết nối.');
      const responseText = result.response.text();

      if (responseText) {
        return { success: true, message: 'Kết nối thành công với Gemini API!' };
      } else {
        return { success: false, message: 'Không nhận được phản hồi từ Gemini.' };
      }
    } catch (err: any) {
      console.error('Gemini Key Test Failed:', err);
      return { success: false, message: err?.message || 'Kết nối thất bại. Vui lòng kiểm tra lại API Key.' };
    }
  });

  // Call Gemini Prompt
  ipcMain.handle('call-gemini', async (_, prompt: string, systemInstruction?: string) => {
    try {
      return await executeGeminiCall(prompt, systemInstruction);
    } catch (err: any) {
      return `❌ Lỗi AI: ${err.message || err}`;
    }
  });

  // Chat Summarizer
  ipcMain.handle('summarize-chat', async (_, chatText: string) => {
    try {
      const settings = loadSettings();
      const styleInstruction =
        settings.summaryStyle === 'bullet'
          ? 'Tóm tắt theo dạng danh sách gạch đầu dòng ngắn gọn.'
          : settings.summaryStyle === 'detailed'
          ? 'Tóm tắt chi tiết các nội dung thảo luận, quyết định và vấn đề chưa giải quyết.'
          : 'Tóm tắt ngắn gọn 3-4 dòng nêu rõ ý chính.';

      const prompt = `Dưới đây là nội dung tin nhắn trò chuyện:\n\n---\n${chatText}\n---\n\nHãy tóm tắt nội dung trên. ${styleInstruction}`;
      return await executeGeminiCall(prompt);
    } catch (err: any) {
      return `❌ Không thể tóm tắt: ${err.message || err}`;
    }
  });

  // Task / Action Items Extractor
  ipcMain.handle('extract-tasks', async (_, chatText: string) => {
    try {
      const prompt = `Dưới đây là nội dung trò chuyện:\n\n---\n${chatText}\n---\n\nHãy phân tích và trích xuất tất cả các công việc (Task / Action Items), hạn chót (Deadline), và người chịu trách nhiệm (nếu có).
Trả về kết quả duy nhất ở dạng danh sách JSON array theo định dạng sau (không thêm bất kỳ văn bản nào khác ngoài JSON):
[
  {
    "id": "1",
    "title": "Tên công việc",
    "deadline": "Hạn chót nếu có",
    "assignee": "Người thực hiện nếu có",
    "priority": "high" | "medium" | "low",
    "completed": false,
    "createdAt": "${new Date().toISOString()}"
  }
]`;

      const rawResult = await executeGeminiCall(prompt);
      const jsonMatch = rawResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (err: any) {
      console.error('Failed to extract tasks:', err);
      return [];
    }
  });

  // Smart Reply Generator
  ipcMain.handle('generate-reply', async (_, chatText: string, style = 'chuyên nghiệp') => {
    try {
      const prompt = `Đoạn tin nhắn nhận được:\n\n"${chatText}"\n\nHãy soạn 3 phương án trả lời bằng Tiếng Việt theo phong cách ${style} (1. Đồng ý/Nhận việc, 2. Cần hỏi thêm thông tin, 3. Từ chối hoặc hẹn lại sau).`;
      return await executeGeminiCall(prompt);
    } catch (err: any) {
      return `❌ Lỗi tạo câu trả lời: ${err.message || err}`;
    }
  });

  // Tasks Management Handlers
  ipcMain.handle('get-tasks', async () => {
    return loadTasks();
  });

  ipcMain.handle('save-tasks', async (_, tasks: any[]) => {
    return saveTasks(tasks);
  });
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  // Configure autoUpdater for GitHub Releases
  autoUpdater.forceDevUpdateConfig = true;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('auto-update-status', { status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('auto-update-status', {
      status: 'available',
      version: info.version,
    });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('auto-update-status', {
      status: 'downloading',
      percent: Math.floor(progressObj.percent),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('auto-update-status', {
      status: 'ready',
      version: info.version,
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    mainWindow?.webContents.send('auto-update-status', {
      status: 'latest',
      version: app.getVersion(),
      message: `✅ Bạn đang sử dụng phiên bản mới nhất (v${app.getVersion()})!`,
    });
  });

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('auto-update-status', {
      status: 'latest',
      version: app.getVersion(),
      message: `✅ Bạn đang sử dụng phiên bản mới nhất (v${app.getVersion()})!`,
    });
  });

  // Automatically check for update 4 seconds after launch in production
  setTimeout(() => {
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.log('Auto-update check error:', err);
      });
    }
  }, 4000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
