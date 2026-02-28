window.App = window.App || {};
window.App.Scenes = window.App.Scenes || {};

window.App.Scenes.TitleScene = class TitleScene {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.isActive = false;
        this.lastTime = 0;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.group.visible = false;
        
        // --- VALENTINE THEME ---
        // Romantic Lighting
        const ambient = new THREE.AmbientLight(0x220011, 0.5);
        this.group.add(ambient);

        const pointLight = new THREE.PointLight(0xff69b4, 1.5, 100);
        pointLight.position.set(20, 20, 20);
        this.group.add(pointLight);

        const pointLight2 = new THREE.PointLight(0x8a2be2, 1.0, 100);
        pointLight2.position.set(-20, -10, 10);
        this.group.add(pointLight2);

        // Floating Hearts (More elegant geometry)
        this.hearts = [];
        const heartShape = new THREE.Shape();
        const x = 0, y = 0;
        heartShape.moveTo(x + 5, y + 5);
        heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
        heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
        heartShape.bezierCurveTo(x - 6, y + 11, x - 2, y + 15.4, x + 5, y + 19);
        heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
        heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
        heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

        const heartGeo = new THREE.ExtrudeGeometry(heartShape, { 
            depth: 2, 
            bevelEnabled: true, 
            bevelSegments: 5, 
            steps: 2, 
            bevelSize: 1, 
            bevelThickness: 1 
        });
        
        // Material: Glossy/Silky
        const heartMat = new THREE.MeshPhongMaterial({ 
            color: 0xffadc9, 
            emissive: 0x330011,
            shininess: 100,
            specular: 0xffffff,
            flatShading: false
        });

        const heartCount = 60; // Increased count
        for(let i=0; i<heartCount; i++) {
             const mesh = new THREE.Mesh(heartGeo, heartMat);
             
             // Wider spread to cover right side, plus extra bias to ensure fullness
             // Range -120 to +120 covers wide screens better
             const spreadX = 240; 
             const posX = (Math.random() - 0.5) * spreadX;
             
             mesh.position.set(
                 posX,
                 (Math.random() - 0.5) * 80,
                 (Math.random() - 0.5) * 60 - 20
             );
             mesh.rotation.z = Math.PI; 
             mesh.rotation.y = Math.random() * Math.PI;
             const scale = 0.5 + Math.random() * 0.5;
             mesh.scale.set(scale, scale, scale);
             
             mesh.userData = {
                 speedY: 2.0 + Math.random() * 4.0, // Speed in units per SECOND
                 rotSpeed: (Math.random() - 0.5) * 1.0, // Rotation per SECOND
                 initialY: mesh.position.y,
                 offset: Math.random() * 100
             };
             this.group.add(mesh);
             this.hearts.push(mesh);
        }

        // --- TEXT OVERLAY ---
        this.titleOverlay = document.createElement('div');
        this.titleOverlay.id = 'title-overlay';
        this.titleOverlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            background: linear-gradient(rgba(20, 0, 10, 0.6), rgba(40, 0, 20, 0.8));
            pointer-events: auto; cursor: pointer;
            z-index: 2000; opacity: 0; transition: opacity 2s ease-in-out;
            text-align: center;
        `;
        
        const container = document.createElement('div');
        container.style.cssText = `
            border: 2px solid rgba(255, 255, 255, 0.2);
            padding: 4rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            backdrop-filter: blur(5px);
            box-shadow: 0 0 30px rgba(255, 105, 180, 0.2);
        `;

        const toText = document.createElement('h3');
        toText.textContent = "To Vidhi";
        toText.style.cssText = `
            color: #fff0f5; 
            font-family: 'Georgia', serif; 
            font-size: 1.5rem; 
            letter-spacing: 0.1em;
            margin-bottom: 1rem;
            text-transform: uppercase;
            font-weight: 300;
        `;

        const mainText = document.createElement('h1');
        mainText.innerHTML = "Happy<br>Valentine's Day"; 
        mainText.style.cssText = `
            color: #ffb7c5; 
            font-family: 'Brush Script MT', 'Lucida Handwriting', cursive; 
            font-size: 5rem; 
            line-height: 1.2;
            text-shadow: 0 0 15px rgba(255, 20, 147, 0.6);
            margin: 1rem 0;
            font-weight: normal;
        `;

        const fromText = document.createElement('h3');
        fromText.textContent = "Love, Vinny";
        fromText.style.cssText = `
            color: #fff0f5; 
            font-family: 'Brush Script MT', 'Lucida Handwriting', cursive; 
            font-size: 2.5rem; 
            margin-top: 2rem;
            opacity: 0.9;
        `;
        
        this.subText = document.createElement('p');
        this.subText.textContent = "( click to continue )";
        this.subText.style.cssText = `
            color: #ffffff;
            font-family: 'Arial', sans-serif;
            font-size: 0.9rem;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            margin-top: 4rem;
            opacity: 0.5;
            animation: pulse 2s infinite;
        `;
        
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes pulse { 
                0% { opacity: 0.3; } 
                50% { opacity: 0.7; } 
                100% { opacity: 0.3; } 
            }
        `;
        document.head.appendChild(style);

        container.appendChild(toText);
        container.appendChild(mainText);
        container.appendChild(fromText);
        this.titleOverlay.appendChild(container);
        this.titleOverlay.appendChild(this.subText);
        document.body.appendChild(this.titleOverlay);
        
        this.titleOverlay.addEventListener('click', () => this.handleProceed());
    }

    enter() {
        this.isActive = true;
        this.group.visible = true;
        this.titleOverlay.style.display = 'flex';
        this.lastTime = performance.now() / 1000; // Init time
        
        setTimeout(() => {
            this.titleOverlay.style.opacity = 1;
        }, 100);
        
        this.camera.position.set(0, 0, 80);
        this.camera.lookAt(0, 0, 0);
        this.camera.zoom = 1.0;
        this.camera.updateProjectionMatrix();

        if(this.scene.fog) {
            this.originalFog = this.scene.fog;
            this.scene.fog = new THREE.Fog(0x1a050a, 40, 150); 
        }
        
        const ui = document.getElementById('ui-layer');
        if(ui) ui.style.display = 'none';
        
        document.body.style.background = '#000';
    }

    exit() {
        this.isActive = false;
        
        this.titleOverlay.style.opacity = 0;
        setTimeout(() => {
            this.titleOverlay.style.display = 'none';
        }, 1200);
        
        this.group.visible = false;
        if(this.originalFog) this.scene.fog = this.originalFog;
        
        const ui = document.getElementById('ui-layer');
        if(ui) ui.style.display = 'block';
    }

    update(time) {
        if(!this.isActive) return;

        // Calculate delta time to ensure consistent speed regardless of framerate
        // time passed in is total elapsed time from main loop
        const delta = time - this.lastTime;
        this.lastTime = time;

        // Safety cap for delta (prevent huge jumps if tab was inactive)
        const dt = Math.min(delta, 0.1); 
        
        this.hearts.forEach(h => {
             // Gentle floating - accumulate position based on dt
             // Oscillation can still use 'time' for phase
             const bob = Math.sin(time + h.userData.offset) * 10.0; // Bob amount
             
             // Move UP continuously
             h.position.y += h.userData.speedY * dt;
             
             // Rotation updates
             h.rotation.y += h.userData.rotSpeed * dt;
             h.rotation.z += Math.cos(time * 0.5 + h.userData.offset) * 0.5 * dt; 
             
             // Loop
             if(h.position.y > 60) h.position.y = -60;
        });
        
        // Rotate camera slightly for parallax (Time based is fine here as it's absolute position)
        this.camera.position.x = Math.sin(time * 0.1) * 5;
        this.camera.position.y = Math.cos(time * 0.1) * 5;
        this.camera.lookAt(0, 0, 0);
    }

    handleProceed() {
        if(!this.isActive) return;
        
        // Start Music
        if(window.App.Utils.MusicManager) {
            if(!window.App.music) window.App.music = new window.App.Utils.MusicManager();
            window.App.music.start();
        }

        if(this.onComplete) this.onComplete();
    }
    
    onPointerDown() {}
    onDrop() {}
};