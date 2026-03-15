@echo off
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  echo Starting local server on http://localhost:5500 ...
  py -m http.server 5500
) else (
  echo Starting local server on http://localhost:5500 ...
  python -m http.server 5500
)
