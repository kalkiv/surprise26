window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.MirrorGrid = class MirrorGrid {
    constructor() {
        this.group = new THREE.Group();
        this.init();
    }

    init() {
        const mirrorBorderMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2, emissive: 0x111111 });
        const mirrorGlassMat = new THREE.MeshStandardMaterial({ 
            color: 0xE8E8E8, // Lighter Silver
            roughness: 0.2,  // Slight roughness to show surface color
            metalness: 0.4   // Lower metalness to avoid "black mirror" effect without envMap
        }); 

        const mCols = 3;
        const mRows = 2;
        
        // Scaled Down Dims (12x18)
        const mWidth = 12; 
        const mHeight = 18; 
        
        for(let r=0; r<mRows; r++) { 
            for(let c=0; c<mCols; c++) { 
                const m = new THREE.Group();
                const xOff = (c - 1) * mWidth; 
                const yOff = (r - 0.5) * mHeight; 
                m.position.set(xOff, yOff, 0);
                
                // Border
                const border = new THREE.Mesh(new THREE.BoxGeometry(mWidth, mHeight, 1), mirrorBorderMat);
                border.castShadow = true;
                m.add(border);
                
                // Glass
                const glass = new THREE.Mesh(new THREE.BoxGeometry(mWidth - 1, mHeight - 1, 0.2), mirrorGlassMat);
                glass.position.z = 0.6; 
                m.add(glass);
                
                // Swipe Effect Mesh (Diagonal Line)
                const swipeGeo = new THREE.PlaneGeometry(mWidth * 1.5, 1); // Long thin strip
                const swipeMat = new THREE.MeshBasicMaterial({ 
                    color: 0xffffff, 
                    transparent: true, 
                    opacity: 0.0,
                    side: THREE.FrontSide
                });
                const swipeMesh = new THREE.Mesh(swipeGeo, swipeMat);
                swipeMesh.position.set(0, 0, 0.75); // Slightly in front of glass
                swipeMesh.rotation.z = Math.PI / 4; // 45 degrees
                swipeMesh.visible = false;
                m.add(swipeMesh);

                // Add metadata
                glass.userData = { isMirror: true, isBroken: false, swipeMesh: swipeMesh, parentGroup: m };

                this.group.add(m);
            }
        }
    }

    breakMirror(mirrorGroup) {
        // Find the glass mesh
        const glass = mirrorGroup.children.find(c => c.type === 'Mesh' && c.geometry.type === 'BoxGeometry' && c.userData.isMirror);
        if(!glass || glass.userData.isBroken) return false;

        glass.userData.isBroken = true;
        glass.visible = false; // Hide original

        // Create Broken Effect
        // 1. Dark backing (The wall/hole behind mirror)
        const gw = glass.geometry.parameters.width;
        const gh = glass.geometry.parameters.height;
        const backing = new THREE.Mesh(
            new THREE.PlaneGeometry(gw, gh),
            new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
        );
        backing.position.z = 0.55; // Moved forward to avoid Z-fighting with frame (Frame ends at 0.5)
        mirrorGroup.add(backing);

        // 2. Add Shards
        const shardMat = new THREE.MeshStandardMaterial({ 
            color: 0xC0C0C0, 
            roughness: 0.2, 
            metalness: 0.8,
            side: THREE.DoubleSide
        });

        // Create a few random jagged triangles
        for(let i=0; i<8; i++) {
            const shardGeo = new THREE.BufferGeometry();
            // Random triangle size ~ 2-4 units
            const s = 2 + Math.random() * 2;
            const vertices = new Float32Array([
                0, s, 0,
                -s/2, -s/2, 0,
                s/2, -s/2, 0
            ]);
            shardGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            shardGeo.computeVertexNormals();

            const shard = new THREE.Mesh(shardGeo, shardMat);
            
            // Random position within frame
            shard.position.set(
                (Math.random() - 0.5) * gw * 0.8,
                (Math.random() - 0.5) * gh * 0.8,
                0.6 + Math.random() * 0.2 // Slightly sticking out
            );
            
            // Random rotation
            shard.rotation.z = Math.random() * Math.PI * 2;
            shard.rotation.x = (Math.random() - 0.5) * 0.5; // Slight tilt
            shard.rotation.y = (Math.random() - 0.5) * 0.5;

            mirrorGroup.add(shard);
        }
        
        return true;
    }
};
