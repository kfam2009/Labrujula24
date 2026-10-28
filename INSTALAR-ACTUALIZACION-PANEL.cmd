@echo off
set SRC=%~dp0public
set DEST=%~1
if "%DEST%"=="" set DEST=C:\Users\claud\Videos\Panel La Brujula
if not exist "%DEST%\public" mkdir "%DEST%\public"
copy /Y "%SRC%\app.js" "%DEST%\public\app.js"
copy /Y "%SRC%\index.html" "%DEST%\public\index.html"
copy /Y "%SRC%\styles.css" "%DEST%\public\styles.css"
copy /Y "%SRC%\brand-logo.png" "%DEST%\public\brand-logo.png"
echo.
echo Panel actualizado en: %DEST%
echo Si el panel estaba abierto, refresca el navegador con Ctrl+F5.
pause
