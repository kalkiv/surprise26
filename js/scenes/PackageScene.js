window.App = window.App || {};
window.App.Scenes = window.App.Scenes || {};

window.App.Scenes.PackageScene = class PackageScene {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.isActive = false;
        
        // Instance
        this.cardboardBox = new window.App.CardboardBox(scene);
        this.cardboardBox.group.visible = false; // Start hidden
        
        // Signal for transition
        this.onComplete = null;
        
        this.cardboardBox.onOpenComplete = () => {
            if(this.onComplete) this.onComplete();
        };
    }

    enter() {
        this.isActive = true;
        this.cardboardBox.group.visible = true;
        // Hide Game UI
        const inv = document.querySelector('.inventory-panel');
        const sw = document.querySelector('.light-switch');
        if(inv) inv.style.opacity = '0';
        if(sw) sw.style.opacity = '0';
        document.querySelector('.nav-label').textContent = "A Mysterious Box...";
    }

    exit() {
        this.isActive = false;
        if(this.cardboardBox) this.cardboardBox.group.visible = false;
    }

    onPointerDown(raycaster) {
        if(!this.isActive) return false;
        return this.cardboardBox.checkClick(raycaster);
    }

    onDrop(toolName, raycaster) {
        if(!this.isActive) return false;
        
        // Raycast check
        const intersects = raycaster.intersectObject(this.cardboardBox.group, true);
        if(intersects.length > 0) {
            if(toolName === 'cutter') {
                this.cardboardBox.cutTape();
                return true;
            }
        }
        return false;
    }
    
    update(time) {
        // No heavy update loop needed for scene 1 usually
    }
};