@echo off
setlocal
rem Hojas Studio installer for Windows. No ( ) blocks on purpose:
rem folder names like "hojas-studio (1)" would break them.
set "S=%~dp0"
set "D=%USERPROFILE%\.claude\skills\hojas-studio"
echo.
echo  Hojas Studio installer
echo  ----------------------
echo.
if not exist "%S%SKILL.md" goto nofiles
if not exist "%S%hs.py" goto nofiles
echo "%S%" | find /I "AppData\Local\Temp" >nul && goto inzip
if not exist "%D%" mkdir "%D%"
if not exist "%D%" goto fail
copy /Y "%S%SKILL.md" "%D%\SKILL.md" >nul
if errorlevel 1 goto fail
rem tell Claude where the skill files are (works for any folder name)
>>"%D%\SKILL.md" echo.
>>"%D%\SKILL.md" echo Skill files on this computer: %S%
rem leftovers from older versions
if exist "%S%demo" rmdir /S /Q "%S%demo"
if exist "%S%run-demo.bat" del /Q "%S%run-demo.bat"
if exist "%S%__pycache__" rmdir /S /Q "%S%__pycache__"
echo  Hojas Studio skill installed for Claude Code.
echo    Skill: %D%\SKILL.md
echo    Files: %S%
echo.
echo  Keep this folder where it is. If you move it, run install.bat again.
where claude >nul 2>nul || goto noclaude
echo  Next: close Claude Code, open it again, and ask it to edit a clip.
goto end
:noclaude
echo  Note: Claude Code was not found on this computer.
echo  The skill works inside Claude Code (not the Claude chat app).
echo  Install it from https://claude.com/claude-code then open a terminal and type: claude
goto end
:inzip
echo  You ran the installer from inside the zip file.
echo  Close this window, right-click the zip, choose "Extract All",
echo  then open the extracted folder and run install.bat from there.
goto end
:nofiles
echo  The skill files were not found next to install.bat.
echo  Extract the whole zip first, then run install.bat from the extracted folder.
goto end
:fail
echo  Could not write to %D%
:end
echo.
pause
