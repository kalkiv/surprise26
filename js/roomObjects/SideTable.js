window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.SideTable = class SideTable {
    constructor() {
        this.group = new THREE.Group();
        this.init();
    }

    init() {
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x090909, roughness: 0.6 });
        
        // Main Body (Hollow / Open Front)
        // Revised Dims: 14 deep(X), 14 tall(Y), 14 wide(Z) [Was 18 wide]
        
        const bodyGroup = new THREE.Group();
        this.group.add(bodyGroup);
        
        // 1. Top Plate
        const top = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 14), woodMat);
        top.position.set(0, 13.5, 0);
        top.castShadow = true; top.receiveShadow = true;
        bodyGroup.add(top);
        
        // 2. Bottom Plate
        const bot = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 14), woodMat);
        bot.position.set(0, 0.5, 0);
        bot.castShadow = true; bot.receiveShadow = true;
        bodyGroup.add(bot);
        
        // 3. Back Plate (X-)
        // At X=-6.5. Dims: 1 thick, 14 high, 14 wide.
        const back = new THREE.Mesh(new THREE.BoxGeometry(1, 14, 14), woodMat);
        back.position.set(-6.5, 7, 0);
        back.castShadow = true; back.receiveShadow = true;
        bodyGroup.add(back);
        
        // 4. Left Plate (Z+)
        // At Z=6.5. Dims: 14 deep, 14 high, 1 thick.
        const left = new THREE.Mesh(new THREE.BoxGeometry(14, 14, 1), woodMat);
        left.position.set(0, 7, 6.5);
        left.castShadow = true; left.receiveShadow = true;
        bodyGroup.add(left);
        
        // 5. Right Plate (Z-)
        const right = new THREE.Mesh(new THREE.BoxGeometry(14, 14, 1), woodMat);
        right.position.set(0, 7, -6.5);
        right.castShadow = true; right.receiveShadow = true;
        bodyGroup.add(right);

        // 6. Front Frame (To cover gaps around drawers)
        // Hole width (between side plates) is 12 (6.5 - -6.5 = 13, minus wall thicknesses 0.5+0.5 = 12).
        // Drawers are 10 wide.
        // Strips at Z=5.25 and Z=-5.25. (6 - 0.75 = 5.25)
        
        // Left Strip
        const fLeft = new THREE.Mesh(new THREE.BoxGeometry(1, 14, 1.5), woodMat); // X=1 thick, H=14, W=1.5
        fLeft.position.set(7.5, 7, 5.25); 
        fLeft.castShadow = true; fLeft.receiveShadow = true;
        bodyGroup.add(fLeft);
        
        // Right Strip
        const fRight = new THREE.Mesh(new THREE.BoxGeometry(1, 14, 1.5), woodMat);
        fRight.position.set(7.5, 7, -5.25);
        fRight.castShadow = true; fRight.receiveShadow = true;
        bodyGroup.add(fRight);
        
        // Middle Strip (Between drawers)
        // Top Bar
        const fTop = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 10), woodMat);
        fTop.position.set(7.5, 13.25, 0);
        bodyGroup.add(fTop);
        
        // Mid Bar
        const fMid = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 10), woodMat);
        fMid.position.set(7.5, 7.0, 0); 
        bodyGroup.add(fMid);
        
        // Bot Bar
        const fBot = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 10), woodMat);
        fBot.position.set(7.5, 0.75, 0);
        bodyGroup.add(fBot);
        
        // Drawers Logic
        // Face Dims: 1 thick (X), 5 high (Y), 10 wide (Z) [Was 14]
        const knobGeo = new THREE.SphereGeometry(0.5);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
        
        const createDrawer = () => {
             const grp = new THREE.Group();
             
             // --- FACE (Dark Wood) ---
             const face = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 10), woodMat);
             face.castShadow = true;
             face.receiveShadow = true;
             // Mark face for Raycaster
             face.userData = { parentDrawer: grp };
             grp.add(face);
             
             // --- KNOB ---
             const knob = new THREE.Mesh(knobGeo, knobMat);
             knob.position.set(0.7, 0, 0);
             knob.userData = { parentDrawer: grp };
             grp.add(knob);
             
             // --- INTERIOR BOX (Lighter Wood) ---
             const depth = 12;
             const width = 8.8; // Reduced width (was 12.8)
             const height = 4; 
             
             // Use double-sided material just in case of culling
             const lightWoodMat = new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.8, side: THREE.DoubleSide });

             // Bottom (Base)
             const base = new THREE.Mesh(new THREE.BoxGeometry(depth, 0.5, width), lightWoodMat);
             base.position.set(-0.5 - depth/2, -2.0, 0);
             base.userData = { parentDrawer: grp };
             grp.add(base);
             
             // Back Wall
             const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, height, width), lightWoodMat);
             back.position.set(-0.5 - depth, 0, 0); 
             back.userData = { parentDrawer: grp };
             grp.add(back);
             
             // Left Wall (Z+)
             const left = new THREE.Mesh(new THREE.BoxGeometry(depth, height, 0.5), lightWoodMat);
             left.position.set(-0.5 - depth/2, 0, width/2);
             left.userData = { parentDrawer: grp };
             grp.add(left);
             
             // Right Wall (Z-)
             const right = new THREE.Mesh(new THREE.BoxGeometry(depth, height, 0.5), lightWoodMat);
             right.position.set(-0.5 - depth/2, 0, -width/2);
             right.userData = { parentDrawer: grp };
             grp.add(right);
             
             return grp;
        };

        // Top Drawer Group
        this.topDrawerGroup = createDrawer();
        this.topDrawerGroup.position.set(7.5, 10, 0);
        this.topDrawerGroup.userData = { isDrawer: true, isOpen: false, originalX: 7.5 }; 
        this.group.add(this.topDrawerGroup);
        
        // Bottom Drawer Group
        this.botDrawerGroup = createDrawer();
        this.botDrawerGroup.position.set(7.5, 4, 0);
        this.botDrawerGroup.userData = { isDrawer: true, isOpen: false, originalX: 7.5 };
        
        // --- BOX CUTTER PROP ---
        // Matching CardboardBox.js design
        const cutter = new THREE.Group();
        
        // Handle (Values from PackageScene logic)
        const handleGeo = new THREE.BoxGeometry(2, 0.5, 0.5);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Dark Grey
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.x = -1.0; // Centered relative to group origin
        // Tagging
        handle.userData = { isCutterProp: true, parentDrawer: this.botDrawerGroup };
        cutter.add(handle);
        
        // Blade
        const bladeGeo = new THREE.BoxGeometry(1.5, 0.2, 0.02);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.x = 1.0; // Extends out
        blade.position.y = -0.1;
        // Tagging
        blade.userData = { isCutterProp: true, parentDrawer: this.botDrawerGroup };
        cutter.add(blade);
        
        // Pos: Centered in Drawer
        // Drawer Depth 12 (X goes -0.5 to -12.5). Center X ~ -6.5.
        // Drawer Width 8.8. Center Z = 0.
        // Height: Base at -2. Rest on top (~ -1.75).
        cutter.position.set(-6, -1.75, 0);
        
        // Add hit volume for easier clicking
        const hitGeo = new THREE.BoxGeometry(4, 1, 2);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitMesh = new THREE.Mesh(hitGeo, hitMat);
        hitMesh.userData = { isCutterProp: true, parentDrawer: this.botDrawerGroup };
        cutter.add(hitMesh);

        this.botDrawerGroup.add(cutter);

        this.group.add(this.botDrawerGroup);
    }
};