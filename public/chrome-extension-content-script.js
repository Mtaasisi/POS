// Content script for Chrome extension - injects shortcut button into WhatsApp Web
(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        buttonId: 'lats-chance-shortcut',
        buttonText: 'LATS CHANCE',
        buttonIcon: '⚡',
        appUrl: 'https://your-domain.com/whatsapp/chrome-extension',
        styles: {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '9999',
            backgroundColor: '#25D366',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
        }
    };

    // Create the shortcut button
    function createShortcutButton() {
        // Check if button already exists
        if (document.getElementById(CONFIG.buttonId)) {
            return;
        }

        // Create button element
        const button = document.createElement('button');
        button.id = CONFIG.buttonId;
        button.innerHTML = `${CONFIG.buttonIcon} ${CONFIG.buttonText}`;
        button.title = 'Open LATS CHANCE Management Interface';

        // Apply styles
        Object.assign(button.style, CONFIG.styles);

        // Add hover effects
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#128C7E';
            button.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseleave', () => {
            Object.assign(button.style, CONFIG.styles);
        });

        // Add click handler
        button.addEventListener('click', () => {
            window.open(CONFIG.appUrl, '_blank');
            
            // Add click animation
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);
        });

        // Add to page
        document.body.appendChild(button);

        console.log('✅ LATS CHANCE shortcut button added to WhatsApp Web');
    }

    // Initialize when page is ready
    function initialize() {
        // Check if we're on WhatsApp Web
        if (window.location.hostname.includes('web.whatsapp.com')) {
            // Wait for WhatsApp to load
            setTimeout(createShortcutButton, 2000);
        }
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
