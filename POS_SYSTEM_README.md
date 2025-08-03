# Point of Sale (POS) System

A comprehensive Point of Sale system integrated into your existing application, designed for efficient sales processing with advanced features like tiered pricing, external product sales, installment payments, and multiple delivery options.

## 🚀 Features

### Core POS Features
- **Product Search & Cart Management**: Search products by name, SKU, or barcode
- **Tiered Pricing**: Automatic price adjustment for retail vs wholesale customers
- **External Product Sales**: Add products not in your inventory (drop-shipping)
- **Multiple Payment Methods**: Cash, Card, Transfer, Installment, Payment on Delivery
- **Delivery Options**: Local Transport, Air Cargo, Bus Cargo, Pickup
- **Real-time Calculations**: Automatic subtotal, tax, shipping, and final amount calculation
- **Receipt Generation**: Printable receipts with order details

### Advanced Features
- **Installment Payments**: Track partial payments and balance due
- **Customer Management**: Select existing customers or add new ones
- **Inventory Integration**: Automatic stock deduction for sold items
- **Sales Analytics**: Real-time statistics and reporting
- **Order Status Tracking**: Pending, Completed, On Hold, Cancelled, etc.

## 📋 Database Setup

### Prerequisites
- Supabase project with existing tables (customers, products, product_variants)
- PostgreSQL database access

### Installation Steps

1. **Run the SQL Migration**:
   ```bash
   # Connect to your Supabase database and run:
   psql -h your-supabase-host -U postgres -d postgres -f setup_pos_tables.sql
   ```

2. **Verify Tables Created**:
   ```sql
   -- Check if tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('sales_orders', 'sales_order_items', 'installment_payments');
   ```

3. **Test the Setup**:
   ```sql
   -- Test the POS statistics function
   SELECT * FROM get_pos_stats();
   ```

## 🛠️ Application Setup

### 1. Types Integration
The POS types have been added to `src/types.ts`:
- `SaleOrder`, `SaleOrderItem`, `InstallmentPayment`
- `CartItem`, `POSState`
- Payment and delivery method enums

### 2. API Integration
The POS API (`src/lib/posApi.ts`) provides:
- `createSaleOrder()`: Create new sales orders
- `recordInstallmentPayment()`: Track partial payments
- `getProductPrice()`: Get tiered pricing
- `searchProductsForPOS()`: Product search functionality
- `getPOSStats()`: Sales analytics

### 3. Components
All POS components are in `src/components/pos/`:
- `ProductSearchInput.tsx`: Product search with results
- `CartItem.tsx`: Individual cart item display
- `PaymentSection.tsx`: Payment method and amount handling
- `DeliverySection.tsx`: Delivery options and address
- `AddExternalProductModal.tsx`: External product addition

### 4. Main POS Page
The main POS interface is at `src/pages/POSPage.tsx` with:
- Product search and cart management
- Customer selection and tiered pricing
- Payment processing and delivery options
- Real-time order summary and calculations

## 🎯 Usage Guide

### Basic Sales Process

1. **Access POS**: Navigate to `/pos` in your application
2. **Select Customer**: Choose existing customer or add new one
3. **Set Customer Type**: Retail or Wholesale (affects pricing)
4. **Search Products**: Use the search bar to find products
5. **Add to Cart**: Click the "+" button to add items
6. **Adjust Quantities**: Use +/- buttons or type directly
7. **Configure Payment**: Select payment method and enter amount
8. **Set Delivery**: Choose delivery method and enter address
9. **Process Sale**: Click "Process Sale" to complete transaction

### Advanced Features

#### External Products
1. Click "Add External Product" button
2. Enter product name, description, price, and quantity
3. Product will be added to cart with "External" badge
4. No inventory impact for external products

#### Installment Payments
1. Select "Installment" as payment method
2. Enter partial payment amount
3. Balance will be tracked for future payments
4. Use "Record Installment Payment" for additional payments

#### Payment on Delivery
1. Select "Payment on Delivery" as payment method
2. Order status automatically set to "payment_on_delivery"
3. Full amount will be collected upon delivery

### Customer Types

#### Retail Customers
- Standard pricing
- Individual purchases
- Immediate payment expected

#### Wholesale Customers
- 10% discount applied automatically
- Bulk purchases
- Flexible payment terms

