#!/bin/bash

echo "🎨 Payment Icon Manager"
echo "========================"

# Check if icons directory exists
if [ ! -d "public/icons/payment-methods" ]; then
    echo "❌ Icons directory not found. Creating..."
    mkdir -p public/icons/payment-methods
fi

echo ""
echo "📁 Current icons in /public/icons/payment-methods/:"
ls -la public/icons/payment-methods/ 2>/dev/null || echo "No icons found"

echo ""
echo "💡 How to add your own icons:"
echo "1. Place your icon files in: public/icons/payment-methods/"
echo "2. Supported formats: PNG, JPG, SVG"
echo "3. Use descriptive names: visa.png, mpesa.svg, mastercard.png"
echo ""
echo "📝 In the app, enter just the filename:"
echo "   - For 'visa.png' → Enter: visa.png"
echo "   - For 'mpesa.svg' → Enter: mpesa.svg"
echo ""
echo "🌐 You can also use full URLs:"
echo "   - https://example.com/icon.png"
echo ""
echo "✅ When you deploy, all icons will be available online!" 