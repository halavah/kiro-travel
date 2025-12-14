@echo off
REM Vercel 部署前检查脚本 (Windows)
REM 运行此脚本以确保所有配置正确

echo 🔍 Vercel 部署前检查...
echo ================================
echo.

setlocal enabledelayedexpansion
set PASSED=0
set FAILED=0
set WARNINGS=0

REM 检查配置文件
echo 📦 检查配置文件...
echo --------------------------------

if exist "vercel.json" (
    echo ✓ vercel.json 存在
    set /a PASSED+=1
) else (
    echo ✗ vercel.json 不存在
    set /a FAILED+=1
)

if exist ".vercelignore" (
    echo ✓ .vercelignore 存在
    set /a PASSED+=1
) else (
    echo ⚠ .vercelignore 不存在 (可选^)
    set /a WARNINGS+=1
)

if exist ".env.example" (
    echo ✓ .env.example 存在
    set /a PASSED+=1
) else (
    echo ⚠ .env.example 不存在 (建议创建^)
    set /a WARNINGS+=1
)

if exist "package.json" (
    echo ✓ package.json 存在
    set /a PASSED+=1
) else (
    echo ✗ package.json 不存在
    set /a FAILED+=1
)

if exist "next.config.mjs" (
    echo ✓ Next.js 配置文件存在
    set /a PASSED+=1
) else if exist "next.config.js" (
    echo ✓ Next.js 配置文件存在
    set /a PASSED+=1
) else (
    echo ✗ Next.js 配置文件不存在
    set /a FAILED+=1
)

echo.
echo 🔐 检查环境变量...
echo --------------------------------

if exist ".env.local" (
    echo ✓ .env.local 存在
    set /a PASSED+=1

    REM 检查 JWT_SECRET
    findstr /C:"JWT_SECRET=" ".env.local" >nul 2>&1
    if !errorlevel! equ 0 (
        findstr /C:"JWT_SECRET=your-secret-key-change-in-production" ".env.local" >nul 2>&1
        if !errorlevel! equ 0 (
            echo ✗ JWT_SECRET 使用默认值，请修改为强密钥
            set /a FAILED+=1
        ) else (
            echo ✓ JWT_SECRET 已自定义
            set /a PASSED+=1
        )
    ) else (
        echo ✗ JWT_SECRET 未在 .env.local 中定义
        set /a FAILED+=1
    )
) else (
    echo ⚠ .env.local 不存在 (本地开发需要^)
    set /a WARNINGS+=1
)

echo.
echo 📂 检查 .gitignore...
echo --------------------------------

if exist ".gitignore" (
    echo ✓ .gitignore 存在
    set /a PASSED+=1

    REM 检查是否忽略 .env.local
    findstr /C:".env.local" ".gitignore" >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✓ .gitignore 包含 .env.local
        set /a PASSED+=1
    ) else (
        findstr /C:".env*.local" ".gitignore" >nul 2>&1
        if !errorlevel! equ 0 (
            echo ✓ .gitignore 包含 .env.local
            set /a PASSED+=1
        ) else (
            echo ✗ .gitignore 未包含 .env.local
            set /a FAILED+=1
        )
    )

    REM 检查是否忽略数据库文件
    findstr /C:"*.db" ".gitignore" >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✓ .gitignore 包含数据库文件
        set /a PASSED+=1
    ) else (
        findstr /C:"*.sqlite" ".gitignore" >nul 2>&1
        if !errorlevel! equ 0 (
            echo ✓ .gitignore 包含数据库文件
            set /a PASSED+=1
        ) else (
            echo ⚠ .gitignore 未包含数据库文件 (建议添加^)
            set /a WARNINGS+=1
        )
    )

    REM 检查是否忽略 .vercel
    findstr /C:".vercel" ".gitignore" >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✓ .gitignore 包含 .vercel 目录
        set /a PASSED+=1
    ) else (
        echo ⚠ .gitignore 未包含 .vercel 目录 (建议添加^)
        set /a WARNINGS+=1
    )
) else (
    echo ✗ .gitignore 不存在
    set /a FAILED+=1
)

