# WhatsApp CRM System

## Overview
Complete Customer Relationship Management system built from WhatsApp message data.

## Features
- Customer database with segmentation
- Automated response system
- Marketing automation
- Interactive dashboards
- Business analytics
- Location-based targeting (Arusha focus)

## Quick Start

### 1. Launch Dashboard
```bash
./launch_dashboard.sh
```
Then open: http://localhost:8501

### 2. Test Automation
```bash
./test_automation.sh
```

### 3. Extract Customer Data
```bash
python3 scripts/extract_customers.py
```

## Database Structure
- customers: Customer information and segmentation
- messages: All WhatsApp messages
- products: Product catalog
- sales: Sales transactions
- campaigns: Marketing campaigns
- automated_responses: Auto-response templates

## Key Components

### Customer Segmentation
- VIP: 1000+ messages
- Regular: 100-999 messages  
- Prospect: 10-99 messages
- Inactive: <10 messages

### Automated Responses
- Price inquiries
- Stock availability
- Delivery information
- Payment methods
- Greetings

### Marketing Automation
- Location-based campaigns
- Product-specific targeting
- Seasonal promotions
- Customer re-engagement

## Arusha Customers
Special focus on Arusha market with dedicated segmentation and campaigns.

## Reports
- Customer segments analysis
- Location-based analytics
- Message volume trends
- Top customers by activity

## Support
For issues or questions, check the logs in the logs/ directory.
