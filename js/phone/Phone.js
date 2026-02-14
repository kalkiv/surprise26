window.App = window.App || {};
window.App.Phone = window.App.Phone || {};

class PhoneManager {
    constructor() {
        this.modal = document.getElementById('phone-modal');
        this.homeScreen = document.getElementById('phone-home-screen');
        this.clockSmall = document.getElementById('phone-clock-small');
        this.clockLarge = document.getElementById('phone-clock-large');
        
        this.apps = {}; 
        
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

        // Close on click outside
        window.addEventListener('click', (e) => {
            if(e.target === this.modal) {
                this.close();
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
            // toggleUI(false)? No, user asked to keep UI. But maybe just hide main controls?
            // Main.js handled toggleUI. Ideally Phone shouldn't know about outside UI.
            // Dispatch event?
            this.updateClock();
            this.closeApp(); // Reset to home
        }
    }

    close() {
        if(this.modal) {
            this.modal.classList.remove('active');
            // Restore UI via Main.js event/state check?
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
}

// Instantiate and Attach to Global
window.addEventListener('load', () => {
    window.App.PhoneManager = new PhoneManager();
    
    // Compatibility Proxy for Inline HTML handlers
    window.App.Phone.openApp = (id) => window.App.PhoneManager.openApp(id);
    window.App.Phone.closeApp = () => window.App.PhoneManager.closeApp();
    window.App.Phone.updateLight = (d, t, v) => {
        if(window.App.PhoneManager.apps['smarthome']) {
            window.App.PhoneManager.apps['smarthome'].updateLight(d, t, v);
        }
    };
});