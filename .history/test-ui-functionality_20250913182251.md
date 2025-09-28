# Testing Device Price Editing UI

## How to Test the Price Editing Feature

### 1. **Apply Database Migrations First**
Before testing the UI, make sure to apply these database migrations:

```sql
-- Run this in your Supabase SQL editor
-- Migration 1: Add repair_price column to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS repair_price NUMERIC(12,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_devices_repair_price ON devices(repair_price);

-- Migration 2: Create device_price_history table
CREATE TABLE IF NOT EXISTS device_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    old_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    new_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    reason TEXT NOT NULL DEFAULT 'Price adjustment',
    updated_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_price_history_device_id ON device_price_history(device_id);
CREATE INDEX IF NOT EXISTS idx_device_price_history_updated_at ON device_price_history(updated_at);
CREATE INDEX IF NOT EXISTS idx_device_price_history_updated_by ON device_price_history(updated_by);

ALTER TABLE device_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON device_price_history
    FOR ALL USING (auth.role() = 'authenticated');
GRANT ALL ON device_price_history TO authenticated;
```

### 2. **Test the UI Flow**

1. **Go to Device Detail Page**
   - Navigate to any device in your system
   - Click "Record Payment" button

2. **Enter Payment Amount**
   - In the payment modal, you'll see a "Payment Amount" input field
   - Enter an amount **higher** than the original amount (e.g., 50000 if original is 30000)

3. **Select Payment Method**
   - Choose any payment method (Cash, Card, etc.)
   - The price editing section should appear

4. **Price Edit Section Should Show**
   - You should see an amber-colored section titled "Customer Paid More"
   - It shows:
     - Original Price: TZS 30,000
     - Amount Paid: TZS 50,000
     - Difference: TZS 20,000

5. **Update the Price**
   - Click "Update Price to Match Payment"
   - Enter a reason (e.g., "Customer paid more, additional services provided")
   - Click "Update Price"

### 3. **Expected Behavior**

✅ **What Should Happen:**
- Price edit section appears when customer pays more than original amount
- Database updates the device's repair_price
- Price change is recorded in device_price_history table
- Success toast notification appears

❌ **If It Doesn't Work:**
- Check browser console for errors
- Verify database migrations were applied
- Ensure you're logged in as a user with proper permissions
- Check that deviceId is being passed correctly

### 4. **Troubleshooting**

**Issue: Price edit section doesn't appear**
- Check: `allowPriceEdit={true}` is passed to PaymentsPopupModal
- Check: `deviceId` is being passed correctly
- Check: Payment amount is higher than original amount

**Issue: Database update fails**
- Check: Database migrations are applied
- Check: User has proper permissions
- Check: deviceId exists in devices table

**Issue: UI doesn't load**
- Check: All imports are correct
- Check: No TypeScript errors
- Check: Supabase connection is working

### 5. **Test Scenarios**

**Scenario 1: Normal Payment (No Overpayment)**
- Enter amount = 30000 (same as original)
- Price edit section should NOT appear

**Scenario 2: Overpayment**
- Enter amount = 50000 (more than original 30000)
- Price edit section SHOULD appear
- Can update device price to match payment

**Scenario 3: Multiple Payment Methods**
- Use split payment mode
- Enter total amount higher than original
- Price edit section should still appear

## Files Modified

- `src/components/PaymentsPopupModal.tsx` - Added price editing UI
- `src/features/devices/pages/DeviceDetailPage.tsx` - Enabled price editing
- `src/lib/devicePriceService.ts` - Service for price updates
- `src/lib/database.types.ts` - Updated types
- Database migrations for repair_price and device_price_history tables
