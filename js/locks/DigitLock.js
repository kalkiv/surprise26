// DigitLock (4-Digit Alphanumerical Pad)
window.App = window.App || {};

window.App.DigitLock = class {
    constructor(solution = ['1', '2', '3', '4']) {
        this.mesh = new THREE.Group();
        this.solution = solution;
        // Start same length as solution
        this.current = new Array(solution.length).fill('A');
        // Include numbers and letters
        this.digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        this.textures = []; // Store textures to update them
        this.activeSlot = null; // For keyboard navigation
        this.isSolved = false;
        
        this.createMesh();
    }

    createMesh() {
        const count = this.solution.length;
        const spacing = 1.0;
        const width = count * spacing + 0.5;
        
        // Base Plate
        const plateGeo = new THREE.BoxGeometry(width, 0.4, 3.5);
        const plateMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.castShadow = true;
        plate.receiveShadow = true;
        plate.userData = { isDigitLockParts: true }; // Clicking plate keeps zoom active
        this.mesh.add(plate);

        // Digits & Arrows
        const startX = -((count - 1) * spacing) / 2;
        
        for(let i=0; i<count; i++) {
            const x = startX + (i * spacing);
            
            // 1. Display Screen (The Digit)
            const digitCanvas = document.createElement('canvas');
            digitCanvas.width = 64; 
            digitCanvas.height = 64;
            const ctx = digitCanvas.getContext('2d');
            
            const tex = new THREE.CanvasTexture(digitCanvas);
            this.textures.push({ tex, ctx, index: i });
            this.updateTexture(i);

            const displayGeo = new THREE.PlaneGeometry(0.8, 0.8);
            const displayMat = new THREE.MeshBasicMaterial({ map: tex });
            const display = new THREE.Mesh(displayGeo, displayMat);
            // On top of plate (plate height 0.4 -> top at 0.2)
            display.position.set(x, 0.22, -0.5); 
            display.rotation.x = -Math.PI / 2; // Flat facing up
            this.mesh.add(display);
            
            // 2. Up Arrow
            const arrowGeo = new THREE.ConeGeometry(0.25, 0.5, 4); // Slightly larger
            const arrowMat = new THREE.MeshStandardMaterial({ 
                color: 0xffd700, // Gold/Yellow for high visibility
                emissive: 0x333300, // Slight glow
                roughness: 0.2,
                metalness: 0.5
            });
            
            const upArrow = new THREE.Mesh(arrowGeo, arrowMat);
            upArrow.position.set(x, 0.25, -1.3);
            // Point "North" (-Z) on the flat surface
            upArrow.rotation.x = -Math.PI / 2; 
            upArrow.userData = { isDigitLockParts: true, action: 'up', slotIndex: i };
            this.mesh.add(upArrow);

            // 3. Down Arrow
            const downArrow = new THREE.Mesh(arrowGeo, arrowMat);
            downArrow.position.set(x, 0.25, 0.3);
            // Point "South" (+Z) on the flat surface
            downArrow.rotation.x = Math.PI / 2; 
            downArrow.userData = { isDigitLockParts: true, action: 'down', slotIndex: i };
            this.mesh.add(downArrow);
        }

        // Red Submit Button
        const btnGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
        const btnMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.submitBtn = new THREE.Mesh(btnGeo, btnMat);
        this.submitBtn.position.set(0, 0.25, 1.0);
        this.submitBtn.userData = { isDigitLockParts: true, action: 'submit' };
        this.mesh.add(this.submitBtn);

        // Status Lights (Red & Green)
        const lightGeo = new THREE.SphereGeometry(0.15, 16, 16);
        
        // Red Light (Initially OFF / Black)
        this.redLightMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff0000, emissiveIntensity: 0 });
        this.redLight = new THREE.Mesh(lightGeo, this.redLightMat);
        this.redLight.position.set(1.5, 0.25, 1.0); // Right of button
        this.mesh.add(this.redLight);

        // Green Light (Initially OFF / Black)
        this.greenLightMat = new THREE.MeshStandardMaterial({ color: 0x003300, emissive: 0x00ff00, emissiveIntensity: 0 });
        this.greenLight = new THREE.Mesh(lightGeo, this.greenLightMat);
        this.greenLight.position.set(-1.5, 0.25, 1.0); // Left of button
        this.mesh.add(this.greenLight);
        
        // Hitbox for General Lock Clicking
        // We need a large invisible box for the initial "zoom" click
        const hitboxGeo = new THREE.BoxGeometry(5, 1, 4);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitbox.userData = { isLock: true, isDigitLock: true }; // Identify this lock type
        this.mesh.add(hitbox);
    }

    updateTexture(i) {
        const { ctx, tex } = this.textures[i];
        const val = this.current[i];
        const isSelected = (this.activeSlot === i);
        
        if (this.isSolved) {
            // Solved State (Green Background, Black Text)
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(0,0,64,64);
            
            ctx.fillStyle = 'black';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(val, 32, 32);
        } else {
            // Normal / Selected State
            // Background
            ctx.fillStyle = isSelected ? '#333333' : '#000000';
            ctx.fillRect(0,0,64,64);
            
            // Border if selected
            if(isSelected) {
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 4;
                ctx.strokeRect(0,0,64,64);
            }
            
            // Text
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(val, 32, 32);
        }
        
        tex.needsUpdate = true;
    }

    selectSlot(index) {
        const prev = this.activeSlot;
        this.activeSlot = index;
        if(prev !== null && prev !== undefined) this.updateTexture(prev);
        if(index !== null && index !== undefined) this.updateTexture(index);
    }

    cycle(index, dir) { // dir: 1 (up) or -1 (down)
        const char = this.current[index];
        let idx = this.digits.indexOf(char);
        
        if(dir === 1) {
            idx = (idx + 1) % this.digits.length;
        } else {
            idx = (idx - 1 + this.digits.length) % this.digits.length;
        }
        
        this.current[index] = this.digits[idx];
        this.updateTexture(index);
    }
    
    setInput(char) {
        // Validate
        if(!this.digits.includes(char)) return;
        
        // Set value
        this.current[this.activeSlot] = char;
        this.updateTexture(this.activeSlot);
        
        // Move to next slot
        const next = (this.activeSlot + 1) % this.current.length; // Wrap around
        this.selectSlot(next);
    }

    check() {
        // Button press animation
        window.TWEEN.to(this.submitBtn.position, { y: 0.15, duration: 0.1, yoyo: true, repeat: 1 });
        
        const isCorrect = this.current.join('') === this.solution.join('');
        
        if (isCorrect) {
            // Green Light ON (Bright), Red OFF
            this.greenLightMat.color.setHex(0x00ff00);
            this.greenLightMat.emissiveIntensity = 3.0; // Very bright green
            
            this.redLightMat.color.setHex(0x330000);
            this.redLightMat.emissiveIntensity = 0;
        } else {
            // Solid Red for 3 Seconds
            this.redLightMat.emissiveIntensity = 3.0;
            
            // Cancel any existing timeout if spamming? (Simplistic approach: Just reset)
            if(this.redTimeout) clearTimeout(this.redTimeout);
            
            this.redTimeout = setTimeout(() => {
                // Fade out nicely or just snap? User said "hold... then..." usually implies just turning off.
                // Let's use Tween for smooth off
                 window.TWEEN.to(this.redLightMat, { emissiveIntensity: 0, duration: 0.5 });
            }, 3000);
        }

        return isCorrect;
    }
    
    // Standard Interface
    animateSolve(callback) {
        this.isSolved = true;
        
        // Update all textures to reflect solved state
        for(let i=0; i<this.current.length; i++) {
            this.updateTexture(i);
        }
        
        // Do NOT float away or shrink. Just callback.
        if(callback) callback();
    }
    
    // Stub for updateGravity if LockFactory calls it
    updateGravity() {} 
}