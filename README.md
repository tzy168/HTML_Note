# HTML Note

一个基于 GitHub Pages 的 HTML 文件导航系统。
https://tzy168.github.io/HTML_Note/

## 目录结构

```
.
├── pages/              # 存放 HTML 文件的目录
│   ├── 示例/
│   │   └── 子目录/
│   └── ...
├── index.html          # 系统首页
├── build.js            # 生成索引脚本
├── index.json          # 自动生成的文件索引
└── .github/
    └── workflows/
        └── build.yml   # GitHub Actions 配置
```

## 使用方法

### 1. 添加 HTML 文件

将 `.html` 文件放入 `pages/` 目录下，支持子目录分级：

```
pages/
├── 前端/
│   ├── CSS技巧.html
│   └── JavaScript.html
├── 后端/
│   └── Nodejs.html
└── 笔记.html
```

### 2. 推送至 GitHub

```bash
git add .
git commit -m "添加新文件"
git push
```

推送后 GitHub Actions 会自动运行 `build.js`，更新 `index.json` 索引。

### 3. 访问首页

打开 GitHub Pages 地址，左侧导航树会自动显示所有 HTML 文件，点击即可在右侧预览。

## 本地预览

```bash
# 生成索引
node build.js

# 启动本地服务器
npx serve .
```
