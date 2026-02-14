window.App = window.App || {};
window.App.Scenes = window.App.Scenes || {};

window.App.Scenes.HeartScene = class HeartScene {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.isActive = false;
        
        // We reuse the HeartBox from PuzzleScene (passed via reference or shared state not ideal)
        // Better: Intro/Package/Puzzle/Heart all share the same Singletons or Main manages them.
        // Currently PuzzleScene owns HeartBox.
        // We will need to access it.
    }

    // Pass dependency or find it
    get heartBox() {
        return window.App.Scenes.puzzleSceneInstance ? window.App.Scenes.puzzleSceneInstance.heartBox : null;
    }

    enter() {
        this.isActive = true;
        const hb = this.heartBox;
        if(hb) hb.group.visible = true;

        window.App.state.isBoxOpen = true; 
        // window.App.UIManager.fadeOutUI(); // Do NOT hide standard UI so Phone remains accessible
        if(window.App.UIManager.elements.uiLayer) window.App.UIManager.elements.uiLayer.style.opacity = 1;
        
        // Show Navigation? 
        // User feedback: "Keep the navigation menu... so they have the option to open their phone"
        // So we do NOT fadeOutUI entirely, or we restore parts of it.
        // In Main.js, toggleUI managed this.

        // Animation Sequence (Opening)
        // If coming from PuzzleScene solve, the box might be closed or just opening.
        // We'll perform the opening sequence here.
        
        this.animateEntry();
    }

    exit() {
        this.isActive = false;
        // Don't hide heartbox if we go backwards? (Not really supported to go back to Puzzle)
    }

    animateEntry() {
        const hb = this.heartBox;
        if(!hb) return;

        // Pulse
        hb.pulse();
        window.App.UIManager.showToast("All keys found! Opening...");

        setTimeout(() => {
            hb.animateOpen();
            
            setTimeout(() => {
                // Camera Move
                window.TWEEN.to(this.camera.position, {
                    x: 0, y: 15, z: 12, 
                    duration: 2.0,
                    ease: "power2.inOut",
                    onUpdate: () => this.camera.lookAt(0, 0, 0)
                });
                
                window.TWEEN.to(this.camera, {
                    zoom: 1.2,
                    duration: 2.0,
                    ease: "power2.inOut",
                    onUpdate: () => this.camera.updateProjectionMatrix()
                });

                this.spawnConfetti();
                window.App.UIManager.showToast("Explore the memories inside.");
                
                // Ensure UI is visible for Phone access
                const navLabel = document.querySelector('.nav-label');
                if(navLabel) navLabel.style.opacity = '1';
                if(navLabel) navLabel.textContent = "Click items to explore.";
                
                const tools = document.querySelector('.tools-panel'); // Phone is here
                if(tools) {
                     tools.style.display = 'flex';
                     // Ensure phone tool is visible
                     const p = document.getElementById('tool-phone');
                     if(p) p.style.display = 'flex';
                }

            }, 1500);
        }, 1500);
    }

    update(time) {
        const hb = this.heartBox;
        if(hb && hb.update) hb.update(time);
        if(hb) hb.group.position.y = Math.sin(time * 2) * 0.5;
    }

    onPointerDown(raycaster) {
        if(!this.isActive) return false;
        
        const hb = this.heartBox;
        if(!hb) return false;

        const objectsToCheck = [];
        if(hb.noteMesh) objectsToCheck.push(hb.noteMesh);
        if(hb.polaroidStack) objectsToCheck.push(hb.polaroidStack);

        const intersects = raycaster.intersectObjects(objectsToCheck, true);
        if(intersects.length > 0) {
            const hitObj = intersects[0].object;
            const data = hitObj.userData;
            
            if(data.isPolaroidStack) {
                return { type: 'polaroid', index: data.galleryIndex };
            }
            if(data.isNote) {
                return { type: 'note', target: hitObj };
            }
            return true;
        }
        return false;
    }

    spawnConfetti() {
        const colors = ['#ff477e', '#ff85a9', '#6e44ff', '#ffffff'];
        const confettiCount = 100;
        
        for(let i=0; i<confettiCount; i++) {
            const el = document.createElement('div');
            el.classList.add('confetti');
            el.style.left = Math.random() * 100 + 'vw';
            el.style.top = -10 + 'px';
            el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            el.style.animationDuration = (Math.random() * 3 + 2) + 's';
            el.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            document.body.appendChild(el);
            setTimeout(() => { if(el.parentNode) el.parentNode.removeChild(el); }, 5000);
        }
    }
};