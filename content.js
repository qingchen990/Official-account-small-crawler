// 监听来自popup和background的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 处理下载完成的消息
  if (message.action === 'downloadComplete') {
    // 如果下载失败，释放Blob URL
    if (!message.success) {
      URL.revokeObjectURL(message.blobUrl);
      return;
    }
  }

  if (message.action === 'crawlArticle') {
    try {
      // 获取文章标题
      const title = document.querySelector('#activity-name')?.textContent.trim() || '无标题';
      
      // 获取文章作者
      const author = document.querySelector('#js_name')?.textContent.trim() || '未知作者';
      
      // 获取发布时间
      const publishTime = document.querySelector('#publish_time')?.textContent.trim() || '未知时间';
      
      // 获取文章正文内容
      const contentElement = document.getElementById('js_content');
      if (!contentElement) {
        sendResponse({ success: false, error: '无法找到文章内容' });
        return true;
      }
      
      // 移除所有的样式，保留纯文本
      const clonedContent = contentElement.cloneNode(true);
      
      // 移除所有脚本标签
      const scripts = clonedContent.querySelectorAll('script');
      scripts.forEach(script => script.remove());
      
      // 移除所有样式标签
      const styles = clonedContent.querySelectorAll('style');
      styles.forEach(style => style.remove());
      
      // 获取所有文本内容
      let textContent = '';
      
      // 处理所有内容元素，包括段落、标题、图片等
      const allElements = clonedContent.querySelectorAll('*');
      allElements.forEach(el => {
        // 处理段落和文本节点
        if (el.tagName === 'P' || el.tagName === 'SECTION' || el.tagName === 'DIV') {
          const text = el.textContent.trim();
          if (text && !el.querySelector('p, section, div')) { // 避免重复内容
            textContent += text + '\n\n';
          }
        }
        
        // 处理图片
        if (el.tagName === 'IMG') {
          const alt = el.getAttribute('alt') || '图片';
          const src = el.getAttribute('data-src') || el.getAttribute('src');
          if (src) {
            textContent += `[${alt}]\n图片链接: ${src}\n\n`;
          }
        }
        
        // 处理标题
        if (el.tagName && el.tagName.match(/^H[1-6]$/)) {
          textContent += el.textContent.trim() + '\n\n';
        }
      });
      
      // 如果没有找到内容，则获取所有文本
      if (textContent.trim() === '') {
        textContent = clonedContent.textContent.trim();
      }
      
      // 移除多余的空行
      textContent = textContent.replace(/\n{3,}/g, '\n\n');
      
      // 组装完整的文章内容
      const fullContent = `标题：${title}\n作者：${author}\n发布时间：${publishTime}\n\n正文：\n${textContent}`;
      
      // 创建Blob对象和URL
      const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);

      // 发送消息给background script处理保存
      chrome.runtime.sendMessage({
        action: 'saveArticle',
        content: fullContent,
        blobUrl: blobUrl
      }, (response) => {
        if (chrome.runtime.lastError) {
          URL.revokeObjectURL(blobUrl);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        
        // 处理响应
        if (response && response.success) {
          if (response.filePath) {
            sendResponse({ success: true, filePath: response.filePath });
          } else if (response.message) {
            sendResponse({ success: true, message: response.message });
          }
        } else {
          sendResponse({ success: false, error: response.error || '保存失败' });
        }
      });
      
      return true; // 保持消息通道开放，以便异步响应
    } catch (error) {
      sendResponse({ success: false, error: error.message });
      return true;
    }
  }
  return true;
});