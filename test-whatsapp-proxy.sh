#!/bin/bash

# WhatsApp Proxy Test Script
echo "🧪 Testing WhatsApp Proxy..."

# Test 1: Health Check
echo "📋 Test 1: Health Check"
curl -X POST https://inauzwa.store/api/whatsapp-proxy.php \
  -H "Content-Type: application/json" \
  -d '{"action":"health"}' \
  -w "\nStatus: %{http_code}\n"

echo ""

# Test 2: Get State Instance
echo "📋 Test 2: Get State Instance"
curl -X POST https://inauzwa.store/api/whatsapp-proxy.php \
  -H "Content-Type: application/json" \
  -d '{"action":"getStateInstance"}' \
  -w "\nStatus: %{http_code}\n"

echo ""

# Test 3: Invalid Request (should return 400)
echo "📋 Test 3: Invalid Request (should return 400)"
curl -X POST https://inauzwa.store/api/whatsapp-proxy.php \
  -H "Content-Type: application/json" \
  -d '{"invalid":"request"}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "✅ Tests completed"
