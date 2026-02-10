// LockFactory
window.App = window.App || {};

window.App.LockFactory = {
    createLock(type, config, shape, centerOffset, extrudeSettings) {
        let container = new THREE.Group();
        let normal = null;

        // --- POSITIONING LOGIC ---
        if (type === 'heart') {
            // PERIMETER LOCKS 
            const t = config.t;
            let pt2;
            
            if(config.id === 0) {
                 pt2 = new THREE.Vector2(5, 19);
                 normal = new THREE.Vector2(0, 1);
            } else {
                 pt2 = shape.getPointAt(t);
                 const tangent = shape.getTangentAt(t);
                 normal = new THREE.Vector2(-tangent.y, tangent.x).normalize();
            }

            let lx = -(pt2.x + centerOffset.x);
            let ly = -(pt2.y + centerOffset.y);
            
            const nx = -normal.x;
            const ny = -normal.y;
            normal.set(nx, ny);
            
            const wx = lx;
            const wy = 0; 
            const wz = -ly;
            
            container.position.set(wx, wy, wz);
            
            const target = new THREE.Vector3(wx + normal.x, wy, wz - normal.y);
            container.up.set(0, 1, 0); 
            container.lookAt(target);

        } else if (type === 'screw') {
            // FACE LOCKS (Bottom Underside)
            const x = config.x || 0;
            const y = config.y || 0;
            const depth = (extrudeSettings && extrudeSettings.depth) ? extrudeSettings.depth : 4;
            const bevel = (extrudeSettings && extrudeSettings.bevelEnabled) ? (extrudeSettings.bevelThickness || 0) : 0;
            
            // Total Thickness = depth + 2*bevel
            // Geometry Centered -> Z extends from -(depth/2 + bevel) to +(depth/2 + bevel).
            // Rotated X -90 -> Z axis becomes -Y axis.
            // So Bottom Face is at World Y = -(depth/2 + bevel).
            
            const totalHalfDepth = (depth / 2) + bevel;
            const yHeight = -totalHalfDepth - 0.15; // Flush on surface
            
            container.position.set(x, yHeight, y); 
            
            // Orientation: Screw Head (faces Z) must face DOWN (-Y).
            container.rotation.x = Math.PI / 2; 
        } else if (type === 'tape') {
             const x = config.x || 0;
             const y = config.y || 0;
             const depth = (extrudeSettings && extrudeSettings.depth) ? extrudeSettings.depth : 4;
             const bevel = (extrudeSettings && extrudeSettings.bevelEnabled) ? (extrudeSettings.bevelThickness || 0) : 0;
             const totalHalfDepth = (depth / 2) + bevel;
             
             // Slightly below screw head
             const yHeight = -totalHalfDepth - 0.3; 
             container.position.set(x, yHeight, y);
             container.rotation.x = Math.PI / 2;
        } else if (type === 'digit') {
            // TOP of the box
            // Lid Group Y is 1.25. Extrusion is centered, height 1.5.
            // Half height 0.75. 1.25 + 0.75 = 2.0.
            // Plus bevels? Let's try constant 2.8 for top surface.
            container.position.set(config.x || 0, 2.8, config.y || 0);
            // Lock is modeled flat in XZ plane, so no rotation needed if Y is up.
        }
        
        // --- INSTANTIATION ---
        let lockInstance;
        if (type === 'heart') {
            lockInstance = new window.App.HeartLock();
        } else if (type === 'screw') {
            lockInstance = new window.App.ScrewLock();
        } else if (type === 'tape') {
            lockInstance = new window.App.TapeLock();
        } else if (type === 'digit') {
            lockInstance = new window.App.DigitLock(config.solution);
        }
        
        const lockGroup = lockInstance.mesh;
        
        // --- EXTRAS ---
        if (type === 'heart') {
            const stickLen = 1.0;
            const stickGeo = new THREE.CylinderGeometry(0.12, 0.12, stickLen, 8);
            const stickMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const stick = new THREE.Mesh(stickGeo, stickMat);
            stick.rotation.x = Math.PI / 2; 
            stick.position.z = stickLen / 2; 
            container.add(stick);
            
            lockGroup.position.z = 0.6; 
            lockGroup.position.y = 0; 
            lockGroup.rotation.z = (Math.random() - 0.5) * 0.1;
             
             // Store base wobble
             lockGroup.userData.baseZ = lockGroup.rotation.z;
             
             // Store Sway Factor based on Normal (-nx)
             // Normal is already calculated above.
             lockGroup.userData.swayFactor = (normal) ? -normal.x : 0;
        } else if (type === 'tape') {
            // Random orientation for messy tape look
            lockGroup.rotation.z = (Math.random() - 0.5) * 0.5;
        }

        // ID assignment
        const hitbox = lockGroup.children.find(c => c.userData.isLock);
        if(hitbox) hitbox.userData.id = config.id;

        container.add(lockGroup);
        
        return {
            container: container,
            instance: lockInstance,
            mesh: lockGroup
        };
    }
};