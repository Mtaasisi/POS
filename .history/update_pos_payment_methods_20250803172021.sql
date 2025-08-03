-- Update POS Page to use Unified Payment Methods
-- This script shows the changes needed for the POS page

-- 1. Add import at the top of src/pages/POSPage.tsx
-- Add this line after the existing imports:
-- import { PaymentMethodCardSelector } from '../components/ui/PaymentMethodSelector';

-- 2. Update the payment method state
-- Change this line:
-- const [paymentMethod, setPaymentMethod] = useState<string>('cash');
-- To:
-- const [paymentMethod, setPaymentMethod] = useState<string>('');

-- 3. Replace the payment method section
-- Replace lines 941-965 with:
/*
<div>
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
  <PaymentMethodCardSelector
    value={paymentMethod}
    onChange={setPaymentMethod}
    type="pos"
    showDescriptions={true}
    className="mb-4"
  />
</div>
*/

-- 4. Update the processSale function to use payment_method_id
-- In the processSale function, update the orderData object:
/*
const orderData = {
  customer_id: selectedCustomer?.id,
  total_amount: totals.subtotal,
  discount_amount: 0,
  tax_amount: totals.tax,
  shipping_cost: totals.shipping,
  final_amount: totals.total,
  amount_paid: amountPaid,
  balance_due: totals.balance,
  payment_method_id: paymentMethod, // Use the payment method ID instead of string
  customer_type: customerType,
  delivery_address: deliveryAddress,
  delivery_city: deliveryCity,
  delivery_method: deliveryMethod as 'local_transport' | 'air_cargo' | 'bus_cargo' | 'pickup',
  delivery_notes: deliveryNotes,
  location_id: currentLocation.id,
  created_by: user.id,
  status: (amountPaid >= totals.total ? 'completed' : 'partially_paid') as 'completed' | 'partially_paid'
};
*/ 