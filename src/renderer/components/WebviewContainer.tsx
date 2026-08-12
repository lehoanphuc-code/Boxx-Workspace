import React, { useRef, useEffect, useState } from 'react';
import { UploadCloud, FileUp } from 'lucide-react';

export interface ServiceItem {
  id: string;
  name: string;
  url: string;
  partition: string;
}

interface WebviewContainerProps {
  services: ServiceItem[];
  activeServiceId: string;
  soundEnabled?: boolean;
  onWebviewReloadRef?: (reloadFn: () => void) => void;
  onGetActiveTextRef?: (getTextFn: () => Promise<string>) => void;
  onTriggerAttachRef?: (triggerFn: () => Promise<void>) => void;
  onUnreadCountUpdate?: (serviceId: string, count: number) => void;
}

export const WebviewContainer: React.FC<WebviewContainerProps> = ({
  services,
  activeServiceId,
  soundEnabled = true,
  onWebviewReloadRef,
  onGetActiveTextRef,
  onTriggerAttachRef,
  onUnreadCountUpdate,
}) => {
  const webviewRefs = useRef<Record<string, any>>({});
  const lastUnreadCounts = useRef<Record<string, number>>({});
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Lazy loading state: tracks which services have been opened at least once
  const [loadedServiceIds, setLoadedServiceIds] = useState<Set<string>>(
    new Set([activeServiceId])
  );

  // Lazy load current active service if not loaded yet
  useEffect(() => {
    setLoadedServiceIds((prev) => {
      if (!prev.has(activeServiceId)) {
        const updated = new Set(prev);
        updated.add(activeServiceId);
        return updated;
      }
      return prev;
    });

    // Reset unread count for the active service when user views it
    if (onUnreadCountUpdate) {
      lastUnreadCounts.current[activeServiceId] = 0;
      onUnreadCountUpdate(activeServiceId, 0);
    }
  }, [activeServiceId, onUnreadCountUpdate]);

  useEffect(() => {
    if (onWebviewReloadRef) {
      onWebviewReloadRef(() => {
        const activeWebview = webviewRefs.current[activeServiceId];
        if (activeWebview && typeof activeWebview.reload === 'function') {
          activeWebview.reload();
        }
      });
    }
  }, [activeServiceId, onWebviewReloadRef]);

  useEffect(() => {
    if (onTriggerAttachRef) {
      onTriggerAttachRef(async () => {
        const activeWebview = webviewRefs.current[activeServiceId];
        if (!activeWebview || typeof activeWebview.executeJavaScript !== 'function') return;
        try {
          await activeWebview.executeJavaScript(`
            (function() {
              const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
              if (fileInputs.length > 0) {
                fileInputs[0].click();
                return;
              }
              const attachBtn = document.querySelector(
                '.btn-attach-file, [title*="gửi file"], [aria-label*="gửi file"], [aria-label*="Đính kèm"], [aria-label*="Attach"], [data-icon="attach-menu-plus"]'
              );
              if (attachBtn) {
                attachBtn.click();
              }
            })()
          `);
        } catch (err) {
          console.error('Failed to trigger webview attach:', err);
        }
      });
    }
  }, [activeServiceId, onTriggerAttachRef]);

  useEffect(() => {
    if (onGetActiveTextRef) {
      onGetActiveTextRef(async (): Promise<string> => {
        const activeWebview = webviewRefs.current[activeServiceId];
        if (!activeWebview || typeof activeWebview.executeJavaScript !== 'function') {
          return '';
        }
        try {
          const selectedText = await activeWebview.executeJavaScript(
            'window.getSelection ? window.getSelection().toString() : ""'
          );
          if (selectedText && selectedText.trim().length > 0) {
            return selectedText.trim();
          }

          const extractedText = await activeWebview.executeJavaScript(`
            (function() {
              const selectors = [
                '#chatMessageList',              // Zalo Web
                '[role="main"]',                 // Facebook Messenger
                '.chat-history',                 // Telegram Web
                '.messages-container',           // Telegram Web v2
                '#main',                         // WhatsApp Web
                '.ts-message-list',              // MS Teams
                '.a3s',                          // Gmail Email Body
                'main'
              ];
              for (const s of selectors) {
                const el = document.querySelector(s);
                if (el && el.innerText && el.innerText.trim().length > 30) {
                  return el.innerText.trim();
                }
              }
              return document.body ? document.body.innerText.trim() : '';
            })()
          `);

          return extractedText || '';
        } catch (err) {
          console.error('Failed to extract text from active webview:', err);
          return '';
        }
      });
    }
  }, [activeServiceId, onGetActiveTextRef]);

  // Continuous background unread count DOM & Title watcher polling
  useEffect(() => {
    const intervalId = setInterval(async () => {
      for (const serviceId of Array.from(loadedServiceIds)) {
        // Skip count polling for active tab as user is currently viewing it
        if (serviceId === activeServiceId) continue;

        const webview = webviewRefs.current[serviceId];
        if (!webview || typeof webview.executeJavaScript !== 'function') continue;

        try {
          const detectedCount = await webview.executeJavaScript(`
            (function() {
              try {
                // 1. Extract count from document.title
                const title = document.title || '';
                const match = title.match(/\\((\\d+)\\)/) || title.match(/\\[(\\d+)\\]/);
                if (match) {
                  const num = parseInt(match[1], 10);
                  if (!isNaN(num) && num > 0) return num;
                }

                // 2. Scan DOM for unread badge indicators across Telegram, Zalo, WhatsApp, Teams, Mail
                const badgeSelectors = [
                  '.badge.unread', '.unread-count', '.chat-item-badge', '.badge',
                  '.unread-badge', '.tab-unread', '.nav-unread', '.bubble-unread',
                  '[aria-label*="unread"]', '[aria-label*="chưa đọc"]',
                  '.app-bar-badge', '.ts-unread-badge', '.bsU'
                ];
                let sum = 0;
                for (const sel of badgeSelectors) {
                  const nodes = document.querySelectorAll(sel);
                  nodes.forEach(node => {
                    const txt = node.innerText ? node.innerText.trim() : '';
                    const val = parseInt(txt, 10);
                    if (!isNaN(val) && val > 0 && val < 999) {
                      sum += val;
                    }
                  });
                  if (sum > 0) break;
                }
                return sum;
              } catch(e) {
                return 0;
              }
            })()
          `);

          if (typeof detectedCount === 'number' && onUnreadCountUpdate) {
            onUnreadCountUpdate(serviceId, detectedCount);
          }
        } catch (err) {
          // Ignore background polling errors for unmounted webviews
        }
      }
    }, 2500);

    return () => clearInterval(intervalId);
  }, [loadedServiceIds, activeServiceId, onUnreadCountUpdate]);

  // Handle Windows Drag Over - Changes 🚫 cursor to "+" Copy cursor
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDraggingFile) setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  // Convert dropped files into Base64 Data URLs and inject them into Webview DOM
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const activeWebview = webviewRefs.current[activeServiceId];
    if (!activeWebview || typeof activeWebview.executeJavaScript !== 'function') return;

    const readFileAsDataUrl = (file: File): Promise<{ name: string; type: string; dataUrl: string }> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve({
            name: file.name,
            type: file.type || 'application/octet-stream',
            dataUrl: reader.result as string,
          });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const fileDataList = await Promise.all(files.map(readFileAsDataUrl));

      await activeWebview.executeJavaScript(`
        (async function() {
          try {
            const filesData = ${JSON.stringify(fileDataList)};
            const dt = new DataTransfer();

            for (const item of filesData) {
              const res = await fetch(item.dataUrl);
              const blob = await res.blob();
              const file = new File([blob], item.name, { type: item.type });
              dt.items.add(file);
            }

            const target = document.activeElement || 
                           document.querySelector('#chatMessageList') || 
                           document.querySelector('[role="main"]') || 
                           document.querySelector('#main') || 
                           document.querySelector('.chat-history') || 
                           document.querySelector('.messages-container') || 
                           document.body;

            // 1. Dispatch synthetic 'drop' event
            const dropEvt = new DragEvent('drop', {
              bubbles: true,
              cancelable: true,
              dataTransfer: dt
            });
            target.dispatchEvent(dropEvt);

            // 2. Dispatch synthetic 'paste' event (Zalo, Messenger, Telegram, WhatsApp support File paste)
            const pasteEvt = new ClipboardEvent('paste', {
              bubbles: true,
              cancelable: true,
              clipboardData: dt
            });
            target.dispatchEvent(pasteEvt);

            // 3. Fallback: If input[type="file"] exists, populate files property & dispatch change event
            const fileInputs = document.querySelectorAll('input[type="file"]');
            if (fileInputs.length > 0) {
              try {
                fileInputs[0].files = dt.files;
                fileInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
              } catch (e) {
                console.log('FileInput fallback:', e);
              }
            }
          } catch (err) {
            console.error('Injected drop handler error:', err);
          }
        })()
      `);
    } catch (err) {
      console.error('Error handling file drop in WebviewContainer:', err);
    }
  };

  const attachWebviewRef = (serviceId: string, el: any) => {
    if (!el) return;
    if (webviewRefs.current[serviceId] === el) return;
    webviewRefs.current[serviceId] = el;

    const parseCountFromTitle = (title: string): number => {
      const match = title.match(/\((\d+)\)/);
      if (match) return parseInt(match[1], 10);

      const altMatch = title.match(/\[(\d+)\]/);
      if (altMatch) return parseInt(altMatch[1], 10);

      return 0;
    };

    const handleTitleUpdate = (e: any) => {
      const title = e.title || '';
      const newCount = parseCountFromTitle(title);

      if (onUnreadCountUpdate) {
        onUnreadCountUpdate(serviceId, newCount);
      }
    };

    const handleNewWindow = (e: any) => {
      const url = e.url;
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        e.preventDefault();
        if (window.electronAPI && typeof window.electronAPI.openExternalLink === 'function') {
          window.electronAPI.openExternalLink(url);
        }
      }
    };

    const handleWillNavigate = (e: any) => {
      const url = e.url;
      if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) return;
      const targetService = services.find((s) => s.id === serviceId);
      if (!targetService) return;

      try {
        const targetHost = new URL(url).hostname;
        const serviceHost = new URL(targetService.url).hostname;
        const cleanServiceHost = serviceHost.replace(/^(web|chat|app)\./, '');

        if (!targetHost.includes(cleanServiceHost)) {
          e.preventDefault();
          if (window.electronAPI && typeof window.electronAPI.openExternalLink === 'function') {
            window.electronAPI.openExternalLink(url);
          }
        }
      } catch {}
    };

    const handleConsoleMessage = (e: any) => {
      const msg = e.message || '';
      if (msg.startsWith('__BOXX_OPEN_EXTERNAL__:')) {
        const url = msg.substring('__BOXX_OPEN_EXTERNAL__:'.length).trim();
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          if (window.electronAPI && typeof window.electronAPI.openExternalLink === 'function') {
            window.electronAPI.openExternalLink(url);
          }
        }
      }
    };

    const handleDomReady = () => {
      // Auto-grant HTML5 Notification permissions & Intercept link clicks in webview
      el.executeJavaScript(`
        (function() {
          try {
            if (window.Notification) {
              window.Notification.permission = 'granted';
              window.Notification.requestPermission = function() { return Promise.resolve('granted'); };
            }

            if (!window.__boxx_link_listener_attached) {
              window.__boxx_link_listener_attached = true;

              // 1. Override window.open inside webview
              const origOpen = window.open;
              window.open = function(url, target, features) {
                if (url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
                  console.log('__BOXX_OPEN_EXTERNAL__:' + url);
                  return null;
                }
                return origOpen ? origOpen.apply(this, arguments) : null;
              };

              // 2. Global capture click listener for <a> tags
              document.addEventListener('click', function(e) {
                const anchor = e.target ? e.target.closest('a') : null;
                if (!anchor) return;
                const href = anchor.href || anchor.getAttribute('href');
                if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;

                try {
                  const targetHost = new URL(href).hostname;
                  const currentHost = window.location.hostname;
                  const cleanCurrent = currentHost.replace(/^(web|chat|app)\./, '');

                  if (!targetHost.includes(cleanCurrent) || anchor.target === '_blank') {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('__BOXX_OPEN_EXTERNAL__:' + href);
                  }
                } catch(err) {
                  console.log('__BOXX_OPEN_EXTERNAL__:' + href);
                }
              }, true);
            }
          } catch(e) {}
        })()
      `).catch(() => {});
    };

    el.removeEventListener('page-title-updated', handleTitleUpdate);
    el.addEventListener('page-title-updated', handleTitleUpdate);

    el.removeEventListener('dom-ready', handleDomReady);
    el.addEventListener('dom-ready', handleDomReady);

    el.removeEventListener('new-window', handleNewWindow);
    el.addEventListener('new-window', handleNewWindow);

    el.removeEventListener('will-navigate', handleWillNavigate);
    el.addEventListener('will-navigate', handleWillNavigate);

    el.removeEventListener('console-message', handleConsoleMessage);
    el.addEventListener('console-message', handleConsoleMessage);
  };

  const activeServiceObj = services.find((s) => s.id === activeServiceId);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 h-full w-full bg-slate-900 relative overflow-hidden"
    >
      {/* Floating Drag & Drop Indicator Banner */}
      {isDraggingFile && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-indigo-950/95 border border-indigo-500/80 shadow-2xl rounded-2xl px-6 py-3.5 flex items-center gap-3 backdrop-blur-md animate-bounce pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-400">
            <UploadCloud className="w-6 h-6 animate-pulse text-indigo-300" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
              <FileUp className="w-4 h-4 text-emerald-400" />
              Thả tệp để gửi ngay qua {activeServiceObj?.name || 'ứng dụng'}
            </h3>
            <p className="text-[11px] text-slate-300">Tự động nạp file vào khung chat của bạn</p>
          </div>
        </div>
      )}

      {services.map((service) => {
        const isLoaded = loadedServiceIds.has(service.id);
        const isActive = service.id === activeServiceId;

        if (!isLoaded) {
          return null;
        }

        return (
          <div
            key={service.id}
            className="w-full h-full absolute inset-0"
            style={{ display: isActive ? 'block' : 'none' }}
          >
            <webview
              ref={(el) => attachWebviewRef(service.id, el)}
              id={`webview-${service.id}`}
              src={service.url}
              partition={service.partition}
              className="w-full h-full border-none bg-slate-900"
              allowpopups={true}
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
            />
          </div>
        );
      })}
    </div>
  );
};
