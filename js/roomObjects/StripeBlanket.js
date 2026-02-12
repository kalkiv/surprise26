window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.StripeBlanket = class StripeBlanket {
    constructor() {
        this.mesh = null;
        this.init();
    }

    init() {
        // Changed to Grid Pattern: Yellow base, Thin White stripes
        // Base texture
        const baseTex = window.App.Utils.TextureFactory.createGridPattern('#FFD700', '#FFFFFF'); 

        // Create variations for correct aspect ratio mapping (Square tiles)
        // Density goal: approx 1 repeat per 4 units.
        
        // 1. Top (12 x 38.5) 
        // Target: Larger squares (approx 8 units size). Texture is 2x2 grid per repeat.
        // X: 1.5 squares -> 0.75 Repeat
        // Z: 4.8 squares -> 2.4 Repeat
        const texTop = baseTex.clone();
        texTop.repeat.set(0.75, 2.4);
        texTop.needsUpdate = true;
        const matTop = new THREE.MeshStandardMaterial({ map: texTop, roughness: 0.9 });

        // 2. Bevels (12 x 1)
        // X: 0.75 Repeat
        // Y: (1/8) = 0.125 squares -> 0.0625 Repeat
        const texBevel = baseTex.clone();
        texBevel.repeat.set(0.75, 0.0625);
        texBevel.needsUpdate = true;
        const matBevel = new THREE.MeshStandardMaterial({ map: texBevel, roughness: 0.9 });

        // 3. Drapes (12 x 6)
        // X: 0.75 Repeat
        // Y: (6/8) = 0.75 squares -> 0.375 Repeat
        const texDrape = baseTex.clone();
        texDrape.repeat.set(0.75, 0.375);
        texDrape.needsUpdate = true;
        const matDrape = new THREE.MeshStandardMaterial({ map: texDrape, roughness: 0.9 });
        
        // Group for draping
        this.mesh = new THREE.Group();

        // Top Part (Matches Bed Width 38.5 - Layered)
        const top = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 38.5), matTop);
        top.position.set(0, 0, 0);
        top.castShadow = true;
        top.receiveShadow = true;
        this.mesh.add(top);

        // 45-degree Bevels
        const bevelGeo = new THREE.BoxGeometry(12, 0.5, 1);
        
        const leftBevel = new THREE.Mesh(bevelGeo, matBevel);
        leftBevel.position.set(0, -0.35, 19.8); // Shifted out to avoid overlap (Flower is 19.35)
        leftBevel.rotation.x = Math.PI / 4; 
        leftBevel.castShadow = true; 
        leftBevel.receiveShadow = true;
        this.mesh.add(leftBevel);

        const rightBevel = new THREE.Mesh(bevelGeo, matBevel);
        rightBevel.position.set(0, -0.35, -19.8);
        rightBevel.rotation.x = -Math.PI / 4; 
        rightBevel.castShadow = true;
        rightBevel.receiveShadow = true;
        this.mesh.add(rightBevel);

        // Side Drapes
        const drapeGeo = new THREE.BoxGeometry(12, 6, 0.5);
        
        const left = new THREE.Mesh(drapeGeo, matDrape);
        left.position.set(0, -3.7, 20.4); // Shifted out (Flower max Z is ~19.95)
        left.castShadow = true;
        left.receiveShadow = true;
        this.mesh.add(left);

        const right = new THREE.Mesh(drapeGeo, matDrape);
        right.position.set(0, -3.7, -20.4);
        right.castShadow = true;
        right.receiveShadow = true;
        this.mesh.add(right);
    }
};