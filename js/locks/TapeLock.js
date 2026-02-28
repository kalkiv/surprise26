window.App = window.App || {};
window.App.Locks = window.App.Locks || {};

window.App.Locks.TapeLock = class {
    constructor() {
        this.mesh = new THREE.Group();
        this.createMesh();
    }

    createMesh() {
        const width = 3.5;
        const height = 2.2;
        const geo = new THREE.BoxGeometry(width, height, 0.05);
        geo.translate(width / 2, 0, 0); 
        
        const boxColor = (window.App.CONFIG && window.App.CONFIG.colors) ? window.App.CONFIG.colors.heart : 0xff69b4;
        
        const mat = new THREE.MeshStandardMaterial({ 
            color: boxColor, 
            roughness: 0.3,
            metalness: 0.1,
            side: THREE.DoubleSide,
        });
        
        this.tapeMesh = new THREE.Mesh(geo, mat);
        
        this.pivotGroup = new THREE.Group();
        this.pivotGroup.position.set(-width / 2, 0, 0);
        
        this.pivotGroup.add(this.tapeMesh);
        this.mesh.add(this.pivotGroup);

        const hitboxGeo = new THREE.BoxGeometry(width, height, 0.2);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitbox.userData = { isLock: true, type: 'TAPE' };
        this.mesh.add(hitbox);
    }

    animateSolve(containerCallback) {
        if(window.App.music) window.App.music.playSFX('tape'); // SFX

        const targetRotY = -Math.PI / 1.5; 
        
        // 1. Peel Phase
        new window.TWEEN.Tween(this.pivotGroup.rotation)
            .to({ y: targetRotY }, 800)
            .easing(window.TWEEN.Easing.Circular.Out)
            .start();
        
        // 2. Detach Phase
        const m = this.mesh;
        new window.TWEEN.Tween(m.position)
            .to({ y: m.position.y + 10, x: m.position.x - 5 }, 600)
            .delay(600)
            .easing(window.TWEEN.Easing.Quadratic.In)
            .start();
            
        new window.TWEEN.Tween(m.scale)
            .to({ x:0, y:0, z:0 }, 400)
            .delay(1000)
            .onComplete(() => {
                m.visible = false;
                if(containerCallback) containerCallback();
            })
            .start();
    }
};