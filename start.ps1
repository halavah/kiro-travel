# ##########################################################################
# #                                                                        #
# #       Kiro Travel 项目启动菜单 (PowerShell 版本)                       #
# #                                                                        #
# ##########################################################################

# 切换到脚本所在目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# 清屏
Clear-Host

# 颜色输出函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# 显示菜单
Write-ColorOutput Cyan "========================================"
Write-ColorOutput Green "  Kiro Travel 项目启动菜单"
Write-ColorOutput Cyan "========================================"
Write-Output ""
Write-ColorOutput Yellow "开发模式:"
Write-Output "  1) 开发服务器 (npm run dev)"
Write-Output "  2) 完整重启 (清理 + 重启) [推荐]"
Write-Output ""
Write-ColorOutput Yellow "生产模式:"
Write-Output "  3) 构建项目 (npm run build)"
Write-Output "  4) 启动生产服务器 (npm run start)"
Write-Output "  5) 构建并启动生产服务器"
Write-Output ""
Write-ColorOutput Yellow "清理选项:"
Write-Output "  6) 清理 .next 目录"
Write-Output "  7) 清理 node_modules 并重装"
Write-Output "  8) 清理端口 3000 占用"
Write-Output "  9) 清理所有 Node 进程"
Write-Output ""
Write-ColorOutput Yellow "数据库:"
Write-Output " 10) 初始化数据库 (创建表+测试数据+FTS索引)"
Write-Output " 11) 重置数据库 (删除并重建)"
Write-Output " 12) 查看数据统计"
Write-Output " 13) 设置全文搜索索引 (FTS5)"
Write-Output ""
Write-ColorOutput Yellow "其他:"
Write-Output " 14) 代码检查 (lint)"
Write-Output " 15) 类型检查 (tsc)"
Write-Output ""
Write-ColorOutput Yellow "部署:"
Write-Output "  0) 部署 (deploy) - Git 提交并推送"
Write-Output ""
Write-Output " 99) 退出"
Write-Output ""
Write-ColorOutput Cyan "========================================"

# 读取用户输入，默认值为 2
$choice = Read-Host "请输入序号 (默认: 2)"
if ([string]::IsNullOrWhiteSpace($choice)) {
    $choice = "2"
}

# 清理端口 3000 函数
function Kill-Port3000 {
    Write-ColorOutput Yellow "检查端口 3000 占用情况..."
    $port = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
    if ($port) {
        foreach ($p in $port) {
            $pid = $p.OwningProcess
            Write-ColorOutput Yellow "发现端口 3000 被进程 $pid 占用，正在终止..."
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-ColorOutput Green "[OK] 已终止进程 $pid"
        }
    } else {
        Write-ColorOutput Green "[OK] 端口 3000 未被占用"
    }
}

# 清理所有 Node 进程函数
function Kill-NodeProcesses {
    Write-ColorOutput Yellow "清理所有 Node.js 进程..."
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Stop-Process -Name node -Force -ErrorAction SilentlyContinue
        Write-ColorOutput Green "[OK] Node.js 进程已清理"
    } else {
        Write-ColorOutput Green "[OK] 没有运行中的 Node.js 进程"
    }
}

# 清理 .next 目录函数
function Clean-NextDir {
    Write-ColorOutput Yellow "清理 .next 目录..."
    if (Test-Path ".next") {
        Remove-Item -Path ".next" -Recurse -Force
        Write-ColorOutput Green "[OK] .next 目录已删除"
    } else {
        Write-ColorOutput Green "[OK] .next 目录不存在，跳过"
    }
}

# 清理 node_modules 函数
function Clean-NodeModules {
    Write-ColorOutput Yellow "清理 node_modules 目录..."
    if (Test-Path "node_modules") {
        Remove-Item -Path "node_modules" -Recurse -Force
        Write-ColorOutput Green "[OK] node_modules 目录已删除"
        Write-ColorOutput Yellow "重新安装依赖..."
        npm install
        Write-ColorOutput Green "[OK] 依赖安装完成"
    } else {
        Write-ColorOutput Green "[OK] node_modules 目录不存在，跳过"
    }
}

# 完整重启函数
function Full-Restart {
    Write-ColorOutput Cyan "========================================"
    Write-ColorOutput Green "  执行完整重启流程"
    Write-ColorOutput Cyan "========================================"
    Write-Output ""

    Kill-Port3000
    Kill-NodeProcesses
    Clean-NextDir

    Write-Output ""
    Write-ColorOutput Green "启动开发服务器..."
    npm run dev
}

