// Previous inline cart item UI that was used before VariantCartItem component
// This is the UI that was directly embedded in POSCartSection.tsx

<div className="space-y-3 mb-6">
  {cartItems.map((item) => (
    <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center overflow-hidden">
            {item.image ? (
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-6 h-6 text-blue-600" />
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {item.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <span className="font-mono">{item.sku || 'N/A'}</span>
                {item.variant?.name && item.variant.name !== 'Default' && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">{item.variant.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Price & Stock Info */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Unit Price:</span>
                <span className="font-medium text-gray-900">{format.money(item.price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium text-gray-900">{item.quantity}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-bold text-gray-900">{format.money(item.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Quantity:</span>
              <div className="flex items-center gap-1">
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => onUpdateCartItemQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="w-8 h-8 p-0"
                >
                  <Minus className="w-3 h-3" />
                </GlassButton>
                <span className="w-12 text-center font-medium text-gray-900">
                  {item.quantity}
                </span>
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => onUpdateCartItemQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 p-0"
                >
                  <Plus className="w-3 h-3" />
                </GlassButton>
              </div>
            </div>
            
            <GlassButton
              variant="danger"
              size="sm"
              onClick={() => onRemoveCartItem(item.id)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
