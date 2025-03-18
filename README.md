# 微信公众号文章爬取器

一个简单易用的Chrome扩展，用于爬取微信公众号文章内容并保存到本地。

## 功能特点

- 一键爬取微信公众号文章内容
- 自动提取文章标题、作者、发布时间等信息
- 保留文章的文本内容和图片链接
- 将内容保存为本地文本文件
- 支持自动打开保存位置

## 使用方法

1. 在Chrome浏览器中安装此扩展
2. 打开任意微信公众号文章页面
3. 点击浏览器工具栏中的扩展图标
4. 点击"爬取当前文章"按钮
5. 文章内容将自动保存到本地文件

## 技术实现

- 使用Chrome Extension Manifest V3
- 通过Content Script实现文章内容提取
- 使用Background Service Worker处理文件下载
- 简洁的Popup界面提供用户交互

## 注意事项

- 仅支持微信公众号文章页面
- 需要Chrome浏览器版本支持Manifest V3
- 请遵守相关法律法规和微信平台的使用条款
