#!/usr/bin/env bash
# Hojas Studio: تثبيت السكل لـ Claude Code على ماك أو لينكس
HERE="$(cd "$(dirname "$0")" && pwd)"; D="$HOME/.claude/skills/hojas-studio"
mkdir -p "$D" && cp "$HERE/SKILL.md" "$D/SKILL.md" && printf '\nSkill files on this computer: %s/\n' "$HERE" >> "$D/SKILL.md"
rm -rf "$HERE/demo" "$HERE/run-demo.bat" "$HERE/__pycache__" 2>/dev/null
if [ -f "$D/SKILL.md" ]; then echo "Hojas Studio skill installed: $D/SKILL.md"; echo "Skill files stay in: $HERE"; echo "Restart Claude Code, then ask it to edit a clip."; else echo "Could not write to $D"; fi
