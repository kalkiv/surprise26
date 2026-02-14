// HeartBox
window.App = window.App || {};

window.App.HeartBox = class {
    constructor(scene, isProp = false) {
        this.scene = scene;
        this.group = new THREE.Group();
        // this.scene.add(this.group); // Removed auto-add to prevent duplicates/orphan instances
        
        this.group.rotation.y = 0;
        
        this.initMesh();
        
        // Always init locks (visually), but prevent interaction if prop
        this.initLocks(isProp);
        
        if (!isProp) {
            this.initEffects();
        }
    }
    
    // Pattern Texture Generation (LV Style Staggered)
    createPatternTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Black background (No Emissive)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, size, size);
        
        // Text Settings
        ctx.fillStyle = '#ff00ff'; // Neon Pink text
        ctx.font = 'bold 160px "Times New Roman", Serif'; // Even Larger font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Ultra Sparse - Just ONE Logo per Tile (Centered)
        ctx.fillText('LOVE', 256, 256);
        
        const tex = new THREE.CanvasTexture(canvas);
        // Repeat settings applied in initMesh based on usage
        return tex;
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
        this.polaroidGroup.position.set(-2, 0.2, 1); 
        this.polaroidGroup.rotation.x = -Math.PI / 2;
        this.polaroidGroup.rotation.z = Math.PI / 8; // Bit of angle
        this.group.add(this.polaroidGroup);
        
        this.polaroids = [];

        // 5 photos
        for(let i=0; i<5; i++) {
            const meshGroup = window.App.GalleryInstance.createPolaroidMesh();
            
            // Assign Texture to Stack Item
            const tex = window.App.GalleryInstance.getTexture(i);
            if(meshGroup.userData.photoMesh) {
                meshGroup.userData.photoMesh.material.map = tex;
                meshGroup.userData.photoMesh.material.needsUpdate = true;
                // Make it white while loading/if fails
                meshGroup.userData.photoMesh.material.color.setHex(0xffffff); 
            }

            // Random jitter
            const rZ = (Math.random() - 0.5) * 0.4;
            const rX = i * 0.05; // Stack height
            
            meshGroup.position.z = rX; // Z is up in local space (since rotated X -90)
            meshGroup.rotation.z = rZ;
            
            // Make interactable
            meshGroup.translateZ(0); // Ensure creation
            
            // Store reference on the group container (meshGroup)
            // MARK AS STACK, but don't rely only on mesh click logic
            meshGroup.userData = { 
                isPolaroidStack: true, 
                parentStack: this.polaroidGroup,
                galleryIndex: i,
                isPhoto: true // Specific Tag
            };

            // Set Check on Children meshes too for Raycasting
            meshGroup.traverse(c => {
                if(c.isMesh) {
                    c.userData = { 
                        isPolaroidStack: true, 
                        parentStack: this.polaroidGroup, 
                        meshGroup: meshGroup, 
                        galleryIndex: i,
                        isPhoto: true
                    };
                }
            });
            
            this.polaroidGroup.add(meshGroup);
            this.polaroids.push(meshGroup);
        }
        
        // Store for Main.js access if needed
        this.polaroidStack = this.polaroidGroup;
    }

    claimNextPolaroid() {
        if(!this.polaroids) return;
        
        // Find top-most visible photo (Highest Index created last)
        // Array is [0, 1, 2, 3, 4] -> 4 is top.
        for(let i = this.polaroids.length - 1; i >= 0; i--) {
            if(this.polaroids[i].visible) {
                 this.polaroids[i].visible = false;
                 
                 // If that was the last one (index 0), hide the group?
                 if(i === 0) {
                     this.polaroidGroup.visible = false;
                 }
                 return true; // Claimed successfully
            }
        }
        return false; // None left
    }

    createCard() {
        const w = 3.5;
        const h = 5;
        
        // Container Group
        this.cardGroup = new THREE.Group();
        this.cardGroup.position.set(0, 0.6, 0);
        this.cardGroup.rotation.x = -Math.PI / 2; // Lie flat on floor
        this.cardGroup.rotation.z = -Math.PI / 12; // Slight jaunty angle
        this.group.add(this.cardGroup);
        
        // 1. Right Panel (The Back / Inside Right) - Static relative to group
        const rightGeo = new THREE.PlaneGeometry(w, h);
        rightGeo.translate(w/2, 0, 0); // Pivot at left edge (0,0)
        
        const rightTexture = window.App.CardContent.getInsideRightTexture();
        const rightMat = new THREE.MeshBasicMaterial({ map: rightTexture, side: THREE.DoubleSide });
        
        this.rightPanel = new THREE.Mesh(rightGeo, rightMat);
        this.cardGroup.add(this.rightPanel);
        this.rightPanel.userData = { isNote: true, parentGroup: this.cardGroup, part: 'right' };

        // 2. Left Panel (The Cover / Inside Left) - Rotates around spine
        this.hingeGroup = new THREE.Group();
        this.hingeGroup.position.set(0, 0, 0); // At spine
        this.cardGroup.add(this.hingeGroup);
        
        const leftGeo = new THREE.PlaneGeometry(w, h);
        leftGeo.translate(-w/2, 0, 0); // Pivot at right edge (0,0)
        
        // Inside Left
        const leftInsideTex = window.App.CardContent.getInsideLeftTexture();
        const leftInsideMat = new THREE.MeshBasicMaterial({ map: leftInsideTex, side: THREE.FrontSide });
        this.leftPanelInside = new THREE.Mesh(leftGeo, leftInsideMat);
        this.leftPanelInside.position.z = 0.01;
        this.hingeGroup.add(this.leftPanelInside);
        
        // Front Cover (Outside)
        const coverTex = window.App.CardContent.getCoverTexture();
        const coverMat = new THREE.MeshBasicMaterial({ map: coverTex, side: THREE.BackSide }); 
        this.coverPanel = new THREE.Mesh(leftGeo, coverMat);
        this.hingeGroup.add(this.coverPanel);

        this.coverPanel.userData = { isNote: true, parentGroup: this.cardGroup, part: 'cover' };
        this.leftPanelInside.userData = { isNote: true, parentGroup: this.cardGroup, part: 'left' };
        
        // Initial State: Closed
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

        // Settings for Extrusion
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
        
        // Generate LV Pattern Texture
        const patternTexSource = this.createPatternTexture();
        patternTexSource.needsUpdate = true;

        // Create separate textures for Top vs Sides to handle UV wrapping correctly
        const topTex = patternTexSource.clone();
        topTex.wrapS = THREE.RepeatWrapping;
        topTex.wrapT = THREE.RepeatWrapping;
        // Huge reduction in density (10-fold less). 3x3 -> 1x1.
        topTex.repeat.set(1, 1); 

        const sideTex = patternTexSource.clone();
        sideTex.wrapS = THREE.RepeatWrapping;
        sideTex.wrapT = THREE.RepeatWrapping;
        // Perimeter ~60 units. 3 repeats horizontally.
        // Height ~2.5 units. 0.2 slice height.
        // Focusing on CENTER text (V=0.5). Slice 0.4 to 0.6.
        sideTex.repeat.set(3, 0.2); 
        sideTex.offset.set(0, 0.4);
        sideTex.wrapS = THREE.RepeatWrapping;
        sideTex.wrapT = THREE.RepeatWrapping;
        // Perimeter ~60 units. Box Width 20. 60/20 = 3 repeats.
        // Height ~2.5 units. Box Height 20. 2.5/20 = 0.125.
        // Focusing on the bottom text row (V=0.25). 
        // We show a slice of height 0.2 centered around 0.25 (offset 0.15).
        sideTex.repeat.set(3, 0.2); 
        sideTex.offset.set(0, 0.15);

        const matParams = {
            color: window.App.CONFIG.colors.heart,
            roughness: 0.3,
            metalness: 0.1,
            emissive: 0xffffff,
            emissiveIntensity: 0
        };

        const topMat = new THREE.MeshStandardMaterial({ ...matParams, emissiveMap: topTex });
        const sideMat = new THREE.MeshStandardMaterial({ ...matParams, emissiveMap: sideTex });
        
        const materials = [topMat, sideMat]; // Index 0: Top/Bottom, Index 1: Sides
        this.lidMaterials = materials; // Expose array for light control

        // --- BASE ---
        const baseGeometry = new THREE.ExtrudeGeometry(heartShape, halfMeshSettings);
        baseGeometry.computeBoundingBox();
        const centerOffset = new THREE.Vector3();
        baseGeometry.boundingBox.getCenter(centerOffset).negate();
        baseGeometry.translate(centerOffset.x, centerOffset.y, centerOffset.z);
        baseGeometry.rotateZ(Math.PI);
        
        // Save offset for locks
        this.centerOffset = centerOffset;

        this.baseGroup = new THREE.Group();
        const baseMesh = new THREE.Mesh(baseGeometry, materials); // Use Array
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
        const lidMesh = new THREE.Mesh(lidGeometry, materials); // Use Array
        lidMesh.rotation.x = -Math.PI / 2;
        lidMesh.castShadow = true;
        lidMesh.receiveShadow = true;
        this.lidGroup.add(lidMesh);

        // Center of lid part is at +1.25 Y
        this.lidGroup.position.y = 1.25;
        this.group.add(this.lidGroup);

        this.heartMesh = baseMesh; 

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
    
    initLocks(isProp) {
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
            
            // DIGIT LOCK (Top Center) - Solution '1L0V3U'
            { type: 'digit', x: 0, y: 0, id: 9, solution: ['1', 'L', '0', 'V', '3', 'U'] }
        ];

        // Tapes don't count for victory
        window.App.state.totalLocks = lockConfigs.filter(c => c.type !== 'tape').length;

        lockConfigs.forEach(config => {
            const lockData = window.App.LockFactory.createLock(config.type, config, this.heartShape, this.centerOffset, this.extrudeSettings);
            
            this.group.add(lockData.container);
            
            if(!isProp) {
                window.App.state.locks.push({
                    mesh: lockData.mesh,
                    container: lockData.container,
                    instance: lockData.instance, 
                    id: config.id,
                    type: config.type,
                    solved: false,
                    puzzle: window.App.puzzles[config.id % window.App.puzzles.length]
                });
            } else {
                // Store prop locks for visual syncing
                if(!this.propLocks) this.propLocks = [];
                this.propLocks.push({
                     container: lockData.container,
                     id: config.id,
                     type: config.type
                });
            }
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
         // Separate the Lid - STRAIGHT UP and DISAPPEAR
         window.TWEEN.to(this.lidGroup.position, { 
             y: this.lidGroup.position.y + 12, 
             duration: 3.0, 
             ease: "cubic.out",
             onComplete: () => { this.lidGroup.visible = false; }
         });
         
         // Scale down lid to vanish
         window.TWEEN.to(this.lidGroup.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 2.5, delay: 0.5, ease: "expo.in" });

         // Also move/hide Digit Lock (since it's physically on the lid)
         const digitLock = window.App.state.locks.find(l => l.type === 'digit');
         if(digitLock) {
             window.TWEEN.to(digitLock.container.position, { 
                 y: digitLock.container.position.y + 12, 
                 duration: 3.0, 
                 ease: "cubic.out",
                 onComplete: () => { digitLock.container.visible = false; }
             });
             window.TWEEN.to(digitLock.container.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 2.5, delay: 0.5, ease: "expo.in" });
         }

         // Light Up
         window.TWEEN.to(this.innerLight, { intensity: 8, duration: 1.5, ease: "linear" });
         
    }
    
    pulse() {
        window.TWEEN.to(this.group.scale, {x: 1.1, y: 1.1, z: 1.1, duration: 0.4, yoyo: true, repeat: 5});
    }
}