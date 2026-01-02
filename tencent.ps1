
# Set console encoding to UTF-8
$OutputEncoding = [System.Console]::OutputEncoding = [System.Console]::InputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = $PSScriptRoot
$BinDir = Join-Path $ScriptDir "bin"

# 执行脚本
function Run-Script {
    param($scriptName)
    $scriptPath = Join-Path $BinDir $scriptName
    if (Test-Path $scriptPath) {
        Write-Host "[信息] 正在执行: $scriptName"
        Push-Location $BinDir
        & $scriptPath
        Pop-Location
    } else {
        Write-Host "[错误] 脚本未找到: $scriptPath"
    }
}

# 显示菜单
function Show-Menu {
    Clear-Host
    Write-Host "==============================================================="
    Write-Host "   Kiro Travel - 腾讯云部署工具"
    Write-Host "==============================================================="
    Write-Host ""
    Write-Host "   1. 🚀 部署到腾讯云"
    Write-Host "      -> 构建并部署 Next.js 应用（使用 PM2）"
    Write-Host ""
    Write-Host "   2. 🔄 重启服务"
    Write-Host "      -> 重启 PM2 进程和 Nginx"
    Write-Host ""
    Write-Host "   3. 🗄️  初始化数据库（远程）"
    Write-Host "      -> 远程执行数据库初始化脚本"
    Write-Host ""
    Write-Host "==============================================================="
    Write-Host ""
    Write-Host "   9. 🚪 退出"
    Write-Host ""
    Write-Host "==============================================================="
    Write-Host ""
}

# 主循环
while ($true) {
    Show-Menu
    $choice = Read-Host "请选择操作 [1-3, 9]"

    switch ($choice) {
        "1" {
            Write-Host "`n============================================================"
            Write-Host "   执行: 部署到腾讯云"
            Write-Host "============================================================`n"
            Run-Script "tencent-deploy.ps1"
        }
        "2" {
            Write-Host "`n============================================================"
            Write-Host "   执行: 重启服务"
            Write-Host "============================================================`n"
            Run-Script "tencent-restart.ps1"
        }
        "3" {
            Write-Host "`n============================================================"
            Write-Host "   执行: 初始化数据库（远程）"
            Write-Host "============================================================`n"
            Run-Script "tencent-init-db.ps1"
        }
        "9" {
            Write-Host "再见!"
            exit 0
        }
        Default {
            Write-Host "`n[错误] 无效的选项: $choice"
            Start-Sleep -Seconds 2
        }
    }

    Write-Host ""
    Read-Host "按 Enter 键返回主菜单..."
}
