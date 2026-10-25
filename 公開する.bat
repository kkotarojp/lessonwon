@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === レッスンWON を公開します（lessonwon.jp）===
git add -A
git commit -m "update %date% %time%" || echo （変更がないので、何もしません）
git push origin main
echo.
echo === 完了。2〜3分で lessonwon.jp に反映されます ===
pause
