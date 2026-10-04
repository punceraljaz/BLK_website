@echo off
rem Starts the local web server for this site and shows the address to open
rem on a phone (same Wi-Fi). Double-click to run; close the window to stop.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ip = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1 -ExpandProperty IPAddress;" ^
  "Write-Host ''; Write-Host '  Racunalnik:  http://localhost:4500' -ForegroundColor Green;" ^
  "Write-Host ('  Telefon:     http://' + $ip + ':4500   (telefon mora biti na istem Wi-Fi)') -ForegroundColor Green; Write-Host ''"
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 4500 -State Listen -ErrorAction SilentlyContinue) { exit 1 }"
if errorlevel 1 (
  echo   Streznik ze tece. To okno lahko zapres.
  echo.
  pause
  exit /b
)
node tools\serve.mjs 4500
pause
