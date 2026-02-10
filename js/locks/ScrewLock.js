// ScrewLock
window.App = window.App || {};

window.App.ScrewLock = class {
    constructor() {
        this.mesh = new THREE.Group();
        this.createMesh();
    }

    createMesh() {
        // Screw Head (Lower metalness to be visible in shadow/ambient light)
        const headGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.1, roughness: 0.5 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.rotation.x = Math.PI / 2; 
        this.mesh.add(head);

        // Shaft (Thread)
        // Extends behind the head (along -Z relative to head orientation, which matches -Y world if head faces world -Y? No.)
        // Ensure shaft is behind the head locally.
        const shaftGeo = new THREE.CylinderGeometry(0.25, 0.25, 3.0, 12);
        // Use darker grey for shaft to distinguish or textured? Same material is fine.
        const shaft = new THREE.Mesh(shaftGeo, headMat);
        shaft.rotation.x = Math.PI / 2; 
        shaft.position.z = -1.6; // Head is at 0 (thickness 0.2, back at -0.1). Shaft length 3. Center at -1.5 - 0.1?
        this.mesh.add(shaft);
        
        // Add spiraling thread visual (simple rings)?
        // Let's stick to simple shaft for now unless requested detailed.

        // Slot
        const slotGeo = new THREE.BoxGeometry(0.8, 0.15, 0.1);
        const slotMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const slot = new THREE.Mesh(slotGeo, slotMat);
        slot.position.z = 0.11; 
        this.mesh.add(slot); 

        const hitboxGeo = new THREE.SphereGeometry(1.0);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitbox.userData = { isLock: true };
        this.mesh.add(hitbox); 
    }

    animateSolve(containerCallback) {
        const m = this.mesh;
        window.TWEEN.to(m.rotation, { z: Math.PI * 4, duration: 1.5, ease: "power1.inOut" });
        window.TWEEN.to(m.position, { z: m.position.z + 5, duration: 1.5, ease: "power1.in" }); 
        window.TWEEN.to(m.scale, { x: 0, y: 0, z: 0, duration: 0.5, delay: 1.5 });
        
        if (containerCallback) {
            setTimeout(containerCallback, 1500);
        }
    }
}