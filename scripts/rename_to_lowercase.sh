#!/bin/bash

# Script to rename all files and folders in the public/images directory to lowercase

# Function to recursively rename files and directories to lowercase
rename_to_lowercase() {
  local dir="$1"
  
  # First, process all files in the current directory
  find "$dir" -maxdepth 1 -type f | while read file; do
    filename=$(basename "$file")
    lowercase_filename=$(echo "$filename" | tr '[:upper:]' '[:lower:]')
    
    if [ "$filename" != "$lowercase_filename" ]; then
      echo "Renaming file: $filename -> $lowercase_filename"
      mv "$dir/$filename" "$dir/$lowercase_filename"
    fi
  done
  
  # Then process all directories in the current directory
  find "$dir" -maxdepth 1 -type d | grep -v "^$dir$" | while read subdir; do
    dirname=$(basename "$subdir")
    lowercase_dirname=$(echo "$dirname" | tr '[:upper:]' '[:lower:]')
    
    # First, recursively process the subdirectory contents
    rename_to_lowercase "$subdir"
    
    # Then rename the directory itself if needed
    if [ "$dirname" != "$lowercase_dirname" ]; then
      echo "Renaming directory: $dirname -> $lowercase_dirname"
      mv "$subdir" "$dir/$lowercase_dirname"
    fi
  done
}

# Start the renaming process from the public/images directory
rename_to_lowercase "public/images"

echo "All files and directories have been renamed to lowercase."