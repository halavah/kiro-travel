
# ================================================
# 腾讯云配置 - 请根据实际情况修改
# ================================================
# TODO: 请填入你的腾讯云服务器信息
$SERVER_IP = "your-tencent-cloud-ip"
$SSH_USER = "ubuntu"
# 统一部署基础路径
$REMOTE_DEPLOY_BASE = "/opt/1panel/www/sites"
# 应用部署路径
$REMOTE_TARGET = "$REMOTE_DEPLOY_BASE/kiro-travel"
# PM2 进程名称
$APP_PM2_NAME = "kiro-travel"

# ================================================
# 颜色定义
# ================================================
Write-Host "🚀 部署 Kiro Travel 到腾讯云..." -ForegroundColor Green

# 获取项目根目录
$ScriptDir = $PSScriptRoot
$ProjectRoot = Split-Path $ScriptDir -Parent

# 1. 本地构建
Write-Host "📦 本地构建 Next.js 应用..." -ForegroundColor Green
Push-Location $ProjectRoot

# 复制 .env.prod 为 .env.production
if (Test-Path ".env.prod") {
    Copy-Item ".env.prod" ".env.production" -Force
    Write-Host "✓ 已复制 .env.prod 为 .env.production" -ForegroundColor Green
}

# 安装依赖并构建
npm install
npm run build

# 2. 准备部署文件
Write-Host "📦 准备部署文件..." -ForegroundColor Green
$DeployTmpDir = Join-Path $ProjectRoot "deploy_tmp"
if (Test-Path $DeployTmpDir) {
    Remove-Item $DeployTmpDir -Recurse -Force
}
New-Item -ItemType Directory -Path $DeployTmpDir | Out-Null

# 复制文件（排除特定目录）
$ExcludeDirs = @("node_modules", ".git", "deploy_tmp", "data")
Get-ChildItem -Path $ProjectRoot -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring($ProjectRoot.Length)
    $shouldExclude = $false

    foreach ($exclude in $ExcludeDirs) {
        if ($relativePath -like "*\$exclude\*" -or $relativePath -like "*/$exclude/*" -or $relativePath -eq "\$exclude" -or $relativePath -eq "/$exclude") {
            $shouldExclude = $true
            break
        }
    }

    if ($_.Name -like ".env.*" -or $_.Name -eq ".DS_Store") {
        $shouldExclude = $true
    }

    if (-not $shouldExclude) {
        $targetPath = Join-Path $DeployTmpDir $relativePath
        if ($_.PSIsContainer) {
            New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
        } else {
            $targetDir = Split-Path $targetPath -Parent
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            Copy-Item $_.FullName -Destination $targetPath -Force
        }
    }
}

# 复制 .env.prod
Copy-Item (Join-Path $ProjectRoot ".env.prod") (Join-Path $DeployTmpDir ".env.production") -Force

# 3. 打包
Write-Host "📦 打包归档..." -ForegroundColor Green
$ArchivePath = Join-Path $ProjectRoot "kiro_travel_deploy.tar.gz"
if (Test-Path $ArchivePath) {
    Remove-Item $ArchivePath -Force
}

Push-Location $DeployTmpDir
tar -czf $ArchivePath *
Pop-Location
Remove-Item $DeployTmpDir -Recurse -Force

# 4. 上传
Write-Host "📤 上传归档到 $SERVER_IP..." -ForegroundColor Green
$REMOTE_UPLOAD_BASE = "/home/$SSH_USER/deploy_upload"
ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "mkdir -p $REMOTE_UPLOAD_BASE && chmod 777 $REMOTE_UPLOAD_BASE"
scp -o StrictHostKeyChecking=no $ArchivePath "$SSH_USER@$SERVER_IP`:$REMOTE_UPLOAD_BASE/"
Remove-Item $ArchivePath -Force

# 5. 远程安装
Write-Host "🔧 远程安装..." -ForegroundColor Green
$RemoteScript = @"
sudo bash -c '
    TARGET="$REMOTE_TARGET"
    echo "   目标路径: \$TARGET"

    # A. 停止 PM2 进程
    echo "   🛑 停止 PM2 进程 $APP_PM2_NAME..."
    su - $SSH_USER -c "pm2 stop $APP_PM2_NAME" 2>/dev/null || true

    # B. 清理旧文件（保留 data 目录）
    echo "   🧹 清理旧文件（保留 data 目录）..."
    mkdir -p \$TARGET
    find \$TARGET -mindepth 1 -maxdepth 1 ! -name "data" -exec rm -rf {} +

    # 确保 data 目录存在
    mkdir -p \$TARGET/data
    chown -R $SSH_USER:$SSH_USER \$TARGET/data

    # C. 解压归档
    echo "   📦 解压归档..."
    tar -xzf /home/$SSH_USER/deploy_upload/kiro_travel_deploy.tar.gz -C \$TARGET
    rm -rf /home/$SSH_USER/deploy_upload

    # 强制清理 Mac 元数据
    echo "   🧹 清理 Mac 元数据文件..."
    find \$TARGET -name "._*" -delete
    find \$TARGET -name ".DS_Store" -delete

    # D. 安装生产依赖
    echo "   📦 安装生产依赖..."
    cd \$TARGET
    su - $SSH_USER -c "cd \$TARGET && npm install --production"

    # E. 权限设置
    chown -R $SSH_USER:$SSH_USER \$TARGET

    # F. 启动 PM2
    echo "   🚀 启动 PM2 进程..."
    su - $SSH_USER -c "cd \$TARGET && pm2 start npm --name $APP_PM2_NAME -- start"
    su - $SSH_USER -c "pm2 save"
    echo "   ✅ 应用已启动"
'
"@

ssh -o StrictHostKeyChecking=no -t "$SSH_USER@$SERVER_IP" $RemoteScript

Pop-Location

Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host "提示：请访问你的域名查看部署结果" -ForegroundColor Yellow
