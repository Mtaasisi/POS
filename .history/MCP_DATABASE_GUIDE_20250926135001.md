# MCP Database Connection Guide

## Overview
This guide shows you how to use MCP (Model Context Protocol) to easily manage your Supabase database for the LATS CHANCE project.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
./setup-mcp-database.sh
```

### 2. Configure Environment
Make sure your `.env` file contains:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For full access
```

### 3. Test Connection
```bash
node test-mcp-connection.js
```

## 🔧 Available MCP Tools

### 1. **query_database**
Execute SQL queries directly on your database.

**Parameters:**
- `query`: SQL query string
- `table`: Table name for simple operations
- `operation`: select, insert, update, delete
- `data`: Data for insert/update operations
- `filters`: Filters for operations

**Examples:**
```javascript
// Direct SQL query
{
  "query": "SELECT * FROM customers WHERE name LIKE '%John%'"
}

// Table operation
{
  "table": "customers",
  "operation": "select",
  "filters": { "name": "John Doe" }
}
```

### 2. **get_table_info**
Get detailed information about a table structure.

**Parameters:**
- `table`: Table name

**Example:**
```javascript
{
  "table": "lats_products"
}
```

### 3. **list_tables**
List all tables in your database.

**Example:**
```javascript
{}
```

### 4. **backup_table**
Create a backup of a table.

**Parameters:**
- `table`: Table name to backup
- `format`: json or csv (default: json)

**Example:**
```javascript
{
  "table": "customers",
  "format": "json"
}
```

### 5. **restore_table**
Restore a table from backup data.

**Parameters:**
- `table`: Table name to restore
- `data`: Backup data array

**Example:**
```javascript
{
  "table": "customers",
  "data": [{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}]
}
```

### 6. **get_table_stats**
Get statistics about a table.

**Parameters:**
- `table`: Table name

**Example:**
```javascript
{
  "table": "lats_sales"
}
```

## 📊 Common Database Operations

### View All Customers
```javascript
{
  "table": "customers",
  "operation": "select"
}
```

### Add New Customer
```javascript
{
  "table": "customers",
  "operation": "insert",
  "data": {
    "name": "John Doe",
    "phone": "+255123456789",
    "email": "john@example.com"
  }
}
```

### Update Customer
```javascript
{
  "table": "customers",
  "operation": "update",
  "data": { "name": "John Smith" },
  "filters": { "id": "customer-id-here" }
}
```

### Get Sales Statistics
```javascript
{
  "query": "SELECT COUNT(*) as total_sales, SUM(total_amount) as total_revenue FROM lats_sales"
}
```

### View Products with Variants
```javascript
{
  "query": "SELECT p.name, pv.variant_name, pv.price FROM lats_products p JOIN lats_product_variants pv ON p.id = pv.product_id"
}
```

## 🔍 Database Schema Overview

### Core Tables
- **customers**: Customer information
- **lats_products**: Product catalog
- **lats_product_variants**: Product variants and pricing
- **lats_sales**: Sales transactions
- **lats_sale_items**: Individual sale items
- **employees**: Staff information
- **lats_categories**: Product categories
- **lats_brands**: Product brands
- **lats_suppliers**: Supplier information

### WhatsApp Integration Tables
- **whatsapp_instances_comprehensive**: WhatsApp instances
- **whatsapp_messages**: Message history
- **whatsapp_message_templates**: Message templates
- **green_api_message_queue**: Green API message queue

### POS Settings Tables
- **lats_pos_general_settings**: General POS settings
- **lats_pos_receipt_settings**: Receipt configuration
- **lats_pos_barcode_scanner_settings**: Barcode scanner settings
- **lats_pos_user_permissions_settings**: User permissions

## 🛠️ Troubleshooting

### Connection Issues
1. Check your `.env` file has correct Supabase credentials
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set for full access
3. Run `node test-mcp-connection.js` to verify connection

### Permission Issues
- Use `SUPABASE_SERVICE_ROLE_KEY` instead of `VITE_SUPABASE_ANON_KEY` for full database access
- Check RLS (Row Level Security) policies in Supabase dashboard

### Common Errors
- **401 Unauthorized**: Check API key permissions
- **400 Bad Request**: Verify query syntax
- **406 Not Acceptable**: Check request headers

## 📈 Performance Tips

1. **Use filters** to limit query results
2. **Select specific columns** instead of `SELECT *`
3. **Use indexes** on frequently queried columns
4. **Batch operations** for multiple inserts/updates

## 🔒 Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Use environment variables for all credentials
- Regularly rotate API keys
- Monitor database access logs

## 📞 Support

For issues with MCP database connection:
1. Check the test connection script output
2. Verify Supabase project settings
3. Review RLS policies in Supabase dashboard
4. Check network connectivity

---

**Ready to use MCP for easy database management!** 🎉