echo.
echo 🏗️  检查构建配置...
echo --------------------------------

if exist "package.json" (
    findstr /C:"\"build\"" "package.json" >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✓ package.json 包含 build 脚本
        set /a PASSED+=1
    ) else (
        echo ✗ package.json 缺少 build 脚本
        set /a FAILED+=1
    )

    findstr /C:"\"start\"" "package.json" >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✓ package.json 包含 start 脚本
        set /a PASSED+=1
    ) else (
        echo ✗ package.json 缺少 start 脚本
        set /a FAILED+=1
    )
)

echo.
echo 📚 检查文档...
echo --------------------------------

if exist "VERCEL_DEPLOYMENT.md" (
    echo ✓ VERCEL_DEPLOYMENT.md 存在
    set /a PASSED+=1
) else (
    echo ⚠ VERCEL_DEPLOYMENT.md 不存在 (建议创建^)
    set /a WARNINGS+=1
)

if exist "VERCEL_QUICKSTART.md" (
    echo ✓ VERCEL_QUICKSTART.md 存在
    set /a PASSED+=1
) else (
    echo ⚠ VERCEL_QUICKSTART.md 不存在 (建议创建^)
    set /a WARNINGS+=1
)

if exist "DEPLOYMENT_CHECKLIST.md" (
    echo ✓ DEPLOYMENT_CHECKLIST.md 存在
    set /a PASSED+=1
) else (
    echo ⚠ DEPLOYMENT_CHECKLIST.md 不存在 (建议创建^)
    set /a WARNINGS+=1
)

echo.
echo 🔄 检查 Git 状态...
echo --------------------------------

if exist ".git" (
    echo ✓ Git 仓库已初始化
    set /a PASSED+=1

    REM 检查远程仓库
    git remote -v 2>nul | findstr /C:"origin" >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✓ 远程仓库已配置
        set /a PASSED+=1
        for /f "tokens=*" %%i in ('git remote get-url origin 2^>nul') do (
            echo     远程 URL: %%i
        )
    ) else (
        echo ✗ 未配置远程仓库
        set /a FAILED+=1
    )

    REM 检查是否有未提交的更改
    git status --porcelain 2>nul | findstr /R ".*" >nul 2>&1
    if !errorlevel! equ 0 (
        echo ⚠ 有未提交的更改
        echo     运行 'git status' 查看详情
        set /a WARNINGS+=1
    ) else (
        echo ✓ 没有未提交的更改
        set /a PASSED+=1
    )
) else (
    echo ✗ 不是 Git 仓库
    set /a FAILED+=1
)

echo.
echo 🧪 测试本地构建...
echo --------------------------------

echo 正在运行 'npm run build'...
npm run build >nul 2>&1
if !errorlevel! equ 0 (
    echo ✓ 本地构建成功
    set /a PASSED+=1
) else (
    echo ✗ 本地构建失败
    echo     运行 'npm run build' 查看详细错误
    set /a FAILED+=1
)

echo.
echo ================================
echo 📊 检查结果汇总
echo ================================
echo 通过: !PASSED!
echo 警告: !WARNINGS!
echo 失败: !FAILED!
echo.

if !FAILED! equ 0 (
    echo ✅ 所有关键检查都通过了��
    echo 你可以继续部署到 Vercel。
    echo.
    echo 下一步：
    echo 1. 提交并推送代码到 GitHub
    echo    git add .
    echo    git commit -m "feat: 准备 Vercel 部署"
    echo    git push origin master
    echo.
    echo 2. 访问 https://vercel.com 导入项目
    echo.
    echo 3. 配置环境变量 (JWT_SECRET^)
    echo.
    echo 4. 点击部署
    echo.
    pause
    exit /b 0
) else (
    echo ❌ 有 !FAILED! 个关键检查失败
    echo 请修复上述问题后再尝试部署。
    echo.
    echo 需要帮助？查看：
    echo - DEPLOYMENT_CHECKLIST.md
    echo - VERCEL_DEPLOYMENT.md
    echo.
    pause
    exit /b 1
)
