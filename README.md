# 青筮问道

青筮问道是一个移动端传统文化工具网站，包含首页、应用页、八字档案与排盘、八字合盘、六爻起卦和六十四卦资料。

## 目录结构

```text
.
├─ frontend/                 # 可直接部署到 GitHub Pages 的静态网站
│  ├─ index.html             # 首页
│  ├─ applications.html      # 应用页
│  ├─ bazi.html              # 档案录入
│  ├─ chart.html             # 八字排盘
│  ├─ hepan.html             # 八字合盘
│  ├─ liuyao.html            # 六爻占卜
│  ├─ app/                   # 样式与交互脚本
│  ├─ assets/                # 图片资源
│  ├─ public/                # 地区数据与站点图标
│  └─ api/                   # GitHub Pages 使用的静态数据
├─ backend/                  # 可选的本地 Node.js 服务
├─ tools/                    # 项目检查工具
└─ .github/workflows/        # GitHub Pages 自动发布配置
```

## 本地运行

需要 Node.js 18 或更高版本，无需安装第三方依赖。

```powershell
npm start
```

浏览器打开：<http://127.0.0.1:8765>

也可以在 Windows 中运行：

```powershell
.\start-local.ps1
```

## 项目检查

```powershell
npm run check
```

其中 `check:pages` 会检查 GitHub Pages 所需的相对路径、静态资源和 JSON 数据。

## Cloudflare Pages

- 构建命令：`npm run build`
- 构建输出目录：`dist`
- Node.js 版本：18 或更高版本

构建过程会先检查静态资源与数据，再把 `frontend/` 完整复制到 `dist/`。

## 发布到 GitHub Pages

1. 新建 GitHub 仓库并把本目录内容推送到 `main` 分支。
2. 在仓库的 **Settings → Pages** 中，将 Source 设为 **GitHub Actions**。
3. 推送后，`.github/workflows/pages.yml` 会自动检查并发布 `frontend/`。
4. 部署完成后，可从仓库的 **Actions** 或 **Settings → Pages** 查看网址。

所有页面和资源均使用相对路径，因此既支持用户主页仓库，也支持 `用户名.github.io/仓库名/` 形式的项目站点。

## 数据与隐私

- 八字档案默认保存在访问者浏览器的本地存储中。
- GitHub Pages 是静态托管，无法保存服务端档案，也不会上传个人出生资料。
- 八字神煞、合盘基础数据和六爻资料已经放入 `frontend/api/`，静态部署后可直接读取。
- 可选的 AI 合盘增强需要本地后端及相应环境变量；静态站点会自动使用内置分析结果。
