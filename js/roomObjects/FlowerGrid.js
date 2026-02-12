window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.FlowerGrid = class FlowerGrid {
    constructor() {
        this.group = new THREE.Group();
        this.init();
    }

    init() {
        const vaseMat = new THREE.MeshStandardMaterial({ 
            color: 0xaaaaaa, 
            transparent: true, 
            opacity: 0.5, 
            roughness: 0.1 
        }); 
        
        const discDarkMat = new THREE.MeshStandardMaterial({ color: 0x5C4033 }); 
        const discLightMat = new THREE.MeshStandardMaterial({ color: 0xD2B48C }); 
        const flowerMat = new THREE.MeshStandardMaterial({ color: 0xFFFF00 }); 
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x228B22 }); 
        
        const fCols = 5;
        const fRows = 3;
        const fSpacingX = 6.0; 
        const fSpacingY = 6.0; 
        
        const scaleFactor = 0.8; 
        
        for(let r=0; r<fRows; r++) {
            for(let c=0; c<fCols; c++) {
                const f = new THREE.Group();
                const xOff = (c - 2) * fSpacingX; 
                const yOff = (r - 1) * fSpacingY;
                
                f.position.set(xOff, yOff, 0);
                
                // --- Sconce Backing ---
                const outerDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.5 * scaleFactor, 1.5 * scaleFactor, 0.6, 16), discDarkMat);
                outerDisc.rotation.x = Math.PI / 2;
                outerDisc.userData = { isFlower: true, parentGroup: f };
                f.add(outerDisc);
                
                const innerDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.1 * scaleFactor, 1.1 * scaleFactor, 0.65, 16), discLightMat);
                innerDisc.rotation.x = Math.PI / 2;
                innerDisc.userData = { isFlower: true, parentGroup: f };
                f.add(innerDisc);
                
                // --- Vase ---
                const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * scaleFactor, 0.5 * scaleFactor, 3.0 * scaleFactor, 16), vaseMat);
                vase.position.set(0, -0.2 * scaleFactor, 0.9); 
                vase.userData = { isFlower: true, parentGroup: f };
                f.add(vase);
                
                // Flower
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scaleFactor, 0.08 * scaleFactor, 2.5 * scaleFactor, 8), stemMat);
                stem.position.set(0, 1.5 * scaleFactor, 0.9); 
                stem.userData = { isFlower: true, parentGroup: f };
                f.add(stem);
                
                const head = new THREE.Mesh(new THREE.SphereGeometry(0.6 * scaleFactor, 8, 8), flowerMat);
                head.position.set(0, 2.8 * scaleFactor, 0.9);
                head.userData = { isFlower: true, parentGroup: f };
                f.add(head);
                
                this.group.add(f);
            }
        }
    }
};