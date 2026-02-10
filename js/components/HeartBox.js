// HeartBox
window.App = window.App || {};

window.App.HeartBox = class {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        this.group.rotation.y = 0;
        
        this.initMesh();
        this.initLocks();
        this.initEffects();
    }
    
    initEffects() {
        // Inner Light (Volumetric feel)
        this.innerLight = new THREE.PointLight(0xffaa00, 0, 20);
        this.innerLight.position.set(0, 0, 0);
        this.group.add(this.innerLight);

        // --- Foldable Card ---
        this.createCard();
        
        // --- Polaroids Stack ---
        this.createPolaroids();
    }

    createPolaroids() {
        this.polaroidGroup = new THREE.Group();
        // Position relative to inside of box.
        // Card is centered. Let's put photos to the left or right.
        // Left side seems open.
        this.polaroidGroup.position.set(-2, 0.2, 1); 
        this.polaroidGroup.rotation.x = -Math.PI / 2;
        this.polaroidGroup.rotation.z = Math.PI / 8; // Bit of angle
        this.group.add(this.polaroidGroup);

        for(let i=0; i<3; i++) {
            const meshGroup = window.App.GalleryInstance.createPolaroidMesh();
            
            // Assign Texture to Stack Item
            // We use the first 3 photos for the 3 stack items
            const tex = window.App.GalleryInstance.getTexture(i);
            if(meshGroup.userData.photoMesh) {
                meshGroup.userData.photoMesh.material.map = tex;
                meshGroup.userData.photoMesh.material.needsUpdate = true;
                // Make it white while loading/if fails? Or standard photo grey.
                meshGroup.userData.photoMesh.material.color.setHex(0xffffff); 
            }

            // Random jitter
            const rZ = (Math.random() - 0.5) * 0.4;
            const rX = i * 0.05; // Stack height
            
            meshGroup.position.z = rX; // Z is up in local space (since rotated X -90)
            meshGroup.rotation.z = rZ;
            
            // Make interactable
            // Add userData to the children meshes that Raycaster expects
            meshGroup.traverse(c => {
                if(c.isMesh) {
                    c.userData = { 
                        isPolaroidStack: true, 
                        parentStack: this.polaroidGroup,
                        galleryIndex: i // Just for variety
                    };
                }
            });
            
            this.polaroidGroup.add(meshGroup);
        }
        
        // Store for Main.js access if needed
        this.polaroidStack = this.polaroidGroup;
    }

    createCard() {
        // Dimensions: Closed 4x6 -> Open 8x6 (Two 4x6 panels)
        // Let's make it 3.5 width x 5 height per panel for a nice card shape
        const w = 3.5;
        const h = 5;
        
        // Container Group
        this.cardGroup = new THREE.Group();
        this.cardGroup.position.set(0, 0.6, 0);
        this.cardGroup.rotation.x = -Math.PI / 2; // Lie flat on floor
        this.cardGroup.rotation.z = -Math.PI / 12; // Slight jaunty angle
        this.group.add(this.cardGroup);
        
        // 1. Right Panel (The Back / Inside Right) - Static relative to group
        // Positioned to the right of the spine (x=0)
        const rightGeo = new THREE.PlaneGeometry(w, h);
        rightGeo.translate(w/2, 0, 0); // Pivot at left edge (0,0)
        
        const rightTexture = window.App.CardContent.getInsideRightTexture();
        const rightMat = new THREE.MeshBasicMaterial({ map: rightTexture, side: THREE.DoubleSide });
        
        this.rightPanel = new THREE.Mesh(rightGeo, rightMat);
        this.cardGroup.add(this.rightPanel);
        // Add userData to children so raycaster hits them
        this.rightPanel.userData = { isNote: true, parentGroup: this.cardGroup, part: 'right' };

        // 2. Left Panel (The Cover / Inside Left) - Rotates around spine
        this.hingeGroup = new THREE.Group();
        this.hingeGroup.position.set(0, 0, 0); // At spine
        this.cardGroup.add(this.hingeGroup);
        
        const leftGeo = new THREE.PlaneGeometry(w, h);
        leftGeo.translate(-w/2, 0, 0); // Pivot at right edge (0,0)
        
        // Front Face (Outside Cover) and Back Face (Inside Left)
        // We'll use a group for the left panel to handle different textures for front/back if needed
        // Or simple: DoubleSide plane? No, Front cover needs different art than Inside Left.
        
        // Let's use Multi-Material or just 2 planes back-to-back.
        // Simplest: 2 Planes.
        
        // Inside Left (Matches Inside Right theme)
        const leftInsideTex = window.App.CardContent.getInsideLeftTexture();
        const leftInsideMat = new THREE.MeshBasicMaterial({ map: leftInsideTex, side: THREE.FrontSide });
        this.leftPanelInside = new THREE.Mesh(leftGeo, leftInsideMat);
        // Z slight offset to avoid fighting
        this.leftPanelInside.position.z = 0.01;
        this.hingeGroup.add(this.leftPanelInside);
        
        // Front Cover (Outside)
        // Since geometry is translated -w/2, facing +Z is "Inside". Facing -Z is "Outside".
        // We want the Cover to be visible when closed.
        // Closed means Hinge Rot Y = 0 (Flat open) -> Hinge Rot Y = roughly 170 deg (Closed).
        // Let's model it "Open Flat" as default (Rot 0).
        // Then "Closed" is Rot Y = -Math.PI.
        
        // Cover Texture
        const coverTex = window.App.CardContent.getCoverTexture();
        const coverMat = new THREE.MeshBasicMaterial({ map: coverTex, side: THREE.BackSide }); // BackSide sees it from outside
        this.coverPanel = new THREE.Mesh(leftGeo, coverMat);
        this.hingeGroup.add(this.coverPanel);

        this.coverPanel.userData = { isNote: true, parentGroup: this.cardGroup, part: 'cover' };
        this.leftPanelInside.userData = { isNote: true, parentGroup: this.cardGroup, part: 'left' };
        
        // Initial State: Closed (Cover on Right, moves Left to Open)
        // Cover Geo is [-W, 0]. Rot 180 puts it at [0, W] (Right, on top of Back).
        this.hingeGroup.rotation.y = Math.PI * 0.99; 
        
        // Reference for Main.js
        this.noteMesh = this.cardGroup; // For compatibility
        this.noteMesh.userData = { isNote: true, isCard: true };
    }


    update(time) {
        // No particle update needed
    }

    initMesh() {
        const heartShape = new THREE.Shape();
        const x = 0, y = 0;
        heartShape.moveTo( x + 5, y + 5 );
        heartShape.bezierCurveTo( x + 5, y + 5, x + 4, y, x, y );
        heartShape.bezierCurveTo( x - 6, y, x - 6, y + 7,x - 6, y + 7 );
        heartShape.bezierCurveTo( x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19 );
        heartShape.bezierCurveTo( x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7 );
        heartShape.bezierCurveTo( x + 16, y + 7, x + 16, y, x + 10, y );
        heartShape.bezierCurveTo( x + 7, y, x + 5, y + 5, x + 5, y + 5 );

        this.heartShape = heartShape;

        // Total depth 4, but split into two halves of 2 (actually 1.5 depth + 2x0.5 bevel = 2.5 height each)
        // Adjusted to match total height of 5 units (4 + 1)
        
        // For Lock compatibility, we pretend depth is 4 in settings
        this.extrudeSettings = {
            depth: 4, 
            bevelEnabled: true,
            bevelSegments: 5, 
            steps: 2,
            bevelSize: 0.5,
            bevelThickness: 0.5
        };

        const halfMeshSettings = {
            depth: 1.5,
            bevelEnabled: true,
            bevelSegments: 5, 
            steps: 2,
            bevelSize: 0.5,
            bevelThickness: 0.5
        };

        const material = new THREE.MeshStandardMaterial({
            color: window.App.CONFIG.colors.heart,
            roughness: 0.3,
            metalness: 0.1,
        });

        // --- BASE ---
        const baseGeometry = new THREE.ExtrudeGeometry(heartShape, halfMeshSettings);
        baseGeometry.computeBoundingBox();
        const centerOffset = new THREE.Vector3(); // Re-use calculating offset
        baseGeometry.boundingBox.getCenter(centerOffset).negate();
        baseGeometry.translate(centerOffset.x, centerOffset.y, centerOffset.z);
        baseGeometry.rotateZ(Math.PI);
        
        // Save offset for locks
        this.centerOffset = centerOffset;

        this.baseGroup = new THREE.Group();
        const baseMesh = new THREE.Mesh(baseGeometry, material);
        baseMesh.rotation.x = -Math.PI / 2;
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        this.baseGroup.add(baseMesh);
        
        // Center of base part is at -1.25 Y
        this.baseGroup.position.y = -1.25;
        this.group.add(this.baseGroup);

        // --- LID ---
        const lidGeometry = new THREE.ExtrudeGeometry(heartShape, halfMeshSettings);
        // Center similarly
        lidGeometry.computeBoundingBox();
        const lidOffset = new THREE.Vector3();
        lidGeometry.boundingBox.getCenter(lidOffset).negate();
        lidGeometry.translate(lidOffset.x, lidOffset.y, lidOffset.z);
        lidGeometry.rotateZ(Math.PI);

        this.lidGroup = new THREE.Group();
        const lidMesh = new THREE.Mesh(lidGeometry, material);
        lidMesh.rotation.x = -Math.PI / 2;
        lidMesh.castShadow = true;
        lidMesh.receiveShadow = true;
        this.lidGroup.add(lidMesh);

        // Center of lid part is at +1.25 Y
        this.lidGroup.position.y = 1.25;
        this.group.add(this.lidGroup);

        this.heartMesh = baseMesh; // Backward compat just in case

        // --- RING (Attached to Base) ---
        const ringSettings = {
            depth: 0.1, 
            bevelEnabled: true,
            bevelSegments: 2, 
            steps: 1,
            bevelSize: 0.55, 
            bevelThickness: 0.05
        };

        const ringGeometry = new THREE.ExtrudeGeometry(heartShape, ringSettings);
        ringGeometry.computeBoundingBox();
        const ringCenter = new THREE.Vector3();
        ringGeometry.boundingBox.getCenter(ringCenter).negate();
        ringGeometry.translate(ringCenter.x, ringCenter.y, ringCenter.z);
        ringGeometry.rotateZ(Math.PI);

        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x800020, 
            roughness: 0.4,
            metalness: 0.1
        });

        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.castShadow = true;
        ringMesh.receiveShadow = true;
        
        // Ring should be at the seam (Y=0). Relative to BaseGroup (Y=-1.25), it should be at Y=+1.25
        ringMesh.position.y = 1.25; 
        
        this.baseGroup.add(ringMesh);
    }
    
    initLocks() {
        const lockConfigs = [
            // HEARTS
            { type: 'heart', t: 0.5, id: 0 }, 
            { type: 'heart', t: 0.25, id: 1 }, 
            { type: 'heart', t: 0.75, id: 2 },
            
            // SCREWS
            { type: 'screw', x: 0, y: 5, id: 3 }, 
            { type: 'screw', x: -4, y: -2, id: 4 }, 
            { type: 'screw', x: 4, y: -2, id: 5 },
            
            // TAPES (Covering Screws)
            { type: 'tape', x: 0, y: 5, id: 6 }, 
            { type: 'tape', x: -4, y: -2, id: 7 }, 
            { type: 'tape', x: 4, y: -2, id: 8 },
            
            // DIGIT LOCK (Top Center) - Solution 'LOVE'
            { type: 'digit', x: 0, y: 0, id: 9, solution: ['L', 'O', 'V', 'E'] }
        ];

        // Tapes don't count for victory
        window.App.state.totalLocks = lockConfigs.filter(c => c.type !== 'tape').length;

        lockConfigs.forEach(config => {
            const lockData = window.App.LockFactory.createLock(config.type, config, this.heartShape, this.centerOffset, this.extrudeSettings);
            
            this.group.add(lockData.container);
            
            window.App.state.locks.push({
                mesh: lockData.mesh,
                container: lockData.container,
                instance: lockData.instance, 
                id: config.id,
                type: config.type,
                solved: false,
                puzzle: window.App.puzzles[config.id % window.App.puzzles.length]
            });
        });
    }
    
    solveLock(id, onComplete) {
        const lockObj = window.App.state.locks.find(l => l.id === id);
        if(!lockObj || lockObj.solved) return;
        
        lockObj.solved = true;
        if(lockObj.type !== 'tape') {
             window.App.state.keysCollected++;
        }
        
        // Animate
        if(lockObj.instance && lockObj.instance.animateSolve) {
            lockObj.instance.animateSolve(() => {
                // Only disappear if NOT digit lock
                if(lockObj.type !== 'digit') {
                    window.TWEEN.to(lockObj.container.scale, { x: 0, y: 0, z: 0, duration: 0.5, delay: 0.3, ease: "back.in" });
                }
            });
        }

        if(onComplete) onComplete();
    }
    
    animateOpen() {
         // Separate the Lid - STRAIGHT UP
         window.TWEEN.to(this.lidGroup.position, { y: this.lidGroup.position.y + 12, duration: 3.0, ease: "cubic.out" });
         
         // Also move Digit Lock (since it's physically on the lid)
         const digitLock = window.App.state.locks.find(l => l.type === 'digit');
         if(digitLock) {
             window.TWEEN.to(digitLock.container.position, { 
                 y: digitLock.container.position.y + 12, 
                 duration: 3.0, 
                 ease: "cubic.out" 
             });
         }

         // No rotation - opens directly up
         
         // Light Up
         window.TWEEN.to(this.innerLight, { intensity: 8, duration: 1.5, ease: "linear" });
         
    }
    
    pulse() {
        window.TWEEN.to(this.group.scale, {x: 1.1, y: 1.1, z: 1.1, duration: 0.4, yoyo: true, repeat: 5});
    }
}