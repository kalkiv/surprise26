// TapeLock
window.App = window.App || {};

window.App.TapeLock = class {
    constructor() {
        this.mesh = new THREE.Group();
        this.createMesh();
    }

    createMesh() {
        // Even larger strip to ensure full coverage
        const width = 3.5;
        const height = 2.2;
        const geo = new THREE.BoxGeometry(width, height, 0.05);
        
        // Setup Pivot for Peeling Effect
        // We want pivot at Left Edge (x = -width/2).
        // Geometry is centered. We need to translate geometry +width/2 so origin is at Left Edge.
        geo.translate(width / 2, 0, 0); 
        // Now (0,0,0) of geometry corresponds to Left Edge. Center is at (+1.5, 0, 0).
        
        // Color: Same as box, slightly translucent
        const boxColor = (window.App.CONFIG && window.App.CONFIG.colors) ? window.App.CONFIG.colors.heart : 0xff69b4;
        
        const mat = new THREE.MeshStandardMaterial({ 
            color: boxColor, 
            roughness: 0.9, 
            opacity: 0.9, // Slightly translucent
            transparent: true, 
            side: THREE.DoubleSide,
            depthWrite: false // Helps with transparency render order sometimes
        });
        
        this.tapeMesh = new THREE.Mesh(geo, mat);
        
        // Create a Pivot Group to hold the tape
        this.pivotGroup = new THREE.Group();
        // Position Pivot Group at the visual Left Edge calculated relative to the Lock center.
        // Lock Center (0,0) -> We want visual tape center at (0,0).
        // Tape Geo Origin is at Left Edge.
        // Start of Tape (Left Edge) should be at x = -1.5 relative to Lock Center.
        this.pivotGroup.position.set(-width / 2, 0, 0);
        
        this.pivotGroup.add(this.tapeMesh);
        this.mesh.add(this.pivotGroup);

        // Hitbox usually slightly smaller than visual or same? 
        // Let's keep it same to ensure easy clicking.
        const hitboxGeo = new THREE.BoxGeometry(width, height, 0.2);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitbox.userData = { isLock: true };
        this.mesh.add(hitbox);
    }

    animateSolve(containerCallback) {
        // "Peel off" animation: Rotate around the pivot (Left Edge)
        // Tape lies on XY plane (local). Z is up.
        // Rotate around Y axis to peel the strip off the surface (which is XY).
        
        const targetRotY = -Math.PI / 1.5; // Peel back 120 degrees
        
        // 1. Peel Phase: Unpeeled side (pivot) stays, other side lifts.
        window.TWEEN.to(this.pivotGroup.rotation, { 
            y: targetRotY, 
            duration: 0.8, 
            ease: "circ.out" 
        });
        
        // 2. Detach Phase: Move entire mesh away
        const m = this.mesh;
        window.TWEEN.to(m.position, { 
            y: m.position.y + 10,  // Move "Up" (which is mostly +Y world here, or relative)
            x: m.position.x - 5,   // Move Left (in direction of peel)
            duration: 0.6, 
            delay: 0.6, 
            ease: "power2.in" 
        });
        
        window.TWEEN.to(m.scale, { x: 0, y: 0, z: 0, duration: 0.4, delay: 1.0 });
        
        if (containerCallback) {
            setTimeout(containerCallback, 1200);
        }
    }
}
