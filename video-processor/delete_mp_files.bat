@echo off

REM Find and delete all .mp3 and .mp4 files in the current directory and subdirectories
for /r %%i in (*.mp3 *.mp4) do del "%%i"

echo All .mp3 and .mp4 files have been deleted.