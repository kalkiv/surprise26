// HeartLock
window.App = window.App || {};

window.App.HeartLock = class {
    constructor() {
        this.mesh = new THREE.Group();
        this.createMesh();
    }

    createMesh() {
        const lockShape = new THREE.Shape();
        lockShape.moveTo(0, -0.5); 
        lockShape.bezierCurveTo(0, -0.2, -0.8, 0.3, -0.8, 0.8);
        lockShape.bezierCurveTo(-0.8, 1.3, -0.2, 1.4, 0, 1.0);
        lockShape.bezierCurveTo(0.2, 1.4, 0.8, 1.3, 0.8, 0.8);
        lockShape.bezierCurveTo(0.8, 0.3, 0, -0.2, 0, -0.5);
        
        const lockExtrude = { depth: 0.4, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.1, bevelThickness: 0.1 };
        const bodyGeo = new THREE.ExtrudeGeometry(lockShape, lockExtrude);
        bodyGeo.center(); 
        // Pivot Adjustment: We want (0,0,0) to be at the top of shackle gap.
        // Original Geometry: Body center ~0. Shackle Center 0.8. Top of shackle gap ~1.1.
        // Shift everything DOWN by 1.1.
        const pivotOffset = -1.1; 
        
        bodyGeo.translate(0, pivotOffset, 0);

        const bodyMat = new THREE.MeshStandardMaterial({ color: window.App.CONFIG.colors.lock, metalness: 0.6, roughness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.castShadow = true;
        this.mesh.add(body);

        const shackleGeo = new THREE.TorusGeometry(0.4, 0.1, 8, 20, Math.PI);
        const shackleMat = new THREE.MeshStandardMaterial({ color: window.App.CONFIG.colors.lockRing, metalness: 0.8, roughness: 0.2 });
        const shackle = new THREE.Mesh(shackleGeo, shackleMat);
        shackle.position.y = 0.8 + pivotOffset; 
        shackle.position.z = 0;
        this.mesh.add(shackle); 

        const holeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.rotation.x = Math.PI / 2;
        hole.position.z = 0.22;
        hole.position.y = 0.2 + pivotOffset; 
        this.mesh.add(hole); 
        
        const hitboxGeo = new THREE.SphereGeometry(1.5);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitbox.userData = { isLock: true }; 
        this.mesh.add(hitbox); 
    }
    
    animateSolve(containerCallback) {
        const m = this.mesh;
        window.TWEEN.to(m.children[1].position, { y: 0.6, duration: 0.3 }); 
        window.TWEEN.to(m.rotation, { z: m.rotation.z + 1, duration: 0.5, delay: 0.3 });
        if (containerCallback) containerCallback();
    }

    updateGravity(boxFlipAngle, sway = 0) {
        const baseZ = (this.mesh.userData.baseZ || 0);
        const swayFactor = (this.mesh.userData.swayFactor !== undefined) ? this.mesh.userData.swayFactor : 1;
        
        // Combine Gravity Compensation + Inertial Sway (Scaled by position)
        // Global Sway Driver * Local Factor
        this.mesh.rotation.z = baseZ - boxFlipAngle + (sway * swayFactor);
    }
}
