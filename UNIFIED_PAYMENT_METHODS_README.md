# Unified Payment Methods System

This system connects payment methods between POS and Finance Management, providing a unified approach to handling payments across your entire application.

## 🎯 Overview

The unified payment methods system allows you to:
- **Share payment methods** between POS and Finance Management
- **Link payment methods to finance accounts** for automatic accounting
- **Manage payment methods centrally** with a single interface
- **Support multiple payment types** (cash, card, transfer, mobile money, etc.)
- **Customize payment methods** with icons, colors, and descriptions

## 🏗️ Architecture

### Database Tables

1. **`payment_methods`** - Central payment methods table
   - `id` - Unique identifier
   - `name` - Display name
   - `code` - Unique code for identification
   - `type` - Payment type (cash, card, transfer, etc.)
   - `icon` - Icon identifier
   - `color` - Color hex code
   - `description` - Optional description
   - `is_active` - Active status

2. **`payment_method_accounts`** - Links payment methods to finance accounts
   - `payment_method_id` - Reference to payment method
   - `account_id` - Reference to finance account
   - `is_default` - Whether this is the default account for this method

### Updated Tables

The following tables have been updated to reference the unified payment methods:

- **`sales_orders`** - POS orders now reference `payment_method_id`
- **`finance_expenses`** - Finance expenses now reference `payment_method_id`
- **`installment_payments`** - Installment payments now reference `payment_method_id`

## 🚀 Setup

### 1. Apply Database Changes

Run the SQL setup script:

```bash
# Option 1: Run the Node.js script
node apply_unified_payment_methods.mjs

# Option 2: Copy and paste the SQL directly
# Copy the contents of unified_payment_methods_setup.sql into your Supabase SQL editor
```

### 2. Verify Setup

Check that the following tables exist:
- `payment_methods`
- `payment_method_accounts`

And that the following columns have been added:
- `sales_orders.payment_method_id`
- `finance_expenses.payment_method_id`
- `installment_payments.payment_method_id`

## 📦 Components

### PaymentMethodService (`src/lib/paymentMethodService.ts`)

Core service for managing payment methods:

```typescript
import { paymentMethodService } from '../lib/paymentMethodService';

// Get all active payment methods
const methods = await paymentMethodService.getActivePaymentMethods();

// Get POS-specific payment methods
const posMethods = await paymentMethodService.getPOSPaymentMethods();

// Get Finance-specific payment methods
const financeMethods = await paymentMethodService.getFinancePaymentMethods();

// Link payment method to account
await paymentMethodService.linkPaymentMethodToAccount(methodId, accountId);
```

### usePaymentMethods Hook (`src/hooks/usePaymentMethods.ts`)

React hook for managing payment methods in components:

```typescript
import { usePaymentMethods } from '../hooks/usePaymentMethods';

const { 
  paymentMethods, 
  loading, 
  getPOSPaymentMethods,
  createPaymentMethod 
} = usePaymentMethods();
```

### PaymentMethodSelector Components (`src/components/ui/PaymentMethodSelector.tsx`)

Reusable components for selecting payment methods:

```typescript
import { PaymentMethodSelector, PaymentMethodCardSelector, PaymentMethodDisplay } from '../components/ui/PaymentMethodSelector';

// Dropdown selector
<PaymentMethodSelector
  value={selectedMethod}
  onChange={setSelectedMethod}
  type="pos" // or "finance" or "all"
/>

// Card-based selector
<PaymentMethodCardSelector
  value={selectedMethod}
  onChange={setSelectedMethod}
  type="pos"
/>

// Display component
<PaymentMethodDisplay
  paymentMethodId={methodId}
  showIcon={true}
  showDescription={true}
/>
```

## 🔧 Usage Examples

### In POS System

```typescript
import { PaymentMethodCardSelector } from '../components/ui/PaymentMethodSelector';

const POSPaymentSection = () => {
  const [paymentMethod, setPaymentMethod] = useState('');
  
  return (
    <div>
      <h3>Payment Method</h3>
      <PaymentMethodCardSelector
        value={paymentMethod}
        onChange={setPaymentMethod}
        type="pos"
        showDescriptions={true}
      />
    </div>
  );
};
```

### In Finance Management

```typescript
import { PaymentMethodSelector } from '../components/ui/PaymentMethodSelector';

const FinancePaymentSection = () => {
  const [paymentMethod, setPaymentMethod] = useState('');
  
  return (
    <div>
      <label>Payment Method</label>
      <PaymentMethodSelector
        value={paymentMethod}
        onChange={setPaymentMethod}
        type="finance"
        showIcons={true}
        showDescriptions={true}
      />
    </div>
  );
};
```

