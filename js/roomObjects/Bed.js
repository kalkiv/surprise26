window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.Bed = class Bed {
    constructor() {
        this.group = new THREE.Group();
        this.frameGroup = new THREE.Group();
        this.group.add(this.frameGroup);
        
        this.bedLen = 50; 
        this.bedWid = 38; 
        this.bedHeight = 8;
        
        this.init();
    }

    init() {
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x090909, roughness: 0.6 });
        
        // Mattress Tex
        const mattressTex = window.App.Utils.TextureFactory.createFlowerPattern('#FFFFFF', '#00008B');
        const bedMat = new THREE.MeshStandardMaterial({ map: mattressTex, roughness: 0.9 });
        
        // Legs (Local -2 to -6 relative to Group 0?)
        // Floor is at Y = -20. Distance to floor = 6.
        // Legs need to be length 6. Start at 0, go to -6.
        const legGeo = new THREE.BoxGeometry(2, 6, 2);
        [ [-this.bedLen/2+1, -this.bedWid/2+1], [-this.bedLen/2+1, this.bedWid/2-1],
          [this.bedLen/2-1, -this.bedWid/2+1], [this.bedLen/2-1, this.bedWid/2-1] ].forEach(pos => {
              const l = new THREE.Mesh(legGeo, woodMat);
              l.position.set(pos[0], -3, pos[1]); // Center -3 extends 0 to -6
              this.frameGroup.add(l);
          });

        // Frame and Mattress 
        const mattress = new THREE.Mesh(new THREE.BoxGeometry(this.bedLen - 2, this.bedHeight, this.bedWid - 2), bedMat);
        mattress.position.y = 6; 
        mattress.castShadow = true;
        mattress.receiveShadow = true;
        this.frameGroup.add(mattress);
        
        // Low Profile Headboard/Footboard
        // Headboard Taller (Reduced to 20)
        const headH = 20;
        const footH = 12;
        
        // Posts (Start Y=0 go up)
        const headPostGeo = new THREE.BoxGeometry(2, headH, 2);
        const footPostGeo = new THREE.BoxGeometry(2, footH, 2);

        const h1 = new THREE.Mesh(headPostGeo, woodMat); h1.position.set(-this.bedLen/2 + 1, headH/2, -this.bedWid/2 + 1); this.frameGroup.add(h1);
        const h2 = new THREE.Mesh(headPostGeo, woodMat); h2.position.set(-this.bedLen/2 + 1, headH/2, this.bedWid/2 - 1); this.frameGroup.add(h2);
        
        const f1 = new THREE.Mesh(footPostGeo, woodMat); f1.position.set(this.bedLen/2 - 1, footH/2, -this.bedWid/2 + 1); this.frameGroup.add(f1);
        const f2 = new THREE.Mesh(footPostGeo, woodMat); f2.position.set(this.bedLen/2 - 1, footH/2, this.bedWid/2 - 1); this.frameGroup.add(f2);
        
        // Rails
        // Side Rails
        const sideRail = new THREE.BoxGeometry(this.bedLen, 2, 2);
        const sr1 = new THREE.Mesh(sideRail, woodMat); sr1.position.set(0, 1, -this.bedWid/2 + 1); this.frameGroup.add(sr1);
        const sr2 = new THREE.Mesh(sideRail, woodMat); sr2.position.set(0, 1, this.bedWid/2 - 1); this.frameGroup.add(sr2);
        
        // Head/Foot Tops
        const headTop = new THREE.Mesh(new THREE.BoxGeometry(2, 2, this.bedWid), woodMat); headTop.position.set(-this.bedLen/2 + 1, headH - 1, 0); this.frameGroup.add(headTop);
        const headBot = new THREE.Mesh(new THREE.BoxGeometry(2, 2, this.bedWid), woodMat); headBot.position.set(-this.bedLen/2 + 1, 3, 0); this.frameGroup.add(headBot);
        
        const footTop = new THREE.Mesh(new THREE.BoxGeometry(2, 2, this.bedWid), woodMat); footTop.position.set(this.bedLen/2 - 1, footH - 1, 0); this.frameGroup.add(footTop);
        const footBot = new THREE.Mesh(new THREE.BoxGeometry(2, 2, this.bedWid), woodMat); footBot.position.set(this.bedLen/2 - 1, 3, 0); this.frameGroup.add(footBot);

        // Horizontal Rungs
        const hRungLen = this.bedWid - 4; 
        const hRungGeo = new THREE.BoxGeometry(1, 1, hRungLen);
        
        // Head Rungs (Up to 17)
        for(let y = 5; y < headH - 1; y += 2) {
             const rh = new THREE.Mesh(hRungGeo, woodMat); rh.position.set(-this.bedLen/2 + 1, y, 0); this.frameGroup.add(rh);
        }
        // Foot Rungs (Up to 11)
        for(let y = 5; y < footH - 1; y += 2) {
             const rf = new THREE.Mesh(hRungGeo, woodMat); rf.position.set(this.bedLen/2 - 1, y, 0); this.frameGroup.add(rf);
        }
    }
};