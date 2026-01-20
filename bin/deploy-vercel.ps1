
# Set console encoding to UTF-8
$OutputEncoding = [System.Console]::OutputEncoding = [System.Console]::InputEncoding = [System.Text.Encoding]::UTF8

Write-Host "============================================================"
Write-Host "   🚀 部署 Kiro Travel 到 Vercel"
Write-Host "============================================================"
Write-Host ""

$ScriptDir = $PSScriptRoot
$ProjectRoot = Split-Path $ScriptDir -Parent
$EnvFile = Join-Path $ProjectRoot ".env.vercel"

# 检查 .env.vercel 文件是否存在
if (-not (Test-Path $EnvFile)) {
    Write-Host "[错误] 环境配置文件不存在: $EnvFile"
    exit 1
}

# 检查 Vercel CLI 是否安装
try {
    $null = Get-Command vercel -ErrorAction Stop
} catch {
    Write-Host "[错误] Vercel CLI 未安装"
    Write-Host ""
    Write-Host "请先安装 Vercel CLI:"
    Write-Host "  npm install -g vercel"
    exit 1
}

Write-Host "[信息] 环境配置: .env.vercel"
Write-Host ""

# 警告：SQLite 数据库限制
Write-Host "[警告] 重要提示："
Write-Host "   Vercel Serverless 环境不支持持久化文件系统"
Write-Host "   SQLite 数据库在每次部署后会丢失"
Write-Host "   建议改用 Vercel Postgres / Neon / Supabase"
Write-Host ""
$confirm = Read-Host "是否继续部署到 Vercel? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "部署已取消"
    exit 0
}

Set-Location $ProjectRoot

# 部署到 Vercel
Write-Host ""
Write-Host "[信息] 正在部署到 Vercel..."
Write-Host ""

# 使用 --prod 参数部署到生产环境
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[成功] 部署成功！"
    Write-Host ""
    Write-Host "[信息] 请访问 Vercel Dashboard 查看部署详情"
    Write-Host "   https://vercel.com/dashboard"
} else {
    Write-Host ""
    Write-Host "[错误] 部署失败"
    exit 1
}
