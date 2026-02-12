window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.SquarePillow = class SquarePillow {
    constructor() {
        this.group = new THREE.Group();
        this.mesh = null;
        this.init();
    }

    init() {
        // Dims: 3 thick, 10 high, 12 wide
        const yellowMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.8 });
        const sqPillowGeo = new THREE.BoxGeometry(3, 10, 12);
        this.mesh = new THREE.Mesh(sqPillowGeo, yellowMat);
        // Offset Y by half height (5)
        this.mesh.position.y = 5;
        this.group.add(this.mesh);
    }
};
