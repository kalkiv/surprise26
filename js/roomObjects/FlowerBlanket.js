window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.FlowerBlanket = class FlowerBlanket {
    constructor() {
        this.mesh = null;
        this.init();
    }

    init() {
        const blanket1Tex = window.App.Utils.TextureFactory.createFlowerPattern('#FFFFFF', '#FF69B4', 73819); // White base, Pink flowers, fixed seed
        const blanket1Mat = new THREE.MeshStandardMaterial({ map: blanket1Tex, roughness: 0.9 });
        
        this.mesh = new THREE.Group();

        // Top Part (Matches Bed Width 38)
        const top = new THREE.Mesh(new THREE.BoxGeometry(15, 0.5, 38), blanket1Mat);
        top.position.set(0, 0, 0);
        top.castShadow = true;
        top.receiveShadow = true;
        this.mesh.add(top);

        // 45-degree Bevels (Smooth transition)
        const bevelGeo = new THREE.BoxGeometry(15, 0.5, 1);
        
        const leftBevel = new THREE.Mesh(bevelGeo, blanket1Mat);
        leftBevel.position.set(0, -0.35, 19.35); // Just off edge
        leftBevel.rotation.x = Math.PI / 4; // Tilt down outwards (Positive rot for Z+ side)
        leftBevel.castShadow = true; 
        leftBevel.receiveShadow = true;
        this.mesh.add(leftBevel);

        const rightBevel = new THREE.Mesh(bevelGeo, blanket1Mat);
        rightBevel.position.set(0, -0.35, -19.35);
        rightBevel.rotation.x = -Math.PI / 4; 
        rightBevel.castShadow = true;
        rightBevel.receiveShadow = true;
        this.mesh.add(rightBevel);

        // Side Drapes
        const drapeGeo = new THREE.BoxGeometry(15, 6, 0.5);
        
        const left = new THREE.Mesh(drapeGeo, blanket1Mat);
        left.position.set(0, -3.7, 19.7); // Shifted out and down
        left.castShadow = true;
        left.receiveShadow = true;
        this.mesh.add(left);

        const right = new THREE.Mesh(drapeGeo, blanket1Mat);
        right.position.set(0, -3.7, -19.7);
        right.castShadow = true;
        right.receiveShadow = true;
        this.mesh.add(right);
    }
};