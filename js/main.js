// Main Logic
window.addEventListener('load', () => {
    // Init Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x5C3644, -100, 300);

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

    // --- SCENE MANAGEMENT ---
    const introScene = new window.App.Scenes.IntroScene(scene, camera);
    const packageScene = new window.App.Scenes.PackageScene(scene, camera);
    const puzzleScene = new window.App.Scenes.PuzzleScene(scene, camera);
    
    let activeScene = introScene;
    window.App.currentScene = 'intro'; // 'intro', 'package', 'puzzle'
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
             // Important: Hide PuzzleScene heartbox which might be visible from Package Scene
             if(puzzleScene.heartBox) puzzleScene.heartBox.group.visible = false;
        }

        setTimeout(() => {
            activeScene.enter(window.App.currentScene === 'intro' ? 'package' : window.App.currentScene); // Pass previous context if needed, though activeScene is already updating. 
            // Wait, window.App.currentScene is ALREADY updated to newSceneId above.
            // I need to capture oldSceneId before updating.
            if(newSceneId === 'package' || newSceneId === 'puzzle') {
                // SEAMLESS TRANSITION FIX
                // Since IntroScene now zooms in further (to match apparent size of 1.0),
                // we set the camera zoom to 1.0 immediately to prevent any visual jump.
                if(isLeavingIntro) {
                    camera.zoom = 1.0;
                    camera.updateProjectionMatrix();
                }

                // Ensure default camera for object views
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

            // Visual continuity for Package Scene
             if(newSceneId === 'package') {
                puzzleScene.heartBox.group.visible = true; 
             }
             
             updateUIForScene(newSceneId);
        }, delay);
    }

    // Scene Transition 1: Intro -> Package (or Puzzle if opened)
    introScene.onComplete = () => {
        if(window.App.isPackageOpened) {
            switchToScene(puzzleScene, 'puzzle');
        } else {
            switchToScene(packageScene, 'package');
        }
    };

    // Scene Transition 2: Package -> Puzzle
    packageScene.onComplete = () => {
        window.App.isPackageOpened = true; // Mark as opened
        switchToScene(puzzleScene, 'puzzle');
    };

    // Back Button Logic
    function goBackOneScene() {
       if(window.App.currentScene === 'puzzle') {
           // If package opened, skip package scene and go to intro
           if(window.App.isPackageOpened) {
               switchToScene(introScene, 'intro');
           } else {
               // Should be impossible if isPackageOpened is set correctly, but fallback
               switchToScene(packageScene, 'package');
           }
       } else if(window.App.currentScene === 'package') {
           switchToScene(introScene, 'intro');
       }
    }
    
    const backBtn = document.getElementById('back-scene-btn');
    if(backBtn) {
        backBtn.addEventListener('click', goBackOneScene);
    }

    function updateUIForScene(sceneId) {
        const backBtn = document.getElementById('back-scene-btn');
        if(backBtn) {
            if(sceneId === 'intro') {
                backBtn.style.opacity = '0';
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
            spotLight.color.setHex(0x7a00ff); 
            spotLight.intensity = 2.5; 
            ambientLight.intensity = 0.1; 
            keyLight.intensity = 0.1;
            fillLight.intensity = 0.1;
            scene.fog.color.setHex(0x110022); 
            document.body.style.background = 'linear-gradient(135deg, #1a0022, #000000)';
        }

        // Spotlight Focus for Intro Scene (Box Highlight)
        if(activeScene === introScene) {
            if(!isLightOn) {
                // Focus Light on Box (Center Bed)
                // Base pos (-15, -1, 0)
                // Move SpotLight Target
                window.TWEEN.to(spotLight.target.position, {
                    x: -15, y: -1, z: 0,
                    duration: 1.0,
                    ease: "power2.inOut"
                });
                // Narrow the beam
                window.TWEEN.to(spotLight, {
                    angle: Math.PI / 8,
                    duration: 1.0,
                    ease: "power2.inOut"
                });
            } else {
                // Reset Light
                window.TWEEN.to(spotLight.target.position, {
                    x: 0, y: 0, z: 0,
                    duration: 1.0,
                    ease: "power2.inOut"
                });
                window.TWEEN.to(spotLight, {
                    angle: Math.PI / 6,
                    duration: 1.0,
                    ease: "power2.inOut"
                });
            }
        }

        // TAPE ILLUMINATION & HIDDEN TEXT needs access to locks (in PuzzleScene)
        if(puzzleScene.heartBox) { 
            if(window.App.state && window.App.state.locks) {
                window.App.state.locks.forEach(lock => {
                    // Tape
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

    // Start Intro Scene
    activeScene.enter(); 
    updateUIForScene('intro');
    if(toggle) updateLights(toggle.checked);

    // --- RAYCASTER ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // --- DIGIT LOCK ZOOM STATE ---
    let isDigitZoomed = false;
    let activeDigitLock = null;

    function zoomToDigitLock(lockInstance) {
        isDigitZoomed = true;
        activeDigitLock = lockInstance;
        if(activeDigitLock) activeDigitLock.selectSlot(0);
        const boxControls = document.getElementById('box-controls');
        if(boxControls) boxControls.style.display = 'none';
        
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
        if(activeScene === puzzleScene) {
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
        
        // Intro Scene Delegation
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
        
        // Bounds
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
        
        // Scene Delegation
        if(activeScene === introScene) {
            if(activeScene.resetRotation) activeScene.resetRotation();
            window.TWEEN.to(camera.position, {
                x: 40, y: 40, z: 40, duration: 1.0, ease: "power2.inOut", onUpdate: () => camera.lookAt(0, 0, 0)
            });
            window.TWEEN.to(camera, {
                zoom: 0.4, // Default for Intro
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

    // Event Listener for Home View Request (sent from PuzzleScene)
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

    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
        e.preventDefault();
        if(!dragTool) return;
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        // Generic delegation if scene supports onDrop
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

        // Active Card Handling (Global overlay logic)
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

        // SCENE SPECIFIC
        if(activeScene === introScene) {
            introScene.onPointerDown(raycaster);
            return;
        }

        if(activeScene === packageScene) {
            packageScene.onPointerDown(raycaster);
            return;
        }

        if(activeScene === puzzleScene) {
            const result = puzzleScene.onPointerDown(
                raycaster, 
                isDigitZoomed, 
                activeDigitLock, 
                () => zoomOutFromDigitLock(), 
                (inst) => zoomToDigitLock(inst)
            );
            
            if(typeof result === 'object') {
                if(result.type === 'polaroid') {
                     openGallery(result.index);
                } else if(result.type === 'note') {
                     openCard(result.target);
                }
            }
        }
    });

    // --- GALLERY / CARD LOGIC (DOM HEAVY) ---
    const galleryModal = document.getElementById('gallery-modal');
    const galleryImage = document.getElementById('gallery-image');
    const galleryCounter = document.getElementById('gallery-counter');
    function updateGalleryUI() {
        const gallery = window.App.GalleryInstance;
        if(gallery.currentIndex < 0) gallery.currentIndex = gallery.photos.length - 1;
        if(gallery.currentIndex >= gallery.photos.length) gallery.currentIndex = 0;
        galleryImage.src = gallery.photos[gallery.currentIndex];
        galleryCounter.textContent = `${gallery.currentIndex + 1} / ${gallery.photos.length}`;
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
        if(!window.App.state.isBoxOpen) return;
        window.App.isGalleryOpen = true;
        if(index !== undefined) window.App.GalleryInstance.currentIndex = index;
        updateGalleryUI();
        if(galleryModal) galleryModal.classList.add('active');
        toggleUI(false);
        document.querySelector('.nav-label').textContent = "Gallery Open";
    }

    function closeGallery() {
        if(galleryModal) galleryModal.classList.remove('active');
        window.App.isGalleryOpen = false;
        toggleUI(true);
        if(window.App.activeCardGroup) {} else {
             const boxControls = document.getElementById('box-controls');
             if(boxControls) boxControls.style.display = 'flex';
        }
        document.querySelector('.nav-label').textContent = "Box Opened";
    }

    function toggleUI(show) {
        const uiElements = [
            document.querySelector('.inventory-panel'),
            document.querySelector('.light-switch'),
            document.querySelector('.nav-label')
        ];

        // Back button visibility
        const backBtn = document.getElementById('back-scene-btn');
        if(backBtn) {
            if(show && window.App.currentScene !== 'intro') {
                backBtn.style.opacity = '1';
                backBtn.style.pointerEvents = 'auto';
            } else {
                backBtn.style.opacity = '0';
                backBtn.style.pointerEvents = 'none';
            }
        }

        uiElements.forEach(el => {
            if(el) {
                el.style.opacity = show ? '1' : '0';
                el.style.pointerEvents = show ? 'auto' : 'none';
            }
        });
        const boxControls = document.getElementById('box-controls');
        if(boxControls) boxControls.style.display = show ? 'flex' : 'none';
        const cardControls = document.getElementById('card-controls');
        if(cardControls) cardControls.style.display = 'none'; // Default hidden
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
            
            toggleUI(false);

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

        toggleUI(true);
        document.querySelector('.nav-label').textContent = "Box Opened";

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
            if(e.key === 'ArrowLeft') activeDigitLock.selectSlot((currentSlot - 1 + 4) % 4);
            else if(e.key === 'ArrowRight') activeDigitLock.selectSlot((currentSlot + 1) % 4);
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

    animate();
});