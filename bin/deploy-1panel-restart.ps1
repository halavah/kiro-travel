
# ================================================
# 腾讯云配置 - 请根据实际情况修改
# ================================================
# TODO: 请填入你的腾讯云服务器信息
$SERVER_IP = "your-tencent-cloud-ip"
$SSH_USER = "ubuntu"

# PM2 进程名称
$APP_PM2_NAME = "kiro-travel"
# Nginx 容器名称（如果使用 1Panel 的 OpenResty）
$NGINX_CONTAINER = "1Panel-openresty-xxxx"

Write-Host "ℹ 正在执行: 服务重启 (PM2 + Nginx)..." -ForegroundColor Blue

$RemoteScript = @"
sudo bash -c '
    # 1. 重启 PM2 进程
    echo "   检查 PM2 进程 ($APP_PM2_NAME)..."
    if su - $SSH_USER -c "pm2 list" | grep -q "$APP_PM2_NAME"; then
         echo "   🔄 重启 PM2 进程..."
         su - $SSH_USER -c "pm2 restart $APP_PM2_NAME"
         echo "   ✅ PM2 进程已重启"
    else
         echo "   ⚠️ PM2 进程未找到"
    fi

    # 2. 重载 Nginx
    echo "   检查 Nginx 容器 ($NGINX_CONTAINER)..."
    NGINX_ID=\$(docker ps -aqf name=$NGINX_CONTAINER)
    if [ ! -z "\$NGINX_ID" ]; then
         echo "   🔄 重载 Nginx..."
         docker exec \$NGINX_ID nginx -s reload
         echo "   ✅ Nginx 已重载"
    else
         echo "   ⚠️ Nginx 容器未找到"
    fi
'
"@

ssh -o StrictHostKeyChecking=no -t "$SSH_USER@$SERVER_IP" $RemoteScript

Write-Host "✅ 服务重启完成" -ForegroundColor Green
