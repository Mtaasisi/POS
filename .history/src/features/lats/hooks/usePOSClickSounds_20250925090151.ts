import { useCallback } from 'react';
import { SoundManager } from '../../../lib/soundUtils';
import { useGeneralSettings } from '../../../hooks/usePOSSettings';

export type POSClickSoundType = 
  | 'click' 
  | 'cart-add' 
  | 'payment' 
  | 'delete' 
  | 'success' 
  | 'error';

export interface POSClickSoundsConfig {
  enabled: boolean;
  volume: number;
  sounds: {
    click: boolean;
    cartAdd: boolean;
    payment: boolean;
    delete: boolean;
    success: boolean;
    error: boolean;
  };
}

const defaultConfig: POSClickSoundsConfig = {
  enabled: true,
  volume: 0.5,
  sounds: {
    click: true,
    cartAdd: true,
    payment: true,
    delete: true,
    success: true,
    error: true,
  },
};

/**
 * Custom hook for managing POS click sounds
 */
export const usePOSClickSounds = (config: Partial<POSClickSoundsConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };

  const playSound = useCallback(async (soundType: POSClickSoundType) => {
    if (!finalConfig.enabled) return;

    try {
      switch (soundType) {
        case 'click':
          if (finalConfig.sounds.click) {
            await SoundManager.playClickSound();
          }
          break;
        case 'cart-add':
          if (finalConfig.sounds.cartAdd) {
            await SoundManager.playCartAddSound();
          }
          break;
        case 'payment':
          if (finalConfig.sounds.payment) {
            await SoundManager.playPaymentSound();
          }
          break;
        case 'delete':
          if (finalConfig.sounds.delete) {
            await SoundManager.playDeleteSound();
          }
          break;
        case 'success':
          if (finalConfig.sounds.success) {
            await SoundManager.playSuccessSound();
          }
          break;
        case 'error':
          if (finalConfig.sounds.error) {
            await SoundManager.playErrorSound();
          }
          break;
        default:
          console.warn(`Unknown sound type: ${soundType}`);
      }
    } catch (error) {
      // Silently handle sound errors to prevent console spam
      console.debug('Sound playback error:', error);
    }
  }, [finalConfig]);

  const playClickSound = useCallback(() => playSound('click'), [playSound]);
  const playCartAddSound = useCallback(() => playSound('cart-add'), [playSound]);
  const playPaymentSound = useCallback(() => playSound('payment'), [playSound]);
  const playDeleteSound = useCallback(() => playSound('delete'), [playSound]);
  const playSuccessSound = useCallback(() => playSound('success'), [playSound]);
  const playErrorSound = useCallback(() => playSound('error'), [playSound]);

  return {
    playSound,
    playClickSound,
    playCartAddSound,
    playPaymentSound,
    playDeleteSound,
    playSuccessSound,
    playErrorSound,
    config: finalConfig,
  };
};

/**
 * Higher-order function to wrap click handlers with sound
 */
export const withClickSound = (
  handler: () => void,
  soundType: POSClickSoundType = 'click',
  soundConfig?: Partial<POSClickSoundsConfig>
) => {
  const { playSound } = usePOSClickSounds(soundConfig);
  
  return () => {
    playSound(soundType);
    handler();
  };
};

/**
 * Hook for POS-specific sound interactions
 */
export const usePOSInteractions = (soundConfig?: Partial<POSClickSoundsConfig>) => {
  const { playClickSound, playCartAddSound, playPaymentSound, playDeleteSound } = usePOSClickSounds(soundConfig);

  const handleAddToCart = useCallback((originalHandler: () => void) => {
    return () => {
      playCartAddSound();
      originalHandler();
    };
  }, [playCartAddSound]);

  const handlePayment = useCallback((originalHandler: () => void) => {
    return () => {
      playPaymentSound();
      originalHandler();
    };
  }, [playPaymentSound]);

  const handleDelete = useCallback((originalHandler: () => void) => {
    return () => {
      playDeleteSound();
      originalHandler();
    };
  }, [playDeleteSound]);

  const handleClick = useCallback((originalHandler: () => void) => {
    return () => {
      playClickSound();
      originalHandler();
    };
  }, [playClickSound]);

  return {
    handleAddToCart,
    handlePayment,
    handleDelete,
    handleClick,
  };
};
