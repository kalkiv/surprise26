window.App = window.App || {};
window.App.Locks = window.App.Locks || {};

window.App.Locks.DigitLock = class {
    constructor(solution = ['1', '2', '3', '4']) {
        this.mesh = new THREE.Group();
        this.solution = solution;
        this.current = new Array(solution.length).fill('A');
        this.digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        this.textures = []; 
        this.activeSlot = null; 
        this.isSolved = false;
        
        this.createMesh();
    }

    createMesh() {
        const count = this.solution.length;
        const spacing = 1.0;
        const width = count * spacing + 0.5;
        
        const plateGeo = new THREE.BoxGeometry(width, 0.4, 3.5);
        const plateMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.castShadow = true;
        plate.receiveShadow = true;
        plate.userData = { isDigitLockParts: true }; 
        this.mesh.add(plate);

        const startX = -((count - 1) * spacing) / 2;
        
        for(let i=0; i<count; i++) {
            const x = startX + (i * spacing);
            
            const digitCanvas = document.createElement('canvas');
            digitCanvas.width = 64; 
            digitCanvas.height = 64;
            const ctx = digitCanvas.getContext('2d');
            
            const tex = new THREE.CanvasTexture(digitCanvas);
            this.textures.push({ tex, ctx, index: i }); // No initial update, will call loop after
            
            const displayGeo = new THREE.PlaneGeometry(0.8, 0.8);
            const displayMat = new THREE.MeshBasicMaterial({ map: tex });
            const display = new THREE.Mesh(displayGeo, displayMat);
            display.position.set(x, 0.22, -0.5); 
            display.rotation.x = -Math.PI / 2; 
            this.mesh.add(display);
            
            const arrowGeo = new THREE.ConeGeometry(0.25, 0.5, 4); 
            const arrowMat = new THREE.MeshStandardMaterial({ 
                color: 0xffd700, 
                emissive: 0x333300, 
                roughness: 0.2,
                metalness: 0.5
            });
            
            const upArrow = new THREE.Mesh(arrowGeo, arrowMat);
            upArrow.position.set(x, 0.25, -1.3);
            upArrow.rotation.x = -Math.PI / 2; 
            upArrow.userData = { isDigitLockParts: true, action: 'up', slotIndex: i };
            this.mesh.add(upArrow);

            const downArrow = new THREE.Mesh(arrowGeo, arrowMat);
            downArrow.position.set(x, 0.25, 0.3);
            downArrow.rotation.x = Math.PI / 2; 
            downArrow.userData = { isDigitLockParts: true, action: 'down', slotIndex: i };
            this.mesh.add(downArrow);
            
            // Initial render
            this.updateTexture(i);
        }

        const btnGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
        const btnMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.submitBtn = new THREE.Mesh(btnGeo, btnMat);
        this.submitBtn.position.set(0, 0.25, 1.0);
        this.submitBtn.userData = { isDigitLockParts: true, action: 'submit' };
        this.mesh.add(this.submitBtn);

        const lightGeo = new THREE.SphereGeometry(0.15, 16, 16);
        
        this.redLightMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff0000, emissiveIntensity: 0 });
        this.redLight = new THREE.Mesh(lightGeo, this.redLightMat);
        this.redLight.position.set(1.5, 0.25, 1.0); 
        this.mesh.add(this.redLight);

        this.greenLightMat = new THREE.MeshStandardMaterial({ color: 0x003300, emissive: 0x00ff00, emissiveIntensity: 0 });
        this.greenLight = new THREE.Mesh(lightGeo, this.greenLightMat);
        this.greenLight.position.set(-1.5, 0.25, 1.0); 
        this.mesh.add(this.greenLight);
        
        const hitboxGeo = new THREE.BoxGeometry(5, 1, 4);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitbox.userData = { isLock: true, isDigitLock: true }; 
        this.mesh.add(hitbox);
    }

    updateTexture(i) {
        if(!this.textures[i]) return;
        const { ctx, tex } = this.textures[i];
        const val = this.current[i];
        const isSelected = (this.activeSlot === i);
        
        if (this.isSolved) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(0,0,64,64);
            ctx.fillStyle = 'black';
        } else {
            ctx.fillStyle = isSelected ? '#333333' : '#000000';
            ctx.fillRect(0,0,64,64);
            if(isSelected) {
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 4;
                ctx.strokeRect(0,0,64,64);
            }
            ctx.fillStyle = '#00ff00';
        }
        
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val, 32, 32);
        
        tex.needsUpdate = true;
    }

    selectSlot(index) {
        const prev = this.activeSlot;
        this.activeSlot = index;
        if(prev !== null && prev !== undefined) this.updateTexture(prev);
        if(index !== null && index !== undefined) this.updateTexture(index);
    }

    cycle(index, dir) { 
        if(window.App.music) window.App.music.playSFX('keypad'); // SFX

        const char = this.current[index];
        let idx = this.digits.indexOf(char); // Assumes val exists in digits
        if(idx === -1) idx = 0; // Fallback
        
        if(dir === 1) {
            idx = (idx + 1) % this.digits.length;
        } else {
            idx = (idx - 1 + this.digits.length) % this.digits.length;
        }
        
        this.current[index] = this.digits[idx];
        this.updateTexture(index);
    }
    
    setInput(char) {
        if(!this.digits.includes(char)) return;
        
        if(window.App.music) window.App.music.playSFX('keypad'); // SFX
        
        if(this.activeSlot === null) this.activeSlot = 0; // Default if none selected
        
        this.current[this.activeSlot] = char;
        this.updateTexture(this.activeSlot);
        
        const next = (this.activeSlot + 1) % this.current.length; 
        this.selectSlot(next);
    }

    check() {
        new window.TWEEN.Tween(this.submitBtn.position)
            .to({ y: 0.15 }, 100)
            .yoyo(true)
            .repeat(1)
            .start();
        
        const isCorrect = this.current.join('') === this.solution.join('');
        
        if (isCorrect) {
            this.greenLightMat.color.setHex(0x00ff00);
            this.greenLightMat.emissiveIntensity = 3.0; 
            
            this.redLightMat.color.setHex(0x330000);
            this.redLightMat.emissiveIntensity = 0;
            
            this.animateSolve(null); // Trigger visual solve immediately? Or wait for controller?
            // Usually controller calls animateSolve. Let's return true.
        } else {
            if(window.App.music) window.App.music.playSFX('beep_low'); // SFX Fail
            
            this.redLightMat.emissiveIntensity = 3.0;
            
            if(this.redTimeout) clearTimeout(this.redTimeout);
            
            this.redTimeout = setTimeout(() => {
                 this.redLightMat.emissiveIntensity = 0; // Snap off
            }, 1500);
        }

        return isCorrect;
    }
    
    animateSolve(callback) {
        if(this.isSolved) return; 
        this.isSolved = true;
        
        if(window.App.music) window.App.music.playSFX('unlock'); // SFX Success
        
        for(let i=0; i<this.current.length; i++) {
            this.updateTexture(i);
        }
        
        if(callback) callback();
    }
    
    updateGravity() {} 
};