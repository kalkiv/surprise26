window.App = window.App || {};
window.App.Scenes = window.App.Scenes || {};

window.App.Scenes.IntroScene = class IntroScene {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.isActive = false;
        this.rotationIndex = 0; // -1 (Left), 0 (Center), 1 (Right)
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.group.visible = false;
        
        this.initRoom();
        
        this.onComplete = null;
        this.isBoxPlaced = window.App.isPackageOpened || false;
    }

    initRoom() {
        // --- MATERIALS ---
        // Floor: Darker brown/beige
        const floorMat = new THREE.MeshStandardMaterial({ color: 0xCCBEB4, roughness: 0.8 }); 
        const wallWhiteMat = new THREE.MeshStandardMaterial({ color: 0xF8F8FF, roughness: 1.0 }); 
        // Wall behind bed (Left): Darker Pink
        const wallPinkMat = new THREE.MeshStandardMaterial({ color: 0xD87093, roughness: 1.0}); 
        const boxMat = new THREE.MeshStandardMaterial({ color: 0xcdb79e }); 

        // --- ROOM GEOMETRY ---
        const roomWidth = 80;
        const roomLength = 90; // Widened direction (Z-axis)
        const wallThickness = 2;

        // Floor 
        const floor = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, wallThickness, roomLength), floorMat);
        floor.position.y = -20 - (wallThickness/2);
        floor.receiveShadow = true;
        this.group.add(floor);

        // Left Wall (Darker Pink, Behind Bed)
        // Increased height to 70 (was 60)
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, 70, roomLength), wallPinkMat);
        leftWall.position.set(-roomWidth/2 - wallThickness/2, 15, 0);
        leftWall.receiveShadow = true;
        leftWall.castShadow = true;
        this.group.add(leftWall);

        // Right/Back Wall (White)
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 70, wallThickness), wallWhiteMat);
        rightWall.position.set(0, 15, -roomLength/2 - wallThickness/2);
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        this.group.add(rightWall);

        // --- ROOM OBJECTS ---

        // Mirror Grid
        this.mirrorGrid = new window.App.RoomObjects.MirrorGrid();
        this.mirrorGrid.group.position.set(20, 10, -roomLength/2 + 0.6); 
        this.group.add(this.mirrorGrid.group);
        this.brokenMirrors = 0;

        // Flower Grid
        const flowerGrid = new window.App.RoomObjects.FlowerGrid();
        flowerGrid.group.position.set(-20, 10, -roomLength/2 + 0.4); 
        this.group.add(flowerGrid.group);

        // Painting (Lowered slightly)
        // Scale 1.35. Y=30.
        const painting = new window.App.RoomObjects.FlowerPainting();
        painting.group.position.set(-roomWidth/2 + 0.6, 30, 0); 
        painting.group.rotation.y = Math.PI / 2; 
        painting.group.scale.set(1.35, 1.35, 1.35);
        this.group.add(painting.group);

        // --- FURNITURE ---
        
        // Bed
        const bed = new window.App.RoomObjects.Bed();
        bed.group.position.set(-15, -14, 0); 
        // Tag for drag-and-drop detection
        bed.group.traverse(o => { if (o.isMesh) o.userData.isBedPart = true; });
        this.group.add(bed.group);

        // Carpet (Added under foot of bed)
        const carpet = new window.App.RoomObjects.Carpet();
        // Bed Foot is at X=+10 (World). Carpet starts slightly under (X=+5) and extends out.
        // Carpet Length 33 -> Center X = 5 + 16.5 = 21.5.
        // Floor Top is Y=-20. Carpet Height 0.4 -> Center Y = -19.8.
        carpet.group.position.set(21.5, -19.8, 0);
        this.group.add(carpet.group);
        
        // Blankets
        // Flower Blanket: 75% from bottom. Ends at 23.5 (short of 25 to avoid collision).
        // Length 36 (covers ~-12.5 to 23.5). Center X = 5.5.
        // Base 15 -> Scale X = 2.4.
        const blk1 = new window.App.RoomObjects.FlowerBlanket();
        blk1.mesh.scale.set(2.4, 1, 1); 
        blk1.mesh.position.set(5.5, 10.25, 0); 
        // Base Width 15. Store props for peeling logic.
        blk1.mesh.userData = { 
            isBlanket: true, isFlowerBlanket: true, isOpen: false, 
            baseWidth: 15, originalScaleX: 2.4, originalX: 5.5 
        };
        // Traverse to tag children for raycaster
        blk1.mesh.traverse(c => { if(c.isMesh) c.userData = { isBlanket: true, isFlowerBlanket: true, parentBlanket: blk1.mesh }; });
        bed.group.add(blk1.mesh);

        // Stripe Blanket: 25% from bottom. Ends at 23.5.
        // Extended to cover phone fully (Starts at X=10).
        // Length 13.5 (covers 10 to 23.5). Center X = 16.75.
        // Base 12 -> Scale X = 1.125.
        const blk2 = new window.App.RoomObjects.StripeBlanket();
        blk2.mesh.scale.set(1.125, 1, 1);
        blk2.mesh.position.set(16.75, 10.75, 0); 
        // Base Width 12.
        blk2.mesh.userData = { 
            isBlanket: true, isOpen: false, 
            baseWidth: 12, originalScaleX: 1.125, originalX: 16.75 
        };
        // Traverse to tag children for raycaster
        blk2.mesh.traverse(c => { if(c.isMesh) c.userData = { isBlanket: true, parentBlanket: blk2.mesh }; });
        bed.group.add(blk2.mesh);

        // Pillows
        const pillowGroup = new THREE.Group();
        bed.group.add(pillowGroup);
        const pillowTilt = 0.2; 
        
        // Keep track of pillows for cascade logic
        this.pillows = [];

        // Pivot Y for all pillows (Bottom of pillow) - Raised to sit on blankets
        const pivotY = 12.0; 

        // Long Pillow (Rank 0 - Back)
        const longPillow = new window.App.RoomObjects.LongPillow();
        longPillow.group.position.set(-bed.bedLen/2 + 5, pivotY, 0);
        longPillow.group.rotation.z = pillowTilt;
        longPillow.group.userData = { isPillow: true, isFallen: false, pillowRank: 0, baseZ: pillowTilt };
        longPillow.group.traverse(c => { if(c.isMesh) c.userData = { isPillow: true, parentGroup: longPillow.group }; });
        pillowGroup.add(longPillow.group);
        this.pillows.push(longPillow.group);

        // Square Pillows (Rank 1 - Middle)
        const yp1 = new window.App.RoomObjects.SquarePillow();
        yp1.group.position.set(-bed.bedLen/2 + 8, pivotY, -9); 
        yp1.group.rotation.z = pillowTilt;
        yp1.group.userData = { isPillow: true, isFallen: false, pillowRank: 1, baseZ: pillowTilt };
        yp1.group.traverse(c => { if(c.isMesh) c.userData = { isPillow: true, parentGroup: yp1.group }; });
        pillowGroup.add(yp1.group);
        this.pillows.push(yp1.group);
        
        const yp2 = new window.App.RoomObjects.SquarePillow();
        yp2.group.position.set(-bed.bedLen/2 + 8, pivotY, 9);
        yp2.group.rotation.z = pillowTilt;
        yp2.group.userData = { isPillow: true, isFallen: false, pillowRank: 1, baseZ: pillowTilt };
        yp2.group.traverse(c => { if(c.isMesh) c.userData = { isPillow: true, parentGroup: yp2.group }; });
        pillowGroup.add(yp2.group);
        this.pillows.push(yp2.group);

        // --- SMART PHONE & WIRE (Under Yellow Blanket) ---
        // Phone: iPhone Style (Black body, Screen Off)
        // Multi-material: Top face (Index 2) is screen. Others are body.
        const matBody = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.8 });
        const matScreen = new THREE.MeshStandardMaterial({ 
            color: 0x050505, 
            emissive: 0x000000, 
            emissiveIntensity: 0,
            roughness: 0.1 
        });
        const materials = [
            matBody, // +x
            matBody, // -x
            matScreen, // +y (Top)
            matBody, // -y
            matBody, // +z
            matBody  // -z
        ];

        const phone = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 5), materials);
        
        // Position: Under Head of Yellow Blanket (blk2, Foot of Bed).
        // blk2 Head Edge ~ 12.5. 
        // Position at X=13 (Just under edge).
        // Side closer to Table (-Z direction). Z = -12.
        // Y = 10.45 (Lowered slightly to avoid clipping Yellow Blanket 10.75, still above Pink 10.25).
        phone.position.set(13, 10.45, -12); 
        phone.rotation.y = -0.1; 
        
        phone.userData = { isPhone: true };
        phone.traverse(c => { if(c.isMesh) c.userData = { isPhone: true, parentPhone: phone }; });

        bed.group.add(phone);

        // Wire: Black cable -> Bottom of Phone -> Wall Behind (Left of Mirrors)
        // Calculated relative to bed.group position (World -15, -14, 0)
        // Floor World Y = -20. Local Floor Y = -6.
        // Wall World Z = -46. Local Z = -46.
        // Target Plug World X = 5. Local X = 20.
        
        // Coiling logic for excess wire on floor
        // Floor Y (Local) raised to -5.0 to safely clear floor
        // Coiling logic for excess wire on floor
        // Floor Y (Local) raised to -5.0 to safely clear floor
        // Shifted ground loops left (X ~ 8) and extended Z clearance to -19
        // Wire Start Y lowered to 10.45 to match phone and clear Yellow Blanket
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(13, 10.45, -14.5),   // Bottom of Phone
            new THREE.Vector3(13.0, 10.45, -19),   // Extend horizontally out FURHTER (Z=-19) to clear blanket spread
            new THREE.Vector3(13.5, 0, -22),       // Dangle
            new THREE.Vector3(13.5, -5.0, -26),    // Land on Floor
            new THREE.Vector3(8, -5.0, -35),       // Approach Coil Area (Shifted Left to X=8)

            // Loop 1 (Centered around X=8)
            new THREE.Vector3(6.5, -5.0, -38),
            new THREE.Vector3(8, -5.0, -36.5),
            new THREE.Vector3(9.5, -5.0, -38),
            new THREE.Vector3(8, -5.0, -39.5),
            
            // Loop 2
            new THREE.Vector3(7, -5.0, -38),
            new THREE.Vector3(8, -5.0, -37),
            new THREE.Vector3(9, -5.0, -38),
            new THREE.Vector3(8, -5.0, -39),

            // Exit coil towards Plug
            new THREE.Vector3(9, -4, -42),
            new THREE.Vector3(10, 4, -44)          // Up to Wall Plug
        ]);
        
        // Thicker wire (radius 0.15)
        const wireGeo = new THREE.TubeGeometry(curve, 40, 0.15, 8, false);
        const wireMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        bed.group.add(wire);

        // Plug Visual (Small Cylinder at Wall)
        const plug = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        plug.rotation.x = Math.PI / 2; 
        plug.position.set(10, 4, -44); // Match wire end (World X=-5, Y=-10)
        bed.group.add(plug);

        // --- HAMMER PROP (Attached to yp1) ---
        this.hammerProp = new THREE.Group();
        // Re-orient to lie flat against YZ plane (Back of pillow)
        // Handle: Vertical (Y-axis)
        const hHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
        hHandle.position.set(0, 0, 0); // Center
        this.hammerProp.add(hHandle);
        
        // Head: Crossing (Z-axis) - Thin in X to lie flat
        const hHead = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 4), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 }));
        hHead.position.set(0, 3, 0); // Top of handle
        this.hammerProp.add(hHead);
        
        // Position: Attached to "Other" Yellow Pillow (yp1) Center Back
        // yp1 Back face is X = -1.5. 
        // Hammer thickness approx 1.5. Center at -0.75 relative to surface.
        // Total X = -1.5 - 0.8 = -2.3.
        this.hammerProp.position.set(-2.3, 5, 0); 
        this.hammerProp.rotation.set(0, 0, 0); 
        this.hammerProp.scale.set(0.6, 0.6, 0.6);
        
        // Tagging
        this.hammerProp.userData = { isHammer: true };
        this.hammerProp.traverse(c => { if(c.isMesh) c.userData = { isHammer: true, parentGroup: this.hammerProp }; });
        
        yp1.group.add(this.hammerProp);

        // Store reference to yp1 for logic
        this.hammerBlocker = yp1.group;

        // Hole Pillow (Rank 2 - Front)
        const hp = new window.App.RoomObjects.HolePillow();
        hp.group.position.set(-bed.bedLen/2 + 11, pivotY, 0);
        hp.group.rotation.z = pillowTilt;
        hp.group.userData = { isPillow: true, isFallen: false, pillowRank: 2, baseZ: pillowTilt };
        hp.group.traverse(c => { if(c.isMesh) c.userData = { isPillow: true, parentGroup: hp.group }; });
        pillowGroup.add(hp.group);
        this.pillows.push(hp.group);

        // Side Table
        const table = new window.App.RoomObjects.SideTable();
        table.group.position.set(-32, -20, -37); 
        this.group.add(table.group);

        // Geometric Lamp on Side Table (Front)
        const lamp = new window.App.RoomObjects.GeometricLamp();
        lamp.group.position.set(-32, -6, -35); // Slight shift back from edge
        lamp.group.scale.set(1.0, 1.0, 1.0);
        lamp.group.rotation.y = -Math.PI / 2; // Face Left/Bed (Z+)
        this.group.add(lamp.group);
        this.geometricLamp = lamp; // Expose for SmartHome App

        // Silver Bonsai on Side Table (Back, Moved Forward to Drawer Edge)
        const bonsai = new window.App.RoomObjects.SilverBonsai();
        bonsai.group.position.set(-27, -6, -41); // Moved X towards -25 (Drawers)
        bonsai.group.rotation.y = Math.PI / 4; 
        this.group.add(bonsai.group);

        // Bookshelf
        const shelf = new window.App.RoomObjects.Bookshelf();
        shelf.group.position.set(-32, -20, 39);
        this.group.add(shelf.group);
        this.bookshelf = shelf; // Expose for SmartHome App

        // --- THE BOX (On Bed) ---
        // Use Actual CardboardBox class as a visual prop
        const cbInstance = new window.App.CardboardBox(this.scene);
        this.scene.remove(cbInstance.group); // Detach from root scene to manage manually
        this.boxProp = cbInstance.group;
        
        const scale = 0.385; // 10/26 approx
        this.boxProp.scale.set(scale, scale, scale);
        // Position underneath the left side of the bed (Z = 12)
        this.boxProp.position.set(-15, -18, 12); 
        this.boxProp.rotation.set(0, 0, 0);
        
        // Tagging recursive for raycaster
        this.boxProp.traverse(c => { c.userData.isIntroBox = true; });
        this.boxProp.userData = { isIntroBox: true };
        
        this.group.add(this.boxProp);

        // --- HEART BOX PROP (For when package is opened) ---
        // Use Actual HeartBox class as a visual prop (isProp = true)
        const hbInstance = new window.App.HeartBox(this.scene, true); // true = visual only
        this.heartBoxPropInstance = hbInstance;
        this.heartBoxProp = hbInstance.group;
        this.heartBoxProp.scale.set(0.3, 0.3, 0.3); // Scale down
        
        // Reparenting to IntroScene group
        this.group.add(this.heartBoxProp);
        
        // Position on Bed
        // HeartBox class is Y-up. 
        // Lying flat on bed means default rotation (x=0).
        // Adjust Y to sit on surface (Bed Y is roughly -14, plus mattress/blankets).
        // Original box was at Y=-1.
        // Lift slightly to avoid potential z-fighting with blankets
        this.heartBoxProp.position.set(-15, -18.8, 12); 
        this.heartBoxProp.rotation.set(0, 0, 0);

        this.heartBoxProp.visible = false;
        
        // Floating animation anchor
        this.boxAnchorY = -18;
    }

    updateProps() {
        if(window.App.isPackageOpened) {
            this.boxProp.visible = false;
            this.heartBoxProp.visible = true;
            this.syncPropLocks();
        } else {
            this.boxProp.visible = true;
            this.heartBoxProp.visible = false;
        }
    }

    syncPropLocks() {
        if(!this.heartBoxPropInstance || !this.heartBoxPropInstance.propLocks) return;
        
        const realLocks = window.App.state.locks;
        if(!realLocks || realLocks.length === 0) return;

        this.heartBoxPropInstance.propLocks.forEach(pLock => {
            const real = realLocks.find(r => r.id === pLock.id);
            if(real) {
                if(real.solved) {
                    pLock.container.scale.set(0,0,0);
                    pLock.container.visible = false;
                } else {
                    pLock.container.scale.set(1,1,1);
                    pLock.container.visible = true;
                }
            }
        });
    }

    getCurrentPropRotation() {
        const propRot = this.heartBoxProp.visible ? this.heartBoxProp.rotation.y : this.boxProp.rotation.y;
        return this.group.rotation.y + propRot;
    }

    resetRotation() {
        this.rotationIndex = 0;
        window.TWEEN.to(this.group.rotation, {
            y: 0,
            duration: 1.0,
            ease: "power2.inOut"
        });
    }

    enter(fromScene) {
        this.isActive = true;
        this.group.visible = true;
        
        // Hide Game UI
        const nav = document.querySelector('.nav-label');
        if(nav) nav.textContent = "It looks like a package arrived...";
        
        // Tools and Light Switch should remain visible
        const inv = document.querySelector('.inventory-panel');
        if(inv) inv.style.opacity = '1';
        const sw = document.querySelector('.light-switch');
        if(sw) sw.style.opacity = '1';

        const isReturning = (fromScene === 'package' || fromScene === 'puzzle');

        if(isReturning) {
            // Start State: Zoomed in on Box, Others Faded
            const boxToFocus = (this.heartBoxProp.visible) ? this.heartBoxProp : this.boxProp; 
            const boxPos = boxToFocus.position.clone();
            const startLookAt = { x: boxPos.x, y: boxPos.y, z: boxPos.z };
            const endLookAt = { x: 0, y: 0, z: 0 };

            // Ensure room is centered (since we transition from Home View)
            this.group.rotation.y = 0;
            this.rotationIndex = 0;

            // Set initial state (Box visible, others invisible)
            this.setEnvironmentOpacity(0);
            
            // Set Camera (Zoomed in on box) matching default relative scale
            // Factor: Box (2.6), Heart (3.33)
            let factor = 2.6;
            if(window.App.isPackageOpened) factor = 3.33; 
            
            this.camera.zoom = factor; // Default zoom (since next scene resets to 1.0)

            // Fake the lookAt by tweening valid lookAt target
            
            // Because we can't easily force the camera matrix without controls,
            // we will just start the tween from where we want.
            // But we need to make sure the first frame renders correctly.
            // On Enter, main loop calls update() then render.
            // We can rely on Tweens to update lookAt in the first frame.
            
            const camState = { lx: startLookAt.x, ly: startLookAt.y, lz: startLookAt.z };
            
            // Tween Zoom Out
            window.TWEEN.to(this.camera, {
                zoom: 0.4,
                duration: 2.0,
                ease: "power2.inOut",
                onUpdate: () => this.camera.updateProjectionMatrix()
            });

            // Initial LookAt Set
            this.camera.lookAt(startLookAt.x, startLookAt.y, startLookAt.z);

            // Tween LookAt back to center
            window.TWEEN.to(camState, {
                lx: endLookAt.x, ly: endLookAt.y, lz: endLookAt.z,
                duration: 2.0,
                ease: "power2.inOut",
                onUpdate: () => this.camera.lookAt(camState.lx, camState.ly, camState.lz)
            });
            
            // Tween Camera Position back to default (if it changed? Exit doesn't change position, only lookAt and Zoom)
            // But main.js resets it constantly for other scenes.
            // So we need to ensure it's at (40,40,40)
            this.camera.position.set(40,40,40);

            // Fade In Environment
            this.tweenEnvironmentOpacity(1, 2.0);

        } else {
            // Normal Entry
             this.setEnvironmentOpacity(1); 
             
             // Reset Camera for Room View
            window.TWEEN.to(this.camera.position, {
                x: 40, y: 40, z: 40,
                duration: 1.5,
                ease: "power2.inOut",
                onUpdate: () => this.camera.lookAt(0, 0, 0)
            });
            
            window.TWEEN.to(this.camera, {
                zoom: 0.4, // One click out from 0.6
                duration: 1.5,
                ease: "power2.inOut",
                onUpdate: () => this.camera.updateProjectionMatrix()
            });
        }
    }

    rotate(dir) {
        if(!this.isActive) return;
        
        if (dir === 'left') {
            if (this.rotationIndex <= -1) return; // Limit -1
            this.rotationIndex--;
        }
        if (dir === 'right') {
            if (this.rotationIndex >= 1) return; // Limit 1
            this.rotationIndex++;
        }

        const step = Math.PI / 4; 
        const target = this.rotationIndex * step;
        
        window.TWEEN.to(this.group.rotation, {
            y: target,
            duration: 0.5,
            ease: "power2.out"
        });
    }

    exit() {
        this.isActive = false;
        
        // RESET ROOM ROTATION TO CENTER (Home View)
        this.resetRotation();

        // Target stored box position
        const targetObj = (this.heartBoxProp.visible) ? this.heartBoxProp : this.boxProp;
        const boxPos = targetObj.position.clone();

        // Target Camera Position: maintain relative vector (-40, -40, -40) relative to target
        // Target is boxPos.
        // New Cam Pos = boxPos + (40, 40, 40)
        const targetCamPos = { x: boxPos.x + 40, y: boxPos.y + 40, z: boxPos.z + 40 };
        
        const currentLook = { x: 0, y: 0, z: 0 }; 

        // 1. Tween LookAt (Focus on Box)
        window.TWEEN.to(currentLook, {
            x: boxPos.x, y: boxPos.y, z: boxPos.z,
            duration: 1.0,
            ease: "power2.inOut",
            onUpdate: () => this.camera.lookAt(currentLook.x, currentLook.y, currentLook.z)
        });

        // 2. Tween Camera Position (Maintain Angle)
        window.TWEEN.to(this.camera.position, {
            x: targetCamPos.x, y: targetCamPos.y, z: targetCamPos.z,
            duration: 1.0,
            ease: "power2.inOut"
        });

        // Calculate Target Zoom to match Size 1.0 in next scene
        // Box Scale 0.385 -> Zoom 2.6
        // Heart Scale 0.3 -> Zoom 3.33
        // Reset to default scale match since next scene resets to 1.0
        
        let targetZoom = 2.6;
        if(this.heartBoxProp.visible) targetZoom = 3.33;

        // 3. Zoom into box transition
        window.TWEEN.to(this.camera, {
            zoom: targetZoom,
            duration: 1.0,
            ease: "power2.inOut",
            onUpdate: () => this.camera.updateProjectionMatrix(),
            onComplete: () => {
                this.group.visible = false;
            }
        });

        // Fade Out Environment
        this.tweenEnvironmentOpacity(0, 1.0);
    }

    tweenEnvironmentOpacity(targetOpacity, duration) {
        const boxToKeep = this.heartBoxProp.visible ? this.heartBoxProp : this.boxProp;
        
        this.group.traverse((obj) => {
            if (obj.isMesh && obj.material && !Array.isArray(obj.material)) {
                // Check if obj is part of the kept box or descendants
                let isBox = false;
                let parent = obj;
                while(parent) {
                    if(parent === boxToKeep || parent.userData.isIntroBox) { isBox = true; break; }
                    parent = parent.parent;
                }
                
                if (!isBox) {
                    // Check if material can support opacity
                    if (!obj.material.userData || !obj.material.userData.isFadeCloned) {
                         obj.material = obj.material.clone();
                         if(!obj.material.userData) obj.material.userData = {};
                         obj.material.userData.isFadeCloned = true;
                         obj.material.transparent = true;
                    }
                    
                    window.TWEEN.to(obj.material, {
                        opacity: targetOpacity,
                        duration: duration,
                        ease: "power2.inOut"
                    });
                }
            }
        });
    }
    
    setEnvironmentOpacity(opacity) {
         const boxToKeep = this.heartBoxProp.visible ? this.heartBoxProp : this.boxProp;
         this.group.traverse((obj) => {
            if (obj.isMesh && obj.material && !Array.isArray(obj.material)) {
                let isBox = false;
                let parent = obj;
                while(parent) {
                    if(parent === boxToKeep || parent.userData.isIntroBox) { isBox = true; break; }
                    parent = parent.parent;
                }
                if (!isBox) {
                    if (!obj.material.userData || !obj.material.userData.isFadeCloned) {
                         obj.material = obj.material.clone();
                         if(!obj.material.userData) obj.material.userData = {};
                         obj.material.userData.isFadeCloned = true;
                         obj.material.transparent = true;
                    }
                    obj.material.opacity = opacity;
                }
            }
         });
    }

    onDrop(toolName, raycaster) {
        if(!this.isActive) return false;

        if(toolName === 'box') {
             // Check intersection with Bed, Blankets, or Pillows
             const roomHits = raycaster.intersectObject(this.group, true);
             let hitBed = false;
             for(let hit of roomHits) {
                 const d = hit.object.userData;
                 if(d.isBedPart || d.isBlanket || d.isPillow) {
                     hitBed = true;
                     break;
                 }
             }
             
             if(hitBed) {
                  // Place Box
                  this.isBoxPlaced = true;
                  this.boxAnchorY = -1.0; // Raised to sit on top of blankets
                  
                  // Position on bed surface (Centered)
                  this.boxProp.position.set(-15, this.boxAnchorY, 0);
                  this.heartBoxProp.position.set(-15, this.boxAnchorY, 0);
                  
                  this.boxProp.visible = true;
                  
                  // Remove from Inventory
                  const t = document.getElementById('tool-box');
                  if(t) t.remove();
                  
                  return true;
             }
        }
        
        if(toolName === 'hammer') {
            // Check collisions with Mirror Grid
            const intersects = raycaster.intersectObject(this.mirrorGrid.group, true);
            if(intersects.length > 0) {
                // Find visible mirror
                let target = null;
                for(let hit of intersects) {
                     if(hit.object.userData.isMirror) {
                         target = hit.object.userData.parentGroup;
                         break;
                     }
                }
                
                if(target) {
                    const success = this.mirrorGrid.breakMirror(target);
                    if(success) {
                        this.brokenMirrors++;
                        // Sound effect?
                        // Check if all broken (Total 6)
                        if(this.brokenMirrors >= 6) {
                            // Remove Tool
                            const t = document.getElementById('tool-hammer');
                            if(t) t.remove();
                            // Optional: Toast "All mirrors broken!"
                        }
                        return true;
                    }
                }
            }
        }
        return false;
    }

    onPointerDown(raycaster) {
        if(!this.isActive) return false;
        
        // 1. Check Box/HeartBox (Priority)
        let boxTarget = this.boxProp;
        if(this.heartBoxProp.visible) boxTarget = this.heartBoxProp;
        const boxHits = raycaster.intersectObject(boxTarget, true);
        if(boxHits.length > 0) {
            if (this.isBoxPlaced || window.App.isPackageOpened) {
                if(this.onComplete) this.onComplete();
            } else {
                // Pick up into inventory
                this.boxProp.visible = false;
                const toolBox = document.getElementById('tool-box');
                if(toolBox) toolBox.style.display = 'flex';
                
                // Toast
                const toast = document.getElementById('toast');
                const msg = document.getElementById('toast-msg');
                if(toast && msg) {
                    msg.textContent = "You picked up the package.";
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 3000);
                }
            }
            return true;
        }

        // 2. Check Room Objects (Traverse whole group)
        const roomHits = raycaster.intersectObject(this.group, true);
        if(roomHits.length > 0) {
            // Find first valid interactable
            for(let hit of roomHits) {
                const meta = hit.object.userData;

                // LAMP TOGGLE
                if(meta.isLamp || (meta.instance && meta.instance.constructor.name === 'GeometricLamp')) {
                    const lamp = meta.instance;
                    if(lamp && typeof lamp.toggle === 'function') {
                        lamp.toggle();
                        return true;
                    }
                }
                
                // BOX CUTTER PROP
                if(meta.isCutterProp) {
                    const drawer = meta.parentDrawer;
                    if(drawer && drawer.userData.isOpen) {
                        // Grant Item
                        const toolEl = document.getElementById('tool-cutter');
                        if(toolEl) toolEl.style.display = 'flex'; // Reveal in UI
                        
                        // Show visual feedback
                        const toast = document.getElementById('toast');
                        const msg = document.getElementById('toast-msg');
                        if(toast && msg) {
                            msg.textContent = "You found a box cutter!";
                            toast.classList.add('show');
                            setTimeout(() => toast.classList.remove('show'), 3000);
                        }

                        // Remove Prop (Hide parent group if part of a group, otherwise hide itself)
                        if(hit.object.parent && hit.object.parent.type === 'Group') {
                            hit.object.parent.visible = false;
                        } else {
                            hit.object.visible = false;
                        }
                        return true;
                    }
                }

                // PILLOWS
                if(meta.isPillow) {
                    const clickedObj = meta.parentGroup || hit.object;
                    const clickedRank = clickedObj.userData.pillowRank;
                    const clickedState = clickedObj.userData.isFallen;
                    const newState = !clickedState;

                    // Cascade Logic
                    // Fall (True): Propagate Back -> Front (Rank 0 -> 2).
                    // Stand (False): Propagate Front -> Back (Rank 2 -> 0).
                    // SEPARATION: Do not affect pillows of the SAME rank (e.g. other yellow pillow)
                    if(this.pillows) {
                        this.pillows.forEach(p => {
                            const pRank = p.userData.pillowRank;
                            let shouldUpdate = false;

                            // Strict Inequality for cascade, plus Identity check for same rank
                            if(pRank === clickedRank) {
                                if(p.uuid === clickedObj.uuid) shouldUpdate = true;
                            } else if(newState === true) { // Falling
                                if(pRank > clickedRank) shouldUpdate = true;
                            } else { // Standing
                                if(pRank < clickedRank) shouldUpdate = true;
                            }

                            if(shouldUpdate && p.userData.isFallen !== newState) {
                                p.userData.isFallen = newState;
                                
                                if(newState) {
                                    // Fall Forward Staggered
                                    // Front (Rank 2) should be FLAT (-PI/2)
                                    // Back (Rank 0) should be Angled (steepest)
                                    // Formula: -PI/2 + ((2 - rank) * stagger)
                                    const stagger = 0.25; 
                                    const targetZ = -Math.PI/2 + ((2 - pRank) * stagger);
                                    window.TWEEN.to(p.rotation, { z: targetZ, duration: 0.6, ease: "bounce.out" });
                                } else {
                                    // Reset
                                    const baseZ = p.userData.baseZ || 0.2;
                                    window.TWEEN.to(p.rotation, { z: baseZ, duration: 0.5, ease: "power2.out" });
                                }
                            }
                        });
                    }
                    return true;
                }

                // PHONE PICKUP
                if(meta.isPhone) {
                    const phoneMesh = meta.parentPhone || hit.object;
                    phoneMesh.visible = false;
                    
                    // Add to Inventory
                    const toolPhone = document.getElementById('tool-phone');
                    if(toolPhone) toolPhone.style.display = 'flex';
                    
                    // Show Toast
                    const toast = document.getElementById('toast');
                    const msg = document.getElementById('toast-msg');
                    if(toast && msg) {
                        msg.textContent = "You found your phone.";
                        toast.classList.add('show');
                        setTimeout(() => toast.classList.remove('show'), 3000);
                    }
                    return true;
                }

                // BLANKETS (Peel Back - Shrink/Compress)
                if(meta.isBlanket) {
                    if(meta.isFlowerBlanket) return false;
                    const blanket = meta.parentBlanket || hit.object; 
                    if(blanket.userData.isFlowerBlanket) return false;

                    const open = !blanket.userData.isOpen;
                    blanket.userData.isOpen = open;
                    
                    const dat = blanket.userData;
                    
                    // Calculate Foot Edge (Fixed Anchor)
                    const footEdge = dat.originalX + (dat.baseWidth * dat.originalScaleX / 2);
                    
                    // Determine Target Scale
                    // Adjusted to ensure Phone is visible (40% reduction to pull back significantly)
                    const targetScaleX = open ? dat.originalScaleX * 0.6 : dat.originalScaleX;
                    
                    // Determine Target Position (Center) based on maintaining Foot Edge
                    // FootEdge = Pos + (Width * Scale / 2) -> Pos = FootEdge - (Width * Scale / 2)
                    const targetX = footEdge - (dat.baseWidth * targetScaleX / 2);

                    // Animate Position
                    window.TWEEN.to(blanket.position, {
                        x: targetX,
                        duration: 0.8,
                        ease: "cubic.inOut"
                    });
                    
                    // Animate Scale
                    window.TWEEN.to(blanket.scale, {
                        x: targetScaleX,
                        duration: 0.8,
                        ease: "cubic.inOut"
                    });

                    return true;
                }

                // DRAWERS
                // Modified: Only open if strict interaction target (Drawer Face) is clicked
                if(meta.isDrawerFace && meta.parentDrawer) {
                    const group = meta.parentDrawer; 
                    if(group && group.userData.isDrawer) {
                        const open = !group.userData.isOpen;
                        group.userData.isOpen = open;
                        const originalX = group.userData.originalX;
                        // Slide along Local X
                        const targetX = open ? originalX + 8 : originalX;
                        window.TWEEN.to(group.position, { x: targetX, duration: 0.5, ease: "cubic.out" });
                        return true;
                    }
                }
                
                // HAMMER PROP
                if(meta.isHammer) {
                    // Check if blocker (yp2) is fallen
                    if(this.hammerBlocker && this.hammerBlocker.userData.isFallen) {
                        // Collect
                        const g = meta.parentGroup || hit.object;
                        g.visible = false;
                        
                        // Show in UI
                        const t = document.getElementById('tool-hammer');
                        if(t) t.style.display = 'flex';
                        
                        // Toast
                        const toast = document.getElementById('toast');
                        const msg = document.getElementById('toast-msg');
                        if(toast && msg) {
                            msg.textContent = "You found a hammer!";
                            toast.classList.add('show');
                            setTimeout(() => toast.classList.remove('show'), 3000);
                        }
                        return true;
                    } else {
                        // Provide hint? "I can't reach that yet."
                    }
                }
            }
        }
        
        return false;
    }

    update(time) {
        if(!this.isActive) return;
        
        // Removed rotation animation (swivel) as requested
        // Removed vertical bobbing effect

        if(this.boxProp.visible) {
            this.boxProp.position.y = this.boxAnchorY;
        }
        if(this.heartBoxProp.visible) {
            this.heartBoxProp.position.y = this.boxAnchorY;
        }
    }
};