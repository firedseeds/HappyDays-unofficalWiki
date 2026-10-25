@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

if not defined HOST set "HOST=0.0.0.0"
if not defined PORT set "PORT=8000"
if not defined PYTHON set "PYTHON=python"
if not defined LOG_LINES set "LOG_LINES=200"

set "RUN_DIR=%~dp0.run"
set "LOG_DIR=%~dp0logs"
set "PID_FILE=%RUN_DIR%\server.pid"
set "SYNC_PID_FILE=%RUN_DIR%\sync.pid"
set "SYNC_SCRIPT=%~dp0sync.ps1"
set "LOG_FILE=%LOG_DIR%\server.log"
set "SYNC_LOG_FILE=%LOG_DIR%\sync.log"
set "LAUNCHER=%RUN_DIR%\server.cmd"

if not defined GIT_SSH_COMMAND set "GIT_SSH_COMMAND=C:/Windows/System32/OpenSSH/ssh.exe -o StrictHostKeyChecking=accept-new"

if not exist "%RUN_DIR%" mkdir "%RUN_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

if /I "%~1"=="-run" goto run
if /I "%~1"=="-stop" goto stop
if /I "%~1"=="-restart" goto restart
if /I "%~1"=="-logs" goto logs
goto usage

:restart
call :stop_sync
if exist "%PID_FILE%" (
  set /p OLD_PID=<"%PID_FILE%"
  if defined OLD_PID (
    tasklist /FI "PID eq !OLD_PID!" /NH 2>nul | find "!OLD_PID!" >nul
    if not errorlevel 1 (
      taskkill /PID !OLD_PID! /T /F >nul 2>&1
      ping -n 2 127.0.0.1 >nul
      tasklist /FI "PID eq !OLD_PID!" /NH 2>nul | find "!OLD_PID!" >nul
      if not errorlevel 1 (
        echo fail: could not stop server ^(PID !OLD_PID!^)
        exit /b 1
      )
    )
  )
  del /q "%PID_FILE%" >nul 2>&1
)
call :sync_push
goto run

:run
if exist "%PID_FILE%" (
  set /p OLD_PID=<"%PID_FILE%"
  if defined OLD_PID (
    tasklist /FI "PID eq !OLD_PID!" /NH 2>nul | find "!OLD_PID!" >nul
    if not errorlevel 1 (
      echo fail: server is already running ^(PID !OLD_PID!^)
      exit /b 1
    )
  )
  del /q "%PID_FILE%" >nul 2>&1
)

"%PYTHON%" --version >nul 2>&1
if errorlevel 1 (
  echo fail: python executable not found: %PYTHON%
  exit /b 1
)

call :sync_pull

>>"%LOG_FILE%" echo.
>>"%LOG_FILE%" echo [%DATE% %TIME%] run.bat -run host=%HOST% port=%PORT%
if "%HOST%"=="0.0.0.0" >>"%LOG_FILE%" echo warning: server is listening on all interfaces and the editor has no authentication.

> "%LAUNCHER%" echo @echo off
>>"%LAUNCHER%" echo cd /d "%%~dp0.."
>>"%LAUNCHER%" echo "%PYTHON%" server.py --host "%HOST%" --port "%PORT%" ^>^> "%LOG_FILE%" 2^>^&1

start "" /B "%ComSpec%" /C "%LAUNCHER%"
if errorlevel 1 (
  echo fail: could not start server
  exit /b 1
)

set "PID="
set /a FIND_ATTEMPT=0
:find_pid
set /a FIND_ATTEMPT+=1
for /f "usebackq delims=" %%P in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'python.exe' -and $_.CommandLine -like '*server.py*--port*%PORT%*' } | Select-Object -First 1 -ExpandProperty ProcessId)"`) do set "PID=%%P"
if defined PID goto got_pid
if !FIND_ATTEMPT! GEQ 20 (
  echo fail: server process did not appear
  powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path '%LOG_FILE%') { Get-Content -Path '%LOG_FILE%' -Tail 40 }"
  exit /b 1
)
ping -n 2 127.0.0.1 >nul
goto find_pid

:got_pid
> "%PID_FILE%" echo !PID!

set "HAS_CURL=0"
where curl.exe >nul 2>&1
if not errorlevel 1 set "HAS_CURL=1"

set /a ATTEMPT=0
:wait_ready
set /a ATTEMPT+=1
tasklist /FI "PID eq !PID!" /NH 2>nul | find "!PID!" >nul
if errorlevel 1 (
  del /q "%PID_FILE%" >nul 2>&1
  echo fail: server exited during startup
  powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path '%LOG_FILE%') { Get-Content -Path '%LOG_FILE%' -Tail 40 }"
  exit /b 1
)

if "!HAS_CURL!"=="1" (
  curl.exe -fsS --max-time 2 "http://127.0.0.1:%PORT%/api/health" >nul 2>&1
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:%PORT%/api/health' -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } } catch { }; exit 1" >nul 2>&1
)
if not errorlevel 1 (
  call :start_sync
  echo Successful
  exit /b 0
)

