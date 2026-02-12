window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.HolePillow = class HolePillow {
    constructor() {
        this.group = new THREE.Group(); // Need Group for rotation logic
        this.init();
    }

    init() {
        const whitePillowMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF }); 
        
        const pWidth = 10;
        const pHeight = 8;
        const pRect = new THREE.Shape();
        pRect.moveTo(-pWidth/2, -pHeight/2);
        pRect.lineTo(pWidth/2, -pHeight/2);
        pRect.lineTo(pWidth/2, pHeight/2);
        pRect.lineTo(-pWidth/2, pHeight/2);
        pRect.lineTo(-pWidth/2, -pHeight/2);
        
        const holeRadius = 1.5;
        const pHole = new THREE.Path();
        pHole.absarc(0, 0, holeRadius, 0, Math.PI * 2, true);
        pRect.holes.push(pHole);
        
        const pGeo = new THREE.ExtrudeGeometry(pRect, { depth: 2, bevelEnabled: false, steps: 1 });
        
        const rectPillow = new THREE.Mesh(pGeo, whitePillowMat);
        rectPillow.geometry.center(); 
        rectPillow.rotation.y = Math.PI / 2;
        
        // Offset Y by half height (4) to pivot at bottom
        rectPillow.position.y = 4;
        
        this.group.add(rectPillow);
    }
};