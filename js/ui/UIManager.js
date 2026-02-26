// UIManager
window.App = window.App || {};

window.App.UIManager = {
    elements: {},
    
    init(onSolveCallback) {
        // Instantiate encapsulated Puzzle Modal logic
        this.puzzleModal = new window.App.PuzzleModal(onSolveCallback);
        
        // Cache DOM elements
        this.elements = {
            keyCounter: document.getElementById('key-counter'),
            toast: document.getElementById('toast'),
            toastMsg: document.getElementById('toast-msg'),
            openBtn: document.getElementById('open-btn'),
            uiLayer: document.getElementById('ui-layer') 
        };
        
        this.initInventory();
    },
    
    initInventory() {
        if(this.elements.keyCounter) {
            this.elements.keyCounter.textContent = `0/${window.App.state.totalLocks}`;
        }
    },
    
    // Delegate to PuzzleModal
    openPuzzle(id) {
        if (this.puzzleModal) this.puzzleModal.open(id);
    },
    
    get activeLockId() {
        return this.puzzleModal ? this.puzzleModal.activeLockId : null;
    },
    
    updateInventory() {
        if(this.elements.keyCounter) {
            this.elements.keyCounter.textContent = `${window.App.state.keysCollected}/${window.App.state.totalLocks}`;
        }
    },
    
    showToast(msg) {
        // Toast notifications disabled
    },
    
    showOpenButton() {
        this.elements.openBtn.classList.add('visible');
    },

    fadeOutUI(duration = 500) {
        this.elements.uiLayer.style.transition = `opacity ${duration}ms`;
        this.elements.uiLayer.style.opacity = 0;
    },

    // Scene Transition Fades
    fadeOut(duration = 1000) {
        const overlay = document.getElementById('transition-overlay');
        if(overlay) {
            overlay.style.transition = `opacity ${duration}ms ease`;
            overlay.style.opacity = 1;
        }
        // Also fade UI
        this.fadeOutUI(duration);
    },

    fadeIn(duration = 1000) {
        const overlay = document.getElementById('transition-overlay');
        if(overlay) {
            overlay.style.transition = `opacity ${duration}ms ease`;
            overlay.style.opacity = 0;
        }
        // Restore UI
        if(this.elements.uiLayer) {
            this.elements.uiLayer.style.transition = `opacity ${duration}ms`;
            this.elements.uiLayer.style.opacity = 1;
        }
    }
};
