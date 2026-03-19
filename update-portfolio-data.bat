@echo off
setlocal

if "%~1"=="" (
  echo Usage: update-portfolio-data.bat "C:\path\to\portfolio-db.json"
  exit /b 1
)

powershell -ExecutionPolicy Bypass -File "%~dp0update-portfolio-data.ps1" -JsonPath "%~1"
