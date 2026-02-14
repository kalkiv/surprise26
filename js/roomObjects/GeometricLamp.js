window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.GeometricLamp = class GeometricLamp {
    constructor() {
        this.group = new THREE.Group();
        this.isOn = true;
        this.light = null;
        this.bulbMat = null;
        this.init();
    }

    init() {
        // Tag base group for easier identification
        this.group.userData = { isLamp: true, instance: this };

        const legMat = new THREE.MeshStandardMaterial({ 
            color: 0xDEB887, // Light Brown / Burlywood
            roughness: 0.6, 
            metalness: 0.1 
        });

        // "Geometric Ball" Shade
        this.bulbMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF, 
            emissive: 0xFFFFE0,
            emissiveIntensity: 0.6,
            roughness: 0.2,
            metalness: 0.1,
            flatShading: true,
            transparent: true,
            opacity: 0.95
        });

        // 1. The Sphere (Shade) - Larger Shapes (Detail 0), Larger Size
        // Shade Lowered (Y=3.5)
        const shadeGeo = new THREE.IcosahedronGeometry(4.5, 0); 
        const shade = new THREE.Mesh(shadeGeo, this.bulbMat);
        shade.position.y = 3.5; 
        shade.castShadow = true; 
        shade.userData = { isLamp: true, instance: this };
        this.group.add(shade);

        // Wireframe 
        const wireframe = new THREE.LineSegments(
            new THREE.WireframeGeometry(shadeGeo),
            new THREE.LineBasicMaterial({ color: 0x555555, opacity: 0.2, transparent: true })
        );
        wireframe.position.copy(shade.position);
        wireframe.rotation.copy(shade.rotation);
        wireframe.userData = { isLamp: true, instance: this };
        this.group.add(wireframe);

        // 2. Minimalist Quad Legs (4 Legs, Shorter)
        const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 4, 8); // Shorter Legs (Length 4)
        
        for(let i=0; i<4; i++) {
            const leg = new THREE.Mesh(legGeo, legMat);
            const angle = (i * Math.PI * 2) / 4;
            const rBase = 1.5; 
            
            leg.position.set(
                Math.cos(angle) * rBase, 
                1.5, // Center Y of leg
                Math.sin(angle) * rBase
            );
            
            leg.lookAt(0, 3.5, 0); 
            leg.rotateX(-Math.PI / 2); 
            
            leg.castShadow = true;
            leg.userData = { isLamp: true, instance: this };
            this.group.add(leg);
        }

        // 3. Yellow Flower Vine (Arching to side)
        const vineGroup = new THREE.Group();
        // Lower Start Position
        vineGroup.position.y = 7.5; // Top of sphere (3.5 + 4.0 = 7.5) roughly
        
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1, 2, 0),
            new THREE.Vector3(3, 1, 0),
            new THREE.Vector3(4, -1, 0)
        ]);
        
        const vineGeo = new THREE.TubeGeometry(curve, 20, 0.1, 8, false);
        const vineMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const vine = new THREE.Mesh(vineGeo, vineMat);
        vineGroup.add(vine);

        // Many Yellow-Orange Flowers along the curve
        // Larger (0.8) and Orangish Yellow (0xFFC000)
        const flowerMat = new THREE.MeshStandardMaterial({ color: 0xFFC000, emissive: 0xAA6600 });
        const flowerCount = 6;
        for(let i=1; i<=flowerCount; i++) {
            const t = i / flowerCount;
            const point = curve.getPoint(t);
            const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), flowerMat);
            flower.position.copy(point);
            // Random rotation
            flower.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
            vineGroup.add(flower);
        }
        
        this.group.add(vineGroup);

        // 4. Light Source
        this.light = new THREE.PointLight(0xFFD700, 0.8, 25);
        this.light.position.y = 3.5; 
        this.group.add(this.light);
    }

    toggle() {
        this.isOn = !this.isOn;
        
        if(this.isOn) {
            // Turn On
            this.bulbMat.emissive.setHex(0xFFFFE0);
            this.bulbMat.emissiveIntensity = 0.6;
            this.light.intensity = 0.8;
            // Optional: little audio cue could go here
        } else {
            // Turn Off
            this.bulbMat.emissive.setHex(0x111111); // Dim glow or dark
            this.bulbMat.emissiveIntensity = 0.1;
            this.light.intensity = 0;
        }
    }
};