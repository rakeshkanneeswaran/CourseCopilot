#!/bin/bash

# Find and delete all .mp3 and .mp4 files in the current directory and subdirectories
find . -type f \( -name "*.mp3" -o -name "*.mp4" \) -exec rm -f {} +

echo "All .mp3 and .mp4 files have been deleted."
