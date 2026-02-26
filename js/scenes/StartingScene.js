window.App = window.App || {};
window.App.Scenes = window.App.Scenes || {};

window.App.Scenes.StartingScene = class StartingScene {
    constructor(scene, camera) {
        this.scene = scene;
        this.orthoCamera = camera;
        this.perspectiveCamera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 20000);
        
        this.isActive = false;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.group.visible = false;
        
        // State
        this.state = 'WALKING';
        this.subState = 'OFFICE';
        this.hasDriven = false;
        
        // Monkey Intro State
        this.introState = 'WAITING_FOR_PLAYER'; 
        this.monkeyDistance = 0;
        this.monkeySpeedMult = 1.0;
        this.monkeySpeedTimer = 0;
        this.monkeyBoosted = false;
        this.dialogueIndex = 0;
        this.dialogueLines = [
            { name: "Egg", text: "Hey!" },
            { name: "Monkey", text: "Oh, hello there!" },
            { name: "Egg", text: "I'm heading home. Need a lift?" },
            { name: "Monkey", text: "Sure! I'll race you there!" },
            { name: "Egg", text: "You're on!" }
        ];
        
        // Driving State
        this.currentLane = 1; // 0, 1, 2
        this.laneOffset = [-60, 0, 60];
        
        // Boost Logic
        this.boostMax = 2.0;
        this.boostCurrent = 2.0;
        this.isBoosting = false;

        // Curve Logic
        this.driveDistance = 0;
        this.totalLength = 0;
        
        // Input
        this.keys = { up: false, down: false, left: false, right: false, space: false, e: false };
        this.lastLeft = false; 
        this.lastRight = false;
        
        // Lists
        this.obstacles = [];
        this.crossingCars = [];
        this.scenery = [];

        this.initMaterials();
        this.initPath(); // Define the curve
        this.initLevel(); // Build mesh along curve
        this.initLights();
        
        this.startMonkeyIntro();
    }
    
    startMonkeyIntro() {
        this.introState = 'EXITING_BUILDING'; // Animation first
        this.monkeyLane = 0; 
        this.monkeyLaneOffset = -60;
        
        // Monkey Position: Closer to Egg
        // Egg exits to X=-200. Monkey at X=-80.
        const monkeyPos = new THREE.Vector3(-80, -60, 5); 
        
        if(this.monkey) {
            this.monkey.visible = true;
            this.monkey.position.copy(monkeyPos);
            
            // Face somewhat towards Egg (Egg at Y=0, Monkey at Y=-60)
            const tgt = new THREE.Vector3(-200, 0, 15);
            const dx = tgt.x - monkeyPos.x;
            const dy = tgt.y - monkeyPos.y;
            const angle = Math.atan2(dy, dx);
            this.monkey.rotation.set(0, 0, angle); // Manual Z rotation keeps it upright
        }
        
        if(this.monkeyCar) {
            this.monkeyCar.visible = true;
            // Monkey Car parked further up
            const carPos = new THREE.Vector3(50, -60, 2.5);
            this.monkeyCar.position.copy(carPos);
        }
        
        if(this.player) {
            // Egg starts INSIDE the building door (Awning at -290)
            this.player.position.set(-320, 0, 15);
            this.camAngle = 0; 
        }

        if(this.car) {
             // Player Car: Right Side (60) and Further Away (100)
             this.car.position.set(100, 60, 2.5);
             this.car.rotation.set(0,0,0);
             this.currentLane = 2; // Sync state
        }
    }

    initMaterials() {
        this.matPlayer = new THREE.MeshLambertMaterial({ color: 0xFF4081 });
        this.matCar = new THREE.MeshLambertMaterial({ color: 0x2196F3 }); 
        this.matBus = new THREE.MeshLambertMaterial({ color: 0xFFB300 });
        this.matBike = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
        this.matWheel = new THREE.MeshLambertMaterial({ color: 0x333333 });
        this.matWin = new THREE.MeshLambertMaterial({ color: 0x81D4FA, transparent: true, opacity: 0.5 });
        this.matDark = new THREE.MeshLambertMaterial({ color: 0x212121 });
        
        this.matGround = new THREE.MeshLambertMaterial({ color: 0x8BC34A });
        this.matRoad = new THREE.MeshLambertMaterial({ color: 0x455A64 }); 
        this.matLine = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        this.matWater = new THREE.MeshLambertMaterial({ color: 0x29B6F6, transparent: true, opacity: 0.8 });
        
        this.matTreeT = new THREE.MeshLambertMaterial({ color: 0x795548 });
        this.matTreeL = new THREE.MeshLambertMaterial({ color: 0x2E7D32 });
        this.matBuilding = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 }); // White siding
        this.matRoof = new THREE.MeshLambertMaterial({ color: 0x795548 });
        this.matShop = new THREE.MeshLambertMaterial({ color: 0xFFCC80 });
        this.matGlass = new THREE.MeshLambertMaterial({ color: 0x90CAF9, transparent:true, opacity:0.6 });
        this.matTun = new THREE.MeshLambertMaterial({ color: 0x616161, side: THREE.DoubleSide });

        this.matWhite = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
    }

    initLights() {
        const amb = new THREE.AmbientLight(0xFFFFFF, 0.6);
        this.group.add(amb);
        
        const sun = new THREE.DirectionalLight(0xFFFFFF, 0.9);
        sun.position.set(500, -1000, 1500);
        sun.castShadow = true;
        
        sun.shadow.camera.left = -6000;
        sun.shadow.camera.right = 6000;
        sun.shadow.camera.top = 3000;
        sun.shadow.camera.bottom = -3000;
        sun.shadow.mapSize.width = 4096;
        sun.shadow.mapSize.height = 4096;
        this.group.add(sun);
        this.sun = sun;
    }

    initPath() {
        const points = [
            new THREE.Vector3(-500, 0, 0),    
            new THREE.Vector3(0, 0, 0),       
            new THREE.Vector3(2000, 0, 0),    
            new THREE.Vector3(3000, -500, 0), 
            new THREE.Vector3(4500, 0, 0),    
            new THREE.Vector3(6000, 0, 200),  // Hill
            new THREE.Vector3(7500, 0, 0),    
            new THREE.Vector3(9000, 500, 0),  
            new THREE.Vector3(10500, 0, 20),  // Bridge Start
            new THREE.Vector3(11500, 0, 100), 
            new THREE.Vector3(12500, 0, 20),  // Bridge End
            new THREE.Vector3(13500, 0, 0),
            new THREE.Vector3(14500, 0, 0),   // Tunnel Start
            new THREE.Vector3(16500, 0, 0),   
            new THREE.Vector3(18000, 400, 0), // Neighborhood
            new THREE.Vector3(19500, -400, 0),
            new THREE.Vector3(21000, 0, 0),
            new THREE.Vector3(23000, 0, 0),
            new THREE.Vector3(25000, 0, 0)
        ];
        this.path = new THREE.CatmullRomCurve3(points);
        this.totalLength = this.path.getLength();
        
        this.zones = {
            bridge: { start: 10500, end: 12500 },
            tunnel: { start: 14500, end: 16500 },
            neighborhood: { start: 17000, end: 21000 }
        };
    }

    initLevel() {
        // --- ROAD ---
        const shape = new THREE.Shape();
        const w = 110; 
        // Revert to thin road (0 to 2) to ensure visibility of lines/objects
        shape.moveTo(0, -w); 
        shape.lineTo(2, -w); 
        shape.lineTo(2, w); 
        shape.lineTo(0, w); 
        shape.lineTo(0, -w);

        const road = new THREE.Mesh(
            new THREE.ExtrudeGeometry(shape, { steps: 800, bevelEnabled: false, extrudePath: this.path }), 
            this.matRoad
        );
        road.receiveShadow = true;
        this.group.add(road);
        
        this.createRoadLines();
        this.createWater();
        this.createBridge();
        this.createTunnel();
        this.createHillBase(); // Fill gap under hill
        this.createOfficeBuilding();

        // --- GROUND ---
        const bg = new THREE.Mesh(new THREE.BoxGeometry(30000, 15000, 10), this.matGround);
        bg.position.set(11000, 0, -30); // Standard ground level
        bg.receiveShadow = true;
        this.group.add(bg);

        this.generateScenery();
        this.createPlayerCar();
        this.createPlayer();
        
        // Destination House
        // Move further down the road (Total length ~25000)
        const houseT = 24800 / this.totalLength; 
        const endPt = this.path.getPointAt(houseT);
        const housePos = endPt.clone().add(new THREE.Vector3(0, -250, 0));
        this.createHouse(housePos);
        
        this.endCutscenePos = housePos;

        this.createInteractionSign();
        this.generateObstacles();
        this.createMonkeyAndCar();
    }

    createMonkeyAndCar() {
        // MONKEY CAR (Same style as Player Car, Dark Blue)
        const matMonkeyCar = new THREE.MeshLambertMaterial({ color: 0x0D47A1 }); // Dark Blue
        
        this.monkeyCar = new THREE.Group();
        this.monkeyCar.up.set(0, 0, 1);
        
        // Car Body (Copy of Player Car logic)
        const finalBody = new THREE.Mesh(new THREE.BoxGeometry(80, 40, 25), matMonkeyCar);
        finalBody.position.z = 12.5; finalBody.castShadow = false;
        
        const top = new THREE.Mesh(new THREE.BoxGeometry(40, 36, 15), new THREE.MeshLambertMaterial({color: 0x1565C0})); // Lighter Blue Top
        top.position.z = 32.5; top.position.x = -10; top.castShadow = false;
        
        const wG = new THREE.CylinderGeometry(10, 10, 10, 16);
        const w1 = new THREE.Mesh(wG, this.matWheel); w1.position.set(25, 20, 10);
        const w2 = new THREE.Mesh(wG, this.matWheel); w2.position.set(25, -20, 10);
        const w3 = new THREE.Mesh(wG, this.matWheel); w3.position.set(-25, 20, 10);
        const w4 = new THREE.Mesh(wG, this.matWheel); w4.position.set(-25, -20, 10);
        
        this.monkeyCar.add(finalBody); this.monkeyCar.add(top); 
        this.monkeyCar.add(w1); this.monkeyCar.add(w2); this.monkeyCar.add(w3); this.monkeyCar.add(w4);
        
        // Position at start, Lane 0 (approx -60 offset)
        const startPt = this.path.getPointAt(0.02); // Slightly ahead like player car
        const tan = this.path.getTangentAt(0.02);
        const norm = new THREE.Vector3(-tan.y, tan.x, 0).normalize();
        
        const carPos = startPt.clone().add(norm.clone().multiplyScalar(-60)); // Lane 0
        this.monkeyCar.position.copy(carPos);
        
        // Correct Rotation (ZXY order for vehicle)
        this.monkeyCar.rotation.order = 'ZXY';
        const angle = Math.atan2(tan.y, tan.x);
        this.monkeyCar.rotation.set(0, 0, angle);
        
        this.monkeyCar.visible = false;
        this.group.add(this.monkeyCar);
        
        // MONKEY CHARACTER (Better Model)
        this.monkey = new THREE.Group();
        this.monkey.up.set(0, 0, 1); // Fix orientation
        const brownMat = new THREE.MeshLambertMaterial({color: 0x5D4037});
        const tanMat = new THREE.MeshLambertMaterial({color: 0xD7CCC8});
        
        // Body
        const mBody = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 16), brownMat);
        mBody.position.z = 10;
        mBody.scale.set(1, 0.8, 1); // Slight squat
        
        // Head
        const mHead = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 16), brownMat);
        mHead.position.z = 22;
        
        // Face (Snout)
        const mFace = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 16), tanMat);
        mFace.position.set(0, -3, 20); // Front of head (assuming -Y is front? Wait, car looks +X locally? Player looks... wait.)
        // Starting scene: Path goes +X.
        // Player looks along +X?
        // Let's assume standard orientation.
        // If Face is at (0, -3, 20), and Head is at (0, 0, 22). It's slightly down/forward if -Y is forward.
        
        // Cars move along +X (tangent logic).
        // Tangent angle applied to rotation Z.
        // So Local X is "Forward" for car?
        // Let's check `createPlayerCar`.
        // `createPlayerCar`: Body box (80, 25, 40). X=80 length? Yes. So X is Forward.
        // So for Monkey to face Forward (X), face should be at +X relative to center.
        
        mFace.position.set(4, 0, 21); // Forward (+X), slightly down.
        
        // Ears
        const mEarL = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), brownMat);
        mEarL.position.set(-2, 6, 23); // Side (+Y)
        const mEarR = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), brownMat);
        mEarR.position.set(-2, -6, 23); // Side (-Y)
        
        // Tail
        const tailGeo = new THREE.TorusGeometry(10, 1.5, 6, 12, Math.PI); 
        const mTail = new THREE.Mesh(tailGeo, brownMat);
        mTail.position.set(-8, 0, 5); // Back (-X)
        mTail.rotation.y = Math.PI/2;
        mTail.rotation.x = -Math.PI/4;
        
        // Limbs (Arms/Legs)
        const limbGeo = new THREE.CylinderGeometry(1.5, 1.5, 10, 8);
        const armL = new THREE.Mesh(limbGeo, brownMat);
        armL.position.set(0, 8, 14); armL.rotation.z = Math.PI/4;
        const armR = new THREE.Mesh(limbGeo, brownMat);
        armR.position.set(0, -8, 14); armR.rotation.z = -Math.PI/4;
        
        this.monkey.add(mBody); this.monkey.add(mHead); this.monkey.add(mFace);
        this.monkey.add(mEarL); this.monkey.add(mEarR); this.monkey.add(mTail);
        this.monkey.add(armL); this.monkey.add(armR);
        
        // Scale/Rotate to match player orientation logic (if needed)
        this.monkey.visible = false;
        this.group.add(this.monkey);
    }
    
    createHillBase() {
        // Math-calculated Cylinder to perfectly match the hill profile
        // Hill Peak (0, 200) relative to start. Width +-1500.
        // Circle passing through (0, 200) and (1500, 0).
        // Radius R=5725, Center Z=-5525.
        
        const radius = 5725;
        const length = 500; // Width of road area
        const hill = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, length, 64), 
            this.matGround
        );
        // Cylinder default is Y-up. We want it horizontal across the road (Y axis).
        // BUT we need the curvature along X.
        // Default orientation: Axis is Y. Curvature in XZ plane.
        // So axis along Y is correct.
        // Rotate Z so axis is... wait.
        // Default: Axis Y. Circle in XZ.
        // We want Circle in XZ (Side view)? No.
        // We want Circle in XZ plane (Distance vs Height). Correct.
        // So no rotation needed relative to XZ plane geometry?
        // But cylinder is standing up (Y axis).
        // So curved surface is at distance R from Y axis.
        // Road runs along X.
        // We want the Cylinder Axis to be along Y (Across road).
        // And we want the Top Surface to be at Z=200.
        // Cylinder creates a tube around XZ.
        // Wait, if Axis is Y.
        // Vertices satisfy x^2 + z^2 = R^2.
        // So curvature is in XZ plane. This is exactly what we want!
        // We need to rotate it? 
        // Default Cylinder: Axis Y. Top face at Y=H/2.
        // We want Axis along Y.
        // So just rotate.z = PI/2 (Axis becomes X)? No.
        // Rotate X = PI/2 (Axis becomes Z)?
        // Default: Axis Y.
        // We want Axis Y. So Rotation (0,0,0).
        // Position: X=6000. Y=0. Z=-5525.
        // This aligns the axis at Y=0 (horizontal along width), Z=-5525 (deep below).
        // X=6000 (center of hill).
        // This should work perfectly.
        
        hill.rotation.z = Math.PI / 2; // Rotate so axis is along X? No!
        // Wait. Cylinder Geometry is "Tube" along Y axis.
        // We want the "Tube" to run Perpendicular to road (Along Y).
        // Road is X. Hill is Z humps along X.
        // So curvature is in XZ plane.
        // Cylinder geometry has curvature in XZ plane (around Y axis).
        // So we KEEP cylinder axis along Y.
        // So rotation should be 0!
        
        // Wait, CylinderGeometry(radiusTop, radiusBottom, height).
        // Height is along Y axis.
        // We want "Height" to be Road Width (Y).
        // So Axis Y aligns with Road Width Y.
        // So Rotation is (0,0,0)!
        
        hill.position.set(6000, 0, -5525);
        this.group.add(hill);
    }

    createRoadLines() {
        const dashGeo = new THREE.PlaneGeometry(30, 4);
        const count = Math.floor(this.totalLength / 60);
        const instanced = new THREE.InstancedMesh(dashGeo, this.matLine, count * 2);
        const dummy = new THREE.Object3D();
        let idx = 0;
        
        for(let d=20; d<this.totalLength; d+=60) {
            const t = d / this.totalLength;
            if(t>1) break;
            const pt = this.path.getPointAt(t);
            const tan = this.path.getTangentAt(t);
            const angle = Math.atan2(tan.y, tan.x);
            const norm = new THREE.Vector3(-tan.y, tan.x, 0).normalize();
            
            const p1 = pt.clone().add(norm.clone().multiplyScalar(-30));
            dummy.position.copy(p1); dummy.position.z += 2.5;
            dummy.rotation.set(0, 0, angle);
            dummy.updateMatrix();
            instanced.setMatrixAt(idx++, dummy.matrix);
            
            const p2 = pt.clone().add(norm.clone().multiplyScalar(30));
            dummy.position.copy(p2); dummy.position.z += 2.5;
            dummy.rotation.set(0, 0, angle);
            dummy.updateMatrix();
            instanced.setMatrixAt(idx++, dummy.matrix);
        }
        instanced.instanceMatrix.needsUpdate = true;
        this.group.add(instanced);
    }
    
    createWater() {
        const lake = new THREE.Mesh(new THREE.BoxGeometry(3000, 4000, 10), this.matWater);
        lake.position.set(11500, 0, -20);
        this.group.add(lake);
    }
    
    createBridge() {
        const g = new THREE.Group();
        const start = this.zones.bridge.start, end = this.zones.bridge.end;
        for(let d=start; d<=end; d+=200) {
            const t = d/this.totalLength;
            const pt = this.path.getPointAt(t);
            const tan = this.path.getTangentAt(t);
            const norm = new THREE.Vector3(-tan.y, tan.x, 0).normalize();
            
            const p = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 150, 8), this.matBuilding);
            p.position.set(pt.x, pt.y, pt.z - 75);
            p.rotation.x = Math.PI/2; 
            g.add(p);

            const l = pt.clone().add(norm.clone().multiplyScalar(-115));
            const r = pt.clone().add(norm.clone().multiplyScalar(115));
            const postL = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 30), this.matRoof);
            postL.position.copy(l); postL.position.z += 15;
            const postR = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 30), this.matRoof);
            postR.position.copy(r); postR.position.z += 15;
            g.add(postL); g.add(postR);
        }
        this.group.add(g);
    }
    
    createTunnel() {
        const g = new THREE.Group();
        const start = this.zones.tunnel.start, end = this.zones.tunnel.end;
        for(let d=start; d<=end; d+=50) {
            const t = d/this.totalLength;
            const pt = this.path.getPointAt(t);
            const tan = this.path.getTangentAt(t);
            const angle = Math.atan2(tan.y, tan.x);
            const arch = new THREE.Mesh(new THREE.TorusGeometry(140, 20, 4, 8, Math.PI), this.matTun);
            arch.position.copy(pt);
            arch.rotation.x = Math.PI/2;
            arch.rotation.y = angle + Math.PI/2;
            g.add(arch);
        }
        this.group.add(g);
    }
    
    createInteractionSign() {
        // [E] to talk
        const c1 = document.createElement('canvas'); c1.width = 512; c1.height = 128; 
        const ctx1 = c1.getContext('2d'); 
        ctx1.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx1.beginPath(); ctx1.roundRect(10, 10, 492, 108, 20); ctx1.fill();
        ctx1.font = 'bold 40px Arial'; ctx1.fillStyle = '#FFF'; ctx1.textAlign = 'center'; ctx1.textBaseline = 'middle';
        ctx1.fillText("[E] to talk", 256, 64);
        this.texTalk = new THREE.CanvasTexture(c1);
        
        // [Space] to drive
        const c2 = document.createElement('canvas'); c2.width = 512; c2.height = 128; 
        const ctx2 = c2.getContext('2d'); 
        ctx2.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx2.beginPath(); ctx2.roundRect(10, 10, 492, 108, 20); ctx2.fill();
        ctx2.font = 'bold 40px Arial'; ctx2.fillStyle = '#FFF'; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
        ctx2.fillText("[Space] to drive", 256, 64);
        this.texDrive = new THREE.CanvasTexture(c2);

        this.interactSign = new THREE.Mesh(new THREE.PlaneGeometry(120, 30), new THREE.MeshBasicMaterial({ map: this.texTalk, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthTest: false }));
        this.interactSign.up.set(0, 0, 1);
        this.interactSign.visible = false;
        this.group.add(this.interactSign);
    }

    createPlayerCar() {
        const g = new THREE.Group();
        g.up.set(0, 0, 1); 
        const body = new THREE.Mesh(new THREE.BoxGeometry(80, 25, 40), this.matCar);
        body.position.z = 12.5; 
        const finalBody = new THREE.Mesh(new THREE.BoxGeometry(80, 40, 25), this.matCar);
        finalBody.position.z = 12.5; finalBody.castShadow = false;
        const top = new THREE.Mesh(new THREE.BoxGeometry(40, 36, 15), new THREE.MeshLambertMaterial({color: 0x1565C0}));
        top.position.z = 32.5; top.position.x = -10; top.castShadow = false;
        const wG = new THREE.CylinderGeometry(10, 10, 10, 16);
        const w1 = new THREE.Mesh(wG, this.matWheel); w1.position.set(25, 20, 10);
        const w2 = new THREE.Mesh(wG, this.matWheel); w2.position.set(25, -20, 10);
        const w3 = new THREE.Mesh(wG, this.matWheel); w3.position.set(-25, 20, 10);
        const w4 = new THREE.Mesh(wG, this.matWheel); w4.position.set(-25, -20, 10);
        g.add(finalBody); g.add(top); g.add(w1); g.add(w2); g.add(w3); g.add(w4);
        this.car = g;
        this.car.rotation.order = 'ZXY';
        this.group.add(this.car);
    }
    
    createPlayer() {
        // CUTE EGG CHARACTER
        this.player = new THREE.Group();
        
        // Body (Egg shape)
        // Sphere (10) scaled (1, 1, 1.5) means Z is the long axis.
        // In this scene, Z IS UP! So we DO NOT want to rotate X.
        // Original rotation.x = PI/2 turned Z-axis to Y-axis (or -Y).
        // We want Z to point UP. So NO rotation on body.
        
        const eggGeo = new THREE.SphereGeometry(10, 32, 32);
        eggGeo.scale(1, 1, 1.5); // Elongate in Z
        const body = new THREE.Mesh(eggGeo, new THREE.MeshLambertMaterial({color: 0xFFF9C4}));
        body.position.z = 15; // Lift up slightly more
        
        // Eyes need to be positioned on the surface of the egg.
        // Forward direction? 
        // If car moves +X, maybe player faces +X too?
        // Or -Y (Screen Down) is typical for "looking at camera" in top-down views.
        // "Go! Watch out for curves!" -> Driving +X.
        // Let's assume +X is forward.
        
        // Eyes on +X face of sphere.
        const eyeGeo = new THREE.SphereGeometry(2.5, 16, 16);
        const eyeMat = new THREE.MeshBasicMaterial({color: 0x000000});
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(8, -4, 20); // x=8 (front), y=-4 (left?), z=20 (eye level)
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(8, 4, 20);
        
        // Legs
        const legGeo = new THREE.CylinderGeometry(2.5, 2.5, 12, 8);
        const legMat = new THREE.MeshLambertMaterial({color: 0xFFAB91}); 
        
        this.lLeg = new THREE.Mesh(legGeo, legMat);
        this.lLeg.rotation.x = Math.PI/2; 
        this.lLeg.position.set(0, -5, 6);
        
        this.rLeg = new THREE.Mesh(legGeo, legMat);
        this.rLeg.rotation.x = Math.PI/2; 
        this.rLeg.position.set(0, 5, 6);

        this.player.add(body); this.player.add(leftEye); this.player.add(rightEye);
        this.player.add(this.lLeg); this.player.add(this.rLeg);

        const p = this.path.getPoint(0.01);
        this.player.position.copy(p); // Feet on ground (Legs Z=6, H=12 implies bottom at 0)
        this.group.add(this.player);
    }

    createOfficeBuilding() {
        const g = new THREE.Group();
        g.position.set(-400, 0, 0);
        
        // Main Tower
        const b = new THREE.Mesh(new THREE.BoxGeometry(200, 300, 600), this.matBuilding);
        b.position.z = 300; b.castShadow = true;
        
        // Windows
        const wins = new THREE.Mesh(new THREE.BoxGeometry(210, 280, 500), this.matGlass);
        wins.position.z = 300;
        
        // Entrance Awning
        const awning = new THREE.Mesh(new THREE.BoxGeometry(100, 150, 10), this.matRoof);
        awning.position.set(110, 0, 80); // Facing +X
        
        // Pillars
        const p1 = new THREE.Mesh(new THREE.CylinderGeometry(5,5,80), this.matDark);
        p1.rotation.x = Math.PI/2; p1.position.set(150, 60, 40);
        const p2 = new THREE.Mesh(new THREE.CylinderGeometry(5,5,80), this.matDark);
        p2.rotation.x = Math.PI/2; p2.position.set(150, -60, 40);

        g.add(b); g.add(wins); g.add(awning); g.add(p1); g.add(p2);
        
        // Skyscrapers behind
        const s1 = new THREE.Mesh(new THREE.BoxGeometry(150, 150, 800), this.matRoad);
        s1.position.set(-200, 300, 400); 
        const s2 = new THREE.Mesh(new THREE.BoxGeometry(150, 150, 700), this.matRoad);
        s2.position.set(-200, -300, 350);
        
        g.add(s1); g.add(s2);

        this.group.add(g);
    }

    createHouse(pos) {
        const g = new THREE.Group();
        g.position.copy(pos);
        const b = new THREE.Mesh(new THREE.BoxGeometry(150, 150, 100), this.matBuilding);
        b.position.z = 50; b.castShadow=true;
        const r = new THREE.Mesh(new THREE.ConeGeometry(120, 60, 4), this.matRoof);
        r.position.z = 130; r.rotation.x = Math.PI/2; r.rotation.y = Math.PI/4;
        g.add(b); g.add(r);
        this.group.add(g);
    }
    
    createShop(pos, rot) {
        const g = new THREE.Group();
        g.position.copy(pos);
        if(rot) g.rotateZ(rot);
        
        const b = new THREE.Mesh(new THREE.BoxGeometry(160, 120, 90), this.matShop);
        b.position.z = 45; b.castShadow = true;
        
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(140, 60), this.matGlass);
        glass.position.set(0, -61, 40);
        glass.rotation.x = Math.PI/2;
        
        const roof = new THREE.Mesh(new THREE.BoxGeometry(170, 130, 10), this.matRoof);
        roof.position.z = 95;
        
        g.add(b); g.add(glass); g.add(roof);
        this.group.add(g);
    }

    generateScenery() {
        const density = 200;
        for(let d=0; d<this.totalLength; d+=density) {
            const t = d / this.totalLength;
            const pt = this.path.getPointAt(t);
            const tan = this.path.getTangentAt(t);
            const norm = new THREE.Vector3(-tan.y, tan.x, 0).normalize();
            
            let inBridge = (d > this.zones.bridge.start - 200 && d < this.zones.bridge.end + 200);
            let inTunnel = (d > this.zones.tunnel.start && d < this.zones.tunnel.end);
            let inHood = (d > this.zones.neighborhood.start && d < this.zones.neighborhood.end);
            
            if(inBridge || inTunnel) continue; 
            
            let leftDist = 180 + Math.random()*300;
            let rightDist = -(180 + Math.random()*300);
            
            if(inHood) {
                // Mix of Houses and Shops
                if(Math.random() > 0.3) {
                    const pos = pt.clone().add(norm.clone().multiplyScalar(leftDist));
                    if(Math.random() > 0.5) this.createHouse(pos);
                    else {
                        const angle = Math.atan2(norm.y, norm.x) + Math.PI/2;
                        this.createShop(pos, angle);
                    }
                }
                if(Math.random() > 0.3) {
                    const pos = pt.clone().add(norm.clone().multiplyScalar(rightDist));
                    if(Math.random() > 0.5) this.createHouse(pos);
                    else {
                        const angle = Math.atan2(-norm.y, -norm.x) + Math.PI/2;
                        this.createShop(pos, angle);
                    }
                }
            } else {
                if(Math.random() > 0.3) {
                    const p = pt.clone().add(norm.clone().multiplyScalar(leftDist));
                    this.spawnTree(p);
                }
                if(Math.random() > 0.3) {
                    const p = pt.clone().add(norm.clone().multiplyScalar(rightDist));
                    this.spawnTree(p);
                }
            }
        }
    }
    
    spawnTree(pos) {
        const g = new THREE.Group();
        g.position.copy(pos); g.position.z = 0;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(5, 8, 30, 6), this.matTreeT);
        trunk.rotation.x = Math.PI/2; trunk.position.z = 15;
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(30, 80, 8), this.matTreeL);
        leaves.rotation.x = Math.PI/2; leaves.position.z = 60;
        g.add(trunk); g.add(leaves);
        const s = 0.8 + Math.random()*0.5;
        g.scale.set(s,s,s);
        this.group.add(g);
        this.scenery.push(g);
    }

    generateObstacles() {
        this.obstacles = [];
        this.crossingCars = [];
        
        const gap = 500; 
        for(let d=1000; d<this.totalLength - 1000; d+=gap) {
            const t = d / this.totalLength;
            const type = Math.floor(Math.random() * 4);
            const lanes = [0,1,2].sort(()=>0.5-Math.random());
            
            if(type === 0) { this.createBus(t, lanes[0]); } 
            else if(type === 1) { this.createBiker(t, lanes[0]); } 
            else if(type === 2) { this.createOncomingCar(t, lanes[0]); } 
            else { 
                this.createCone(t, lanes[0]);
                if(Math.random()>0.5) this.createCone(t, lanes[1]);
            }
        }
    }
    
    createBus(t, lane) { this.addObs(t, lane, 'BUS'); }
    createBiker(t, lane) { this.addObs(t, lane, 'BIKER'); }
    createOncomingCar(t, lane) { this.addObs(t, lane, 'CAR_ONCOMING'); }
    createCone(t, lane) { this.addObs(t, lane, 'CONE'); }
    
    addObs(t, laneIdx, type) {
        const pt = this.path.getPointAt(t);
        const tan = this.path.getTangentAt(t);
        const norm = new THREE.Vector3(-tan.y, tan.x, 0).normalize(); 
        
        const laneOffset = this.laneOffset[laneIdx];
        const pos = pt.clone().add(norm.clone().multiplyScalar(laneOffset));
        pos.z += 2;
        
        let mesh = new THREE.Group();
        mesh.up.set(0, 0, 1); 

        if(type === 'BUS') {
            const body = new THREE.Mesh(new THREE.BoxGeometry(40, 50, 140), this.matBus);
            body.position.y = 35;
            const windows = new THREE.Mesh(new THREE.BoxGeometry(41, 15, 110), this.matWin);
            windows.position.y = 45; windows.position.z = 5;
            const bumperF = new THREE.Mesh(new THREE.BoxGeometry(40, 10, 5), this.matDark);
            bumperF.position.set(0, 10, 72);
            const bumperB = new THREE.Mesh(new THREE.BoxGeometry(40, 10, 5), this.matDark);
            bumperB.position.set(0, 10, -72);
            const whG = new THREE.CylinderGeometry(9, 9, 10, 16);
            const wh1 = new THREE.Mesh(whG, this.matWheel); wh1.rotation.z = Math.PI/2; wh1.position.set(20, 10, 40);
            const wh2 = new THREE.Mesh(whG, this.matWheel); wh2.rotation.z = Math.PI/2; wh2.position.set(-20, 10, 40);
            const wh3 = new THREE.Mesh(whG, this.matWheel); wh3.rotation.z = Math.PI/2; wh3.position.set(20, 10, -40);
            const wh4 = new THREE.Mesh(whG, this.matWheel); wh4.rotation.z = Math.PI/2; wh4.position.set(-20, 10, -40);
            mesh.add(body); mesh.add(windows); mesh.add(bumperF); mesh.add(bumperB); 
            mesh.add(wh1); mesh.add(wh2); mesh.add(wh3); mesh.add(wh4);
            
        } else if(type === 'BIKER') {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(4, 15, 30), this.matBike);
            frame.position.y = 15;
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 16, 8), this.matDark);
            handle.rotation.z = Math.PI/2; handle.position.set(0, 30, 10);
            const wheelG = new THREE.CylinderGeometry(8, 8, 3, 16);
            const w1 = new THREE.Mesh(wheelG, this.matWheel); w1.rotation.z=Math.PI/2; w1.position.set(0, 8, 15);
            const w2 = new THREE.Mesh(wheelG, this.matWheel); w2.rotation.z=Math.PI/2; w2.position.set(0, 8, -15);
            const body = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 16, 8), this.matPlayer);
            body.position.set(0, 26, -5); 
            const head = new THREE.Mesh(new THREE.SphereGeometry(5), new THREE.MeshLambertMaterial({color:0xFFCCBC}));
            head.position.set(0, 36, -5);
            mesh.add(frame); mesh.add(handle); mesh.add(w1); mesh.add(w2); mesh.add(body); mesh.add(head);

        } else if(type === 'CAR_ONCOMING') {
            const chassis = new THREE.Mesh(new THREE.BoxGeometry(36, 15, 70), new THREE.MeshLambertMaterial({color:0xD32F2F}));
            chassis.position.y = 12;
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 35), this.matWin);
            cabin.position.y = 25; cabin.position.z = -5;
            const lights = new THREE.Mesh(new THREE.BoxGeometry(26, 4, 2), new THREE.MeshBasicMaterial({color:0xFFEB3B}));
            lights.position.set(0, 14, 36); 
            const tail = new THREE.Mesh(new THREE.BoxGeometry(26, 4, 2), new THREE.MeshBasicMaterial({color:0xFF0000}));
            tail.position.set(0, 14, -36);
            const whG = new THREE.CylinderGeometry(7, 7, 8, 16);
            const w1L = new THREE.Mesh(whG, this.matWheel); w1L.rotation.z=Math.PI/2; w1L.position.set(-18, 7, 20);
            const w1R = new THREE.Mesh(whG, this.matWheel); w1R.rotation.z=Math.PI/2; w1R.position.set(18, 7, 20);
            const w2L = new THREE.Mesh(whG, this.matWheel); w2L.rotation.z=Math.PI/2; w2L.position.set(-18, 7, -20);
            const w2R = new THREE.Mesh(whG, this.matWheel); w2R.rotation.z=Math.PI/2; w2R.position.set(18, 7, -20);
            mesh.add(chassis); mesh.add(cabin); mesh.add(lights); mesh.add(tail); 
            mesh.add(w1L); mesh.add(w1R); mesh.add(w2L); mesh.add(w2R);
            
        } else if(type === 'CONE') {
            // Larger Cone
            const c = new THREE.Mesh(new THREE.ConeGeometry(10, 24, 16), new THREE.MeshLambertMaterial({color:0xFF6D00}));
            c.position.y = 12; 
            const base = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 18), new THREE.MeshLambertMaterial({color:0xFF6D00}));
            base.position.y = 2;
            mesh.add(c); mesh.add(base);
        }
        
        mesh.position.copy(pos);
        const lookTgt = pos.clone().add(tan);
        mesh.lookAt(lookTgt); 
        if(type === 'CAR_ONCOMING') mesh.rotateY(Math.PI); 
        this.group.add(mesh);
        
        this.obstacles.push({
            mesh: mesh,
            t: t,
            lane: laneIdx,
            type: type,
            active: true
        });
    }

    enter() {
        this.isActive = true;
        this.group.visible = true;
        this.perspectiveCamera.up.set(0, 0, 1);
        window.App.mainCamera = this.perspectiveCamera;
        
        this.originalFog = this.scene.fog;
        this.scene.fog = new THREE.Fog(0xA1E8FF, 500, 4000); 

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        
        // Hide UI Elements specific to RoomScene
        const ids = ['tools-panel', 'box-controls', 'nav-label'];
        ids.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; });
        
        const inv = document.querySelector('.inventory-panel');
        if(inv) inv.style.display = 'none';
        
        const light = document.querySelector('.light-switch');
        if(light) light.style.display = 'none';
        
        // Create Boost Bar UI
        this.boostBarContainer = document.createElement('div');
        this.boostBarContainer.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); width:300px; height:20px; background:rgba(0,0,0,0.5); border:2px solid white; border-radius:10px; display:none; z-index:100;';
        this.boostBarFill = document.createElement('div');
        this.boostBarFill.style.cssText = 'width:100%; height:100%; background:#00E676; border-radius:8px; transition: width 0.1s linear;';
        this.boostBarContainer.appendChild(this.boostBarFill);
        document.body.appendChild(this.boostBarContainer);
    }

    exit() {
        this.isActive = false;
        this.group.visible = false;
        window.App.mainCamera = this.orthoCamera;
        if(this.originalFog) this.scene.fog = this.originalFog;
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        
        const ids = ['tools-panel', 'box-controls', 'nav-label'];
        ids.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'flex'; });

        const inv = document.querySelector('.inventory-panel');
        if(inv) inv.style.display = 'flex';
        
        const light = document.querySelector('.light-switch');
        if(light) light.style.display = 'flex';
        
        if(this.boostBarContainer) {
            document.body.removeChild(this.boostBarContainer);
            this.boostBarContainer = null;
        }
    }

    handleKeyDown = (e) => {
        if(!this.isActive) return;
        const k = e.key.toLowerCase();
        if(k === 'arrowleft' || k === 'a') this.keys.left = true;
        if(k === 'arrowright' || k === 'd') this.keys.right = true;
        if(k === 'arrowup' || k === 'w') this.keys.up = true;
        if(k === 'arrowdown' || k === 's') this.keys.down = true;
        if(k === ' ') this.keys.space = true;
        if(k === 'e') this.keys.e = true;
    }

    handleKeyUp = (e) => {
        if(!this.isActive) return;
        const k = e.key.toLowerCase();
        if(k === 'arrowleft' || k === 'a') this.keys.left = false;
        if(k === 'arrowright' || k === 'd') this.keys.right = false;
        if(k === 'arrowup' || k === 'w') this.keys.up = false;
        if(k === 'arrowdown' || k === 's') this.keys.down = false;
        if(k === ' ') this.keys.space = false;
        if(k === 'e') this.keys.e = false;
    }

    update(time) {
        if(!this.isActive) return;
        
        const delta = time - (this.lastTime || time);
        this.lastTime = time;
        const dt = Math.min(delta, 0.1); 

        if(this.camAngle === undefined) this.camAngle = Math.PI;

        // --- MONKEY INTRO LOGIC ---
        if(this.introState === 'EXITING_BUILDING') {
            // Auto-walk out of building (from -320 to -200)
            const targetX = -200;
            if(this.player.position.x < targetX) {
                this.player.position.x += 60 * dt; // Walk speed
                // Bobbing (Base 0)
                this.player.position.z = Math.abs(Math.sin(time * 10)) * 2;
                
                // Camera Follow
                const cx = this.player.position.x + 200; // Looking back at building
                this.perspectiveCamera.position.set(cx, 0, 100);
                this.perspectiveCamera.lookAt(this.player.position);
                
            } else {
                this.player.position.x = targetX;
                this.introState = 'WAITING_FOR_PLAYER';
                
                // Allow player control
                this.camAngle = 0; // Look forward
            }
        }
        else if(this.introState === 'WAITING_FOR_PLAYER') {
             const dist = this.player.position.distanceTo(this.monkey.position);
             if(dist < 80) {
                 this.interactSign.visible = true;
                 this.interactSign.material.map = this.texTalk; // Ensure correct texture
                 this.interactSign.position.copy(this.monkey.position).add(new THREE.Vector3(0,0,40));
                 this.interactSign.lookAt(this.perspectiveCamera.position);
                 
                 if(this.keys.e) {
                      this.introState = 'DIALOGUE';
                      this.interactSign.visible = false;
                      this.showDialogue();
                      this.keys.e = false; 
                 }
             } else {
                 if(this.state === 'WALKING') this.interactSign.visible = false;
             }
        }
        else if(this.introState === 'DIALOGUE') {
             if(this.keys.space && !this.lastSpace) {
                 this.advanceDialogue();
             }
             this.lastSpace = this.keys.space;
        }
        else if(this.introState === 'HOPPING') {
            // Monkey hops to car door
            // Car width is 40, so side is at ~20. Target slightly outside at 35.
            const targetPos = this.monkeyCar.position.clone().add(new THREE.Vector3(0, -35, 0)); 
            const dist = this.monkey.position.distanceTo(targetPos);
            
            if(dist > 10) { // Slightly larger threshold to avoid jitter at end
                const dir = targetPos.clone().sub(this.monkey.position).normalize();
                this.monkey.position.add(dir.multiplyScalar(60 * dt)); // Walk speed
                this.monkey.position.z = Math.abs(Math.sin(time * 15)) * 5; // Hop (Base 0)
                
                // Manual LookAt (Z-axis rotation only) to stay upright
                const angle = Math.atan2(dir.y, dir.x);
                this.monkey.rotation.set(0, 0, angle);
            } else {
                // Reached car door, enter immediately
                this.introState = 'WAITING_FOR_RACE';
                this.monkey.visible = false;
                
                // Set monkey car distance to its actual position logic
                // MonkeyCar was at X=50 (set in startMonkeyIntro). 
                this.monkeyDistance = 50; 
            }
        } else if(this.introState === 'DRIVING') {
            // Drive Monkey Car away
            let speed = 500; // Base Player Speed
            
            // Scripted Overtake Logic
            if(this.driveDistance > 14500 && !this.monkeyBoosted) {
                this.monkeyBoosted = true;
                // If behind, rubber-band to just behind player to ensure visible overtake
                if(this.monkeyDistance < this.driveDistance) {
                    this.monkeyDistance = this.driveDistance - 500;
                }
            }

            if(this.monkeyBoosted) {
                // Uber Boost to ensure overtake
                speed = 1200; 
            } else {
                // Standard Oscillation
                this.monkeySpeedMult = 0.95 + Math.sin(time * 1.5) * 0.25;
                speed *= this.monkeySpeedMult;
            }

            this.monkeyDistance += speed * dt;
            
            // --- AI LANE SWITCHING ---
            const lookAheadDist = 600;
            // Check if current lane is blocked ahead
            const isBlocked = this.obstacles.some(o => {
                if(!o.active) return false;
                const obsDist = o.t * this.totalLength;
                return o.lane === this.monkeyLane && obsDist > this.monkeyDistance && obsDist < this.monkeyDistance + lookAheadDist;
            });

            if(isBlocked) {
                // Try to switch 
                // Prefer Lane 0 -> 1 -> 2
                // Or simply: check adjacent lanes
                const tryLanes = [];
                if(this.monkeyLane > 0) tryLanes.push(this.monkeyLane - 1);
                if(this.monkeyLane < 2) tryLanes.push(this.monkeyLane + 1);
                
                let foundSafe = false;
                for(let lane of tryLanes) {
                    const safe = !this.obstacles.some(o => {
                        if(!o.active) return false;
                        const obsDist = o.t * this.totalLength;
                        return o.lane === lane && obsDist > this.monkeyDistance && obsDist < this.monkeyDistance + lookAheadDist;
                    });
                    if(safe) {
                        this.monkeyLane = lane;
                        foundSafe = true;
                        break;
                    }
                }
            }
            // ------------------------

            // Hide only if far ahead AND total length done
            if(this.monkeyDistance > this.totalLength + 2000) { 
                 this.monkeyCar.visible = false;
                 this.introState = 'DONE';
            } else {
                let tickDist = this.monkeyDistance;
                if(tickDist > this.totalLength) tickDist = this.totalLength; // Clamp for path calc

                const t = tickDist / this.totalLength;
                const pt = this.path.getPointAt(t);
                const tan = this.path.getTangentAt(t);
                const norm = new THREE.Vector3(-tan.y, tan.x, 0).normalize();
                
                // Handle Lane Movement
                const targetOffset = this.laneOffset[this.monkeyLane];
                const lerpFactor = 1 - Math.pow(0.01, dt); 
                this.monkeyLaneOffset += (targetOffset - this.monkeyLaneOffset) * lerpFactor;

                const pos = pt.clone().add(norm.clone().multiplyScalar(this.monkeyLaneOffset));
                pos.z += 2.5;
                const angle = Math.atan2(tan.y, tan.x);
                
                this.monkeyCar.position.copy(pos);
                this.monkeyCar.rotation.set(0,0,angle);
            }
        }
        // --------------------------

        if(this.state === 'WALKING') {
            // Block movement during dialogue
            if(this.introState === 'DIALOGUE') return;

            const camRotSpeed = 0.04;
            if(this.keys.left) this.camAngle += camRotSpeed;
            if(this.keys.right) this.camAngle -= camRotSpeed;
            
            let move = 0;
            if(this.keys.up) move = 2.0;
            if(this.keys.down) move = -2.0;
            
            if(move !== 0) {
                 const dx = -Math.cos(this.camAngle);
                 const dy = -Math.sin(this.camAngle);
                 this.player.position.x += dx * move;
                 this.player.position.y += dy * move;
                 
                 // Better Walking Animation
                 const walkCycle = time * 15;
                 this.player.position.z = Math.abs(Math.sin(walkCycle)) * 2; // Bounce
                 
                 // Leg Swing
                 if(this.lLeg && this.rLeg) {
                     this.lLeg.rotation.y = Math.sin(walkCycle) * 0.5;
                     this.rLeg.rotation.y = Math.sin(walkCycle + Math.PI) * 0.5;
                 }
            } else {
                 if(this.lLeg) this.lLeg.rotation.y = 0;
                 if(this.rLeg) this.rLeg.rotation.y = 0;
                 this.player.position.z = 0;
            }
            
            const cx = this.player.position.x + Math.cos(this.camAngle) * 200;
            const cy = this.player.position.y + Math.sin(this.camAngle) * 200;
            this.perspectiveCamera.position.lerp(new THREE.Vector3(cx, cy, this.player.position.z+100), 0.1);
            this.perspectiveCamera.lookAt(this.player.position);
            
            // Interaction Logic (Car Entry Only)
            // Only allow driving AFTER talking to monkey (WAITING_FOR_RACE)
            if(!this.hasDriven && this.introState === 'WAITING_FOR_RACE') {
                const carPos = this.car.position.clone();
                const dist = this.player.position.distanceTo(carPos);
                
                if(dist < 150) { 
                     this.interactSign.visible = true;
                     this.interactSign.material.map = this.texDrive; 
                     this.interactSign.position.copy(carPos).add(new THREE.Vector3(0, 0, 100)); // Higher visibility
                     this.interactSign.lookAt(this.perspectiveCamera.position);

                     if(this.keys.space) {
                         this.state = 'DRIVING';
                         this.introState = 'DRIVING'; // Start Race
                         
                         this.player.visible = false;
                         this.interactSign.visible = false;
                         
                         // Start at car position (X=100) (From setup)
                         // But driveDistance is "distance along path".
                         // Car at X=100 is approx 100 on path.
                         this.driveDistance = 100; 
                         this.currentLane = 2; 
                         window.App.UIManager.showToast("Go! Watch out for curves!");
                     }
                } else {
                    this.interactSign.visible = false;
                }
            }
        }
        else if(this.state === 'DRIVING') {
            // Show Boost Bar
            this.boostBarContainer.style.display = 'block';
            
            let speed = 500.0;
            
            // Boost Logic (Space)
            // Need to check specific collision timers to allow/disallow boosting?
            // Usually boost overrides normal speed, but not collision penalties?
            // "If they press space, it makes them go 1.5x speed"
            // If bouncing or slowed, boost probably shouldn't work fully?
            // Let's assume Boosting is intentional and consumes bar.
            
            let canBoost = true;
            if(this.bounceTimer && time < this.bounceTimer) canBoost = false;
            
            if(this.keys.space && this.boostCurrent > 0 && canBoost) {
                speed *= 1.5;
                this.boostCurrent -= dt;
                if(this.boostCurrent < 0) this.boostCurrent = 0;
            } else {
                // Regen slowly? (Optional, but good UX)
                if(this.boostCurrent < this.boostMax) {
                    this.boostCurrent += dt * 0.5; // 4s to full regen
                }
            }
            
            // Update UI
            const pct = (this.boostCurrent / this.boostMax) * 100;
            this.boostBarFill.style.width = pct + '%';
            this.boostBarFill.style.background = (pct < 20) ? '#FF5252' : '#00E676';
            
            // Collision Effects
            if(this.bounceTimer && time < this.bounceTimer) {
                speed = -300.0; // Bounce Backwards
            }
            else if(this.slowTimer && time < this.slowTimer) {
                speed = 100.0; // Slowed down
            }
            
            this.driveDistance += speed * dt;
            if(this.driveDistance < 0) this.driveDistance = 0; // Clamp
            
            let t = this.driveDistance / this.totalLength;
            if(t > 0.99) t = 0.99; // Safety

            // Trigger cutscene closer to the new house position (24800)
            if(this.driveDistance > 24500) { 
                this.state = 'CUTSCENE'; 
                this.subState=0; 
            }
            
            if(this.keys.left && !this.lastLeft) if(this.currentLane < 2) this.currentLane++;
            this.lastLeft = this.keys.left;
            if(this.keys.right && !this.lastRight) if(this.currentLane > 0) this.currentLane--;
            this.lastRight = this.keys.right;
            
            const pt = this.path.getPointAt(t);
            const tan = this.path.getTangentAt(t);
            const norm = new THREE.Vector3(-tan.y, tan.x, 0).normalize();
            
            // Lane Logic
            if(!this.currentLaneOffset) this.currentLaneOffset = 0;
            const tgtOffset = this.laneOffset[this.currentLane];
            const lerpFactor = 1 - Math.pow(0.1, dt * 5); 
            this.currentLaneOffset += (tgtOffset - this.currentLaneOffset) * lerpFactor;
            
            // Position Car
            const carPos = pt.clone().add(norm.clone().multiplyScalar(this.currentLaneOffset));
            carPos.z += 2.5; 
            const angle = Math.atan2(tan.y, tan.x);
            this.car.position.copy(carPos);
            this.car.rotation.set(0, 0, angle);

            // Camera
            const camPos = carPos.clone().sub(tan.clone().multiplyScalar(200));
            camPos.z += 100;
            this.perspectiveCamera.position.set(camPos.x, camPos.y, camPos.z);
            this.perspectiveCamera.lookAt(carPos.clone().add(new THREE.Vector3(0,0,20)));
            
            // Collision Detection
            // Only check if moving forward and not bouncing
            if(speed > 0 && (!this.bounceTimer || time > this.bounceTimer)) {
                const playerL = 80;
                const playerW = 40;

                this.obstacles.forEach(o => {
                    if(!o.active) return;
                    const obsDist = o.t * this.totalLength;
                    const distDiff = obsDist - this.driveDistance; // Positive if ahead (obstacle is further along track)
                    
                    // Determine Obstacle Size
                    let obsL = 70, obsW = 40;
                    if(o.type === 'BUS') { obsL = 140; obsW = 40; }
                    else if(o.type === 'BIKER') { obsL = 30; obsW = 15; }
                    else if(o.type === 'CAR_ONCOMING') { obsL = 70; obsW = 36; }
                    else if(o.type === 'CONE') { obsL = 18; obsW = 18; }

                    // Check Longitudinal Overlap (Hitbox Length)
                    // Allow some leniency (0.8 factor) so you don't hit "air"
                    const minL = (playerL + obsL) / 2 * 0.85;

                    if(Math.abs(distDiff) < minL) {
                        const obsLat = this.laneOffset[o.lane];
                        const latDist = Math.abs(this.currentLaneOffset - obsLat);
                        
                        // Check Lateral Overlap (Hitbox Width)
                        // Make hitboxes skinny (0.6 factor) to allow tight squeezing
                        const minW = (playerW + obsW) / 2 * 0.6;
                        
                        if(latDist < minW) {
                            if(o.type === 'CONE') {
                                // Slow Interaction
                                this.slowTimer = time + 1.0;
                                window.App.UIManager.showToast("Slowed Down!");
                                o.active = false; // Consume cone
                                o.mesh.visible = false;
                            } else {
                                // Crash Interaction
                                this.bounceTimer = time + 0.5; // Short bounce
                                window.App.UIManager.showToast("Ouch!");
                            }
                        }
                    }
                });
            }
        }
        else if(this.state === 'CUTSCENE') {
             // Camera follows player walking to house
             const targetPos = this.player.visible ? this.player.position : (this.endCutscenePos || new THREE.Vector3(24800, 200, 0));
             const camOffset = new THREE.Vector3(-200, -150, 150);
             const camPos = targetPos.clone().add(camOffset);
             this.perspectiveCamera.position.lerp(camPos, 0.05);
             this.perspectiveCamera.lookAt(targetPos);
             
             if(this.subState === 0) {
                 // Exit Car
                 this.subState = 1;
                 this.player.visible = true;
                 // Place player next to car
                 const carPos = this.car.position.clone();
                 this.player.position.copy(carPos).add(new THREE.Vector3(0, -40, 0)); // Next to driver side
                 this.camAngle = Math.PI / 2; // Face house (approx)
             }
             else if(this.subState === 1) {
                 // Walk to House
                 const housePos = this.endCutscenePos.clone();
                 // Target is door facing the road. House is at Y=-250. Road at Y=0.
                 // So "Front" is +Y side of house relative to house center.
                 // House Width 150 -> Half 75.
                 // Target slightly inside/at threshold: +60.
                 const doorPos = housePos.clone().add(new THREE.Vector3(0, 60, 0)); 
                 
                 const dist = this.player.position.distanceTo(doorPos);
                 if(dist > 10) {
                     const dir = doorPos.clone().sub(this.player.position).normalize();
                     const speed = 100 * dt;
                     this.player.position.add(dir.multiplyScalar(speed));
                     // Bobbing animation
                     this.player.position.z = 10 + Math.sin(time * 15) * 2;
                 } else {
                     // Reached Door
                     this.subState = 2;
                     window.App.UIManager.showToast("Welcome Home!");
                     
                     // Trigger Fade Out
                     if(window.App.UIManager.fadeOut) window.App.UIManager.fadeOut(1500);
                     
                     setTimeout(() => {
                         if(this.onComplete) this.onComplete();
                     }, 1500); // Wait for fade
                 }
             }
        }
    }
    
    handleCrash(msg) {
        // Legacy: Unused now replaced by inline logic, but kept for safety
    }
    
    handleSuccess() {
        this.state = 'WALKING';
        this.hasDriven = true;
        this.player.visible = true;
        const pt = this.path.getPoint(0.98);
        this.player.position.copy(pt);
        this.camAngle = Math.PI;
    }

    resetPositions() {
        this.player.position.set(-200, 0, 0);
        // Player Car: Right Side (60) and Further Away (100)
        this.car.position.set(100, 60, 2.5);
        this.car.rotation.set(0,0,0); 
        this.currentLane = 2; // Lane 2 is Right (60)
        this.state = 'WALKING';
        this.lastTime = 0; 
        this.player.visible = true;
        this.camAngle = Math.PI; 
    }

    skipToEnd() {
        // Skip essentially fast-forwards to just before the cutscene triggers
        // so we can watch the auto-walk logic.
        this.driveDistance = 24501; // Just past trigger threshold (24500)
        this.state = 'CUTSCENE';
        this.subState = 0;
        
        // Move car to end
        const t = this.driveDistance / this.totalLength;
        const pt = this.path.getPointAt(t);
        const tan = this.path.getTangentAt(t);
        const angle = Math.atan2(tan.y, tan.x);
        this.car.position.copy(pt);
        this.car.position.z += 2.5; 
        this.car.rotation.set(0, 0, angle);

        window.App.UIManager.showToast("Skipped to Arrival!");
    }

    showDialogue() {
        const overlay = document.getElementById('dialogue-overlay');
        const nameEl = document.getElementById('dialogue-name');
        const textEl = document.getElementById('dialogue-text');
        
        if(this.dialogueIndex < this.dialogueLines.length) {
            const line = this.dialogueLines[this.dialogueIndex];
            overlay.style.display = 'block';
            nameEl.textContent = line.name;
            textEl.textContent = line.text;
            
            if(line.name === 'Egg') nameEl.style.color = '#ff477e';
            else nameEl.style.color = '#ffb300';
            
        } else {
            // End Dialogue
            overlay.style.display = 'none';
            this.introState = 'HOPPING';
        }
    }
    
    advanceDialogue() {
        this.dialogueIndex++;
        this.showDialogue();
    }

    onPointerDown() { return false; }
    onDrop() { return false; }
};