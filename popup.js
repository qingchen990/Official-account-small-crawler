document.addEventListener('DOMContentLoaded', function() {
  const crawlBtn = document.getElementById('crawlBtn');
  const statusDiv = document.getElementById('status');
  let isProcessing = false;
  let timeoutId = null;
  
  crawlBtn.addEventListener('click', async () => {
    if (isProcessing) {
      statusDiv.textContent = '正在处理中，请稍候...';
      return;
    }
    
    isProcessing = true;
    crawlBtn.disabled = true;
    statusDiv.textContent = '正在爬取...';
    
    try {
      // 获取当前标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检查当前页面是否是微信公众号文章页面
      if (!tab.url || !tab.url.includes('mp.weixin.qq.com')) {
        statusDiv.textContent = '错误: 当前页面不是微信公众号文章页面';
        return;
      }
      
      // 注入content script确保它已加载
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      // 向content script发送消息
      // 设置30秒超时
      timeoutId = setTimeout(() => {
        statusDiv.textContent = '爬取超时，请重试';
        isProcessing = false;
        crawlBtn.disabled = false;
      }, 30000);

      chrome.tabs.sendMessage(tab.id, { action: 'crawlArticle' }, (response) => {
        clearTimeout(timeoutId);
        isProcessing = false;
        crawlBtn.disabled = false;

        if (chrome.runtime.lastError) {
          statusDiv.textContent = '错误: ' + chrome.runtime.lastError.message;
          console.error('发送消息错误:', chrome.runtime.lastError);
          return;
        }
        
        if (response && response.success) {
          if (response.filePath) {
            statusDiv.textContent = `爬取成功！文件已保存到：${response.filePath}`;
          } else {
            statusDiv.textContent = '爬取成功！文件已保存。';
          }
        } else {
          statusDiv.textContent = '爬取失败: ' + (response && response.error ? response.error : '未知错误');
        }
      });

    } catch (error) {
      clearTimeout(timeoutId);
      isProcessing = false;
      crawlBtn.disabled = false;
      statusDiv.textContent = '错误: ' + error.message;
      console.error('爬取过程出错:', error);
    }
  });
});
// 这里不需要额外的右花括号，因为它已经在前面的代码块中闭合了
