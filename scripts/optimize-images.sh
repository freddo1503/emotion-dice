#!/bin/bash

# Script to optimize images in the public folder
# 1. Converts PNG to JPG with ImageMagick using specified parameters
# 2. Optimizes JPG files to ensure they are less than 1MB in size

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it first."
    exit 1
fi

# Part 1: Convert PNG to JPG
echo "Converting PNG files to JPG format..."
find public/images -name "*.png" | while read -r png_file; do
    # Get the directory and filename without extension
    dir_name=$(dirname "$png_file")
    base_name=$(basename "$png_file" .png)

    # Create the new JPG filename
    jpg_file="${dir_name}/${base_name}.jpg"

    echo "Converting $png_file to $jpg_file"

    # Convert PNG to JPG with the specified parameters
    convert "$png_file" -strip -quality 100 -define webp:lossless=true "$jpg_file"

    # Check if conversion was successful
    if [ $? -eq 0 ]; then
        echo "Successfully converted $png_file to $jpg_file"
        # Remove the original PNG file
        rm "$png_file"
        echo "Removed original PNG file: $png_file"
    else
        echo "Failed to convert $png_file"
    fi
done

# Part 2: Optimize JPG files to ensure they are less than 1MB
echo "Optimizing JPG files to ensure they are less than 1MB..."
find public/images -name "*.jpg" -size +1M | while read -r jpg_file; do
    # Get the file size in bytes
    file_size=$(stat -c%s "$jpg_file")
    file_size_mb=$(echo "scale=2; $file_size / 1048576" | bc)

    echo "Optimizing $jpg_file (current size: ${file_size_mb}MB)"

    # Create a temporary file for the optimized image
    temp_file="${jpg_file}.temp"

    # Start with quality 85 which should provide a good balance between size and quality
    quality=85

    # Optimize the image
    convert "$jpg_file" -strip -quality $quality "$temp_file"

    # Check if the optimized file is less than 1MB
    optimized_size=$(stat -c%s "$temp_file")

    # If still larger than 1MB, try with lower quality
    if [ $optimized_size -gt 1048576 ]; then
        quality=75
        convert "$jpg_file" -strip -quality $quality "$temp_file"
        optimized_size=$(stat -c%s "$temp_file")
    fi

    # If still larger than 1MB, try with even lower quality
    if [ $optimized_size -gt 1048576 ]; then
        quality=65
        convert "$jpg_file" -strip -quality $quality "$temp_file"
    fi

    # Replace the original file with the optimized one
    mv "$temp_file" "$jpg_file"

    # Get the new file size
    new_size=$(stat -c%s "$jpg_file")
    new_size_mb=$(echo "scale=2; $new_size / 1048576" | bc)

    echo "Optimized $jpg_file (new size: ${new_size_mb}MB, quality: $quality)"
done

echo "Image optimization complete!"
