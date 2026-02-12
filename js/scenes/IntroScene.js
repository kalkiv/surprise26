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
        this.group.add(bed.group);
        
        // Blankets
        // Flower Blanket: 75% from bottom. Ends at 23.5 (short of 25 to avoid collision).
        // Length 36 (covers ~-12.5 to 23.5). Center X = 5.5.
        // Base 15 -> Scale X = 2.4.
        const blk1 = new window.App.RoomObjects.FlowerBlanket();
        blk1.mesh.scale.set(2.4, 1, 1); 
        blk1.mesh.position.set(5.5, 10.25, 0); 
        bed.group.add(blk1.mesh);

        // Stripe Blanket: 25% from bottom. Ends at 23.5.
        // Length 11 (covers ~12.5 to 23.5). Center X = 18.
        // Base 12 -> Scale X = 0.92.
        const blk2 = new window.App.RoomObjects.StripeBlanket();
        blk2.mesh.scale.set(0.92, 1, 1);
        blk2.mesh.position.set(18, 10.75, 0); 
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

        // Bookshelf
        const shelf = new window.App.RoomObjects.Bookshelf();
        shelf.group.position.set(-32, -20, 39);
        this.group.add(shelf.group);

        // --- THE BOX (On Bed) ---
        // Use Actual CardboardBox class as a visual prop
        const cbInstance = new window.App.CardboardBox(this.scene);
        this.scene.remove(cbInstance.group); // Detach from root scene to manage manually
        this.boxProp = cbInstance.group;
        
        const scale = 0.385; // 10/26 approx
        this.boxProp.scale.set(scale, scale, scale);
        // Correct position to sit on bed (Visual check: bottom at roughly -4)
        this.boxProp.position.set(-15, -1, 0); 
        this.boxProp.rotation.set(0, 0, 0);
        
        // Tagging recursive for raycaster
        this.boxProp.traverse(c => { c.userData.isIntroBox = true; });
        this.boxProp.userData = { isIntroBox: true };
        
        this.group.add(this.boxProp);

        // --- HEART BOX PROP (For when package is opened) ---
        // Use Actual HeartBox class as a visual prop (isProp = true)
        const hbInstance = new window.App.HeartBox(this.scene, true); // true = visual only
        this.heartBoxProp = hbInstance.group;
        this.heartBoxProp.scale.set(0.3, 0.3, 0.3); // Scale down
        
        // Reparenting to IntroScene group
        this.group.add(this.heartBoxProp);
        
        // Position on Bed
        // HeartBox class is Y-up. 
        // Lying flat on bed means default rotation (x=0).
        // Adjust Y to sit on surface (Bed Y is roughly -14, plus mattress/blankets).
        // Original box was at Y=-1.
        this.heartBoxProp.position.set(-15, -2, 0); 
        this.heartBoxProp.rotation.set(0, 0, 0);

        this.heartBoxProp.visible = false;
        
        // Floating animation anchor
        this.boxAnchorY = -1;
    }

    updateProps() {
        if(window.App.isPackageOpened) {
            this.boxProp.visible = false;
            this.heartBoxProp.visible = true;
        } else {
            this.boxProp.visible = true;
            this.heartBoxProp.visible = false;
        }
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
            const boxPos = { x: -15, y: -1, z: 0 };
            const startLookAt = { x: boxPos.x, y: boxPos.y, z: boxPos.z };
            const endLookAt = { x: 0, y: 0, z: 0 };

            // Set initial state (Box visible, others invisible)
            this.setEnvironmentOpacity(0);
            
            // Set Camera (Zoomed in on box)
            this.camera.zoom = 2.0;
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
        
        const boxPos = { x: -15, y: -1, z: 0 };
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
            if(this.onComplete) this.onComplete();
            return true;
        }

        // 2. Check Room Objects (Traverse whole group)
        const roomHits = raycaster.intersectObject(this.group, true);
        if(roomHits.length > 0) {
            // Find first valid interactable
            for(let hit of roomHits) {
                const meta = hit.object.userData;
                
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

                // DRAWERS
                if(meta.isDrawer || (meta.parentDrawer && meta.parentDrawer.userData.isDrawer)) {
                    const group = meta.parentDrawer || meta.parentGroup || hit.object; // ParentDrawer set in SideTable
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
        
        // Gentle hover only when active
        const offset = Math.sin(time * 2) * 0.5;
        const rot = Math.sin(time) * 0.1;

        if(this.boxProp.visible) {
            this.boxProp.position.y = this.boxAnchorY + offset;
            this.boxProp.rotation.y = rot;
        }
        if(this.heartBoxProp.visible) {
            this.heartBoxProp.position.y = this.boxAnchorY + offset;
            this.heartBoxProp.rotation.y = rot;
        }
    }
};