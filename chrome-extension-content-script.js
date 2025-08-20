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
        },
        hoverStyles: {
            backgroundColor: '#128C7E',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
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
            Object.assign(button.style, CONFIG.hoverStyles);
        });

        button.addEventListener('mouseleave', () => {
            Object.assign(button.style, CONFIG.styles);
        });

        // Add click handler
        button.addEventListener('click', handleButtonClick);

        // Add to page
        document.body.appendChild(button);

        // Add notification badge for new messages
        addNotificationBadge(button);

        console.log('✅ LATS CHANCE shortcut button added to WhatsApp Web');
    }

    // Handle button click
    function handleButtonClick() {
        // Open management interface in new tab
        window.open(CONFIG.appUrl, '_blank');
        
        // Add click animation
        const button = document.getElementById(CONFIG.buttonId);
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }

    // Add notification badge
    function addNotificationBadge(button) {
        const badge = document.createElement('span');
        badge.id = 'lats-chance-badge';
        badge.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            backgroundColor: #FF4444;
            color: white;
            borderRadius: 50%;
            width: 18px;
            height: 18px;
            fontSize: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            fontWeight: bold;
            display: none;
        `;
        badge.textContent = '0';
        button.appendChild(badge);
    }

    // Update notification badge
    function updateNotificationBadge(count) {
        const badge = document.getElementById('lats-chance-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count.toString();
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Monitor for new messages
    function monitorNewMessages() {
        // Watch for new message elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check for new message indicators
                            const newMessageIndicators = node.querySelectorAll('[data-testid="msg-meta"], [data-testid="conversation"]');
                            if (newMessageIndicators.length > 0) {
                                // Update notification count
                                const currentCount = parseInt(document.getElementById('lats-chance-badge')?.textContent || '0');
                                updateNotificationBadge(currentCount + 1);
                            }
                        }
                    });
                }
            });
        });

        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Add keyboard shortcut
    function addKeyboardShortcut() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + Shift + L to open LATS CHANCE
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'L') {
                event.preventDefault();
                handleButtonClick();
            }
        });
    }

    // Add context menu integration
    function addContextMenu() {
        // Create context menu item
        const contextMenu = document.createElement('div');
        contextMenu.id = 'lats-chance-context-menu';
        contextMenu.style.cssText = `
            position: fixed;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 8px 0;
            z-index: 10000;
            display: none;
            font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
        `;

        const menuItems = [
            { text: '📊 Open Dashboard', action: () => window.open(CONFIG.appUrl, '_blank') },
            { text: '⚙️ Settings', action: () => window.open(CONFIG.appUrl + '?tab=settings', '_blank') },
            { text: '📈 Analytics', action: () => window.open(CONFIG.appUrl + '?tab=analytics', '_blank') },
            { text: '🔧 Test Connection', action: testConnection }
        ];

        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.textContent = item.text;
            menuItem.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                transition: background-color 0.2s;
            `;
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.backgroundColor = '#f5f5f5';
            });
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.backgroundColor = 'transparent';
            });
            menuItem.addEventListener('click', () => {
                item.action();
                hideContextMenu();
            });
            contextMenu.appendChild(menuItem);
        });

        document.body.appendChild(contextMenu);

        // Show context menu on right-click of shortcut button
        document.addEventListener('contextmenu', (event) => {
            if (event.target.id === CONFIG.buttonId) {
                event.preventDefault();
                showContextMenu(event.clientX, event.clientY);
            }
        });

        // Hide context menu on click outside
        document.addEventListener('click', hideContextMenu);
    }

    function showContextMenu(x, y) {
        const menu = document.getElementById('lats-chance-context-menu');
        if (menu) {
            menu.style.left = x + 'px';
            menu.style.top = y + 'px';
            menu.style.display = 'block';
        }
    }

    function hideContextMenu() {
        const menu = document.getElementById('lats-chance-context-menu');
        if (menu) {
            menu.style.display = 'none';
        }
    }

    // Test connection to your app
    function testConnection() {
        fetch(CONFIG.appUrl.replace('/whatsapp/chrome-extension', '/api/chrome-extension/status'))
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('✅ Connection successful! LATS CHANCE is ready.');
                } else {
                    alert('❌ Connection failed. Please check your setup.');
                }
            })
            .catch(error => {
                alert('❌ Connection error: ' + error.message);
            });
    }

    // Initialize when page is ready
    function initialize() {
        // Wait for WhatsApp Web to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
            return;
        }

        // Check if we're on WhatsApp Web
        if (window.location.hostname.includes('web.whatsapp.com')) {
            // Wait a bit for WhatsApp to fully load
            setTimeout(() => {
                createShortcutButton();
                monitorNewMessages();
                addKeyboardShortcut();
                addContextMenu();
            }, 2000);
        }
    }

    // Start initialization
    initialize();

    // Re-initialize on navigation (for SPA behavior)
    let currentUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            setTimeout(initialize, 1000);
        }
    }, 1000);

})();
