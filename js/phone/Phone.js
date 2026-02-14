window.App = window.App || {};
window.App.Phone = window.App.Phone || {};

class PhoneManager {
    constructor() {
        this.modal = document.getElementById('phone-modal');
        this.homeScreen = document.getElementById('phone-home-screen');
        this.clockSmall = document.getElementById('phone-clock-small');
        this.clockLarge = document.getElementById('phone-clock-large');
        
        this.apps = {}; 
        this.hasUnread = false;
        
        this.init();
    }

    init() {
        // Event Listeners for Phone UI
        const phoneHomeBtn = document.getElementById('phone-home-btn');
        if(phoneHomeBtn) {
            phoneHomeBtn.addEventListener('click', () => {
                 if(this.homeScreen.classList.contains('active')) {
                     this.close();
                 } else {
                     this.closeApp();
                 }
            });
        }
        
        const toolPhone = document.getElementById('tool-phone');
        if(toolPhone) {
            toolPhone.addEventListener('click', () => this.open());
        }

        // Notification Banner Click
        const notifBanner = document.getElementById('phone-notification-banner');
        if(notifBanner) {
            notifBanner.addEventListener('click', () => {
                this.openApp('messages');
            });
        }

        // Close on click outside
        window.addEventListener('click', (e) => {
            // Only check if modal is open
            if(this.modal && this.modal.classList.contains('active')) {
                // If click is NOT on the phone body (or inside it)
                // AND NOT on the tool button (to avoid immediate close on open)
                if(!e.target.closest('.phone-body') && !e.target.closest('#tool-phone')) {
                    this.close();
                }
            }
        });

        // App Click Handlers (Delegated via onclick in HTML or added here)
        // HTML has: onclick="window.App.Phone.openApp('xyz')"
        // We will expose window.App.Phone instance methods to match this API or update HTML.
        // To avoid changing HTML too much, I'll expose methods on window.App.Phone as a proxy or singleton.
    }

    open() {
        if(this.modal) {
            this.modal.classList.add('active');
            
            // Remove shake animation if present
            const toolPhone = document.getElementById('tool-phone');
            if(toolPhone) toolPhone.classList.remove('shake');

            this.updateClock();
            this.closeApp(); // Reset to home

            // Check for notifications
            if(this.hasUnread) {
                const banner = document.getElementById('phone-notification-banner');
                if(banner) banner.classList.add('active');
            }
        }
    }

    close() {
        if(this.modal) {
            this.modal.classList.remove('active');
        }
    }

    openApp(appId) {
        if(this.homeScreen) this.homeScreen.classList.remove('active');
        document.querySelectorAll('.phone-app').forEach(el => el.style.display = 'none');
        
        const appEl = document.getElementById('app-' + appId);
        if(appEl) {
            appEl.style.display = 'flex';
            
            // App Specific Init
            if(this.apps[appId] && this.apps[appId].onOpen) {
                this.apps[appId].onOpen();
            }
        }

        // Handle Notifications
        if(appId === 'messages') {
            this.hasUnread = false;
            // Hide Badge
            const badge = document.getElementById('msg-badge');
            if(badge) badge.style.display = 'none';
            // Hide Banner
            const banner = document.getElementById('phone-notification-banner');
            if(banner) banner.classList.remove('active');
        }
    }

    closeApp() {
        document.querySelectorAll('.phone-app').forEach(el => el.style.display = 'none');
        if(this.homeScreen) this.homeScreen.classList.add('active');
    }

    updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const mins = now.getMinutes().toString().padStart(2, '0');
        hours = hours % 12;
        hours = hours ? hours : 12; 
        const timeStr = hours + ':' + mins; 
        
        if(this.clockSmall) this.clockSmall.textContent = timeStr;
        if(this.clockLarge) this.clockLarge.textContent = timeStr;
    }

    registerApp(id, handler) {
        this.apps[id] = handler;
    }

    receiveMessage(text) {
        // Add to Messages App
        const container = document.querySelector('.messages-container');
        if(container) {
            const bubble = document.createElement('div');
            bubble.className = 'msg-bubble received';
            bubble.textContent = text;
            container.appendChild(bubble);
            // Scroll to bottom
            container.scrollTop = container.scrollHeight;
        }

        // Update Notification State
        this.hasUnread = true;
        
        // Show Badge
        const badge = document.getElementById('msg-badge');
        if(badge) badge.style.display = 'block';

        // Update Banner Text
        const notifText = document.getElementById('notif-text-content');
        if(notifText) notifText.textContent = text;

        // Check if Phone is open
        const isOpen = this.modal && this.modal.classList.contains('active');
        
        // If Phone is closed: Shake Tool
        if(!isOpen) {
            const toolPhone = document.getElementById('tool-phone');
            if(toolPhone) toolPhone.classList.add('shake');
        } else {
            // If Phone is Open (but not necessarily in Messages app)
            // Check if Messages App is already open?
            const msgApp = document.getElementById('app-messages');
            const isMsgOpen = msgApp && msgApp.style.display === 'flex';
            
            if(!isMsgOpen) {
                // Show Banner immediately
                const banner = document.getElementById('phone-notification-banner');
                if(banner) banner.classList.add('active');
            } else {
                // Already in messages, so consider read immediately? 
                // Or just don't show banner.
                // Let's mark as read if user is staring at it?
                // For simplicity, just don't show banner.
            }
        }
    }
}

// Instantiate and Attach to Global
window.addEventListener('load', () => {
    window.App.PhoneManager = new PhoneManager();
    
    // Compatibility Proxy for Inline HTML handlers
    window.App.Phone.openApp = (id) => window.App.PhoneManager.openApp(id);
    window.App.Phone.closeApp = () => window.App.PhoneManager.closeApp();
    window.App.Phone.receiveMessage = (text) => window.App.PhoneManager.receiveMessage(text);
    window.App.Phone.updateLight = (d, t, v) => {
        if(window.App.PhoneManager.apps['smarthome']) {
            window.App.PhoneManager.apps['smarthome'].updateLight(d, t, v);
        }
    };
});
