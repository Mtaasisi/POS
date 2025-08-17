#!/bin/bash

echo "🚀 Setting up Mobile Payment Integration for LATS System"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create a .env file with your Supabase credentials."
    exit 1
fi

echo "📝 Adding mobile payment finance accounts..."
node scripts/add-mobile-payment-accounts.js

echo ""
echo "✅ Mobile payment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Visit /lats/mobile-payment-test to test mobile payments"
echo "2. Visit /lats/zenopay-test to test ZenoPay integration"
echo "3. Visit /payments-accounts to manage payment accounts"
echo "4. Visit /pos to test POS mobile payments"
echo ""
echo "📱 Available mobile payment methods:"
echo "   - M-Pesa (Safaricom)"
echo "   - Airtel Money"
echo "   - ZenoPay"
echo "   - Tigo Pesa"
echo "   - Halopesa"
echo ""
echo "💳 Traditional payment methods:"
echo "   - Cash"
echo "   - Credit/Debit Cards"
echo "   - Bank Transfers"
echo ""
echo "🔧 Configuration files:"
echo "   - src/features/lats/config/zenopay.ts (ZenoPay config)"
echo "   - scripts/add-mobile-payment-accounts.js (Account setup)"
echo "   - src/features/lats/pages/MobilePaymentTestPage.tsx (Test page)"
