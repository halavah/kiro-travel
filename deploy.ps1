
# Set console encoding to UTF-8
$OutputEncoding = [System.Console]::OutputEncoding = [System.Console]::InputEncoding = [System.Text.Encoding]::UTF8

function Show-Menu {
    Clear-Host
    Write-Host "═══════════════════════════════════════════════════════════"
    Write-Host "  Kiro Travel 部署工具"
    Write-Host "═══════════════════════════════════════════════════════════"
    Write-Host ""

    Write-Host "  1. 🚀 部署到 Vercel"
    Write-Host "     → 部署到 Vercel Serverless 平台"
    Write-Host "     ⚠️  注意: Vercel 不支持 SQLite 持久化"
    Write-Host ""

    Write-Host "  2. 🌐 部署到 Render"
    Write-Host "     → 触发 Render Web Service 重新部署"
    Write-Host ""

    Write-Host "  3. ⚙️  部署到 1Panel（腾讯云）"
    Write-Host "     → SSH 部署到腾讯云服务器"
    Write-Host ""

    Write-Host "═══════════════════════════════════════════════════════════"
    Write-Host ""

    Write-Host "  4. 🗄️  初始化 1Panel 数据库"
    Write-Host "     → 初始化腾讯云 SQLite 数据库"
    Write-Host ""

    Write-Host "  5. 🔄 重启 1Panel 服务"
    Write-Host "     → 重启 PM2 进程"
    Write-Host ""

    Write-Host "═══════════════════════════════════════════════════════════"
    Write-Host ""

    Write-Host "  9. 🚪 退出"
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════"
    Write-Host ""
}

function Run-Script {
    param (
        [string]$ScriptName,
        [string]$Header
    )

    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════"
    Write-Host "  $Header"
    Write-Host "════════════════════════════════════════════════════════════"
    Write-Host ""

    $ScriptPath = Join-Path $BinDir $ScriptName
    if (Test-Path $ScriptPath) {
        Write-Host "[信息] 正在执行: $ScriptName"
        & $ScriptPath
    } else {
        Write-Host "[错误] 脚本未找到: $ScriptPath"
    }
}

$ScriptDir = $PSScriptRoot
$BinDir = Join-Path $ScriptDir "bin"

while ($true) {
    Show-Menu
    $choice = Read-Host "请选择操作 [1-5, 9]"

    switch ($choice) {
        "1" {
            Run-Script "deploy-vercel.ps1" "执行: 部署到 Vercel"
        }
        "2" {
            Run-Script "deploy-render.ps1" "执行: 部署到 Render"
        }
        "3" {
            Run-Script "deploy-1panel.ps1" "执行: 部署到 1Panel（腾讯云）"
        }
        "4" {
            Run-Script "deploy-1panel-init-db.ps1" "执行: 初始化 1Panel 数据库"
        }
        "5" {
            Run-Script "deploy-1panel-restart.ps1" "执行: 重启 1Panel 服务"
        }
        "9" {
            Write-Host "再见!"
            exit 0
        }
        default {
            Write-Host "[错误] 无效的选项"
        }
    }

    Write-Host ""
    Read-Host "按 Enter 键返回主菜单"
}
