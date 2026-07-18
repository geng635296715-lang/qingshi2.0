$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $ProjectRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "未找到 Node.js。请先安装 Node.js 18 或更高版本。"
}

Write-Host "正在启动青筮问道八字网页……"
Write-Host "打开地址：http://127.0.0.1:8765"
node backend/server.mjs

