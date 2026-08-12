import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  testGeminiKey: (apiKey: string, model?: string) => ipcRenderer.invoke('test-gemini-key', apiKey, model),
  callGemini: (prompt: string, systemInstruction?: string) => ipcRenderer.invoke('call-gemini', prompt, systemInstruction),
  summarizeChat: (text: string) => ipcRenderer.invoke('summarize-chat', text),
  extractTasks: (text: string) => ipcRenderer.invoke('extract-tasks', text),
  generateReply: (text: string, style?: string) => ipcRenderer.invoke('generate-reply', text, style),
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  saveTasks: (tasks: any[]) => ipcRenderer.invoke('save-tasks', tasks),
  selectFile: () => ipcRenderer.invoke('select-file'),
  openExternalLink: (url: string) => ipcRenderer.invoke('open-external-link', url),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (version: string) => ipcRenderer.invoke('download-update', version),
  restartAndInstallUpdate: (targetPath?: string) => ipcRenderer.invoke('restart-and-install-update', targetPath),
  onAutoUpdateStatus: (callback: Function) => {
    ipcRenderer.on('auto-update-status', (_, data) => callback(data));
  },
});
