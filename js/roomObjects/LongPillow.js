window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.LongPillow = class LongPillow {
    constructor() {
        this.group = new THREE.Group();
        this.mesh = null;
        this.init();
    }

    init() {
        // Dims: 3 thick, 10 high, 36 wide
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(3, 10, 36), 
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
        );
        // Offset Y by half height (5) so group origin is at bottom
        this.mesh.position.y = 5;
        this.group.add(this.mesh);
    }
};
