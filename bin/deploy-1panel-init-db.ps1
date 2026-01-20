
# ================================================
# 腾讯云配置 - 请根据实际情况修改
# ================================================
# TODO: 请填入你的腾讯云服务器信息
$SERVER_IP = "your-tencent-cloud-ip"
$SSH_USER = "ubuntu"
$REMOTE_DEPLOY_BASE = "/opt/1panel/www/sites"
$REMOTE_TARGET = "$REMOTE_DEPLOY_BASE/kiro-travel"

Write-Host "============================================================"
Write-Host "   🗄️  初始化腾讯云数据库"
Write-Host "============================================================"
Write-Host ""

Write-Host "[信息] 正在执行: 远程数据库初始化"
Write-Host ""

$RemoteScript = @"
sudo bash -c '
    TARGET="$REMOTE_TARGET"
    echo "   应用路径: \$TARGET"

    # 检查目录是否存在
    if [ ! -d "\$TARGET" ]; then
        echo "   ❌ 错误: 应用目录不存在，请先部署应用"
        exit 1
    fi

    # 切换到应用目录
    cd \$TARGET

    # 确保 data 目录存在
    mkdir -p data
    chown -R $SSH_USER:$SSH_USER data

    # 执行数据库初始化
    echo "   🗄️  执行数据库初始化脚本..."
    su - $SSH_USER -c "cd \$TARGET && npm run db:init"

    echo "   ✅ 数据库初始化完成"
'
"@

ssh -o StrictHostKeyChecking=no -t "$SSH_USER@$SERVER_IP" $RemoteScript

Write-Host ""
Write-Host "✅ 远程数据库初始化完成！" -ForegroundColor Green