# Git 部署函数
function Git-Deploy {
    Write-ColorOutput Cyan "========================================"
    Write-ColorOutput Green "  Git 部署流程"
    Write-ColorOutput Cyan "========================================"
    Write-Output ""

    # 检测当前 Git 分支
    Write-ColorOutput Yellow "检测当前 Git 分支..."
    $currentBranch = git rev-parse --abbrev-ref HEAD 2>$null
    if ([string]::IsNullOrWhiteSpace($currentBranch)) {
        Write-ColorOutput Red "未能检测到 Git 分支。"
        Write-Output "请确保当前目录是 Git 仓库。"
        Read-Host "按任意键继续"
        return
    }
    Write-ColorOutput Green "当前分支: $currentBranch"
    Write-Output ""

    # 暂存所有更改
    Write-ColorOutput Yellow "暂存所有更改..."
    git add .
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "暂存失败。"
        Read-Host "按任意键继续"
        return
    }

    # 检查是否有更改需要提交
    $status = git diff --staged --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Yellow "没有需要提交的更改。"
        Write-Output ""
        Write-ColorOutput Yellow "拉取远程最新更改..."
        git pull origin $currentBranch
        Read-Host "按任意键继续"
        return
    }

    # 提交更改
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Write-ColorOutput Yellow "提交更改，时间戳: $timestamp..."
    git commit -m $timestamp
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "提交失败。"
        Read-Host "按任意键继续"
        return
    }

    # 拉取远程最新更改
    Write-ColorOutput Yellow "拉取远程最新更改..."
    git pull origin $currentBranch
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "拉取失败。如有冲突请解决后重新运行。"
        Read-Host "按任意键继续"
        return
    }

    # 推送到远程仓库
    Write-ColorOutput Yellow "推送更改到远程仓库..."
    git push origin $currentBranch
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "推送失败。"
        Read-Host "按任意键继续"
        return
    }

    Write-Output ""
    Write-ColorOutput Green "[OK] 更改已成功提交并推送到分支: $currentBranch"
    Read-Host "按任意键继续"
}

# 根据用户选择执行对应操作
switch ($choice) {
    "1" {
        Write-ColorOutput Green "启动开发服务器..."
        npm run dev
    }
    "2" {
        Full-Restart
    }
    "3" {
        Write-ColorOutput Green "构建生产版本..."
        npm run build
    }
    "4" {
        Write-ColorOutput Green "启动生产服务器..."
        npm run start
    }
    "5" {
        Write-ColorOutput Green "构建并启动生产服务器..."
        npm run build
        if ($LASTEXITCODE -eq 0) {
            npm run start
        } else {
            Write-ColorOutput Red "构建失败！"
        }
    }
    "6" {
        Clean-NextDir
        Read-Host "按任意键继续"
    }
    "7" {
        Clean-NodeModules
        Read-Host "按任意键继续"
    }
    "8" {
        Kill-Port3000
        Write-ColorOutput Green "[OK] 端口 3000 检查完成"
        Read-Host "按任意键继续"
    }
    "9" {
        Kill-NodeProcesses
        Read-Host "按任意键继续"
    }
    "10" {
        Write-ColorOutput Green "初始化数据库 (包含 FTS5 索引)..."
        npm run db:init
        Read-Host "按任意键继续"
    }
    "11" {
        Write-ColorOutput Red "[警告] 这将删除所有数据！"
        $confirm = Read-Host "确认重置数据库? (y/N)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Write-ColorOutput Green "重置数据库..."
            npm run db:reset
        } else {
            Write-ColorOutput Yellow "操作已取消"
        }
        Read-Host "按任意键继续"
    }
    "12" {
        Write-ColorOutput Green "查看数据统计..."
        if (Test-Path "data\travel.db") {
            Write-Output ""
            sqlite3 data\travel.db ".headers on" ".mode column" ".width 20 10" "SELECT '用户数' as 统计项, COUNT(*) as 数量 FROM users UNION ALL SELECT '景点分类数', COUNT(*) FROM spot_categories UNION ALL SELECT '景点数', COUNT(*) FROM spots UNION ALL SELECT '门票数', COUNT(*) FROM tickets UNION ALL SELECT '酒店数', COUNT(*) FROM hotels UNION ALL SELECT '酒店房间数', COUNT(*) FROM hotel_rooms UNION ALL SELECT '订单数', COUNT(*) FROM orders UNION ALL SELECT '评论数', COUNT(*) FROM spot_comments UNION ALL SELECT '活动数', COUNT(*) FROM activities UNION ALL SELECT '新闻数', COUNT(*) FROM news;"
            Write-Output ""
            Write-ColorOutput Green "[OK] 数据统计完成"
        } else {
            Write-ColorOutput Red "[错误] 数据库文件不存在，请先运行 '初始化数据库'"
        }
        Read-Host "按任意键继续"
    }
    "13" {
        Write-ColorOutput Green "设置全文搜索索引 (FTS5)..."
        npm run db:fts
        Read-Host "按任意键继续"
    }
    "14" {
        Write-ColorOutput Green "执行代码检查..."
        npm run lint
        Read-Host "按任意键继续"
    }
    "15" {
        Write-ColorOutput Green "执行类型检查..."
        npx tsc --noEmit
        Read-Host "按任意键继续"
    }
    "0" {
        Git-Deploy
    }
    "99" {
        Write-ColorOutput Green "退出脚本"
        exit 0
    }
    default {
        Write-ColorOutput Red "无效选择，默认执行完整重启..."
        Full-Restart
    }
}
