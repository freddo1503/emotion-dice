#!/bin/bash

# Script to fix naming inconsistencies in the public/images directory

# Fix spelling errors in directory names
if [ -d "public/images/feeling/angry/agressive" ]; then
  echo "Renaming directory: agressive -> aggressive"
  mv "public/images/feeling/angry/agressive" "public/images/feeling/angry/aggressive"
fi

if [ -d "public/images/feeling/disgusted/aweful" ]; then
  echo "Renaming directory: aweful -> awful"
  mv "public/images/feeling/disgusted/aweful" "public/images/feeling/disgusted/awful"
fi

# Fix spelling errors in file names
if [ -f "public/images/feeling/fearful/scared/firghtened.png" ]; then
  echo "Renaming file: firghtened.png -> frightened.png"
  mv "public/images/feeling/fearful/scared/firghtened.png" "public/images/feeling/fearful/scared/frightened.png"
fi

# Replace spaces with hyphens in directory names
find "public/images" -type d -name "* *" | while read dir; do
  newdir=$(echo "$dir" | sed 's/ /-/g')
  echo "Renaming directory: $dir -> $newdir"
  mv "$dir" "$newdir"
done

# Replace spaces with hyphens in file names
find "public/images" -type f -name "* *" | while read file; do
  newfile=$(echo "$file" | sed 's/ /-/g')
  echo "Renaming file: $file -> $newfile"
  mv "$file" "$newfile"
done

echo "All naming inconsistencies have been fixed."