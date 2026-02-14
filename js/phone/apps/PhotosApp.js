window.App = window.App || {};
window.App.PhoneApps = window.App.PhoneApps || {};

window.App.PhoneApps.PhotosApp = class PhotosApp {
    constructor() {
        this.grid = document.getElementById('phone-photos-grid');
    }

    onOpen() {
        if (!this.grid) return;
        
        this.grid.innerHTML = '';
        const photos = window.App.GalleryInstance ? window.App.GalleryInstance.photos : [];
        const collected = window.App.state ? window.App.state.photosCollected : 0;
        
        // Show all 10 slots
        for(let i=0; i<10; i++) {
                const div = document.createElement('div');
                div.style.width = '100%';
                div.style.aspectRatio = '1/1';
                div.style.backgroundSize = 'cover';
                div.style.backgroundPosition = 'center';
                div.style.cursor = 'pointer';
                div.style.borderRadius = '4px';
                div.style.border = '1px solid #333';
                
                if(i < collected && photos[i]) {
                    div.style.backgroundImage = `url('${photos[i]}')`;
                    div.onclick = () => {
                        this.openGallery(i);
                    };
                } else {
                    div.style.backgroundColor = '#ccc';
                    div.style.display = 'flex';
                    div.style.alignItems = 'center';
                    div.style.justifyContent = 'center';
                    div.innerHTML = '🔒';
                    div.style.color = '#888';
                }
                this.grid.appendChild(div);
        }
    }

    openGallery(index) {
        // Needs access to main global function openGallery
        // Ideally this should emit event or call a global service. 
        // For now, assume global scope (as previous code did) or attach to App.
        if (window.App.main && typeof window.App.main.openGallery === 'function') {
            window.App.main.openGallery(index);
        } else if (typeof openGallery === 'function') {
             // Fallback to global function if defined
             openGallery(index);
        } else {
             // Re-implement if needed or expose it
             // Let's defer to main.js exposing it
             console.warn("openGallery not found");
        }
    }
};

// Register
window.addEventListener('load', () => {
    if(window.App.PhoneManager) {
        window.App.PhoneManager.registerApp('photos', new window.App.PhoneApps.PhotosApp());
    }
});