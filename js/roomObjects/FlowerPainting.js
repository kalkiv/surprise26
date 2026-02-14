window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.FlowerPainting = class FlowerPainting {
    constructor() {
        this.group = new THREE.Group();
        this.init();
    }

    init() {
        // Frame
        const pSize = 24; 
        const frameThick = 2;
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.3, metalness: 0.8 });
        // Frame Box: 24x24x1
        const frame = new THREE.Mesh(new THREE.BoxGeometry(pSize, pSize, 1), frameMat);
        this.group.add(frame);
        
        // Canvas
        const canvasSize = pSize - 2*frameThick; // 20
        const artTex = window.App.Utils.TextureFactory.createSingleFlowerTex();
        // Use StandardMaterial so it reacts to light changes (dimming)
        const artMat = new THREE.MeshStandardMaterial({ 
            map: artTex,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(canvasSize, canvasSize), artMat);
        canvasMesh.position.z = 0.6; // Slightly in front of frame center
        this.group.add(canvasMesh);
    }
};