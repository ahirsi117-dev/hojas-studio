@echo off
set "D=%USERPROFILE%\.claude\skills\hojas-studio"
if not exist "%D%" mkdir "%D%"
copy /Y "%~dp0SKILL.md" "%D%\SKILL.md" >nul
rem tell Claude where the skill files are (works for any folder name, e.g. hojas-studio-main from GitHub)
>>"%D%\SKILL.md" echo.
>>"%D%\SKILL.md" echo Skill files on this computer: %~dp0
rem leftovers from older versions
if exist "%~dp0demo" rmdir /S /Q "%~dp0demo"
if exist "%~dp0run-demo.bat" del /Q "%~dp0run-demo.bat"
if exist "%~dp0__pycache__" rmdir /S /Q "%~dp0__pycache__"
if exist "%D%\SKILL.md" (
  echo Hojas Studio skill installed for Claude Code:
  echo   %D%\SKILL.md
  echo The skill files stay in: %~dp0
  echo Close Claude Code and open it again, then type /hojas-studio or just ask it to edit a clip.
) else (
  echo Could not write to %D%
)
pause
