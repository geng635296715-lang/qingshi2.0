# 青筮问道八字网页

这是从青筮记项目中整理出的独立网页工程，已按前端、后端和运行数据分层，可直接保存到 GitHub，也可在安装 Node.js 后本地运行。

## 项目结构

```text
qingshiwendao-bazi/
├─ frontend/                  # 手机端网页
│  ├─ index.html              # 首页
│  ├─ bazi.html               # 八字信息录入
│  ├─ chart.html              # 八字排盘与解析
│  ├─ app/                    # 页面样式和功能脚本
│  └─ public/                 # 地区数据、图标等静态资源
├─ backend/
│  ├─ server.mjs              # 静态页面及数据接口服务
│  └─ data/                   # 网页运行所需神煞规则数据
├─ package.json               # 项目信息和启动命令
├─ start-local.ps1            # Windows 一键启动脚本
└─ .gitignore                 # Git 忽略规则
```

## 本地启动

运行环境：Node.js 18 或更高版本。本项目没有第三方运行依赖，不需要安装 `node_modules`。

方式一：在项目目录运行：

```powershell
npm start
```

方式二：在 Windows PowerShell 中运行：

```powershell
.\start-local.ps1
```

启动后访问：<http://127.0.0.1:8765>

如需更换端口：

```powershell
$env:PORT=8876
npm start
```

## 页面与接口

- `/`：手机端首页
- `/bazi.html`：八字信息录入和档案管理
- `/chart.html`：八字命帖、流运、干支关系、古籍参考和流派详析
- `/api/shensha-rules.json`：神煞可执行规则
- `/api/shensha-wenzhen.json`：问真口径规则数据
- `/api/shensha-profiles.json`：神煞兼容显示配置
- `/api/shensha-catalog.json`：神煞基础资料

人物档案当前保存在访问者浏览器的本地存储中；后端只负责网页资源和规则数据的读取，不会上传个人出生资料。

## 检查项目

```powershell
npm run check
```

## 提交到 GitHub

在本目录中执行：

```powershell
git init
git add .
git commit -m "Initial qingshiwendao bazi web app"
git branch -M main
git remote add origin https://github.com/你的用户名/qingshiwendao-bazi.git
git push -u origin main
```

项目中的古籍全文、研究文档和原始数据库没有被整体复制；仅收录了网页实际运行所需的规则 JSON，避免仓库夹带无关资料或继续依赖原工作区路径。

