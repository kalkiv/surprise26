window.App = window.App || {};

window.App.CardboardBox = class CardboardBox {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // State
        this.isOpen = false;
        this.isRemoved = false;
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

        // Tape
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
    }

    setRotation(x, y) {
        if(this.isRemoved) return;
        this.group.rotation.x = x;
        this.group.rotation.y = y;
    }

    checkClick(raycaster) {
        if(this.isOpen || this.isRemoved) return false;

        const intersects = raycaster.intersectObject(this.group, true);
        if(intersects.length > 0) {
            this.animateOpen();
            return true;
        }
        return false;
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
            }
        });
    }
};