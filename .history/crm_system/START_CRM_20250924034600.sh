#!/bin/bash

echo "🚀 Starting WhatsApp CRM System..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "database/crm.db" ]; then
    echo "❌ CRM database not found. Please run from the crm_system directory."
    exit 1
fi

echo "📊 CRM System Status:"
echo "✅ Database: $(ls -lh database/crm.db | awk '{print $5}')"
echo "✅ Reports: $(ls reports/*.csv | wc -l) files generated"
echo "✅ Customers: $(sqlite3 database/crm.db 'SELECT COUNT(*) FROM customers;') total customers"
echo "✅ Messages: $(sqlite3 database/crm.db 'SELECT COUNT(*) FROM messages;') total messages"

echo ""
echo "🎯 Key Features Available:"
echo "• Interactive Dashboard (Streamlit)"
echo "• Customer Segmentation & Analytics"
echo "• Automated Response System"
echo "• Marketing Automation"
echo "• Arusha Customer Focus"
echo "• Business Intelligence Reports"

echo ""
echo "🚀 Launching Dashboard..."
echo "Opening: http://localhost:8501"
echo ""
echo "Press Ctrl+C to stop the dashboard"
echo ""

# Launch the dashboard
streamlit run dashboards/crm_dashboard.py --server.port 8501 --server.headless true
