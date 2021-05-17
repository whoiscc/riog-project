@echo off
setlocal EnableDelayedExpansion
set "command=source ~/.bashrc && coffee %*"
@REM echo !command!
wsl bash -c '!command!'