### In Admin Dashboard

```typescript
import PaymentMethodManagement from '../components/admin-dashboard/PaymentMethodManagement';

const AdminDashboard = () => {
  return (
    <div>
      <PaymentMethodManagement />
    </div>
  );
};
```

## 🎨 Payment Method Types

### Available Types

1. **Cash** (`cash`)
   - Cash payments
   - Cash on delivery

2. **Card** (`card`)
   - Credit card
   - Debit card
   - Generic card payment

3. **Transfer** (`transfer`)
   - Bank transfer
   - Wire transfer

4. **Mobile Money** (`mobile_money`)
   - Mobile money payments

5. **Check** (`check`)
   - Check payments
   - Postdated checks

6. **Installment** (`installment`)
   - Installment payments
   - Monthly installments

7. **Delivery** (`delivery`)
   - Payment on delivery
   - Pickup payment

### Icons and Colors

Each payment method can be customized with:
- **Icons**: Emoji representations (💰, 💳, 🏦, etc.)
- **Colors**: Hex color codes for UI theming
- **Descriptions**: Detailed explanations

## 🔗 Linking to Finance Accounts

### Manual Linking

```typescript
// Link a payment method to an account
await paymentMethodService.linkPaymentMethodToAccount(
  paymentMethodId,
  accountId,
  isDefault = false
);

// Set default account for a payment method
await paymentMethodService.setDefaultAccountForPaymentMethod(
  paymentMethodId,
  accountId
);
```

### Automatic Account Selection

When a payment method is selected, the system can automatically:
1. Find the default account for that payment method
2. Update the account balance when payment is processed
3. Create accounting entries automatically

## 📊 Migration from Old System

The system includes automatic migration functions:

1. **Existing payment methods** are automatically mapped to new unified methods
2. **Old payment_method columns** are preserved for backward compatibility
3. **New payment_method_id columns** are populated with references to unified methods

### Migration Process

```sql
-- This runs automatically during setup
SELECT migrate_existing_payment_methods();
```

## 🛠️ Customization

### Adding New Payment Methods

```typescript
// Create a new payment method
const newMethod = await paymentMethodService.createPaymentMethod({
  name: 'Crypto Payment',
  code: 'crypto',
  type: 'transfer',
  icon: 'bitcoin',
  color: '#F7931A',
  description: 'Cryptocurrency payments',
  is_active: true
});
```

### Custom Icons

Add new icons to the icon mapping:

```typescript
const iconMap: Record<string, string> = {
  'dollar-sign': '💰',
  'credit-card': '💳',
  'bitcoin': '₿',
  // Add your custom icons here
};
```

## 🔍 Troubleshooting

### Common Issues

1. **Payment methods not loading**
   - Check if the `payment_methods` table exists
   - Verify RLS policies are set correctly
   - Ensure user has proper permissions

2. **Migration not working**
   - Run the migration function manually: `SELECT migrate_existing_payment_methods();`
   - Check for any constraint violations

3. **Component not rendering**
   - Verify the hook is properly imported
   - Check for TypeScript errors
   - Ensure all required props are passed

### Debug Commands

```sql
-- Check payment methods
SELECT * FROM payment_methods WHERE is_active = true;

-- Check payment method accounts
SELECT pm.name, fa.name as account_name, pma.is_default
FROM payment_method_accounts pma
JOIN payment_methods pm ON pma.payment_method_id = pm.id
JOIN finance_accounts fa ON pma.account_id = fa.id;

-- Check migration status
SELECT payment_method, payment_method_id 
FROM sales_orders 
WHERE payment_method IS NOT NULL;
```

## 📈 Benefits

1. **Consistency**: Same payment methods across all systems
2. **Maintainability**: Single source of truth for payment methods
3. **Flexibility**: Easy to add new payment methods
4. **Integration**: Seamless connection between POS and Finance
5. **User Experience**: Consistent UI across all payment selections
6. **Accounting**: Automatic account linking and balance updates

## 🔮 Future Enhancements

- **Payment Gateway Integration**: Direct integration with payment processors
- **Analytics**: Payment method usage analytics
- **Multi-currency Support**: Support for different currencies
- **Advanced Rules**: Conditional payment method availability
- **API Endpoints**: REST API for external integrations

## 📝 Notes

- The system maintains backward compatibility with existing payment_method columns
- All payment methods are soft-deleted (is_active = false) rather than hard-deleted
- The system supports both simple dropdown and card-based selection interfaces
- Payment methods can be filtered by type (POS, Finance, or All)
- Account linking is optional and can be done on-demand 