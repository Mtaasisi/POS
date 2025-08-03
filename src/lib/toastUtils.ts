import { toast as hotToast } from 'react-hot-toast';

// Custom toast utility that provides consistent methods
export const toast = {
  success: (message: string) => hotToast.success(message),
  error: (message: string) => hotToast.error(message),
  info: (message: string) => hotToast(message, {
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: '#fff',
    },
  }),
  warning: (message: string) => hotToast(message, {
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: '#fff',
    },
  }),
  loading: (message: string) => hotToast.loading(message),
  dismiss: (toastId?: string) => hotToast.dismiss(toastId),
};

export default toast; 