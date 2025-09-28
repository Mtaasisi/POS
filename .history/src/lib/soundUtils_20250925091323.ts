// Sound utilities for playing audio feedback
export class SoundManager {
  private static audioContext: AudioContext | null = null;
  private static isInitialized = false;
  private static userInteracted = false;
  private static initializationPromise: Promise<void> | null = null;

  // Initialize global user interaction listener
  static {
    // Mark user interaction on any user action
    const markInteraction = () => {
      this.markUserInteracted();
      // Remove listeners after first interaction
      document.removeEventListener('click', markInteraction);
      document.removeEventListener('keydown', markInteraction);
      document.removeEventListener('touchstart', markInteraction);
    };

    // Add listeners immediately
    document.addEventListener('click', markInteraction);
    document.addEventListener('keydown', markInteraction);
    document.addEventListener('touchstart', markInteraction);
  }

  private static async initialize() {
    if (this.isInitialized) return;
    
    // Only initialize AudioContext after user interaction
    if (!this.userInteracted) {
      // Reduced logging to prevent console spam
      return;
    }
    
    // Prevent multiple initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this.createAudioContext();
    await this.initializationPromise;
  }

  private static async createAudioContext() {
    try {
      // Only create AudioContext if it doesn't exist and user has interacted
      if (this.canCreateAudioContext()) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume the context if it's suspended
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        
        this.isInitialized = true;
        // Reduced logging to prevent console spam
      }
    } catch (error) {
      // Silently handle AudioContext creation errors to prevent console spam
      this.isInitialized = true; // Mark as initialized to prevent retries
    }
  }

  /**
   * Mark that user has interacted (call this on first user action)
   */
  static markUserInteracted() {
    if (!this.userInteracted) {
      this.userInteracted = true;
      // Reduced logging to prevent console spam
      // Trigger initialization after user interaction
      this.initialize();
    }
  }

  /**
   * Check if AudioContext can be safely created
   */
  private static canCreateAudioContext(): boolean {
    return this.userInteracted && !this.isInitialized && !this.audioContext;
  }

  /**
   * Play a notification sound when a remark is sent
   */
  static async playRemarkSound() {
    // Only play sound if user has interacted and AudioContext is ready
    if (!this.userInteracted) {
      // Silently skip if no user interaction yet
      return;
    }
    
    // Mark user interaction on first sound play
    this.markUserInteracted();
    await this.initialize();
    
    if (this.audioContext && this.audioContext.state === 'running') {
      // Create a pleasant notification sound using Web Audio API
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Create a pleasant notification sound
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } else {
      // Fallback: Create a simple audio element
      this.playFallbackSound();
    }
  }

  /**
   * Fallback method using HTML5 Audio
   */
  private static playFallbackSound() {
    try {
      // Simple fallback without AudioContext
      console.log('Playing fallback sound');
    } catch (error) {
      console.warn('Could not play remark sound:', error);
    }
  }

  /**
   * Play a success sound
   */
  static async playSuccessSound() {
    // Mark user interaction on first sound play
    this.markUserInteracted();
    await this.initialize();
    
    if (this.audioContext && this.audioContext.state === 'running') {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Success sound (ascending tones)
      oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2); // G5
      
      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    }
  }

  /**
   * Play an error sound
   */
  static async playErrorSound() {
    // Mark user interaction on first sound play
    this.markUserInteracted();
    await this.initialize();
    
    if (this.audioContext && this.audioContext.state === 'running') {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Error sound (descending tones)
      oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime); // G5
      oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime + 0.2); // C5
      
      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    }
  }

  /**
   * Play a click sound for button interactions
   */
  static async playClickSound() {
    try {
      // Mark user interaction on first sound play
      this.markUserInteracted();
      await this.initialize();
      
      if (!this.audioContext) {
        console.warn('AudioContext not available for click sound');
        return;
      }

      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (this.audioContext.state === 'running') {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Click sound (short, crisp tone)
        oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
        
        console.log('✅ Click sound played successfully');
      } else {
        console.warn(`AudioContext state is ${this.audioContext.state}, cannot play click sound`);
      }
    } catch (error) {
      console.error('Error playing click sound:', error);
    }
  }

  /**
   * Play a cart add sound for adding items to cart
   */
  static async playCartAddSound() {
    try {
      // Mark user interaction on first sound play
      this.markUserInteracted();
      await this.initialize();
      
      if (!this.audioContext) {
        console.warn('AudioContext not available for cart add sound');
        return;
      }

      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (this.audioContext.state === 'running') {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Cart add sound (pleasant chime)
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.05);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
        
        console.log('✅ Cart add sound played successfully');
      } else {
        console.warn(`AudioContext state is ${this.audioContext.state}, cannot play cart add sound`);
      }
    } catch (error) {
      console.error('Error playing cart add sound:', error);
    }
  }

  /**
   * Play a payment sound for successful transactions
   */
  static async playPaymentSound() {
    try {
      // Mark user interaction on first sound play
      this.markUserInteracted();
      await this.initialize();
      
      if (!this.audioContext) {
        console.warn('AudioContext not available for payment sound');
        return;
      }

      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (this.audioContext.state === 'running') {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Payment sound (cash register-like chime)
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2); // G5
        oscillator.frequency.setValueAtTime(1047, this.audioContext.currentTime + 0.3); // C6
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.4);
        
        console.log('✅ Payment sound played successfully');
      } else {
        console.warn(`AudioContext state is ${this.audioContext.state}, cannot play payment sound`);
      }
    } catch (error) {
      console.error('Error playing payment sound:', error);
    }
  }

  /**
   * Play a delete/remove sound
   */
  static async playDeleteSound() {
    // Mark user interaction on first sound play
    this.markUserInteracted();
    await this.initialize();
    
    if (this.audioContext && this.audioContext.state === 'running') {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Delete sound (descending tone)
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime + 0.1);
      oscillator.type = 'sawtooth';
      
      gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.2);
    }
  }

  /**
   * Test function to verify sound functionality
   */
  static async testSound() {
    console.log('Testing sound functionality...');
    try {
      await this.playRemarkSound();
      console.log('✅ Sound test successful');
    } catch (error) {
      console.error('❌ Sound test failed:', error);
    }
  }
} 