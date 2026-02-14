window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.FlowerGrid = class FlowerGrid {
    constructor() {
        this.group = new THREE.Group();
        this.init();
    }

    init() {
        const discDarkMat = new THREE.MeshStandardMaterial({ color: 0x5C4033 }); 
        const discLightMat = new THREE.MeshStandardMaterial({ color: 0xD2B48C }); 
        const flowerMat = new THREE.MeshStandardMaterial({ color: 0xFFFF00 }); 
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x228B22 }); 
        
        // Vase material (no longer used for logic, but kept for visuals)
        const vaseMat = new THREE.MeshStandardMaterial({ 
            color: 0xaaaaaa, 
            transparent: true, 
            opacity: 0.5, 
            roughness: 0.1
        }); 

        const fCols = 5;
        const fRows = 3;
        const fSpacingX = 6.0; 
        const fSpacingY = 6.0; 
        
        const scaleFactor = 0.8; 
        
        this.flowers = [];

        for(let r=0; r<fRows; r++) {
            for(let c=0; c<fCols; c++) {
                const f = new THREE.Group();
                const xOff = (c - 2) * fSpacingX; 
                const yOff = (r - 1) * fSpacingY;
                
                f.position.set(xOff, yOff, 0);
                f.userData = { row: r, col: c };

                // Initial Rotation: All Turned Right
                // 0 = Up, 1 = Right
                const startRot = 1;
                f.rotation.z = -startRot * (Math.PI / 2);
                
                // --- Sconce Backing ---
                // Outer disc doesn't rotate naturally in real life if attached to wall? 
                // But user asked to "rotate it ... when clicked".
                // If we rotate the GROUP f, everything rotates.
                const outerDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.5 * scaleFactor, 1.5 * scaleFactor, 0.6, 16), discDarkMat);
                outerDisc.rotation.x = Math.PI / 2;
                outerDisc.userData = { isFlower: true, parentGroup: f, row: r, col: c };
                f.add(outerDisc);
                
                const innerDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.1 * scaleFactor, 1.1 * scaleFactor, 0.65, 16), discLightMat);
                innerDisc.rotation.x = Math.PI / 2;
                innerDisc.userData = { isFlower: true, parentGroup: f, row: r, col: c };
                f.add(innerDisc);
                
                // --- Vase ---
                const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * scaleFactor, 0.5 * scaleFactor, 3.0 * scaleFactor, 16), vaseMat);
                vase.position.set(0, -0.2 * scaleFactor, 0.9); 
                vase.userData = { isFlower: true, parentGroup: f, row: r, col: c };
                f.add(vase);
                
                // Flower
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scaleFactor, 0.08 * scaleFactor, 2.5 * scaleFactor, 8), stemMat);
                stem.position.set(0, 1.5 * scaleFactor, 0.9); 
                stem.userData = { isFlower: true, parentGroup: f, row: r, col: c };
                f.add(stem);
                
                const head = new THREE.Mesh(new THREE.SphereGeometry(0.6 * scaleFactor, 8, 8), flowerMat);
                head.position.set(0, 2.8 * scaleFactor, 0.9);
                head.userData = { isFlower: true, parentGroup: f, row: r, col: c };
                f.add(head);
                
                this.group.add(f);

                this.flowers.push({
                    row: r,
                    col: c,
                    group: f,
                    rotIndex: startRot // 0=Up, 1=Right
                });
            }
        }
    }

    rotate(targetObj) {
        let data = targetObj.userData;
        const r = data.row;
        const c = data.col;
        
        if (r === undefined || c === undefined) return;

        const flower = this.flowers.find(f => f.row === r && f.col === c);
        if(flower && !flower.isAnimating) {
            flower.isAnimating = true;
            // Toggle between 0 (Up) and 1 (Right)
            const nextIndex = (flower.rotIndex === 0) ? 1 : 0;
            const targetZ = -nextIndex * (Math.PI / 2);
            
            // Update State Immediately for Logic Checks
            flower.rotIndex = nextIndex;
            
            window.TWEEN.to(flower.group.rotation, {
                z: targetZ,
                duration: 0.3,
                ease: "back.out",
                onComplete: () => {
                    flower.isAnimating = false;
                }
            });
        }
    }

    // No toggle/updateVisual needed anymore

    checkPattern() {
        // Pattern Validation
        // "Illuminated" set must be Up (0).
        // "Non-Illuminated" set must be Right (1).
        
        for(let f of this.flowers) {
            let isIlluminatedSet = false;
            
            // COLUMN 0: ALL Illuminated (H - Left Vertical)
            if(f.col === 0) {
                 isIlluminatedSet = true;
            }
            // COLUMN 1: Middle Only (H - Crossbar)
            else if(f.col === 1) {
                 isIlluminatedSet = (f.row === 1); 
            }
            // COLUMN 2: ALL Illuminated (H - Right Vertical)
            else if(f.col === 2) {
                 isIlluminatedSet = true;
            }
            // COLUMN 3: Bottom Only (I - Dot?)
            else if(f.col === 3) {
                 isIlluminatedSet = (f.row === 0); 
            }
            // COLUMN 4: ALL Illuminated (I - Stem)
            else if(f.col === 4) {
                 isIlluminatedSet = true;
            }
            
            if(isIlluminatedSet) {
                // REQUIRED: Up (0)
                if(f.rotIndex !== 0) return false;
            } else {
                // REQUIRED: Right (1)
                if(f.rotIndex !== 1) return false;
            }
        }
        return true;
    }
};
