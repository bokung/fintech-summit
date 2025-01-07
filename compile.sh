#!/bin/bash

# Output file
OUTPUT_FILE="all_source_code.txt"

# Clear the output file if it already exists
echo "" > "$OUTPUT_FILE"

# Find and process files
find . \( -name "*.py" -o -name "*.vue" -o -name "*.js" \) \
    ! -path "./website/node_modules/*" | while read -r file; do
    echo "Processing: $file"
    echo -e "\n===== File: $file =====\n" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo -e "\n" >> "$OUTPUT_FILE"
done

echo "All source code has been collected in $OUTPUT_FILE"