if !ATTEMPT! GEQ 60 (
  taskkill /PID !PID! /T /F >nul 2>&1
  del /q "%PID_FILE%" >nul 2>&1
  echo fail: server did not become ready at http://127.0.0.1:%PORT%/
  powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path '%LOG_FILE%') { Get-Content -Path '%LOG_FILE%' -Tail 40 }"
  exit /b 1
)
ping -n 2 127.0.0.1 >nul
goto wait_ready

:stop
call :stop_sync
if not exist "%PID_FILE%" (
  echo fail: server is not running ^(no PID file^)
  exit /b 1
)
set /p PID=<"%PID_FILE%"
if not defined PID (
  del /q "%PID_FILE%" >nul 2>&1
  echo fail: server is not running ^(stale PID file removed^)
  exit /b 1
)
tasklist /FI "PID eq !PID!" /NH 2>nul | find "!PID!" >nul
if errorlevel 1 (
  del /q "%PID_FILE%" >nul 2>&1
  echo fail: server is not running ^(stale PID file removed^)
  exit /b 1
)

taskkill /PID !PID! /T /F >nul 2>&1
if errorlevel 1 (
  tasklist /FI "PID eq !PID!" /NH 2>nul | find "!PID!" >nul
  if not errorlevel 1 (
    echo fail: failed to stop PID !PID!
    exit /b 1
  )
)
set /a STOP_ATTEMPT=0
:wait_stopped
set /a STOP_ATTEMPT+=1
tasklist /FI "PID eq !PID!" /NH 2>nul | find "!PID!" >nul
if errorlevel 1 (
  del /q "%PID_FILE%" >nul 2>&1
  call :sync_push
  echo Successful
  exit /b 0
)
if !STOP_ATTEMPT! GEQ 10 (
  echo fail: server process !PID! is still running
  exit /b 1
)
ping -n 2 127.0.0.1 >nul
goto wait_stopped

:logs
if not exist "%LOG_FILE%" (
  echo fail: log file not found: %LOG_FILE%
  exit /b 1
)
if /I "%~2"=="-f" goto logs_follow
powershell -NoProfile -ExecutionPolicy Bypass -Command "$files=@('%LOG_FILE%','%SYNC_LOG_FILE%') | Where-Object { Test-Path $_ }; Get-Content -Path $files -Tail %LOG_LINES%"
exit /b 0

:logs_follow
powershell -NoProfile -ExecutionPolicy Bypass -Command "$files=@('%LOG_FILE%','%SYNC_LOG_FILE%') | Where-Object { Test-Path $_ }; Get-Content -Path $files -Tail %LOG_LINES% -Wait"
exit /b 0

:sync_pull
if not exist ".git" exit /b 0
powershell -NoProfile -ExecutionPolicy Bypass -File "%SYNC_SCRIPT%" -Mode Pull -Root "%CD%" >nul 2>&1
exit /b 0

:sync_push
if not exist ".git" exit /b 0
powershell -NoProfile -ExecutionPolicy Bypass -File "%SYNC_SCRIPT%" -Mode Push -Root "%CD%" >nul 2>&1
exit /b 0

:start_sync
if not exist ".git" exit /b 0
if exist "%SYNC_PID_FILE%" (
  set /p OLD_SYNC=<"%SYNC_PID_FILE%"
  if defined OLD_SYNC (
    tasklist /FI "PID eq !OLD_SYNC!" /NH 2>nul | find "!OLD_SYNC!" >nul
    if not errorlevel 1 exit /b 0
  )
  del /q "%SYNC_PID_FILE%" >nul 2>&1
)
start "" /B powershell -NoProfile -ExecutionPolicy Bypass -File "%SYNC_SCRIPT%" -Mode Loop -Root "%CD%"
set "SYNC_PID="
for /L %%I in (1,1,20) do (
  if exist "%SYNC_PID_FILE%" (
    set /p SYNC_PID=<"%SYNC_PID_FILE%"
    if defined SYNC_PID (
      tasklist /FI "PID eq !SYNC_PID!" /NH 2>nul | find "!SYNC_PID!" >nul
      if not errorlevel 1 goto :sync_started
    )
  )
  ping -n 2 127.0.0.1 >nul
)
:sync_started
if defined SYNC_PID (
  > "%SYNC_PID_FILE%" echo !SYNC_PID!
) else (
  >>"%SYNC_LOG_FILE%" echo warning: sync scheduler did not start
)
exit /b 0

:stop_sync
if not exist "%SYNC_PID_FILE%" exit /b 0
set /p SYNC_PID=<"%SYNC_PID_FILE%"
if defined SYNC_PID (
  tasklist /FI "PID eq !SYNC_PID!" /NH 2>nul | find "!SYNC_PID!" >nul
  if not errorlevel 1 taskkill /PID !SYNC_PID! /T /F >nul 2>&1
)
del /q "%SYNC_PID_FILE%" >nul 2>&1
exit /b 0

:usage
echo fail: usage: %~nx0 -run ^| -stop ^| -restart ^| -logs [-f] 1>&2
exit /b 1
