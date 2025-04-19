#!/bin/bash

# Script to optimize images in the public folder
# Converts PNG to JPG with ImageMagick using specified parameters

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it first."
    exit 1
fi

# Find all PNG files in the public/images directory
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

echo "Image optimization complete!"