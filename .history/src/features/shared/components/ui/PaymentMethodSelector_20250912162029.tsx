import React, { useState, useEffect } from 'react';
import { usePaymentAccounts } from '../../../../hooks/usePaymentAccounts';
import { FinanceAccount } from '../../../../lib/financeAccountService';
import PaymentMethodIcon from '../../../../components/PaymentMethodIcon';

interface PaymentAccountSelectorProps {
  value?: string;
  onChange: (paymentAccountId: string) => void;
  type?: 'pos' | 'finance' | 'all';
  showIcons?: boolean;
  showDescriptions?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export const PaymentAccountSelector: React.FC<PaymentAccountSelectorProps> = ({
  value,
  onChange,
  type = 'all',
  showIcons = true,
  showDescriptions = false,
  className = '',
  placeholder = 'Select payment account',
  disabled = false,
  required = false
}) => {
  const { paymentAccounts, loading, getPOSPaymentAccounts, getFinancePaymentAccounts } = usePaymentAccounts();
  const [filteredAccounts, setFilteredAccounts] = useState<FinanceAccount[]>([]);

  useEffect(() => {
    const loadPaymentAccounts = async () => {
      let accounts: FinanceAccount[] = [];
      
      switch (type) {
        case 'pos':
          accounts = await getPOSPaymentAccounts();
          break;
        case 'finance':
          accounts = await getFinancePaymentAccounts();
          break;
        default:
          accounts = paymentAccounts;
          break;
      }
      
      setFilteredAccounts(accounts);
    };

    loadPaymentAccounts();
  }, [type, paymentAccounts, getPOSPaymentAccounts, getFinancePaymentAccounts]);

  const getIconForAccount = (account: FinanceAccount) => {
    return (
      <PaymentMethodIcon 
        type={account.type} 
        name={account.name} 
        size="sm" 
      />
    );
  };

  const getColorForAccount = (account: FinanceAccount) => {
    const colorMap: Record<string, string> = {
      'bank': '#059669',
      'cash': '#10B981',
      'mobile_money': '#DC2626',
      'credit_card': '#3B82F6',
      'savings': '#8B5CF6',
      'investment': '#F59E0B',
      'other': '#6B7280'
    };
    
    return colorMap[account.type] || '#3B82F6';
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {filteredAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {showIcons && (() => {
              const iconMap: Record<string, string> = {
                'bank': '🏦', 'cash': '💰', 'mobile_money': '📱', 'credit_card': '💳',
                'savings': '🏦', 'investment': '📈', 'other': '💳'
              };
              return iconMap[account.type] || '💳';
            })()} {account.name}
            {showDescriptions && ` - ${account.type} (${account.balance})`}
          </option>
        ))}
      </select>
    </div>
  );
};

// Card-based payment account selector
interface PaymentAccountCardSelectorProps {
  value?: string;
  onChange: (paymentAccountId: string) => void;
  type?: 'pos' | 'finance' | 'all';
  showDescriptions?: boolean;
  className?: string;
  disabled?: boolean;
}

export const PaymentAccountCardSelector: React.FC<PaymentAccountCardSelectorProps> = ({
  value,
  onChange,
  type = 'all',
  showDescriptions = true,
  className = '',
  disabled = false
}) => {
  const { paymentAccounts, loading, getPOSPaymentAccounts, getFinancePaymentAccounts } = usePaymentAccounts();
  const [filteredAccounts, setFilteredAccounts] = useState<FinanceAccount[]>([]);

  useEffect(() => {
    const loadPaymentAccounts = async () => {
      let accounts: FinanceAccount[] = [];
      
      switch (type) {
        case 'pos':
          accounts = await getPOSPaymentAccounts();
          break;
        case 'finance':
          accounts = await getFinancePaymentAccounts();
          break;
        default:
          accounts = paymentAccounts;
          break;
      }
      
      setFilteredAccounts(accounts);
    };

    loadPaymentAccounts();
  }, [type, paymentAccounts, getPOSPaymentAccounts, getFinancePaymentAccounts]);

  const getIconForAccount = (account: FinanceAccount) => {
    return (
      <PaymentMethodIcon 
        type={account.type} 
        name={account.name} 
        size="sm" 
      />
    );
  };

  const getColorForAccount = (account: FinanceAccount) => {
    const colorMap: Record<string, string> = {
      'bank': '#059669',
      'cash': '#10B981',
      'mobile_money': '#DC2626',
      'credit_card': '#3B82F6',
      'savings': '#8B5CF6',
      'investment': '#F59E0B',
      'other': '#6B7280'
    };
    
    return colorMap[account.type] || '#3B82F6';
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 ${className}`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 ${className}`}>
      {filteredAccounts.map((account) => (
        <button
          key={account.id}
          type="button"
          onClick={() => !disabled && onChange(account.id)}
          disabled={disabled}
          className={`
            p-4 rounded-lg border-2 transition-all duration-200 text-left
            ${value === account.id 
              ? 'border-blue-500 bg-blue-50 shadow-md' 
              : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          style={{
            borderColor: value === account.id ? getColorForAccount(account) : undefined,
            backgroundColor: value === account.id ? `${getColorForAccount(account)}10` : undefined
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getIconForAccount(account)}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{account.name}</div>
              {showDescriptions && (
                <div className="text-sm text-gray-500 truncate">
                  {account.type} • ${(() => {
                  const formatted = account.balance.toFixed(2);
                  return formatted.replace(/\.00$/, '').replace(/\.0$/, '');
                })()}
                </div>
              )}
            </div>
            {value === account.id && (
              <div 
                className="w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: getColorForAccount(account) }}
              >
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

// Payment account display component
interface PaymentAccountDisplayProps {
  paymentAccountId?: string;
  showIcon?: boolean;
  showDescription?: boolean;
  className?: string;
}

export const PaymentAccountDisplay: React.FC<PaymentAccountDisplayProps> = ({
  paymentAccountId,
  showIcon = true,
  showDescription = false,
  className = ''
}) => {
  const { getPaymentAccountById } = usePaymentAccounts();
  const [account, setAccount] = useState<FinanceAccount | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAccount = async () => {
      if (!paymentAccountId) {
        setAccount(null);
        return;
      }

      setLoading(true);
      const paymentAccount = await getPaymentAccountById(paymentAccountId);
      setAccount(paymentAccount);
      setLoading(false);
    };

    loadAccount();
  }, [paymentAccountId, getPaymentAccountById]);

  const getIconForAccount = (account: FinanceAccount) => {
    return (
      <PaymentMethodIcon 
        type={account.type} 
        name={account.name} 
        size="sm" 
      />
    );
  };

  if (loading) {
    return <div className={`animate-pulse h-6 bg-gray-200 rounded ${className}`}></div>;
  }

  if (!account) {
    return <span className={`text-gray-500 ${className}`}>No payment account</span>;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && (
        <span className="text-lg">{getIconForAccount(account)}</span>
      )}
      <div>
        <div className="font-medium">{account.name}</div>
        {showDescription && (
          <div className="text-sm text-gray-500">
                            {account.type} • ${(() => {
                  const formatted = account.balance.toFixed(2);
                  return formatted.replace(/\.00$/, '').replace(/\.0$/, '');
                })()}
          </div>
        )}
      </div>
    </div>
  );
}; 