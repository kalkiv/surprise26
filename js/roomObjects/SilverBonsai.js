window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.SilverBonsai = class SilverBonsai {
    constructor() {
        this.group = new THREE.Group();
        this.init();
    }

    init() {
        // Materials
        // Use lower metalness to prevent picking up too much warm room color (which makes it look brown/copper)
        // High lightness color + moderate metalness gives a "Silver" look in warm lighting
        const silverMat = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF, 
            metalness: 0.6, 
            roughness: 0.2,
        });

        const marbleMat = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.1, // Polished
            metalness: 0.1,
        });

        const heartMat = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            emissive: 0x222222,
            roughness: 0.5,
            flatShading: true 
        });

        // 1. White Marble Circle Base - Smaller (Radius 2)
        const baseGeo = new THREE.CylinderGeometry(2, 2, 0.4, 32);
        const base = new THREE.Mesh(baseGeo, marbleMat);
        base.position.y = 0.2;
        base.receiveShadow = true;
        base.castShadow = true;
        this.group.add(base);

        // 2. Trunk (Sculptural Silver)
        const trunkGroup = new THREE.Group();
        trunkGroup.position.y = 0.4;
        this.group.add(trunkGroup);

        // Curved Trunk Construction (Simulated with segments)
        // Base Trunk
        const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.5, 8), silverMat);
        t1.position.set(0, 0.75, 0);
        t1.rotation.z = 0.1; // Slight lean
        t1.castShadow = true;
        trunkGroup.add(t1);

        // Mid Trunk (Angling Left)
        const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.5, 8), silverMat);
        t2.position.set(-0.35, 2.0, 0); 
        t2.rotation.z = 0.4;
        t2.castShadow = true;
        trunkGroup.add(t2);

        // Top Trunk (Angling Right)
        const t3 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.2, 8), silverMat);
        t3.position.set(-0.3, 3.2, 0);
        t3.rotation.z = -0.3;
        t3.castShadow = true;
        trunkGroup.add(t3);

        // --- BRANCHES (Added more) ---

        // 1. Low Branch (Right) - Strong lower branch
        const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 1.6, 6), silverMat);
        b1.position.set(0.6, 1.5, 0);
        b1.rotation.z = -1.2; 
        b1.castShadow = true;
        trunkGroup.add(b1);
        
        // 2. Mid Branch (Left)
        const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 1.4, 6), silverMat);
        b2.position.set(-0.8, 2.8, 0);
        b2.rotation.z = 1.0;
        b2.castShadow = true;
        trunkGroup.add(b2);

        // 3. Mid-Back Branch (Depth) - New!
        const b3 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 1.2, 6), silverMat);
        b3.position.set(-0.2, 2.2, -0.5); // Behind
        b3.rotation.x = -1.0; // Pointing back
        b3.rotation.z = 0.5;
        b3.castShadow = true;
        trunkGroup.add(b3);

        // 4. Upper Right Branch - New!
        const b4 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 1.0, 6), silverMat);
        b4.position.set(0.2, 3.0, 0.0);
        b4.rotation.z = -0.8;
        b4.castShadow = true;
        trunkGroup.add(b4);

        // 3. Foliage Pads (Silver Clusters)
        // Bonsai pads are usually flattened spheres
        const padGeo = new THREE.SphereGeometry(1, 7, 6); 
        
        const createPad = (x, y, z, sX, sY, sZ) => {
            const pad = new THREE.Mesh(padGeo, silverMat);
            pad.position.set(x, y, z);
            pad.scale.set(sX, sY, sZ);
            pad.castShadow = true;
            return pad;
        };

        // Right Pad (Low)
        trunkGroup.add(createPad(1.5, 1.4, 0, 0.9, 0.4, 0.9));

        // Left Pad (Mid)
        trunkGroup.add(createPad(-1.5, 3.3, 0.2, 0.8, 0.35, 0.8));

        // Top Pad (Crown)
        trunkGroup.add(createPad(0.1, 4.0, 0, 1.1, 0.5, 1.1));

        // Back Pad (Depth)
        trunkGroup.add(createPad(-0.3, 2.6, -1.0, 0.7, 0.3, 0.7));

        // Upper Right Pad (New)
        trunkGroup.add(createPad(0.8, 3.4, 0.1, 0.6, 0.3, 0.6));


        // 4. White Geometric Heart on Trunk
        // Shape Extrusion (Reverted to Smooth Curves)
        const shape = new THREE.Shape();
        const x = 0, y = 0;
        shape.moveTo(x + 0.25, y + 0.25);
        shape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.20, y, x, y);
        shape.bezierCurveTo(x - 0.30, y, x - 0.30, y + 0.35, x - 0.30, y + 0.35);
        shape.bezierCurveTo(x - 0.30, y + 0.55, x - 0.10, y + 0.77, x + 0.25, y + 0.95);
        shape.bezierCurveTo(x + 0.60, y + 0.77, x + 0.80, y + 0.55, x + 0.80, y + 0.35);
        shape.bezierCurveTo(x + 0.80, y + 0.35, x + 0.80, y, x + 0.50, y);
        shape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);

        const extrudeSettings = { depth: 0.2, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
        const heartGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        
        // Center the geometry so rotation pivots around center
        heartGeo.center();

        const heart = new THREE.Mesh(heartGeo, heartMat);
        
        // Position
        heart.position.set(0.1, 1.5, 0.4); 
        
        // Flip Upside Down check:
        // Shape draws from (0,0) going UP to Y=0.95.
        // So Point is at Bottom. (Standard Upright Heart).
        // If user wants it standard, rotation 0 should work.
        // User previously complained "flipped upside down" when I had rotation -0.1 on this shape.
        // So maybe they saw it inverted?
        // I will rotate Math.PI (180 deg) just in case they prefer the Point UP or if Extrude behaves oddly.
        // Actually, let's stick to the previous fix that satisfied them before I changed to geo mode.
        // Previous successful state: rotated Math.PI - 0.1.
        heart.rotation.z = Math.PI - 0.1;
        
        // Scale: Slightly smaller (1.4)
        heart.scale.set(1.4, 1.4, 1.4);
        heart.castShadow = true;
        
        trunkGroup.add(heart);
    }
};