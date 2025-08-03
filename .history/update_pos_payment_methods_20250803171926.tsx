import { PaymentMethodCardSelector } from '../components/ui/PaymentMethodSelector';

const [paymentMethod, setPaymentMethod] = useState<string>('');

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