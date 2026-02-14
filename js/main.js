// Main Logic
window.addEventListener('load', () => {
    // Init Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x5C3644, -100, 300);
    window.App.mainScene = scene; // Expose scene

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
    window.App.mainCamera = camera; // Expose camera

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

    // --- SCENE MANAGEMENT ---
    // Instantiate scenes and store globally for access by Apps/other scenes
    window.App.Scenes.introSceneInstance = new window.App.Scenes.IntroScene(scene, camera);
    window.App.Scenes.packageSceneInstance = new window.App.Scenes.PackageScene(scene, camera);
    window.App.Scenes.puzzleSceneInstance = new window.App.Scenes.PuzzleScene(scene, camera);
    window.App.Scenes.heartSceneInstance = new window.App.Scenes.HeartScene(scene, camera);

    const introScene = window.App.Scenes.introSceneInstance;
    const packageScene = window.App.Scenes.packageSceneInstance;
    const puzzleScene = window.App.Scenes.puzzleSceneInstance;
    const heartScene = window.App.Scenes.heartSceneInstance;
    
    let activeScene = introScene;
    window.App.currentScene = 'intro'; // 'intro', 'package', 'puzzle', 'heart'
    window.App.isPackageOpened = false; // Track if cardboard box is removed

    function switchToScene(newSceneObj, newSceneId) {
        if(activeScene === newSceneObj) return;
        
        const isLeavingIntro = (activeScene === introScene);
        const delay = isLeavingIntro ? 1000 : 0;

        activeScene.exit();
        activeScene = newSceneObj;
        window.App.currentScene = newSceneId;
        
        // Special case: If going to Intro, update prop visibility
        if(newSceneId === 'intro') {
             if(introScene.updateProps) introScene.updateProps();
             if(puzzleScene.heartBox) puzzleScene.heartBox.group.visible = false;
        }

        setTimeout(() => {
            activeScene.enter(); 
            
            if(newSceneId === 'package' || newSceneId === 'puzzle' || newSceneId === 'heart') {
                if(isLeavingIntro) {
                    camera.zoom = 1.0; 
                    camera.position.set(40, 40, 40);
                    camera.lookAt(0, 0, 0);
                    camera.updateProjectionMatrix();
                }

                if(newSceneId !== 'heart') {
                    // Default camera for object views (Heart handles its own camera)
                    window.TWEEN.to(camera.position, {
                        x: 40, y: 40, z: 40,
                        duration: 1.5,
                        ease: "power2.inOut",
                        onUpdate: () => camera.lookAt(0, 0, 0)
                    });
                    window.TWEEN.to(camera, {
                        zoom: 1.0, 
                        duration: 1.5,
                        ease: "power2.inOut",
                        onUpdate: () => camera.updateProjectionMatrix()
                    });
                }
            }

             if(newSceneId === 'package') {
                puzzleScene.heartBox.group.visible = true; 
             }
             
             updateUIForScene(newSceneId);
        }, delay);
    }

    // Scene Transition 1: Intro -> Package
    introScene.onComplete = () => {
        const currentRot = 0; 
        window.App.state.rotY = currentRot;
        targetYRotation = currentRot; 
        
        if(window.App.isPackageOpened) {
            switchToScene(puzzleScene, 'puzzle');
        } else {
            switchToScene(packageScene, 'package');
        }
    };

    // Scene Transition 2: Package -> Puzzle
    packageScene.onComplete = () => {
        window.App.isPackageOpened = true; 
        switchToScene(puzzleScene, 'puzzle');
    };

    // Scene Transition 3: Puzzle -> Heart (Triggered via logic)
    // PuzzleScene logic calls this when solving
    // We need to hook into puzzle completion.
    // Assuming PuzzleScene or Main checks for completion.
    // Let's modify PuzzleScene.handleLockSolved in main.js admin logic or override it.
    // PuzzleScene handles its own logic, but we need to know when it opens.
    // PuzzleScene calls `heartBox.animateOpen()` internally usually? 
    // No, PuzzleScene has `handleLockSolved`.
    // We should override/inject completion logic.
    
    // Check if PuzzleScene emits event or callback.
    // Currently relying on Admin menu or internal checks.
    // Main.js had Admin.solvePuzzle logic.
    
    // We'll expose a global function to trigger Heart Scene Transition
    window.App.triggerHeartScene = () => {
        switchToScene(heartScene, 'heart');
    };

    // Back Button Logic
    function goBackOneScene() {
       homeView();
       // Always go back to Intro Scene as per user request
       switchToScene(introScene, 'intro');
    }
    
    const backBtn = document.getElementById('back-scene-btn');
    if(backBtn) {
        backBtn.addEventListener('click', goBackOneScene);
    }

    function updateUIForScene(sceneId) {
        const backBtn = document.getElementById('back-scene-btn');
        if(backBtn) {
            if(sceneId === 'intro') {
                backBtn.style.opacity = '0.3'; 
                backBtn.style.pointerEvents = 'none';
            } else {
                backBtn.style.opacity = '1';
                backBtn.style.pointerEvents = 'auto';
            }
        }
    }

    // --- LIGHT TOGGLE ---
    const toggle = document.getElementById('light-toggle');
    function updateLights(isLightOn) {
        if(isLightOn) {
            spotLight.color.setHex(0xffffff);
            spotLight.intensity = 1.0;
            ambientLight.intensity = 0.7;
            keyLight.intensity = 0.8;
            fillLight.intensity = 0.6;
            scene.fog.color.setHex(0x5C3644); 
            document.body.style.background = 'linear-gradient(135deg, var(--bg-grad-start), var(--bg-grad-end))';
        } else {
            spotLight.color.setHex(0xffffff); 
            spotLight.intensity = 0.0; 
            ambientLight.intensity = 0.1; 
            keyLight.intensity = 0.1;
            fillLight.intensity = 0.1;
            scene.fog.color.setHex(0x050505); 
            document.body.style.background = 'linear-gradient(135deg, #111111, #000000)';
        }

        // TAPE ILLUMINATION & HIDDEN TEXT
        if(puzzleScene.heartBox) { 
            if(window.App.state && window.App.state.locks) {
                window.App.state.locks.forEach(lock => {
                    if(lock.type === 'tape' && lock.instance && lock.instance.tapeMesh) {
                        const mat = lock.instance.tapeMesh.material;
                        if(isLightOn) {
                            mat.emissive.setHex(0x000000);
                            mat.emissiveIntensity = 0;
                            mat.opacity = 1.0;
                        } else {
                            mat.emissive.setHex(0xff00ff);
                            mat.emissiveIntensity = 2.0;
                            mat.opacity = 1.0;
                        }
                    }
                });
            }
            if(puzzleScene.heartBox.lidMaterials) {
                puzzleScene.heartBox.lidMaterials.forEach(mat => {
                    if(isLightOn) {
                        mat.emissiveIntensity = 0;
                    } else {
                        mat.emissiveIntensity = 4.0;
                    }
                });
            }
        }
    }

    if(toggle) {
        toggle.addEventListener('change', (e) => {
            updateLights(e.target.checked);
        });
    }

    activeScene.enter(); 
    updateUIForScene('intro');
    if(toggle) updateLights(toggle.checked);

    // --- RAYCASTER ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // --- ADMIN MENU LOGIC ---
    window.App.Admin = {
        setScene: (name) => {
            if(name === 'intro') switchToScene(introScene, 'intro');
            if(name === 'package') switchToScene(packageScene, 'package');
            if(name === 'puzzle') switchToScene(puzzleScene, 'puzzle');
            if(name === 'heart') switchToScene(heartScene, 'heart');
        },
        toggleLight: () => {
             const t = document.getElementById('light-toggle');
             if(t) { t.checked = !t.checked; t.dispatchEvent(new Event('change')); }
        },
        breakMirrors: (doBreak) => {
             if(introScene && introScene.mirrorGrid) {
                introScene.mirrorGrid.group.children.forEach(m => {
                    if(doBreak) {
                        introScene.mirrorGrid.breakMirror(m);
                    } else {
                        // Fix
                         const glass = m.children.find(c => c.userData.isMirror);
                         if(glass) {
                             glass.visible = true; glass.userData.isBroken = false;
                         }
                         if(glass && glass.userData.backingMesh) glass.userData.backingMesh.visible = false;
                         for(let i=m.children.length-1; i>=0; i--) {
                             let c = m.children[i];
                             if(c.geometry.type === 'BufferGeometry') m.remove(c);
                         }
                    }
                });
                introScene.brokenMirrors = doBreak ? 6 : 0;
             }
        },
        toggleTools: (collect) => {
            ['tool-cutter', 'tool-hammer', 'tool-box'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.style.display = collect ? 'flex' : 'none';
            });
        },
        solvePuzzle: (index) => {
             const locks = window.App.state.locks;
             if(!locks) return;
             
             if(index === 'all') {
                locks.forEach(l => {
                     if(!l.solved && puzzleScene.handleLockSolved) puzzleScene.handleLockSolved(l.id);
                });
             } else {
                 if(locks[index]) {
                      if(!locks[index].solved && puzzleScene.handleLockSolved) puzzleScene.handleLockSolved(locks[index].id);
                 }
             }
        },
        unsolveAll: () => {
             const locks = window.App.state.locks;
             if(!locks) return;
             
             window.App.state.keysCollected = 0;
             if(window.App.UIManager && window.App.UIManager.updateInventory) window.App.UIManager.updateInventory();

             locks.forEach(l => {
                 l.solved = false;
                 if(l.container) {
                     window.TWEEN.killTweensOf(l.container.scale);
                     l.container.visible = true;
                     l.container.scale.set(1, 1, 1);
                 }
             });
             if(window.App.UIManager && window.App.UIManager.showToast) window.App.UIManager.showToast("Puzzles reset!");
        }
    };

    window.addEventListener('keydown', (e) => {
        if(e.key === '`') {
             const p = document.getElementById('admin-panel');
             if(p) p.style.display = (p.style.display === 'none') ? 'block' : 'none';
        }
    });

    // --- DIGIT LOCK ZOOM STATE ---
    let isDigitZoomed = false;
    let activeDigitLock = null;

    function zoomToDigitLock(lockInstance) {
        isDigitZoomed = true;
        activeDigitLock = lockInstance;
        if(activeDigitLock) activeDigitLock.selectSlot(0);
        // User Requested Nav Bar to remaining visible
        const boxControls = document.getElementById('box-controls');
        if(boxControls) boxControls.style.display = 'flex';
        
        if(boxRotTween) boxRotTween.stop(); 
        if(boxFlipTween) boxFlipTween.stop(); 

        window.TWEEN.to(window.App.state, {
            rotY: 0, rotX: 0, duration: 1.0, ease: "power2.inOut", onUpdate: updateBoxRot
        });
        window.TWEEN.to(camera.position, {
            x: 0, y: 50, z: 1, duration: 1.5, ease: "power2.inOut", onUpdate: () => camera.lookAt(0, 0, 0)
        });
        window.TWEEN.to(camera, {
            zoom: 4.0, duration: 1.5, ease: "power2.inOut", onUpdate: () => camera.updateProjectionMatrix()
        });
    }

    function zoomOutFromDigitLock() {
        isDigitZoomed = false;
        if(activeDigitLock) {
            activeDigitLock.selectSlot(null);
            activeDigitLock = null;
        }
        const boxControls = document.getElementById('box-controls');
        if(boxControls) boxControls.style.display = 'flex';
        
        window.TWEEN.to(camera.position, {
            x: 40, y: 40, z: 40, duration: 1.0, ease: "power2.inOut", onUpdate: () => camera.lookAt(0, 0, 0)
        });
        window.TWEEN.to(camera, {
            zoom: 1.0, duration: 1.0, ease: "power2.inOut", onUpdate: () => camera.updateProjectionMatrix()
        });
    }

    // --- NAVIGATION TWEENS ---
    let boxRotTween = null;
    let swayTween = null;
    let boxFlipTween = null;
    let lockFlipTween = null;
    let currentLockSimulatedRot = 0;
    const swayState = { val: 0 };
    const lockState = { val: 0 };
    let targetYRotation = 0;
    let targetXRotation = 0;

    function updateBoxRot() {
        if(activeScene === puzzleScene || activeScene === heartScene) {
            puzzleScene.heartBox.group.rotation.y = window.App.state.rotY;
            puzzleScene.heartBox.group.rotation.x = window.App.state.rotX;
        }
        if(activeScene === packageScene) {
            packageScene.cardboardBox.setRotation(window.App.state.rotX, window.App.state.rotY);
        }
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
        
        if(activeScene === introScene) {
            introScene.rotate(dir);
            return;
        }

        const step = Math.PI / 2;
        let swayImpulse = 0;
        if(dir === 'left') { targetYRotation -= step; swayImpulse = 0.8; }
        if(dir === 'right') { targetYRotation += step; swayImpulse = -0.8; }

        if(boxRotTween) boxRotTween.stop();
        if(swayTween) swayTween.stop();

        boxRotTween = window.TWEEN.to(window.App.state, { 
            rotY: targetYRotation, duration: 0.5, ease: "cubic.out", onUpdate: updateBoxRot 
        });
        swayState.val = swayImpulse;
        swayTween = window.TWEEN.to(swayState, {
            val: 0, duration: 2.0, ease: "elastic.out", onUpdate: () => updateLocks(lockState.val, swayState.val)
        });
    }

    function zoom(dir) {
        if(window.App.state.isBoxOpen) return;
        
        let target = camera.zoom;
        if(dir === 'in') target += 0.2;
        if(dir === 'out') target -= 0.2;
        
        if(target < 0.2) target = 0.2;
        if(target > 5.0) target = 5.0;

        window.TWEEN.to(camera, {
            zoom: target,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: () => camera.updateProjectionMatrix()
        });
    }

    function homeView() {
        if(window.App.state.isBoxOpen) return;

        // If currently zoomed into digit lock, treat Home as Exit Zoom
        if(isDigitZoomed) {
            zoomOutFromDigitLock();
            return;
        }
        
        // Scene Delegation
        if(activeScene === introScene) {
            if(activeScene.resetRotation) activeScene.resetRotation();
            window.TWEEN.to(camera.position, {
                x: 40, y: 40, z: 40, duration: 1.0, ease: "power2.inOut", onUpdate: () => camera.lookAt(0, 0, 0)
            });
            window.TWEEN.to(camera, {
                zoom: 0.4, 
                duration: 1.0, ease: "power2.inOut", onUpdate: () => camera.updateProjectionMatrix()
            });
            return;
        }

        targetYRotation = 0;
        targetXRotation = 0;
        if(boxRotTween) boxRotTween.stop();
        if(boxFlipTween) boxFlipTween.stop();
        boxRotTween = window.TWEEN.to(window.App.state, {
            rotY: 0, rotX: 0, duration: 1.0, ease: "power2.inOut", onUpdate: updateBoxRot
        });
        window.TWEEN.to(camera.position, {
            x: 40, y: 40, z: 40, duration: 1.0, ease: "power2.inOut", onUpdate: () => camera.lookAt(0, 0, 0)
        });
        window.TWEEN.to(camera, {
            zoom: 1.0, duration: 1.0, ease: "power2.inOut", onUpdate: () => camera.updateProjectionMatrix()
        });
        animateLocksTo(0, 0.8); 
    }

    function toggleFlip() {
        if(window.App.state.isBoxOpen) return;
        if (Math.abs(targetXRotation - Math.PI) < 0.1) targetXRotation = 0;
        else targetXRotation = Math.PI;
        if(boxFlipTween) boxFlipTween.stop();
        boxFlipTween = window.TWEEN.to(window.App.state, {
            rotX: targetXRotation, duration: 1.0, ease: "back.inOut", onUpdate: updateBoxRot
        });
        animateLocksTo(targetXRotation, 0.8);
    }
    
    function animateLocksTo(targetVal, delay) {
        if(lockFlipTween) lockFlipTween.stop();
        lockFlipTween = window.TWEEN.to(lockState, {
            val: targetVal, duration: 2.0, delay: delay, ease: "elastic.out", onUpdate: () => updateLocks(lockState.val, swayState.val)
        });
        currentLockSimulatedRot = targetVal;
    }

    window.addEventListener('request-home-view', () => homeView());

    document.getElementById('nav-left').addEventListener('click', () => rotate('left'));
    document.getElementById('nav-right').addEventListener('click', () => rotate('right'));
    document.getElementById('nav-home').addEventListener('click', homeView);
    document.getElementById('nav-flip').addEventListener('click', toggleFlip);
    document.getElementById('nav-zoom-in').addEventListener('click', () => zoom('in'));
    document.getElementById('nav-zoom-out').addEventListener('click', () => zoom('out'));

    // --- DRAG AND DROP ---
    let dragTool = null;
    const toolCutter = document.getElementById('tool-cutter');
    if(toolCutter) {
        toolCutter.addEventListener('dragstart', (e) => {
            dragTool = 'cutter';
            e.dataTransfer.effectAllowed = 'copy';
        });
        toolCutter.addEventListener('dragend', () => { dragTool = null; });
    }
    const toolHammer = document.getElementById('tool-hammer');
    if(toolHammer) {
        toolHammer.addEventListener('dragstart', (e) => {
            dragTool = 'hammer';
            e.dataTransfer.effectAllowed = 'copy';
        });
        toolHammer.addEventListener('dragend', () => { dragTool = null; });
    }
    const toolBox = document.getElementById('tool-box');
    if(toolBox) {
        toolBox.addEventListener('dragstart', (e) => {
            dragTool = 'box';
            e.dataTransfer.effectAllowed = 'copy';
        });
        toolBox.addEventListener('dragend', () => { dragTool = null; });
    }

    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
        e.preventDefault();
        if(!dragTool) return;
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        if(activeScene && typeof activeScene.onDrop === 'function') {
            activeScene.onDrop(dragTool, raycaster);
        }
        
        dragTool = null;
    });

    // --- CLICK HANDLING ---
    window.addEventListener('pointerdown', (event) => {
        if(window.App.UIManager.activeLockId !== null) return; 

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        if(window.App.activeCardGroup) {
             const cardGroup = window.App.activeCardGroup;
             const cardIntersects = raycaster.intersectObject(cardGroup, true);
             if(cardIntersects.length === 0) {
                 closeCard();
                 return;
             } else {
                 if(cardIntersects[0].object.userData.part === 'cover' 
                    && cardGroup.userData.cardState === 1) {
                    updateCard('open');
                 }
                 return; 
             }
        }
        
        if(window.App.isGalleryOpen) return;

        // SCENE SPECIFIC DELEGATION
        if(activeScene && typeof activeScene.onPointerDown === 'function') {
            const result = activeScene.onPointerDown(
                raycaster, 
                isDigitZoomed, 
                activeDigitLock, 
                () => zoomOutFromDigitLock(), 
                (inst) => zoomToDigitLock(inst)
            );

            if(typeof result === 'object') {
                if(result.type === 'polaroid') {
                     collectPhotos(result.target);
                } else if(result.type === 'note') {
                     // openCard(result.target); // Removed zoom animation
                     document.getElementById('card-modal').classList.add('active'); // Open Modal instead
                }
            }
        }
    });

    // Global Functions for Scenes
    window.App.main = {
        openGallery: openGallery
    };

    // --- GALLERY / CARD LOGIC (DOM HEAVY) ---
    const galleryModal = document.getElementById('gallery-modal');
    const galleryImage = document.getElementById('gallery-image');
    const galleryCounter = document.getElementById('gallery-counter');
    function updateGalleryUI() {
        const gallery = window.App.GalleryInstance;
        const limit = Math.max(1, window.App.state.photosCollected); 
        
        if(gallery.currentIndex < 0) gallery.currentIndex = Math.min(limit - 1, gallery.photos.length - 1);
        if(gallery.currentIndex >= limit) gallery.currentIndex = 0;
        
        galleryImage.src = gallery.photos[gallery.currentIndex];
        galleryCounter.textContent = `${gallery.currentIndex + 1} / ${limit}`;
    }
    function updateGallery(dir) {
        const gallery = window.App.GalleryInstance;
        if(dir === 'next') gallery.currentIndex++;
        if(dir === 'prev') gallery.currentIndex--;
        updateGalleryUI();
    }
    document.getElementById('gallery-close-btn').addEventListener('click', closeGallery);
    document.getElementById('gallery-next').addEventListener('click', () => updateGallery('next'));
    document.getElementById('gallery-prev').addEventListener('click', () => updateGallery('prev'));

    function openGallery(index) {
        window.App.isGalleryOpen = true;
        if(index !== undefined) window.App.GalleryInstance.currentIndex = index;
        updateGalleryUI();
        if(galleryModal) galleryModal.classList.add('active');
        document.querySelector('.nav-label').textContent = "Gallery Open";
    }

    function closeGallery() {
        if(galleryModal) galleryModal.classList.remove('active');
        window.App.isGalleryOpen = false;
        // toggleUI(true); // Don't hide/restore UI to keep phone accessible?
        if(window.App.activeCardGroup) {} else {
             const boxControls = document.getElementById('box-controls');
             // if(boxControls) boxControls.style.display = 'flex'; // Only if we are not in Heart Scene mode which hides controls?
             // Heart scene manages its own UI state.
             if(activeScene !== heartScene && boxControls) boxControls.style.display = 'flex';
        }
        document.querySelector('.nav-label').textContent = (activeScene === heartScene) ? "Click items to explore." : "Box Opened";
    }

    // Card Logic
    function openCard(hitObj) {
        if(!window.App.state.isBoxOpen) return;
        const cardGroup = hitObj.userData.parentGroup || hitObj;
        if(cardGroup.userData.isAnimating) return;
        
        if(cardGroup.userData.cardState === undefined) cardGroup.userData.cardState = 0;
        const state = cardGroup.userData.cardState;

        if(state === 0) { // Fly out
            cardGroup.userData.isAnimating = true;
            scene.attach(cardGroup);
            cardGroup.traverse(c => { if(c.isMesh) c.renderOrder = 1000; });
            const targetPos = { x: 0, y: 15, z: 15 }; 
            const targetScale = { x: 3.5, y: 3.5, z: 3.5 };
            
            // Move Box Away
            window.TWEEN.to(puzzleScene.heartBox.group.position, { y: -200, duration: 1.0, ease: "cubic.inOut" });
            
            window.TWEEN.to(cardGroup.position, { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: 1.0, ease: "cubic.inOut" });
            window.TWEEN.to(cardGroup.scale, { x: targetScale.x, y: targetScale.y, z: targetScale.z, duration: 1.0, ease: "cubic.inOut" });
            window.TWEEN.to(cardGroup.rotation, { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z, duration: 1.0, ease: "cubic.inOut",
                onComplete: () => {
                    cardGroup.userData.isAnimating = false;
                    cardGroup.userData.cardState = 1; 
                    const cardControls = document.getElementById('card-controls');
                    if(cardControls) { cardControls.style.display = 'flex'; cardControls.style.zIndex = '1000'; }
                    document.querySelector('.nav-label').style.opacity = '1';
                    document.querySelector('.nav-label').textContent = "Use arrows to open card.";
                    window.App.activeCardGroup = cardGroup;
                }
            });
        }
    }

    function closeCard() {
        const cardGroup = window.App.activeCardGroup;
        if(!cardGroup || cardGroup.userData.isAnimating) return;
        cardGroup.userData.isAnimating = true;
        
        if(cardGroup.userData.cardState === 2) {
             window.TWEEN.to(puzzleScene.heartBox.hingeGroup.rotation, { y: Math.PI * 0.99, duration: 0.5, ease: "cubic.in" });
        }

        document.querySelector('.nav-label').textContent = (activeScene === heartScene) ? "Click items to explore." : "Box Opened";

        window.TWEEN.to(puzzleScene.heartBox.group.position, { y: Math.sin(clock.getElapsedTime()) * 0.5, duration: 1.0, ease: "cubic.inOut" });
        
        window.TWEEN.to(cardGroup.position, { x: 0, y: 0, z: 0, duration: 1.0, ease: "cubic.inOut" });
        window.TWEEN.to(cardGroup.scale, { x: 0.1, y: 0.1, z: 0.1, duration: 1.0, ease: "cubic.inOut" });
        window.TWEEN.to(cardGroup.rotation, { x: 0, y: 0, z: 0, duration: 1.0, ease: "cubic.inOut",
            onComplete: () => {
                puzzleScene.heartBox.group.add(cardGroup);
                cardGroup.position.set(0, 0.6, 0);
                cardGroup.rotation.set(-Math.PI / 2, 0, -Math.PI / 12);
                cardGroup.scale.set(1, 1, 1);
                puzzleScene.heartBox.hingeGroup.rotation.y = Math.PI * 0.99;
                cardGroup.userData.isAnimating = false;
                cardGroup.userData.cardState = 0; 
                window.App.activeCardGroup = null;
            }
        });
    }

    function updateCard(action) {
        const cardGroup = window.App.activeCardGroup;
        if(!cardGroup || cardGroup.userData.isAnimating) return;
        if(action === 'open' && cardGroup.userData.cardState === 1) {
            cardGroup.userData.isAnimating = true;
            window.TWEEN.to(puzzleScene.heartBox.hingeGroup.rotation, {
                y: 0, duration: 1.5, ease: "back.out",
                onComplete: () => {
                    cardGroup.userData.isAnimating = false;
                    cardGroup.userData.cardState = 2; // Open
                }
            });
        }
        if(action === 'close') closeCard();
    }
    
    document.getElementById('card-next').addEventListener('click', () => { if(window.App.activeCardGroup) updateCard('open'); });
    document.getElementById('card-prev').addEventListener('click', () => { if(window.App.activeCardGroup) updateCard('close'); });

    window.addEventListener('keydown', (e) => {
        if(window.App.UIManager.activeLockId !== null || document.activeElement.tagName === 'INPUT') return;
        
        if(isDigitZoomed && activeDigitLock) {
            const currentSlot = activeDigitLock.activeSlot;
            const len = activeDigitLock.current.length;
            if(e.key === 'ArrowLeft') activeDigitLock.selectSlot((currentSlot - 1 + len) % len);
            else if(e.key === 'ArrowRight') activeDigitLock.selectSlot((currentSlot + 1) % len);
            else if(e.key === 'ArrowUp') activeDigitLock.cycle(currentSlot, -1);
            else if(e.key === 'ArrowDown') activeDigitLock.cycle(currentSlot, 1);
            else if(e.key === 'Enter' || e.key === ' ') {
                if(activeDigitLock.check()) {
                     const lockEntry = window.App.state.locks.find(l => l.instance === activeDigitLock);
                     if(lockEntry) puzzleScene.handleLockSolved(lockEntry.id, () => zoomOutFromDigitLock());
                }
            } else if(e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) activeDigitLock.setInput(e.key.toUpperCase());
            return; 
        }

        if(window.App.activeCardGroup) {
             if(e.key === 'ArrowLeft') updateCard('close');
             if(e.key === 'ArrowRight') updateCard('open');
             if(e.key === 'Escape') closeCard();
             return; 
        }
        
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

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        window.TWEEN.update(performance.now() / 1000);

        if(activeScene) activeScene.update(time);

        renderer.render(scene, camera);
    }
    
    // collectPhotos function
    function collectPhotos(hitObj) {
        let handled = false;
        
        // Try Central Manager First (HeartBox Stack)
        // Only delegate if the clicked object is ACTUALLY part of the managed stack
        if (hitObj && hitObj.userData.isPolaroidStack) {
             const hb = window.App.Scenes.puzzleSceneInstance ? window.App.Scenes.puzzleSceneInstance.heartBox : null;
             if (hb && typeof hb.claimNextPolaroid === 'function') {
                 // Claim the next valid photo from the managed stack
                 const claimed = hb.claimNextPolaroid();
                 if (claimed) {
                     handled = true;
                 } else {
                     // Stack is empty
                     return; 
                 }
             }
        }

        // Fallback: If not handled by HeartBox manager (e.g. random photo elsewhere), do old logic
        if (!handled && hitObj) {
            if(hitObj.userData.meshGroup) {
                hitObj.userData.meshGroup.visible = false;
            } else {
                hitObj.visible = false;
            }
        }

        if(window.App.state.photosCollected >= 10) {
             window.App.UIManager.showToast("You have found all photos!");
             return;
        }

        const grant = 1; // 1 photo per click
        window.App.state.photosCollected = Math.min(10, window.App.state.photosCollected + grant);
        
        const photoCounter = document.getElementById('photo-counter');
        if(photoCounter) photoCounter.textContent = `${window.App.state.photosCollected}/10`;
        
        window.App.UIManager.showToast(`Found a Photo! Check your phone.`);
    }

    animate();
});