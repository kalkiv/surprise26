window.App = window.App || {};
window.App.Scenes = window.App.Scenes || {};

window.App.Scenes.PuzzleScene = class PuzzleScene {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.isActive = false;
        
        this.heartBox = new window.App.HeartBox(scene);
        this.scene.add(this.heartBox.group); // Manually add to scene
        this.heartBox.group.visible = false; // Start hidden
        
        // Puzzle Logic Bindings
        this.initPuzzles();
    }

    initPuzzles() {
        // Shared Logic for Successful Solve
        this.handleLockSolved = (id, onComplete) => {
            this.heartBox.solveLock(id, () => {
                window.App.UIManager.updateInventory();
                window.App.UIManager.showToast("Key Collected!");

                if(window.App.state.keysCollected >= window.App.state.totalLocks) {
                    setTimeout(() => {
                        this.homeView(); 
                        if (window.App.triggerHeartScene) {
                            window.App.triggerHeartScene();
                        } else {
                            // Fallback if Main not updated yet
                            console.error("triggerHeartScene not defined");
                        }
                    }, 1000);
                }
                if(onComplete) onComplete();
            });
        };

        // Init UI
        window.App.UIManager.init((id) => {
            this.handleLockSolved(id);
        });
    }

    enter() {
        this.isActive = true;
        this.heartBox.group.visible = true;

        // Show Game UI
        const inv = document.querySelector('.inventory-panel');
        const sw = document.querySelector('.light-switch');
        if(inv) window.TWEEN.to(inv.style, { opacity: '1', duration: 1.0 });
        if(sw) window.TWEEN.to(sw.style, { opacity: '1', duration: 1.0 });
        document.querySelector('.nav-label').textContent = "Solve the puzzles.";
        
        window.App.UIManager.showToast("Find the keys to open the heart!");
    }

    exit() {
        this.isActive = false;
        if(this.heartBox) this.heartBox.group.visible = false;
    }

    update(time) {
        if(this.heartBox.update) this.heartBox.update(time);
        
        // Floating Heart effect matching Intro/Package scene
        // Amplitude 0.5, Speed 2
        this.heartBox.group.position.y = Math.sin(time * 2) * 0.5;
    }

    // --- Interaction Delegation ---

    onPointerDown(raycaster, isDigitZoomed, activeDigitLock, zoomOutCb, zoomToCb) {
        if(!this.isActive) return false;

        // Gallery/Card checks handled in Main? Or here? 
        // Let's assume passed Check.

        const objectsToCheck = [];
        window.App.state.locks.forEach(l => {
            if(!l.solved) {
                // Determine what to check based on zoom state
                if(l.type === 'digit' && isDigitZoomed) {
                    l.mesh.children.forEach(c => {
                        if(c.userData.isDigitLockParts) {
                            objectsToCheck.push(c);
                        }
                    });
                } else {
                    const hb = l.mesh.children.find(c => c.userData.isLock);
                    if(hb) objectsToCheck.push(hb);
                }
            }
        });

        // Add Note Mesh if available
        if (this.heartBox.noteMesh) {
            objectsToCheck.push(this.heartBox.noteMesh);
        }
        
        if (this.heartBox.polaroidStack) {
            objectsToCheck.push(this.heartBox.polaroidStack);
        }

        const intersects = raycaster.intersectObjects(objectsToCheck, true);
        
        if (intersects.length > 0) {
            const hitObj = intersects[0].object;
            const data = hitObj.userData;
            
            // --- DIGIT LOCK (Zoom / Interact) ---
            if(isDigitZoomed) {
                if(data.isDigitLockParts) {
                    const lockEntry = window.App.state.locks.find(l => l.mesh === hitObj.parent);
                    if(lockEntry && lockEntry.instance) {
                        if(data.action === 'up') {
                            lockEntry.instance.selectSlot(data.slotIndex);
                            lockEntry.instance.cycle(data.slotIndex, -1);
                        }
                        else if(data.action === 'down') {
                            lockEntry.instance.selectSlot(data.slotIndex);
                            lockEntry.instance.cycle(data.slotIndex, 1);
                        }
                        else if(data.action === 'submit') {
                            if(lockEntry.instance.check()) {
                                this.handleLockSolved(lockEntry.id, () => zoomOutCb());
                            }
                        }
                    }
                    return true;
                } else if(data.isDigitLock) {
                    return true; 
                } else {
                    zoomOutCb();
                    return true;
                }
            } else {
                if(data.isDigitLock || data.isDigitLockParts) {
                    const lockEntry = window.App.state.locks.find(l => l.mesh === hitObj.parent || l.mesh === hitObj);
                    if(lockEntry && lockEntry.instance) {
                        zoomToCb(lockEntry.instance);
                    }
                    return true; 
                }
            }
            
            // Check Polaroid Stack (Return special signal or handle)
            if(hitObj.userData.isPolaroidStack) {
                return { type: 'polaroid', index: data.galleryIndex, target: hitObj };
            }
            
            // Check Note
            if(hitObj.userData.isNote) {
                return { type: 'note', target: hitObj };
            }

            const id = hitObj.userData.id;
            const lockData = window.App.state.locks.find(l => l.id === id);
            
            if (lockData && lockData.type === 'tape') {
                this.heartBox.solveLock(id); 
            } else if (lockData && lockData.type === 'screw') {
                const screwPos = lockData.container.position;
                const blockingTape = window.App.state.locks.find(l => 
                    l.type === 'tape' && 
                    !l.solved && 
                    Math.abs(l.container.position.x - screwPos.x) < 0.1 && 
                    Math.abs(l.container.position.z - screwPos.z) < 0.1
                );

                if (blockingTape) {
                    this.heartBox.solveLock(blockingTape.id);
                } else {
                    window.App.UIManager.openPuzzle(id);
                }
            } else {
                window.App.UIManager.openPuzzle(id);
            }
            return true;
        } 
        
        // If Digit Lock Zoomed and clicked OUTSIDE of interaction targets (e.g. background)
        if(isDigitZoomed) {
            zoomOutCb();
            return true;
        }

        return false;
    }
    
    // Helper needed for callbacks
    homeView() {
        // This relies on Main.js camera/tween logic usually.
        // Maybe dispatch event? Or assume Main handles navigation view?
        // Actually Main.js has `homeView()`.
        // Ideally this Scene class handles view logic too, but Camera is shared.
        // For now, trigger custom event.
        window.dispatchEvent(new CustomEvent('request-home-view'));
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
            
            // Cleanup
            setTimeout(() => {
                if(el && el.parentNode) el.parentNode.removeChild(el);
            }, 5000);
        }
    }
};
