@echo off
chcp 65001 >nul
rem ##########################################################################
rem #                                                                        #
rem #       Kiro Travel 项目启动菜单 (Windows BAT 版本)                      #
rem #                                                                        #
rem ##########################################################################

rem 切换到当前目录或脚本所在的目录
cd /d "%~dp0"

rem 清屏以便更清晰显示菜单
cls

rem 显示菜单
echo ========================================
echo   Kiro Travel 项目启动菜单
echo ========================================
echo.
echo 开发模式:
echo   1) 开发服务器 (npm run dev)
echo   2) 完整重启 (清理 + 重启) [推荐]
echo.
echo 生产模式:
echo   3) 构建项目 (npm run build)
echo   4) 启动生产服务器 (npm run start)
echo   5) 构建并启动生产服务器
echo.
echo 清理选项:
echo   6) 清理 .next 目录
echo   7) 清理 node_modules 并重装
echo   8) 清理端口 3000 占用
echo   9) 清理所有 Node 进程
echo.
echo 数据库:
echo  10) 初始化数据库
echo  11) 重置数据库 (删除并重建)
echo.
echo 其他:
echo  12) 代码检查 (lint)
echo  13) 类型检查 (tsc)
echo   0) 退出
echo.
echo ========================================

rem 读取用户输入，提供提示
set /p choice=请输入序号 (默认: 2):

rem 如果用户直接回车，则设置默认值为 2
if "%choice%"=="" set "choice=2"

rem 根据用户选择执行对应操作
if "%choice%"=="1"  goto opt1
if "%choice%"=="2"  goto opt2
if "%choice%"=="3"  goto opt3
if "%choice%"=="4"  goto opt4
if "%choice%"=="5"  goto opt5
if "%choice%"=="6"  goto opt6
if "%choice%"=="7"  goto opt7
if "%choice%"=="8"  goto opt8
if "%choice%"=="9"  goto opt9
if "%choice%"=="10" goto opt10
if "%choice%"=="11" goto opt11
if "%choice%"=="12" goto opt12
if "%choice%"=="13" goto opt13
if "%choice%"=="0"  goto opt0

rem 如果输入无效则执行默认操作
echo 无效选择，默认执行完整重启...
goto opt2

:opt1
echo 启动开发服务器...
npm run dev
goto :eof

:opt2
echo ========================================
echo   执行完整重启流程
echo ========================================
echo.

echo 检查端口 3000 占用情况...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo 发现端口 3000 被进程 %%a 占用，正在终止...
    taskkill /F /PID %%a >nul 2>&1
    echo [OK] 已终止进程 %%a
)

echo 清理所有 Node.js 进程...
taskkill /F /IM node.exe >nul 2>&1
echo [OK] Node.js 进程已清理

echo 清理 .next 目录...
if exist .next (
    rmdir /s /q .next
    echo [OK] .next 目录已删除
) else (
    echo [OK] .next 目录不存在，跳过
)

echo.
echo 启动开发服务器...
npm run dev
goto :eof

:opt3
echo 构建生产版本...
npm run build
goto :eof

:opt4
echo 启动生产服务器...
npm run start
goto :eof

:opt5
echo 构建并启动生产服务器...
npm run build
if %errorlevel% equ 0 (
    npm run start
) else (
    echo 构建失败！
)
goto :eof

:opt6
echo 清理 .next 目录...
if exist .next (
    rmdir /s /q .next
    echo [OK] .next 目录已删除
) else (
    echo [OK] .next 目录不存在，跳过
)
pause
goto :eof

:opt7
echo 清理 node_modules 目录...
if exist node_modules (
    rmdir /s /q node_modules
    echo [OK] node_modules 目录已删除
    echo 重新安装依赖...
    npm install
    echo [OK] 依赖安装完成
) else (
    echo [OK] node_modules 目录不存在，跳过
)
pause
goto :eof

:opt8
echo 清理端口 3000 占用...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo 发现端口 3000 被进程 %%a 占用，正在终止...
    taskkill /F /PID %%a >nul 2>&1
    echo [OK] 已终止进程 %%a
)
echo [OK] 端口 3000 检查完成
pause
goto :eof

:opt9
echo 清理所有 Node.js 进程...
taskkill /F /IM node.exe >nul 2>&1
echo [OK] Node.js 进程已清理
pause
goto :eof

:opt10
echo 初始化数据库...
if not exist data mkdir data
sqlite3 data\travel.db < scripts\001_create_tables_sqlite.sql
echo [OK] 数据库初始化完成
pause
goto :eof

:opt11
echo 重置数据库 (删除并重建)...
if exist data\travel.db del /f /q data\travel.db
if exist data\travel.db-shm del /f /q data\travel.db-shm
if exist data\travel.db-wal del /f /q data\travel.db-wal
if not exist data mkdir data
sqlite3 data\travel.db < scripts\001_create_tables_sqlite.sql
if exist scripts\002_insert_test_data.sql (
    sqlite3 data\travel.db < scripts\002_insert_test_data.sql
    echo [OK] 测试数据已插入
)
echo [OK] 数据库重置完成
pause
goto :eof

:opt12
echo 执行代码检查...
npm run lint
pause
goto :eof

:opt13
echo 执行类型检查...
npx tsc --noEmit
pause
goto :eof

:opt0
echo 退出脚本
exit /b 0

rem :eof 是一个特殊的预定义标签，表示文件结束。goto :eof 会直接结束脚本执行。
