#!/bin/bash

# Try to use Safari or any available browser to convert HTML to PDF on macOS
HTML_FILE="/Users/murali/Documents/neuro/Neuro360/NEUROSENSE_PROJECT_HANDOFF.html"
PDF_FILE="/Users/murali/Documents/neuro/Neuro360/NEUROSENSE_PROJECT_HANDOFF.pdf"

# Use cupsfilter if available (macOS)
if command -v cupsfilter &> /dev/null; then
    cupsfilter -m application/pdf "$HTML_FILE" > "$PDF_FILE" 2>/dev/null
    if [ -f "$PDF_FILE" ] && [ -s "$PDF_FILE" ]; then
        echo "✓ PDF created successfully: $PDF_FILE"
        ls -lh "$PDF_FILE"
        exit 0
    fi
fi

# Alternative: Try using 'sips' if available
if command -v sips &> /dev/null; then
    echo "Converting via system tools..."
    # sips doesn't directly handle HTML, but we can try other approaches
fi

echo "⚠ Automatic PDF conversion requires browser installation."
echo "Please use Option 1: Open HTML in browser → Cmd+P → Save as PDF"
echo ""
echo "Or install Homebrew tools:"
echo "  brew install --cask wkhtmltopdf"
exit 1
