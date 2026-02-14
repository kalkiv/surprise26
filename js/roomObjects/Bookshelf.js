window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.Bookshelf = class Bookshelf {
    constructor() {
        this.group = new THREE.Group();
        // Shelf Lamp State (Shelf 3 Cyl Lamp)
        this.shelfLampOn = true; 
        this.shelfLampMat = null; 
        this.shelfLampLight = null; 

        // Shelf 4 Bell Lamp State (New)
        this.bellLampOn = true;
        this.bellLampMat = null;
        this.bellLampLight = null;
        
        this.init();
    }

    toggleShelfLamp() {
        this.shelfLampOn = !this.shelfLampOn;
        if(this.shelfLampMat) {
            if(this.shelfLampOn) {
                this.shelfLampMat.opacity = 0.9;
                this.shelfLampMat.emissiveIntensity = 0.5;
            } else {
                this.shelfLampMat.opacity = 0.4;
                this.shelfLampMat.emissiveIntensity = 0.0;
            }
        }
        if(this.shelfLampLight) {
            this.shelfLampLight.intensity = this.shelfLampOn ? 1.2 : 0;
        }
    }

    toggleBellLamp() {
        this.bellLampOn = !this.bellLampOn;
        if(this.bellLampMat) {
            if(this.bellLampOn) {
                this.bellLampMat.emissiveIntensity = 0.8;
            } else {
                this.bellLampMat.emissiveIntensity = 0.0;
            }
        }
        if(this.bellLampLight) {
            this.bellLampLight.intensity = this.bellLampOn ? 1.5 : 0;
        }
    }

    init() {
        // Bookshelf (Right Corner area X=-30, Z=35)
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x090909, roughness: 0.6 });
        
        const shelfWidthX = 14;
        const shelfDepthZ = 10;
        const shelfHeight = 44; 
        
        // Angled Posts
        const postLen = Math.sqrt(44*44 + 8*8);
        const postAngle = Math.atan2(8, 44); 
        const angledPostGeo = new THREE.BoxGeometry(2, postLen, 2);

        // Left Post
        const lPost = new THREE.Mesh(angledPostGeo, woodMat);
        lPost.position.set(-shelfWidthX/2 + 1, shelfHeight/2, 0);
        lPost.rotation.x = postAngle; 
        this.group.add(lPost);

        // Right Post
        const rPost = new THREE.Mesh(angledPostGeo, woodMat);
        rPost.position.set(shelfWidthX/2 - 1, shelfHeight/2, 0);
        rPost.rotation.x = postAngle;
        this.group.add(rPost);

        // Top Horizontal Stick (Connecting posts)
        // Posts lean forward (+Z), so top is at Z = +4.
        const topStick = new THREE.Mesh(new THREE.BoxGeometry(shelfWidthX, 1.5, 1.5), woodMat);
        topStick.position.set(0, 44, 4); 
        this.group.add(topStick);
          
        // Shelves Loop (5 Shelves)
        const shelfPlank = new THREE.BoxGeometry(shelfWidthX, 1, shelfDepthZ);
        // Spacing: 5 shelves. Y levels: 4, 13, 22, 31, 40
        const levels = [4, 13, 22, 31, 40];
        
        levels.forEach(y => {
            const plank = new THREE.Mesh(shelfPlank, woodMat);
            plank.position.set(0, y, 0);
            plank.castShadow = true;
            plank.receiveShadow = true;
            this.group.add(plank);
        });

        // --- SHELF 1 (Top) Y=40.5 ---
        const shelf1Y = 40.5;
        const plasterMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });

        // 1. Large Black Square Photo Frame (Swapped to Left)
        const lFrameGroup = new THREE.Group();
        lFrameGroup.position.set(-3.0, shelf1Y, 1.5); 
        lFrameGroup.rotation.y = -Math.PI / 8 + Math.PI; // Angled outward to Right
        
        // Large Black Square (Thicker 1.2)
        const lfGeo = new THREE.BoxGeometry(5.0, 5.0, 1.2);
        const lfMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const lFrame = new THREE.Mesh(lfGeo, lfMat);
        lFrame.position.y = 2.5; 
        lFrame.rotation.x = -0.1;
        lFrameGroup.add(lFrame);
        // Inner photo
        const lPhGeo = new THREE.PlaneGeometry(4.0, 4.0);
        const lPhMat = new THREE.MeshStandardMaterial({ color: 0x333333 }); 
        const lPhoto = new THREE.Mesh(lPhGeo, lPhMat);
        lPhoto.position.set(0, 2.5, 0.61); 
        lPhoto.rotation.x = -0.1;
        lFrameGroup.add(lPhoto);
        this.group.add(lFrameGroup);

        // 2. Black Box with Heart (Swapped to Right)
        const boxGroup = new THREE.Group();
        boxGroup.position.set(3.0, shelf1Y, 1.0); 
        const cube = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 2.5), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        cube.position.y = 1.25;
        boxGroup.add(cube);
        
        const hShape = new THREE.Shape();
        const x = 0, y = 0;
        hShape.moveTo(x + 0.25, y + 0.25);
        hShape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.20, y, x, y);
        hShape.bezierCurveTo(x - 0.30, y, x - 0.30, y + 0.35, x - 0.30, y + 0.35);
        hShape.bezierCurveTo(x - 0.30, y + 0.55, x - 0.10, y + 0.77, x + 0.25, y + 0.95);
        hShape.bezierCurveTo(x + 0.60, y + 0.77, x + 0.80, y + 0.55, x + 0.80, y + 0.35);
        hShape.bezierCurveTo(x + 0.80, y + 0.35, x + 0.80, y, x + 0.50, y);
        hShape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);
        const hGeo = new THREE.ExtrudeGeometry(hShape, { depth: 0.1, bevelEnabled: false });
        hGeo.center();
        const hMesh = new THREE.Mesh(hGeo, new THREE.MeshStandardMaterial({ color: 0xFF69B4, emissive: 0x330011 }));
        hMesh.rotation.z = Math.PI; 
        hMesh.scale.set(1.5, 1.5, 1.5);
        hMesh.position.set(0, 1.25, 1.26); 
        boxGroup.add(hMesh);
        this.group.add(boxGroup);

        // 3. Hanging Plant (Further Back)
        const hangGroup = new THREE.Group();
        hangGroup.position.set(0, shelf1Y, 0); // Moved to center
        const hPot = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.5, 1.0, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        hPot.position.y = 0.5;
        hangGroup.add(hPot);
        
        const bushMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), bushMat); 
        bush.position.y = 1.0;
        bush.scale.set(1.0, 0.7, 1.0); 
        hangGroup.add(bush);
        
        const vineMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        
        // 1. Hanging Vines (Down the back)
        const hangCount = 7; 
        for(let i=0; i<hangCount; i++) {
            const len = 15 + Math.random()*5; 
            const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.02, len, 5), vineMat);
            // Behind pot (Move further back to roughly -5.5 to clear shelf edge)
            vine.position.set((Math.random()-0.5)*1.2, -len/2 + 0.5, -5.5 + (Math.random()-0.5)*0.3);
            vine.rotation.z = (Math.random()-0.5)*0.15; 
            hangGroup.add(vine);
            // Leaf logic...
            const leafCount = 10;
            for(let j=0; j<leafCount; j++) {
                const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 4, 4), vineMat);
                leaf.scale.set(1.2, 2.0, 0.4); 
                leaf.position.y = (Math.random() - 0.5) * len; 
                leaf.rotation.set(Math.random()*3, Math.random()*3, 0);
                vine.add(leaf);
            }
        }

        // 1b. Connector Vines (From Pot to Back Edge)
        const connectCount = 3;
        for(let i=0; i<connectCount; i++) {
            // bridge from Z=0 to Z=-5.5
            const len = 5.5 + Math.random();
            const connVine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 5), vineMat);
            // Rotate to lie flat on Z axis
            connVine.rotation.x = Math.PI / 2;
            connVine.rotation.z = (Math.random()-0.5) * 0.2; // slight wiggle
            // Position: Center of cylinder is at -len/2
            connVine.position.set((Math.random()-0.5)*0.8, 0.8, -len/2 + 0.5);
            hangGroup.add(connVine);

            // Add leaves to connector
            const leafCount = 4;
            for(let j=0; j<leafCount; j++) {
                const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.15, 4, 4), vineMat);
                leaf.scale.set(1.5, 2.0, 0.3);
                // Position along the length (which is Y in local cylinder space)
                leaf.position.y = (Math.random()-0.5) * len; 
                leaf.rotation.set(Math.random()*3, Math.random()*3, 0);
                connVine.add(leaf);
            }
        }

        // 2. Surface Vines (Draping ON the shelf)
        const drapeCount = 5;
        for(let i=0; i<drapeCount; i++) {
            const curveLen = 1.5 + Math.random()*1.0;
            const drapingVine = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, curveLen, 4), vineMat);
            const angle = Math.random() * Math.PI; 
            
            drapingVine.position.set(0, 0.8, 0); 
            drapingVine.rotation.x = Math.PI/2;
            drapingVine.rotation.z = angle;
            
            const vCont = new THREE.Group();
            vCont.position.y = 0.8;
            vCont.rotation.y = angle; 
            vCont.rotation.x = Math.PI/2 + 0.2; 
            
            const dVine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.02, curveLen), vineMat);
            dVine.position.y = curveLen/2; 
            dVine.rotation.z = (Math.random()-0.5)*0.5; 
            
            vCont.add(dVine);
            hangGroup.add(vCont);
            
             // Leaves
            for(let j=0; j<4; j++) {
                const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.15, 4, 4), vineMat);
                leaf.scale.set(1.5, 2.0, 0.3);
                leaf.position.y = Math.random() * curveLen;
                leaf.rotation.set(Math.random()*3, Math.random()*3, 0);
                dVine.add(leaf);
            }
        }
        this.group.add(hangGroup);

        // --- SHELF 2 (Y=31.5) ---
        const shelf2Y = 31.5;

        // 1. Photo Frame (Swapped from Shelf 3) - Left
        const frameGroup2 = new THREE.Group();
        frameGroup2.position.set(-3.0, shelf2Y, 0.5); // Moved In
        // Copy Frame logic from Shelf 3
        const fGeo = new THREE.BoxGeometry(2.5, 1.8, 0.2);
        const fMat = new THREE.MeshStandardMaterial({ color: 0xDEB887 }); 
        const frame = new THREE.Mesh(fGeo, fMat);
        frame.position.y = 0.9;
        frame.rotation.x = -0.1;
        frameGroup2.add(frame);
        const pGeo = new THREE.PlaneGeometry(2.1, 1.4);
        const pMat = new THREE.MeshStandardMaterial({ color: 0xE0E0E0 });
        const photo = new THREE.Mesh(pGeo, pMat);
        photo.position.set(0, 0.9, 0.11);
        photo.rotation.x = -0.1;
        frameGroup2.add(photo);
        // Stand leg
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 0.1), fMat);
        leg.position.set(0, 0.8, -0.3);
        leg.rotation.x = 0.3;
        frameGroup2.add(leg);
        this.group.add(frameGroup2);

        // 2. Flower (Keep) - Center
        const flowerGroup = new THREE.Group();
        flowerGroup.position.set(0, shelf2Y, 0);
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.8, 1.5, 8), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
        pot.position.y = 0.75;
        flowerGroup.add(pot);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5), new THREE.MeshStandardMaterial({ color: 0x228B22 }));
        stem.position.y = 2.25;
        flowerGroup.add(stem);
        const fPetals = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.0, 5, 1, true), new THREE.MeshStandardMaterial({ color: 0xFFB6C1, side: THREE.DoubleSide }));
        fPetals.position.y = 3.0;
        fPetals.rotation.x = Math.PI;
        flowerGroup.add(fPetals);
        this.group.add(flowerGroup);

        // 3. Insta Board (Keep) - Right
        const boardGroup = new THREE.Group();
        boardGroup.position.set(3.0, shelf2Y, -0.5); // Moved In
        const bGeo = new THREE.BoxGeometry(3.5, 3.5, 0.4);
        const bMat = new THREE.MeshStandardMaterial({ color: 0xDEB887 }); 
        const board = new THREE.Mesh(bGeo, bMat);
        board.position.y = 1.75; 
        boardGroup.add(board);
        const carvedMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.15, 4, 16), carvedMat);
        ring.position.set(0, 1.75, 0.22);
        boardGroup.add(ring);
        const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12), carvedMat);
        dot.rotation.x = Math.PI/2;
        dot.position.set(0, 1.75, 0.22);
        boardGroup.add(dot);
        const dot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8), carvedMat);
        dot2.rotation.x = Math.PI/2;
        dot2.position.set(1.1, 2.8, 0.22);
        boardGroup.add(dot2);
        const cBoard = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.4, 32), bMat); 
        cBoard.rotation.x = Math.PI/2; 
        cBoard.position.set(-1.2, 1.0, 0.45);
        boardGroup.add(cBoard);
        this.group.add(boardGroup);

        // --- SHELF 3 (Y=22.51) ---
        const shelf3Y = 22.51;

        // 1. Cylinder Lamp (Swapped to Left) - Far Left
        const lampGroup = new THREE.Group();
        lampGroup.position.set(-3.5, shelf3Y, -1.0); // Spaced Out
        const lBase = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
        lBase.position.y = 0.25;
        lBase.userData = { isLamp: true, instance: { toggle: () => this.toggleShelfLamp() } };
        lampGroup.add(lBase);
        this.shelfLampMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFF8DC, transparent: true, opacity: 0.9, side: THREE.DoubleSide, emissive: 0xFFFFE0, emissiveIntensity: 0.5
        });
        const lShade = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.8, 16, 1, true), this.shelfLampMat);
        lShade.position.y = 1.15 + 0.25;
        lShade.userData = { isLamp: true, instance: { toggle: () => this.toggleShelfLamp() } };
        lampGroup.add(lShade);
        this.shelfLampLight = new THREE.PointLight(0xFFFFE0, 1.2, 8);
        this.shelfLampLight.position.set(0, 1.5, 0);
        lampGroup.add(this.shelfLampLight);
        this.group.add(lampGroup);

        // 2. Grass (Swapped to Mid Left)
        const grassGroup = new THREE.Group();
        grassGroup.position.set(-1.5, shelf3Y, 1.0); // Spaced Out
        const gPot = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        gPot.position.y = 0.6;
        grassGroup.add(gPot);
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x556B2F }); 
        for(let i=0; i<12; i++) {
            const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05, 1.5 + Math.random(), 4), grassMat);
            blade.position.set((Math.random()-0.5)*0.8, 1.2, (Math.random()-0.5)*0.8);
            blade.rotation.x = (Math.random()-0.5)*0.5;
            blade.rotation.z = (Math.random()-0.5)*0.5;
            grassGroup.add(blade);
        }
        this.group.add(grassGroup);

        // 3. Miniature House - Center
        const houseGroup = new THREE.Group();
        houseGroup.position.set(0, shelf3Y, 0);
        // Base box (Shorter)
        const hBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.5), new THREE.MeshStandardMaterial({ color: 0xE6E6FA })); 
        hBase.position.y = 0.5;
        houseGroup.add(hBase);
        // Roof (Brown)
        const hRoof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.0, 4), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
        hRoof.position.y = 1.5; // Adjusted for shorter base
        hRoof.rotation.y = Math.PI/4;
        houseGroup.add(hRoof);
        // Door (Brown)
        const hDoor = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
        hDoor.position.set(0, 0.3, 0.76);
        houseGroup.add(hDoor);
        this.group.add(houseGroup);

        // 4. Globe - Mid Right
        const globeGroup = new THREE.Group();
        globeGroup.position.set(1.5, shelf3Y, 0.5); // Adjusted spacing
        const gStand = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 0.5, 8), woodMat);
        gStand.position.y = 0.25;
        globeGroup.add(gStand);
        const gAxis = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.1, 4, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 }));
        gAxis.rotation.z = -Math.PI/2 - 0.4; 
        gAxis.position.y = 1.8;
        globeGroup.add(gAxis);
        const gSphere = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 16), plasterMat);
        gSphere.position.y = 1.8;
        globeGroup.add(gSphere);
        this.group.add(globeGroup);

        // 5. Sign (Keep) - Far Right
        const signGroup = new THREE.Group();
        signGroup.position.set(3.5, shelf3Y, -0.5); // Moved In
        const sGeo = new THREE.BoxGeometry(2.0, 1.2, 0.4);
        const sMat = new THREE.MeshStandardMaterial({ color: 0xD2691E }); 
        const sign = new THREE.Mesh(sGeo, sMat);
        sign.position.y = 0.6;
        signGroup.add(sign);
        const lineMat = new THREE.MeshStandardMaterial({ color: 0xFFFACD });
        const line1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.05), lineMat);
        line1.position.set(0, 0.8, 0.21);
        signGroup.add(line1);
        const line2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.05), lineMat);
        line2.position.set(0, 0.5, 0.21);
        signGroup.add(line2);
        this.group.add(signGroup);

        // --- SHELF 4 (Y=13.51) ---
        const shelf4Y = 13.51; 

        // 1. Mini Tree (Black Trunk, Spread Red Foliage) - Swapped to Left
        const treeGroup = new THREE.Group();
        treeGroup.position.set(-3.0, shelf4Y, 0);
        // Base/Trunk (Black)
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const tTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 2.0, 8), trunkMat);
        tTrunk.position.y = 1.0;
        treeGroup.add(tTrunk);
        
        const tFoliage = new THREE.Group();
        tFoliage.position.y = 1.8;
        
        const redLeafMat = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
        
        const branches = [
            { x: 0.8, y: 0.5, z: 0, rotZ: -0.6 },
            { x: -0.8, y: 0.4, z: 0.2, rotZ: 0.6 },
            { x: 0, y: 0.7, z: 0.8, rotX: 0.5 },
            { x: 0.2, y: 0.6, z: -0.8, rotX: -0.5 },
            { x: 0, y: 1.0, z: 0, rotZ: 0 } 
        ];

        branches.forEach(b => {
             const br = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.0), trunkMat);
             br.position.set(b.x/2, b.y/2, b.z/2); 
             if(b.rotZ) br.rotation.z = b.rotZ;
             if(b.rotX) br.rotation.x = b.rotX;
             tFoliage.add(br);
             
             const puff = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), redLeafMat);
             puff.position.set(b.x, b.y, b.z);
             tFoliage.add(puff);
        });
        treeGroup.add(tFoliage);
        this.group.add(treeGroup);

        // 2. Funko Pop Box - Mid Left
        const funkoGroup = new THREE.Group();
        funkoGroup.position.set(-1.0, shelf4Y, -0.8); 
        const fBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 1.5), new THREE.MeshStandardMaterial({ color: 0xFFFFFF }));
        fBox.position.y = 1.1;
        funkoGroup.add(fBox);
        const fWin = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.4), new THREE.MeshStandardMaterial({ color: 0xADD8E6 }));
        fWin.position.set(0, 1.1, 0.76);
        funkoGroup.add(fWin);
        this.group.add(funkoGroup);

        // 3. Woman Statue - Swapped to Mid Right
        const womanGroup = new THREE.Group();
        womanGroup.position.set(1.5, shelf4Y, 0.5); // Moved Here
        womanGroup.scale.set(0.7, 0.7, 0.7); 
        const wBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 2.5, 8), plasterMat);
        wBase.position.y = 1.25;
        womanGroup.add(wBase);
        const wTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 1.5, 8), plasterMat);
        wTorso.position.y = 3.25;
        womanGroup.add(wTorso);
        const wHead = new THREE.Mesh(new THREE.SphereGeometry(0.4), plasterMat);
        wHead.position.y = 4.5;
        womanGroup.add(wHead);
        this.group.add(womanGroup);

        // 4. Bell Flower Lamp (Tulip Style) - Right
        const bellGroup = new THREE.Group();
        bellGroup.position.set(3.0, shelf4Y, 0.5); 
        bellGroup.scale.set(1.8, 1.8, 1.8); // Larger
        bellGroup.rotation.y = Math.PI * 0.85; // Rotate Inwards (Face mostly Left/Back)

        const goldMat2 = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 });
        
        // Base (Gold)
        const bBase = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.2, 16), goldMat2);
        bBase.position.y = 0.1;
        bellGroup.add(bBase);

        // Stem (Gold)
        const bellStem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5), goldMat2);
        bellStem.position.y = 1.25;
        
        const curve = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 4, 8, Math.PI), goldMat2);
        curve.position.set(0.5, 2.5, 0);
        curve.rotation.z = Math.PI/2;
        bellGroup.add(bellStem);
        bellGroup.add(curve);
        
        // Tulip Bell Shade (Lathe)
        this.bellLampMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF, transparent: true, opacity: 0.9, side: THREE.DoubleSide, 
            emissive: 0xFFFFFF, emissiveIntensity: 0.8 
        });
        
        const points = [];
        // Tulip profile (Top neck to Bottom rim)
        points.push(new THREE.Vector2(0.1, 1.0)); // Neck
        points.push(new THREE.Vector2(0.2, 0.9));
        points.push(new THREE.Vector2(0.45, 0.6)); // Bulge
        points.push(new THREE.Vector2(0.35, 0.3)); // Waisted
        points.push(new THREE.Vector2(0.6, 0.0)); // Flare rim
        const bellGeo = new THREE.LatheGeometry(points, 16);
        
        const bell = new THREE.Mesh(bellGeo, this.bellLampMat);
        // Curve ends at (1.0, 2.5). Bell neck at local y=1.0. 
        // We want neck at (1.0, 2.5).
        // Bell extends 0.0 to 1.0.
        // So position bell Top at y=2.5. Bell local 0 is bottom.
        // Position y = 1.5.
        // Also rotate? Lathe is Y-up. Just translate.
        bell.position.set(1.0, 1.5, 0); 
        
        bell.userData = { isLamp: true, instance: { toggle: () => this.toggleBellLamp() } };
        bellGroup.add(bell);
        
        // Light (White)
        this.bellLampLight = new THREE.PointLight(0xFFFFFF, 1.5, 6);
        this.bellLampLight.position.set(1.0, 1.8, 0); // Inside bell
        bellGroup.add(this.bellLampLight);

        this.group.add(bellGroup);

        // --- SHELF 5 (Bottom) Y=4 ---
        const shelf5Y = 4.5; 

        // 1. Stack of 4 Books (Left, Moved In)
        const stackGroup = new THREE.Group();
        stackGroup.position.set(-2.5, shelf5Y, 0); 
        const stackCols = [0x556B2F, 0x8B0000, 0x483D8B, 0x2F4F4F];
        let currentY = 0;
        for(let i=0; i<4; i++) {
            const w = 2.5 - (i*0.2) + (Math.random()*0.2);
            const d = 3.5 - (i*0.3) + (Math.random()*0.4);
            const h = 0.3 + Math.random()*0.3;
            const book = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: stackCols[i] }));
            book.position.y = currentY + h/2;
            book.rotation.y = (Math.random()-0.5) * 0.1;
            stackGroup.add(book);
            currentY += h;
        }
        this.group.add(stackGroup);

        // 2. White Crate/Basket (Right, Moved In)
        const crateGroup = new THREE.Group();
        crateGroup.position.set(2.5, shelf5Y, 0); 
        const cW = 5, cD = 4, cH = 2.0;
        const thick = 0.2;
        const crateMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const base = new THREE.Mesh(new THREE.BoxGeometry(cW, thick, cD), crateMat);
        base.position.y = thick/2;
        crateGroup.add(base);
        const postGeo = new THREE.BoxGeometry(thick*1.5, cH, thick*1.5);
        const halfW = cW/2 - thick;
        const halfD = cD/2 - thick;
        [
            {x: -halfW, z: -halfD}, {x: halfW, z: -halfD},
            {x: -halfW, z: halfD},  {x: halfW, z: halfD}
        ].forEach(pos => {
            const post = new THREE.Mesh(postGeo, crateMat);
            post.position.set(pos.x, cH/2, pos.z);
            crateGroup.add(post);
        });
        const slatCount = 2; 
        const slatH = 0.6; 
        const gap = (cH - (slatCount * slatH)) / (slatCount + 1); 
        for(let i=0; i<slatCount; i++) {
            const y = gap + slatH/2 + i*(slatH+gap);
            const longSlat = new THREE.BoxGeometry(cW, slatH, thick);
            const front = new THREE.Mesh(longSlat, crateMat);
            front.position.set(0, y, cD/2 - thick/2);
            crateGroup.add(front);
            const back = new THREE.Mesh(longSlat, crateMat);
            back.position.set(0, y, -cD/2 + thick/2);
            crateGroup.add(back);
            const shortSlat = new THREE.BoxGeometry(thick, slatH, cD - thick*2);
            const left = new THREE.Mesh(shortSlat, crateMat);
            left.position.set(-cW/2 + thick/2, y, 0);
            crateGroup.add(left);
            const right = new THREE.Mesh(shortSlat, crateMat);
            right.position.set(cW/2 - thick/2, y, 0);
            crateGroup.add(right);
        }
        const bookCols = [0x550000, 0x000055, 0x004400, 0x553311, 0x330055, 0x223333, 0x440000, 0x000044];
        for(let i=0; i<8; i++) {
            const bw = 0.7 + Math.random()*0.5;
            const bl = 0.9 + Math.random()*0.5;
            const bt = 0.2 + Math.random()*0.1;
            const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bt, bl), new THREE.MeshStandardMaterial({ color: bookCols[i] }));
            bMesh.position.set((Math.random()-0.5)*(cW-1.5), thick + 0.1 + (i*0.2), (Math.random()-0.5)*(cD-1.5));
            bMesh.rotation.y = Math.random() * Math.PI;
            bMesh.rotation.z = (Math.random()-0.5) * 0.3; 
            crateGroup.add(bMesh);
        }
        this.group.add(crateGroup);
    }
};