import { useState, useCallback, useMemo } from 'react';

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export const usePOSCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');

  // Add item to cart
  const addToCart = useCallback((product: any, variant?: any, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.productId === product.id && 
        item.variantId === (variant?.id || product.variants?.[0]?.id)
      );

      if (existingItem) {
        return prevItems.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + quantity, totalPrice: item.price * (item.quantity + quantity) }
            : item
        );
      }

      const newItem: CartItem = {
        id: `${product.id}-${variant?.id || product.variants?.[0]?.id}-${Date.now()}`,
        productId: product.id,
        variantId: variant?.id || product.variants?.[0]?.id,
        name: product.name,
        variantName: variant?.name || product.variants?.[0]?.name,
        price: variant?.sellingPrice || product.variants?.[0]?.sellingPrice,
        quantity,
        totalPrice: (variant?.sellingPrice || product.variants?.[0]?.sellingPrice) * quantity
      };

      return [...prevItems, newItem];
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);

  // Update item quantity
  const updateCartItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, quantity, totalPrice: item.price * quantity }
          : item
      )
    );
  }, [removeFromCart]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setSelectedCustomer(null);
    setManualDiscount(0);
    setDiscountValue('');
  }, []);

  // Calculate cart totals
  const cartTotals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    let discount = 0;
    if (discountType === 'percentage' && manualDiscount > 0) {
      discount = (subtotal * manualDiscount) / 100;
    } else if (discountType === 'fixed') {
      discount = manualDiscount;
    }
    
    const finalPrice = Math.max(0, subtotal - discount);
    const tax = finalPrice * 0.18; // 18% VAT
    const total = finalPrice + tax;

    return {
      subtotal,
      discount,
      finalPrice,
      tax,
      total,
      itemCount: cartItems.length
    };
  }, [cartItems, manualDiscount, discountType]);

  // Apply discount
  const applyDiscount = useCallback((value: string, type: 'percentage' | 'fixed') => {
    const numValue = parseFloat(value) || 0;
    setDiscountValue(value);
    setDiscountType(type);
    setManualDiscount(numValue);
  }, []);

  // Remove discount
  const removeDiscount = useCallback(() => {
    setManualDiscount(0);
    setDiscountValue('');
  }, []);

  return {
    // State
    cartItems,
    selectedCustomer,
    manualDiscount,
    discountType,
    discountValue,
    cartTotals,
    
    // Actions
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    setSelectedCustomer,
    applyDiscount,
    removeDiscount,
    setDiscountType
  };
};
