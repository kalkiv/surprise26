window.App = window.App || {};

window.App.CardboardBox = class CardboardBox {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // State
        this.isOpen = false;
        this.isRemoved = false;
        this.isTaped = true; // New state
        this.flaps = [];

        this.init();
    }

    init() {
        // Dimensions
        const boxW = 26;
        const boxH = 16;
        const boxD = 26;

        // Material
        const cardboardMat = new THREE.MeshStandardMaterial({ 
            color: 0xcdb79e, 
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        // Main Body Group (Offset to center around HeartBox)
        this.bodyGroup = new THREE.Group();
        this.bodyGroup.position.y = 2; 
        this.group.add(this.bodyGroup);

        // Bottom
        const bottomGeo = new THREE.PlaneGeometry(boxW, boxD);
        const bottomMesh = new THREE.Mesh(bottomGeo, cardboardMat);
        bottomMesh.rotation.x = -Math.PI / 2;
        bottomMesh.position.y = -boxH / 2;
        bottomMesh.receiveShadow = true;
        this.bodyGroup.add(bottomMesh);

        // Sides
        const sideGeoFB = new THREE.PlaneGeometry(boxW, boxH);
        const sideGeoLR = new THREE.PlaneGeometry(boxD, boxH);

        const front = new THREE.Mesh(sideGeoFB, cardboardMat);
        front.position.z = boxD / 2;
        front.receiveShadow = true;
        front.castShadow = true;
        this.bodyGroup.add(front);

        const back = new THREE.Mesh(sideGeoFB, cardboardMat);
        back.position.z = -boxD / 2;
        back.rotation.y = Math.PI;
        back.receiveShadow = true;
        back.castShadow = true;
        this.bodyGroup.add(back);

        const left = new THREE.Mesh(sideGeoLR, cardboardMat);
        left.position.x = -boxW / 2;
        left.rotation.y = -Math.PI / 2;
        left.receiveShadow = true;
        left.castShadow = true;
        this.bodyGroup.add(left);

        const right = new THREE.Mesh(sideGeoLR, cardboardMat);
        right.position.x = boxW / 2;
        right.rotation.y = Math.PI / 2;
        right.receiveShadow = true;
        right.castShadow = true;
        this.bodyGroup.add(right);

        // Invisible Hitbox
        const hitGeo = new THREE.BoxGeometry(boxW, boxH, boxD);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.userData = { isCardboard: true };
        this.bodyGroup.add(hitMesh);

        // Flaps (Front/Back)
        const flapWidth = boxD / 2; // Extension (13)
        const flapLength = boxW;    // Hinge Width (26)
        const flapGeo = new THREE.PlaneGeometry(flapLength, flapWidth - 0.2);

        const flapConfigs = [
            // Front Flap: Pivot +Z. OpenDir 1 (Up/Out)
            { name: 'front', x: 0, z: boxD/2, rotY: 0, openDir: 1 },
            // Back Flap: Pivot -Z. OpenDir -1 (Up/Out)
            { name: 'back', x: 0, z: -boxD/2, rotY: Math.PI, openDir: -1 }
        ];

        flapConfigs.forEach(conf => {
            const pivot = new THREE.Group();
            pivot.position.set(conf.x, boxH / 2, conf.z);
            pivot.rotation.y = conf.rotY;

            const mesh = new THREE.Mesh(flapGeo, cardboardMat);
            mesh.position.y = 0;
            // Shift so edge is at pivot. Extends Inwards.
            // For Front (RotY 0): Local -Z is Inward.
            // For Back (RotY 180): Local -Z is Inward.
            mesh.position.z = -(flapWidth - 0.2) / 2; 
            mesh.rotation.x = -Math.PI / 2;

            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = { isCardboard: true };

            pivot.add(mesh);
            this.bodyGroup.add(pivot);

            this.flaps.push({ pivot, conf, mesh });
        });

        // Tape on Flaps (Visual detail on flaps themselves)
        const tapeMat = new THREE.MeshBasicMaterial({ color: 0x8b7355 });
        const tapeStripGeo = new THREE.PlaneGeometry(flapLength, 2);
        const extMag = flapWidth - 0.2;

        // Front Tape
        const tF = new THREE.Mesh(tapeStripGeo, tapeMat);
        tF.position.z = 0.02; 
        tF.position.y = -extMag / 2 + 1; // Tip
        this.flaps[0].mesh.add(tF);

        // Back Tape
        const tB = new THREE.Mesh(tapeStripGeo, tapeMat);
        tB.position.z = 0.02;
        tB.position.y = -extMag / 2 + 1; // Tip
        this.flaps[1].mesh.add(tB);

        // --- SEALING TAPE (The obstruction) ---
        // This tape goes across the middle seam (Z=0, Y=boxH/2)
        // Length = boxW (Matched to edge). Width = 4.
        const sealingTapeGeo = new THREE.PlaneGeometry(boxW, 4);
        const sealingTapeMat = new THREE.MeshStandardMaterial({ 
            color: 0x9c8266, // Slightly lighter or diff color
            roughness: 0.9,
            metalness: 0.1,
            transparent: true,
            opacity: 0.9
        });
        
        this.sealingTape = new THREE.Mesh(sealingTapeGeo, sealingTapeMat);
        this.sealingTape.rotation.x = -Math.PI / 2;
        this.sealingTape.position.set(0, boxH / 2 + 0.05, 0); // Sit on top
        
        this.sealingTape.userData = { isSealingTape: true }; // Identification for Raycast
        this.bodyGroup.add(this.sealingTape);

        // --- KNIFE MESH (For Animation) ---
        this.knifeGroup = new THREE.Group();
        this.knifeGroup.visible = false;
        
        // 1. Main Handle Body (Red Plastic)
        const handleGeo = new THREE.BoxGeometry(2.5, 0.6, 0.5);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 }); // Red
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.set(-0.5, 0, 0);
        this.knifeGroup.add(handle);

        // 2. Black Rubber Grip (Middle/Rear)
        const gripGeo = new THREE.BoxGeometry(1.5, 0.65, 0.55); // Slightly larger than handle
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const grip = new THREE.Mesh(gripGeo, gripMat);
        grip.position.set(-1.0, 0, 0);
        this.knifeGroup.add(grip);

        // 3. Metal Blade Guide (Front Tip)
        const guideGeo = new THREE.BoxGeometry(0.8, 0.5, 0.15);
        const guideMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.4 });
        const guide = new THREE.Mesh(guideGeo, guideMat);
        guide.position.set(1.0, 0, 0); // Front of handle
        this.knifeGroup.add(guide);

        // 4. The Blade (Trapezoid Tip)
        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(0, 0);
        bladeShape.lineTo(1.2, 0); // Bottom edge
        bladeShape.lineTo(1.5, 0.4); // Sharp Tip
        bladeShape.lineTo(0, 0.4);   // Top edge
        bladeShape.lineTo(0, 0);     // Close

        const bladeSettings = { depth: 0.02, bevelEnabled: false };
        const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, bladeSettings);
        const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.9, roughness: 0.1 });
        const blade = new THREE.Mesh(bladeGeom, bladeMaterial);
        
        // Orient and position blade
        blade.position.set(0.5, -0.2, -0.01); // Center inside handle/guide
        this.knifeGroup.add(blade);

        // 5. Slider Knob (Top)
        const sliderGeo = new THREE.BoxGeometry(0.4, 0.2, 0.3);
        const sliderMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const knob = new THREE.Mesh(sliderGeo, sliderMat);
        knob.position.set(0.0, 0.35, 0);
        this.knifeGroup.add(knob);
        
        // Add to body group so it moves with box
        this.bodyGroup.add(this.knifeGroup);
    }

    setRotation(x, y) {
        if(this.isRemoved) return;
        this.group.rotation.x = x;
        this.group.rotation.y = y;
    }

    checkClick(raycaster) {
        if(this.isOpen || this.isRemoved) return false;

        // Only checking Cardboard hit for general click-to-open logic
        const intersects = raycaster.intersectObject(this.group, true);
        if(intersects.length > 0) {
            
            // IF TAPED, BLOCK OPENING
            if(this.isTaped) {
                // Shake box? Or Toolkit hint?
                window.App.UIManager.showToast("It's taped shut. Use a tool!");
                return true; // We handled the click
            }

            this.animateOpen();
            return true;
        }
        return false;
    }
    
    cutTape() {
        if(!this.isTaped) return;
        
        // Start Position (Left side of tape)
        // Tape length is boxW (26). Local X goes -13 to 13.
        
        this.knifeGroup.visible = true;
        this.knifeGroup.position.set(-15, 8.5, 0); // Start off edge, slightly above tape (Y=8)
        this.knifeGroup.rotation.z = -Math.PI / 8; // Angled down
        
        // Animate Cut Position: Sweeping motion (slow start/end)
        window.TWEEN.to(this.knifeGroup.position, {
            x: 15, // End off edge right
            duration: 0.8,
            ease: "power2.inOut", 
            onComplete: () => {
                this.knifeGroup.visible = false;
                this.isTaped = false;
                
                // Remove Tool from UI
                const toolEl = document.getElementById('tool-cutter');
                if(toolEl) {
                    toolEl.style.opacity = '0';
                    setTimeout(() => toolEl.remove(), 500);
                }

                // Remove Tape
                window.TWEEN.to(this.sealingTape.material, {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        this.sealingTape.visible = false;
                        // Auto Open Box
                        this.animateOpen();
                    }
                });
            }
        });

        // Animate Cut Rotation: Tilt blade into the cut
        window.TWEEN.to(this.knifeGroup.rotation, {
            z: -Math.PI / 4, // Steeper angle during cut
            duration: 0.8,
            ease: "power2.inOut"
        });
    }

    animateOpen() {
        if(this.isOpen) return;
        this.isOpen = true;

        const openAngle = Math.PI * 0.65;
        
        // Open Flaps
        this.flaps.forEach(item => {
            const targetRot = openAngle * item.conf.openDir;
            window.TWEEN.to(item.pivot.rotation, {
                x: targetRot,
                duration: 1.0,
                ease: "back.out"
            });
        });

        // Descend and Disable
        window.TWEEN.to(this.group.position, {
            y: -40,
            duration: 1.5,
            delay: 0.6,
            ease: "power2.in",
            onComplete: () => {
                this.group.visible = false;
                this.isRemoved = true;
                if(this.onOpenComplete) this.onOpenComplete();
            }
        });
    }
};