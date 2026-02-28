window.App = window.App || {};
window.App.Locks = window.App.Locks || {};

window.App.Locks.ScrewLock = class {
    constructor() {
        this.mesh = new THREE.Group();
        this.createMesh();
    }

    createMesh() {
        const headGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.1, roughness: 0.5 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.rotation.x = Math.PI / 2; 
        this.mesh.add(head);

        const shaftGeo = new THREE.CylinderGeometry(0.25, 0.25, 3.0, 12);
        const shaft = new THREE.Mesh(shaftGeo, headMat);
        shaft.rotation.x = Math.PI / 2; 
        shaft.position.z = -1.6; 
        this.mesh.add(shaft);
        
        const slotGeo = new THREE.BoxGeometry(0.8, 0.15, 0.1);
        const slotMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const slot = new THREE.Mesh(slotGeo, slotMat);
        slot.position.z = 0.11; 
        this.mesh.add(slot); 

        const hitboxGeo = new THREE.SphereGeometry(1.0);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitbox.userData = { isLock: true, type: 'SCREW' };
        this.mesh.add(hitbox); 
    }

    animateSolve(containerCallback) {
        if(window.App.music) window.App.music.playSFX('screw'); // SFX

        // Using GSAP or TWEEN (Assuming window.TWEEN from examples)
        // Also assuming TWEEN is available globally or via window.App.TWEEN?
        // Other files use window.TWEEN.
        
        const m = this.mesh;
        
        // Rotation
        new window.TWEEN.Tween(m.rotation)
            .to({ z: Math.PI * 4 }, 1500)
            .easing(window.TWEEN.Easing.Quadratic.InOut)
            .start();

        // Position (Pull out)
        new window.TWEEN.Tween(m.position)
            .to({ z: m.position.z + 5 }, 1500)
            .easing(window.TWEEN.Easing.Quadratic.In)
            .onComplete(() => {
                 m.visible = false;
                 if(containerCallback) containerCallback();
            })
            .start();
            
        // Scale out at end
        new window.TWEEN.Tween(m.scale)
            .to({ x:0, y:0, z:0 }, 500)
            .delay(1000)
            .start();
    }
};