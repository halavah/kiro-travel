
# Set console encoding to UTF-8
$OutputEncoding = [System.Console]::OutputEncoding = [System.Console]::InputEncoding = [System.Text.Encoding]::UTF8

Write-Host "============================================================"
Write-Host "   🚀 部署 Kiro Travel 到 Render"
Write-Host "============================================================"
Write-Host ""

$ScriptDir = $PSScriptRoot
$ProjectRoot = Split-Path $ScriptDir -Parent
$EnvFile = Join-Path $ProjectRoot ".env.render"

# 检查 .env.render 文件是否存在
if (-not (Test-Path $EnvFile)) {
    Write-Host "[错误] 环境配置文件不存在: $EnvFile"
    exit 1
}

# 加载环境变量
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

$DeployHook = [System.Environment]::GetEnvironmentVariable("RENDER_DEPLOY_HOOK")

# 检查 Deploy Hook URL 是否配置
if ([string]::IsNullOrWhiteSpace($DeployHook)) {
    Write-Host "[错误] RENDER_DEPLOY_HOOK 未配置"
    Write-Host ""
    Write-Host "请在 $EnvFile 中配置 Deploy Hook URL"
    Write-Host "获取方式: Render Dashboard > kiro-travel > Settings > Deploy Hook"
    exit 1
}

$DisplayUrl = if ($DeployHook.Length -gt 50) { $DeployHook.Substring(0, 50) + "..." } else { $DeployHook }
Write-Host "[信息] Deploy Hook URL: $DisplayUrl"
Write-Host ""

# 触发部署
Write-Host "[信息] 正在触发 Render 部署..."
try {
    $Response = Invoke-WebRequest -Uri $DeployHook -Method POST -UseBasicParsing
    Write-Host "[成功] 部署请求已发送"
    Write-Host ""
    Write-Host "[信息] 请访问 Render Dashboard 查看部署进度"
    Write-Host "   https://dashboard.render.com/"
} catch {
    Write-Host "[错误] 部署请求失败: $_"
    exit 1
}
