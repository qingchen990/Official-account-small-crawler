// 保存当前的下载监听器引用和下载ID
let currentDownloadListener = null;
let currentDownloadId = null;

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveArticle') {
    try {
      // 如果当前有正在进行的下载，不启动新的下载
      if (currentDownloadId !== null) {
        sendResponse({ success: false, error: '当前有正在进行的下载，请等待完成' });
        return true;
      }

      // 获取当前时间戳
      const timestamp = Date.now();
      
      // 创建文件名
      const filename = `weixin_${timestamp}.txt`;
      
      // 使用从content script接收到的Blob URL进行下载
      const blobUrl = message.blobUrl;
      
      // 移除所有可能存在的旧监听器
      if (currentDownloadListener) {
        chrome.downloads.onChanged.removeListener(currentDownloadListener);
        currentDownloadListener = null;
      }

      // 使用chrome.downloads API保存文件
      chrome.downloads.download({
        url: blobUrl,
        filename: filename
      }, (id) => {
        if (chrome.runtime.lastError) {
          // 通知content script下载失败，让它释放Blob URL
          chrome.tabs.sendMessage(sender.tab.id, { 
            success: false, 
            error: chrome.runtime.lastError.message,
            action: 'downloadComplete'
          });
          currentDownloadId = null;
          return;
        }
        // 保存downloadId
        currentDownloadId = id;
      });

      // 创建新的下载监听器
      const downloadListener = function(delta) {
        if (delta.id === currentDownloadId && delta.state) {
          if (delta.state.current === 'complete') {
            // 获取下载项信息
            chrome.downloads.search({id: currentDownloadId}, function(items) {
              if (items && items[0]) {
                const filePath = items[0].filename;
                // 打开文件所在文件夹
                chrome.downloads.show(currentDownloadId);
                // 确保在获取到文件路径后再发送响应
                chrome.tabs.sendMessage(sender.tab.id, { 
                  success: true, 
                  filePath: filePath 
                });
              }
              // 清理所有状态
              chrome.downloads.onChanged.removeListener(downloadListener);
              currentDownloadListener = null;
              currentDownloadId = null;
            });
          } else if (delta.state.current === 'interrupted') {
            console.error('下载中断:', delta.error && delta.error.current);
            chrome.tabs.sendMessage(sender.tab.id, { 
              success: false, 
              error: '下载中断' 
            });
            // 清理所有状态
            chrome.downloads.onChanged.removeListener(downloadListener);
            currentDownloadListener = null;
            currentDownloadId = null;
          }
        }
      };
      
      // 先注册监听器，再开始下载
      chrome.downloads.onChanged.addListener(downloadListener);
      currentDownloadListener = downloadListener;

      // 初始响应，表示开始下载
      sendResponse({ success: true, message: '开始下载文件' });
      
      // 清理之前的Blob URL
      if (message.blobUrl) {
        URL.revokeObjectURL(message.blobUrl);
      }

      
      return true; // 保持消息通道开放，以便异步响应
    } catch (error) {
      sendResponse({ success: false, error: error.message });
      return true;
    }
  }
  return true;
});