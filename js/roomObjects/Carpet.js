window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.Carpet = class Carpet {
    constructor() {
        this.group = new THREE.Group();
        this.init();
    }

    init() {
        // Fainter pink than #FF69B4 (HotPink). Using #FFC0CB (Pink) which is much lighter.
        // Or could go for #FFB6C1 (LightPink).
        const texture = window.App.Utils.TextureFactory.createFlowerPattern('#FFFFFF', '#FFC0CB'); 
        
        const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 });
        
        // Dimensions - Scaled 50% larger
        // Width (Z): 63 (42 * 1.5)
        // Length (X): 33 (22 * 1.5)
        // Height (Y): 0.4
        const geometry = new THREE.BoxGeometry(33, 0.4, 63);
        
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.receiveShadow = true;
        
        // Texture repeat adjustment if needed (Scaled by 1.5 to maintain pattern density)
        texture.repeat.set(3, 6); 
        
        this.group.add(mesh);
    }
};