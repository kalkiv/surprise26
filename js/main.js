// Main Logic
window.addEventListener('load', () => {
    // Init Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x5C3644, -100, 200);

    const frustumSize = 40;
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, 
        frustumSize * aspect / 2, 
        frustumSize / 2, 
        frustumSize / -2, 
        1, 
        1000
    );
    camera.position.set(40, 40, 40); 
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('world').appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(20, 40, 30);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.left = -30;
    keyLight.shadow.camera.right = 30;
    keyLight.shadow.camera.top = 30;
    keyLight.shadow.camera.bottom = -30;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffb6c1, 0.6);
    fillLight.position.set(-20, 10, 10);
    scene.add(fillLight);
    
    // Cone Light (Spotlight from top)
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(0, 30, 0); // Directly above
    spotLight.angle = Math.PI / 6; // Cone shape
    spotLight.penumbra = 0.3; // Soft edges
    spotLight.decay = 2;
    spotLight.distance = 100;
    spotLight.castShadow = true;
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);

    // Light Toggle Logic
    const toggle = document.getElementById('light-toggle');
    
    function updateLights(isLightOn) {
        if(isLightOn) {
            // Bright / Normal Mode
            spotLight.color.setHex(0xffffff);
            spotLight.intensity = 1.0;
            
            ambientLight.intensity = 0.7;
            keyLight.intensity = 0.8;
            fillLight.intensity = 0.6;
            
            scene.fog.color.setHex(0x5C3644); // Dark background fog
            document.body.style.background = 'linear-gradient(135deg, var(--bg-grad-start), var(--bg-grad-end))';
        } else {
            // UV / Night Mode
            spotLight.color.setHex(0x7a00ff); // UV Purple
            spotLight.intensity = 2.5; // Stronger to compensate for dark env
            
            ambientLight.intensity = 0.1; // Very dim
            keyLight.intensity = 0.1;
            fillLight.intensity = 0.1;
            
            scene.fog.color.setHex(0x110022); // Dark purple fog
            document.body.style.background = 'linear-gradient(135deg, #1a0022, #000000)';
        }

        // TAPE ILLUMINATION & HIDDEN TEXT
        if(window.App.state && window.App.state.locks) {
            window.App.state.locks.forEach(lock => {
                // Tape
                if(lock.type === 'tape' && lock.instance && lock.instance.tapeMesh) {
                    const mat = lock.instance.tapeMesh.material;
                    if(isLightOn) {
                        // Reset
                        mat.emissive.setHex(0x000000);
                        mat.emissiveIntensity = 0;
                        mat.opacity = 1.0;
                    } else {
                        // Glow
                        mat.emissive.setHex(0xff00ff); // Neon Pink/Magenta Glow
                        mat.emissiveIntensity = 2.0;
                        mat.opacity = 1.0;
                    }
                }
                
            });
        }
        
        // Heart Box Hidden Text (LV Pattern Texture Emissive)
        if(typeof heartBox !== 'undefined' && heartBox.lidMaterials) {
            heartBox.lidMaterials.forEach(mat => {
                if(isLightOn) {
                    mat.emissiveIntensity = 0;
                } else {
                    mat.emissiveIntensity = 4.0; // High intensity for visibility
                }
            });
        }
    }

    if(toggle) {
        toggle.addEventListener('change', (e) => {
            updateLights(e.target.checked);
        });
    }

    // Create HeartBox
    const heartBox = new window.App.HeartBox(scene);

    // Create CardboardBox
    const cardboardBox = new window.App.CardboardBox(scene);
    
    // Apply Initial Lighting State (Now that locks are created)
    if(toggle) updateLights(toggle.checked);

    // Shared Logic for Successful Solve
    const handleLockSolved = (id, onComplete) => {
        heartBox.solveLock(id, () => {
            window.App.UIManager.updateInventory();
            window.App.UIManager.showToast("Key Collected!");

            if(window.App.state.keysCollected >= window.App.state.totalLocks) {
                setTimeout(() => {
                    homeView(); // Orient back to home
                    window.App.UIManager.showOpenButton();
                    window.App.UIManager.showToast("All keys found! Open the Box!");
                    heartBox.pulse();
                }, 1000);
            }
            if(onComplete) onComplete();
        });
    };

    // Init UI
    window.App.UIManager.init((id) => {
        handleLockSolved(id);
    });

    // Raycasting for Lock Picking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Zoom State for Digit Lock
    let isDigitZoomed = false;
    let activeDigitLock = null;

    // Zoom Helpers
    function zoomToDigitLock(lockInstance) {
        isDigitZoomed = true;
        activeDigitLock = lockInstance;
        
        // Initialize Selection
        if(activeDigitLock) activeDigitLock.selectSlot(0);

        // Disable box controls UI
        const boxControls = document.getElementById('box-controls');
        if(boxControls) boxControls.style.display = 'none';
        
        // 1. Reset Box Rotation to "Top Up"
        if(boxRotTween) boxRotTween.stop();
        if(boxFlipTween) boxFlipTween.stop();
        
        window.TWEEN.to(window.App.state, {
            rotY: 0,
            rotX: 0,
            duration: 1.0,
            ease: "power2.inOut",
            onUpdate: updateBoxRot
        });
        
        window.TWEEN.to(camera.position, {
            x: 0, y: 50, z: 1, 
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => camera.lookAt(0, 0, 0)
        });
        
        window.TWEEN.to(camera, {
            zoom: 4.0,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => camera.updateProjectionMatrix()
        });
    }

    function zoomOutFromDigitLock() {
        isDigitZoomed = false;
        if(activeDigitLock) {
            activeDigitLock.selectSlot(null);
            activeDigitLock = null;
        }
        
        // Re-enable box controls
        const boxControls = document.getElementById('box-controls');
        if(boxControls) boxControls.style.display = 'flex';
        
        // Restore Camera
        window.TWEEN.to(camera.position, {
            x: 40, y: 40, z: 40,
            duration: 1.0,
            ease: "power2.inOut",
            onUpdate: () => camera.lookAt(0, 0, 0)
        });
        
        window.TWEEN.to(camera, {
            zoom: 1.0,
            duration: 1.0,
            ease: "power2.inOut",
            onUpdate: () => camera.updateProjectionMatrix()
        });
    }

    // Gallery UI Bindings (No 3D Mesh)
    const galleryModal = document.getElementById('gallery-modal');
    const galleryImage = document.getElementById('gallery-image');
    const galleryCounter = document.getElementById('gallery-counter');
    const galleryCloseBtn = document.getElementById('gallery-close-btn');
    const galleryNextBtn = document.getElementById('gallery-next');
    const galleryPrevBtn = document.getElementById('gallery-prev');

    function updateGalleryUI() {
        const gallery = window.App.GalleryInstance;
        // Wrap index logic safely happens in navigation, but insure here
        if(gallery.currentIndex < 0) gallery.currentIndex = gallery.photos.length - 1;
        if(gallery.currentIndex >= gallery.photos.length) gallery.currentIndex = 0;
        
        const url = gallery.photos[gallery.currentIndex];
        galleryImage.src = url;
        galleryCounter.textContent = `${gallery.currentIndex + 1} / ${gallery.photos.length}`;
    }

    if(galleryCloseBtn) galleryCloseBtn.addEventListener('click', closeGallery);
    if(galleryNextBtn) galleryNextBtn.addEventListener('click', () => updateGallery('next'));
    if(galleryPrevBtn) galleryPrevBtn.addEventListener('click', () => updateGallery('prev'));

    function closeGallery() {
        // HIDE DOM UI
        if(galleryModal) galleryModal.classList.remove('active');
        
        window.App.isGalleryOpen = false;

        // Restore Main UI
        const uiElementsToRestore = [
            document.querySelector('.inventory-panel'),
            document.querySelector('.light-switch'),
            document.getElementById('open-btn'),
            document.querySelector('.nav-label')
        ];
        uiElementsToRestore.forEach(el => {
            if(el) {
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
            }
        });
        
        const boxControls = document.getElementById('box-controls');
        const cardControls = document.getElementById('card-controls');
        if(boxControls) boxControls.style.display = 'flex';
        // Ensure card controls hidden if appropriate (usually yes if gallery was open)
        if(cardControls) cardControls.style.display = 'none';

        document.querySelector('.nav-label').textContent = "Box Opened";
    }

    function updateGallery(dir) {
        const gallery = window.App.GalleryInstance;
        
        if(dir === 'next') gallery.currentIndex++;
        if(dir === 'prev') gallery.currentIndex--;
        
        updateGalleryUI();
    }

    window.addEventListener('pointerdown', (event) => {
        if(window.App.UIManager.activeLockId !== null) return; 

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // 0. Check Cardboard Box first if present
        if(cardboardBox.checkClick(raycaster)) return;
        
        if(!cardboardBox.isRemoved) {
            return;
        }
        
        // 0.5 Check Click Off Card (If Active)
        if(window.App.activeCardGroup) {
             const cardGroup = window.App.activeCardGroup;
             const cardIntersects = raycaster.intersectObject(cardGroup, true);
             if(cardIntersects.length === 0) {
                 closeCard();
                 return;
             }
        }
        
        // Gallery Mode Click Handling
        if(window.App.isGalleryOpen) {
             // Block 3D interactions while gallery Open
             return; 
        }

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

        // Add Note Mesh if available (it might be inside the group)
        if (heartBox.noteMesh) {
            objectsToCheck.push(heartBox.noteMesh);
        }
        
        if (heartBox.polaroidStack) {
            objectsToCheck.push(heartBox.polaroidStack);
        }

        // Enable recursive check to hit children of Groups (like the card group)
        const intersects = raycaster.intersectObjects(objectsToCheck, true);
        
        if (intersects.length > 0) {
            const hitObj = intersects[0].object;
            const data = hitObj.userData;
            
            // --- DIGIT LOCK (Zoom / Interact) ---
            if(isDigitZoomed) {
                // Interaction Mode
                if(data.isDigitLockParts) {
                    const lockEntry = window.App.state.locks.find(l => l.mesh === hitObj.parent);
                    if(lockEntry && lockEntry.instance) {
                        if(data.action === 'up') {
                            lockEntry.instance.selectSlot(data.slotIndex);
                            lockEntry.instance.cycle(data.slotIndex, -1); // Reverse
                        }
                        else if(data.action === 'down') {
                            lockEntry.instance.selectSlot(data.slotIndex);
                            lockEntry.instance.cycle(data.slotIndex, 1); // Forward
                        }
                        else if(data.action === 'submit') {
                            if(lockEntry.instance.check()) {
                                handleLockSolved(lockEntry.id, () => zoomOutFromDigitLock());
                            }
                        }
                    }
                    return;
                } else if(data.isDigitLock) {
                    return; // Ignore background click
                } else {
                    // Hit something else?
                    zoomOutFromDigitLock();
                    return;
                }
            } else {
                // Not Zoomed - check if we hit the digit lock to zoom in
                if(data.isDigitLock || data.isDigitLockParts) {
                    const lockEntry = window.App.state.locks.find(l => l.mesh === hitObj.parent || l.mesh === hitObj);
                    if(lockEntry && lockEntry.instance) {
                        zoomToDigitLock(lockEntry.instance);
                    }
                    return; 
                }
            }
            // ------------------------------------
            
            // Check if Polaroid Stack
            if(hitObj.userData.isPolaroidStack) {
                if(!window.App.state.isBoxOpen) return;
                
                // Open Gallery UI Immediately (No 3D Animation)
                window.App.isGalleryOpen = true;
                
                // Use clicked index if available
                if(data.galleryIndex !== undefined) window.App.GalleryInstance.currentIndex = data.galleryIndex;

                updateGalleryUI();
                if(galleryModal) galleryModal.classList.add('active');

                // Hide Main UI Controls
                const uiElementsToHide = [
                        document.querySelector('.inventory-panel'),
                        document.querySelector('.light-switch'),
                        document.getElementById('open-btn'),
                        document.querySelector('.nav-label')
                ];
                uiElementsToHide.forEach(el => {
                    if(el) {
                        el.style.opacity = '0';
                        el.style.pointerEvents = 'none';
                    }
                });
                
                const boxControls = document.getElementById('box-controls');
                const cardControls = document.getElementById('card-controls');
                if(boxControls) boxControls.style.display = 'none';
                if(cardControls) cardControls.style.display = 'none';
                
                document.querySelector('.nav-label').textContent = "Gallery Open";
                return;
            }
            
            // Check if Note
            if(hitObj.userData.isNote) {
                // Require Box to be open
                if(!window.App.state.isBoxOpen) return;

                // Determine the group to animate (in case we hit a child mesh)
                const cardGroup = hitObj.userData.parentGroup || hitObj;
                
                // Prevent quick double clicks during animation
                if(cardGroup.userData.isAnimating) return;
                
                // Initialize State
                if(cardGroup.userData.cardState === undefined) {
                    cardGroup.userData.cardState = 0; // 0: In Box, 1: Screen Closed, 2: Screen Open
                }

                const state = cardGroup.userData.cardState;

                // --- STATE 0: Fly Out from Box ---
                if(state === 0) {
                    cardGroup.userData.isAnimating = true;
                    // Detach from HeartBox to animate freely in World Space
                    scene.attach(cardGroup);
                    
                    // Render Card ON TOP
                    cardGroup.traverse(c => { if(c.isMesh) c.renderOrder = 1000; });

                    const targetPos = { x: 0, y: 15, z: 15 }; 
                    const targetScale = { x: 3.5, y: 3.5, z: 3.5 };
                    
                    // Move All Other Assets Off Screen
                    window.TWEEN.to(heartBox.group.position, { y: -200, duration: 1.0, ease: "cubic.inOut" });
                    
                    if(cardboardBox && cardboardBox.group) {
                         window.TWEEN.to(cardboardBox.group.position, { y: -200, duration: 1.0, ease: "cubic.inOut" });
                    }

                    // Hide UI Elements
                    const uiElementsToHide = [
                        document.querySelector('.inventory-panel'),
                        document.querySelector('.light-switch'),
                        document.getElementById('open-btn'),
                        document.querySelector('.nav-label')
                    ];
                    uiElementsToHide.forEach(el => {
                        if(el) {
                            el.style.transition = 'opacity 0.5s';
                            el.style.opacity = '0';
                            el.style.pointerEvents = 'none';
                        }
                    });

                    // Move & Rotate to Face Camera (Closed)
                    window.TWEEN.to(cardGroup.position, {
                        x: targetPos.x, y: targetPos.y, z: targetPos.z,
                        duration: 1.0,
                        ease: "cubic.inOut"
                    });
                    
                    window.TWEEN.to(cardGroup.scale, {
                        x: targetScale.x, y: targetScale.y, z: targetScale.z,
                        duration: 1.0,
                        ease: "cubic.inOut"
                    });
                    
                    window.TWEEN.to(cardGroup.rotation, {
                        x: camera.rotation.x,
                        y: camera.rotation.y, 
                        z: camera.rotation.z, 
                        duration: 1.0,
                        ease: "cubic.inOut",
                        onComplete: () => {
                            cardGroup.userData.isAnimating = false;
                            cardGroup.userData.cardState = 1; // Now at Screen, Closed
                            
                            // Show Card Controls, Hide Box Controls
                            const boxControls = document.getElementById('box-controls');
                            const cardControls = document.getElementById('card-controls');
                            
                            if(boxControls) boxControls.style.display = 'none';
                            if(cardControls) {
                                cardControls.style.display = 'flex';
                                cardControls.style.zIndex = '1000'; // Force on top
                            }
                            
                            // For card, prev button might be hidden?
                            const prevBtn = document.getElementById('card-prev');
                            // if(prevBtn) prevBtn.style.display = 'none'; // Optional: if we want prev only for gallery
                            
                            document.querySelector('.nav-label').textContent = "Use arrows to open card.";
                            
                            // Bind Card Logic Globally so buttons can access
                            window.App.activeCardGroup = cardGroup;
                        }
                    });
                }
                // --- STATE 1: Closed (Front Page Visible) ---
                else if(state === 1) {
                    // Clicking Cover opens it
                    if(hitObj.userData.part === 'cover') {
                        updateCard('open');
                    }
                }
                // --- STATE 2: Open (Left & Right Pages Visible) ---
                else if(state === 2) {
                    // Cannot close once open
                }
                // Only allow State 0/1/2 logic.
                return;
            }

            const id = hitObj.userData.id;
            const lockData = window.App.state.locks.find(l => l.id === id);
            
            if (lockData && lockData.type === 'tape') {
                heartBox.solveLock(id); // Immediate solve, no puzzle
            } else if (lockData && lockData.type === 'screw') {
                // Check if blocked by tape
                const screwPos = lockData.container.position;
                const blockingTape = window.App.state.locks.find(l => 
                    l.type === 'tape' && 
                    !l.solved && 
                    Math.abs(l.container.position.x - screwPos.x) < 0.1 && 
                    Math.abs(l.container.position.z - screwPos.z) < 0.1
                );

                if (blockingTape) {
                    // Redirect click to remove the blocking tape
                    heartBox.solveLock(blockingTape.id);
                } else {
                    window.App.UIManager.openPuzzle(id);
                }
            } else {
                window.App.UIManager.openPuzzle(id);
            }
        } else {
            // Clicked Empty Space
            if(isDigitZoomed) {
                zoomOutFromDigitLock();
            }
        }
    });

    // View Rotation Targets
    let targetYRotation = 0;
    let targetXRotation = 0;
    
    // Simulation State
    let currentLockSimulatedRot = 0;
    const swayState = { val: 0 };
    
    // Tween References (for canceling)
    let boxRotTween = null;
    let swayTween = null;
    let boxFlipTween = null;
    let lockFlipTween = null;

    function updateBoxRot() {
        heartBox.group.rotation.y = window.App.state.rotY;
        heartBox.group.rotation.x = window.App.state.rotX;
        
        // Sync Cardboard Rotation
        cardboardBox.setRotation(window.App.state.rotX, window.App.state.rotY);
    }
    
    function updateLocks(gravityVal, swayVal) {
        window.App.state.locks.forEach(lock => {
            if (lock.instance && typeof lock.instance.updateGravity === 'function') {
                lock.instance.updateGravity(gravityVal, swayVal);
            }
        });
    }

    function rotate(dir) {
        if(window.App.state.isBoxOpen) return;

        const step = Math.PI / 2;
        let swayImpulse = 0;
        
        if(dir === 'left') {
            targetYRotation -= step;
            swayImpulse = 0.8; // Increased amplitude for visibility
        }
        if(dir === 'right') {
            targetYRotation += step;
            swayImpulse = -0.8; 
        }

        // Cancel existing tweens
        if(boxRotTween) boxRotTween.stop();
        if(swayTween) swayTween.stop();

        boxRotTween = window.TWEEN.to(window.App.state, { 
            rotY: targetYRotation, 
            duration: 0.5, 
            ease: "cubic.out", 
            onUpdate: updateBoxRot 
        });
        
        // Sway Animation
        swayState.val = swayImpulse;
        swayTween = window.TWEEN.to(swayState, {
            val: 0,
            duration: 2.0, // Longer settle time
            ease: "elastic.out",
            onUpdate: () => updateLocks(lockState.val, swayState.val)
        });
    }

    function homeView() {
        if(window.App.state.isBoxOpen) return;

        targetYRotation = 0;
        targetXRotation = 0;
        
        // Reset Box
        if(boxRotTween) boxRotTween.stop();
        if(boxFlipTween) boxFlipTween.stop();
        
        boxRotTween = window.TWEEN.to(window.App.state, {
            rotY: 0,
            rotX: 0, // Reset both
            duration: 1.0,
            ease: "power2.inOut",
            onUpdate: updateBoxRot
        });

        // Reset Camera
        window.TWEEN.to(camera.position, {
            x: 40, y: 40, z: 40,
            duration: 1.0,
            ease: "power2.inOut",
            onUpdate: () => camera.lookAt(0, 0, 0)
        });

        window.TWEEN.to(camera, {
            zoom: 1.0,
            duration: 1.0,
            ease: "power2.inOut",
            onUpdate: () => camera.updateProjectionMatrix()
        });
        
        animateLocksTo(0, 0.8); 
    }

    function toggleFlip() {
        if(window.App.state.isBoxOpen) return;

        if (Math.abs(targetXRotation - Math.PI) < 0.1) {
            targetXRotation = 0;
        } else {
            targetXRotation = Math.PI;
        }
        
        if(boxFlipTween) boxFlipTween.stop();
        
        // Animate Box
        boxFlipTween = window.TWEEN.to(window.App.state, {
            rotX: targetXRotation,
            duration: 1.0,
            ease: "back.inOut",
            onUpdate: updateBoxRot
        });
        
        animateLocksTo(targetXRotation, 0.8);
    }
    
    // Helper to animate locks "falling"
    const lockState = { val: 0 };
    function animateLocksTo(targetVal, delay) {
        if(lockFlipTween) lockFlipTween.stop();
        
        lockFlipTween = window.TWEEN.to(lockState, {
            val: targetVal,
            duration: 2.0, // Longer duration for Elastic settlement
            delay: delay,
            ease: "elastic.out", // "Rock till stable" effect
            onUpdate: () => updateLocks(lockState.val, swayState.val)
        });
        currentLockSimulatedRot = targetVal;
    }

    // Bind Navigation
    document.getElementById('nav-left').addEventListener('click', () => rotate('left'));
    document.getElementById('nav-right').addEventListener('click', () => rotate('right'));
    document.getElementById('nav-home').addEventListener('click', homeView);
    document.getElementById('nav-flip').addEventListener('click', toggleFlip);

    // Card Controls
    function closeCard() {
        const cardGroup = window.App.activeCardGroup;
        if(!cardGroup || cardGroup.userData.isAnimating) return;
        
        cardGroup.userData.isAnimating = true;
        
        // 1. Force Hinge Closed if Open
        if(cardGroup.userData.cardState === 2) {
             window.TWEEN.to(heartBox.hingeGroup.rotation, {
                y: Math.PI * 0.99, 
                duration: 0.5,
                ease: "cubic.in"
            });
        }

        // 2. Animate Back to Box - Restore UI
        const uiElementsToRestore = [
            document.querySelector('.inventory-panel'),
            document.querySelector('.light-switch'),
            document.getElementById('open-btn'),
            document.querySelector('.nav-label')
        ];
        uiElementsToRestore.forEach(el => {
            if(el) {
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
            }
        });
        
        const boxControls = document.getElementById('box-controls');
        const cardControls = document.getElementById('card-controls');
        if(boxControls) boxControls.style.display = 'flex';
        if(cardControls) cardControls.style.display = 'none';

        document.querySelector('.nav-label').textContent = "Box Opened";

        // Bring Box Back
        window.TWEEN.to(heartBox.group.position, { y: Math.sin(clock.getElapsedTime()) * 0.5, duration: 1.0, ease: "cubic.inOut" });
        if(cardboardBox && cardboardBox.group) {
             window.TWEEN.to(cardboardBox.group.position, { y: -200, duration: 1.0, ease: "cubic.inOut" }); // Keep cardboard gone? Or restore? Assume gone.
        }
        
        // Animate Card Back
        window.TWEEN.to(cardGroup.position, {
            x: 0, y: 0, z: 0, 
            duration: 1.0, 
            ease: "cubic.inOut" 
        });
        
        window.TWEEN.to(cardGroup.scale, {
            x: 0.1, y: 0.1, z: 0.1, // Shrink
            duration: 1.0,
            ease: "cubic.inOut"
        });
        
        window.TWEEN.to(cardGroup.rotation, {
            x: 0, y: 0, z: 0, 
            duration: 1.0,
            ease: "cubic.inOut",
            onComplete: () => {
                // Re-Parent
                heartBox.group.add(cardGroup);
                
                // Reset Local Transform exactly
                cardGroup.position.set(0, 0.6, 0);
                cardGroup.rotation.set(-Math.PI / 2, 0, -Math.PI / 12);
                cardGroup.scale.set(1, 1, 1);
                
                // Reset Hinge
                heartBox.hingeGroup.rotation.y = Math.PI * 0.99;
                
                cardGroup.userData.isAnimating = false;
                cardGroup.userData.cardState = 0; // State 0: Inside Box
                scene.fog.color.setHex(0x5C3644); // Restore Fog if needed?
                
                window.App.activeCardGroup = null;
            }
        });
    }

    function updateCard(action) {
        const cardGroup = window.App.activeCardGroup;
        if(!cardGroup || cardGroup.userData.isAnimating) return;
        
        const state = cardGroup.userData.cardState;
        
        // Open
        if(action === 'open' && state === 1) {
            cardGroup.userData.isAnimating = true;
            window.TWEEN.to(heartBox.hingeGroup.rotation, {
                y: 0, // Open Flat
                duration: 1.5,
                ease: "back.out",
                onComplete: () => {
                    cardGroup.userData.isAnimating = false;
                    cardGroup.userData.cardState = 2; // Open
                    
                    // Confetti if first time
                    if(!cardGroup.userData.confettiStarted) {
                        cardGroup.userData.confettiStarted = true;
                        const colors = ['#ff477e', '#ff85a9', '#6e44ff', '#ffd700', '#ffffff'];
                        const createConfetti = () => {
                            const el = document.createElement('div');
                            el.classList.add('confetti');
                            el.style.left = Math.random() * 100 + 'vw';
                            el.style.top = -10 + 'px';
                            el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                            el.style.animationDuration = (Math.random() * 2 + 2) + 's';
                            el.style.opacity = Math.random();
                            el.style.transform = `rotate(${Math.random() * 360}deg)`;
                            document.body.appendChild(el);
                            setTimeout(() => el.remove(), 4000);
                        };
                        setInterval(createConfetti, 100);
                    }
                }
            });
        }
    }
    
    // document.getElementById('card-prev').addEventListener('click', () => updateCard('close'));
    document.getElementById('card-next').addEventListener('click', () => {
        if(window.App.activeCardGroup) updateCard('open');
        // Gallery now uses its own buttons
    });
    
    document.getElementById('card-prev').addEventListener('click', () => {
        if(window.App.activeCardGroup) updateCard('close');
    });

    function openSequence() {
        window.App.state.isBoxOpen = true;
        window.App.UIManager.fadeOutUI();
        heartBox.animateOpen();
        
        // Camera Animation: View from the pointed tip (roughly -Y / +Z area)
        const targetPos = { x: 0, y: 40, z: 50 }; // Look from top-front
        
        window.TWEEN.to(camera.position, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: 2.0,
            ease: "power2.inOut",
            onUpdate: () => camera.lookAt(0, 0, 0)
        });

        // Zoom in slightly (Orthographic specific)
        window.TWEEN.to(camera, {
            zoom: 1.5,
            duration: 2.0,
            ease: "power2.inOut",
            onUpdate: () => camera.updateProjectionMatrix()
        });
        
        // Removed auto-navigation. User must click the note now.
        // setTimeout(() => { window.location.href = 'reward.html'; }, 3500);
    }

    document.getElementById('open-btn').addEventListener('click', () => {
         openSequence();
    });


    window.addEventListener('keydown', (e) => {
        if(window.App.UIManager.activeLockId !== null || document.activeElement.tagName === 'INPUT') return;
        
        // DIGIT LOCK KEYBOARD SUPPORT
        if(isDigitZoomed && activeDigitLock) {
            const currentSlot = activeDigitLock.activeSlot;
            
            if(e.key === 'ArrowLeft') {
                const next = (currentSlot - 1 + 4) % 4;
                activeDigitLock.selectSlot(next);
            }
            else if(e.key === 'ArrowRight') {
                const next = (currentSlot + 1) % 4;
                activeDigitLock.selectSlot(next);
            }
            else if(e.key === 'ArrowUp') {
                // User wants Reverse cycle
                activeDigitLock.cycle(currentSlot, -1);
            }
            else if(e.key === 'ArrowDown') {
                // User wants Forward cycle
                activeDigitLock.cycle(currentSlot, 1);
            }
            else if(e.key === 'Enter' || e.key === ' ') {
                const isCorrect = activeDigitLock.check();
                if(isCorrect) {
                     // Find ID to solve
                     const lockEntry = window.App.state.locks.find(l => l.instance === activeDigitLock);
                     if(lockEntry) {
                         handleLockSolved(lockEntry.id, () => zoomOutFromDigitLock());
                     }
                }
            }
            // Direct Typing Support
            else if(e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
                activeDigitLock.setInput(e.key.toUpperCase());
            }
            return; // Block other controls
        }

        // If Card Active, Arrows control card
        if(window.App.activeCardGroup) {
             if(e.key === 'ArrowLeft') updateCard('close');
             if(e.key === 'ArrowRight') updateCard('open');
             if(e.key === 'Escape') closeCard();
             return; // Block box controls
        }
        
        // If Gallery Active
        if(window.App.isGalleryOpen) {
             if(e.key === 'ArrowLeft') updateGallery('prev');
             if(e.key === 'ArrowRight') updateGallery('next');
             if(e.key === 'Escape') closeGallery();
             return; 
        }

        if(e.key === 'ArrowLeft') rotate('left');
        if(e.key === 'ArrowRight') rotate('right');
        if(e.key === 'h' || e.key === 'H') homeView();
        if(e.key === 'f' || e.key === 'F' || e.key === 'ArrowUp') toggleFlip();
    });

    window.addEventListener('resize', () => {
        const aspect = window.innerWidth / window.innerHeight;
        camera.left = -frustumSize * aspect / 2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        window.TWEEN.update(time);

        heartBox.group.position.y = Math.sin(time) * 0.5;
        
        if(heartBox.update) heartBox.update(time);

        renderer.render(scene, camera);
    }

    animate();
});