## 📊 Database Schema

### sales_orders
```sql
- id (UUID, Primary Key)
- customer_id (UUID, Foreign Key)
- order_date (TIMESTAMP)
- status (TEXT: pending, completed, on_hold, etc.)
- total_amount (DECIMAL)
- discount_amount (DECIMAL)
- tax_amount (DECIMAL)
- shipping_cost (DECIMAL)
- final_amount (DECIMAL)
- amount_paid (DECIMAL)
- balance_due (DECIMAL)
- payment_method (TEXT)
- customer_type (TEXT: retail, wholesale)
- delivery_address (TEXT)
- delivery_city (TEXT)
- delivery_method (TEXT)
- delivery_notes (TEXT)
```

### sales_order_items
```sql
- id (UUID, Primary Key)
- order_id (UUID, Foreign Key)
- product_id (UUID, Foreign Key, nullable)
- variant_id (UUID, Foreign Key, nullable)
- quantity (INTEGER)
- unit_price (DECIMAL)
- unit_cost (DECIMAL)
- item_total (DECIMAL)
- is_external_product (BOOLEAN)
- external_product_details (JSONB)
```

### installment_payments
```sql
- id (UUID, Primary Key)
- order_id (UUID, Foreign Key)
- payment_date (TIMESTAMP)
- amount (DECIMAL)
- payment_method (TEXT)
- notes (TEXT)
- created_by (UUID, Foreign Key)
```

## 🔧 Configuration

### Environment Variables
No additional environment variables required - uses existing Supabase configuration.

### Customization Options

#### Pricing Tiers
Modify the wholesale discount in `src/lib/posApi.ts`:
```typescript
if (customerType === 'wholesale') {
  price = price * 0.9; // 10% discount
}
```

#### Delivery Methods
Add new delivery methods in `src/types.ts`:
```typescript
export type DeliveryMethod = 'local_transport' | 'air_cargo' | 'bus_cargo' | 'pickup' | 'your_new_method';
```

#### Payment Methods
Add new payment methods in `src/types.ts`:
```typescript
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'installment' | 'payment_on_delivery' | 'your_new_method';
```

## 📈 Analytics & Reporting

### POS Statistics
The system provides real-time statistics:
- Total sales amount
- Total orders count
- Average order value
- Today's sales
- Today's orders count

### Sales Reports
Access sales data through the database views:
- `sales_orders_with_customer`: Orders with customer details
- `sales_order_items_with_details`: Items with product details
- `get_pos_stats()`: Function for POS statistics

## 🔒 Security

### Row Level Security (RLS)
All POS tables have RLS policies:
- Users can only view their own orders
- Admins can view all orders
- Proper authentication required for all operations

### Data Validation
- Input validation on all forms
- Currency formatting
- Quantity limits based on stock
- Payment amount validation

## 🐛 Troubleshooting

### Common Issues

1. **Products not appearing in search**:
   - Check if products are marked as `is_active = true`
   - Verify product variants exist and have stock

2. **Payment processing fails**:
   - Ensure customer is selected
   - Check payment amount is valid
   - Verify database connection

3. **Inventory not updating**:
   - Check if product variants have sufficient stock
   - Verify `updateStock` function permissions

### Debug Mode
Enable debug logging in `src/lib/posApi.ts`:
```typescript
console.log('POS Debug:', { orderData, result });
```

## 🚀 Future Enhancements

### Planned Features
- [ ] Barcode scanner integration
- [ ] Receipt printing functionality
- [ ] Advanced inventory management
- [ ] Customer loyalty program integration
- [ ] Multi-currency support
- [ ] Tax calculation automation
- [ ] Email/SMS notifications
- [ ] Advanced reporting dashboard

### API Extensions
- [ ] Bulk order processing
- [ ] Order templates
- [ ] Customer credit management
- [ ] Supplier integration
- [ ] Advanced analytics

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review database logs for errors
3. Verify all tables and functions are created correctly
4. Test with sample data to isolate issues

## 📝 License

This POS system is part of your existing application and follows the same licensing terms.

---

**Note**: This POS system is designed to integrate seamlessly with your existing application architecture while providing powerful sales processing capabilities. All features are built with scalability and maintainability in mind. 