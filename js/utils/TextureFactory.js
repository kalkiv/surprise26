window.App = window.App || {};
window.App.Utils = window.App.Utils || {};

window.App.Utils.TextureFactory = {
    createFlowerPattern: (bgHex, fgHex) => {
        // "Frequency of pink higher, blobs significantly larger"
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128; // Increased resolution
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bgHex;
        ctx.fillRect(0,0,128,128);
        ctx.fillStyle = fgHex;
        
        // Draw large blobs
        // Count: 12 (Higher frequency)
        // Size: Radius ~10-15 (Large blobs)
        for(let i=0; i<12; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const r = 8 + Math.random() * 8; // Radius 8-16
            
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI*2);
            ctx.fill();
            
            // "Blob" effect - add some random overlapping circles
            for(let j=0; j<3; j++) {
                const ox = x + (Math.random() - 0.5) * r * 1.5;
                const oy = y + (Math.random() - 0.5) * r * 1.5;
                const or = r * 0.7;
                ctx.beginPath();
                ctx.arc(ox, oy, or, 0, Math.PI*2);
                ctx.fill();
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 4);
        return tex;
    },

    createStripePattern: (bgHex, fgHex) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bgHex;
        ctx.fillRect(0,0,64,64);
        ctx.strokeStyle = fgHex;
        ctx.lineWidth = 4;
        // Cross stripes (Default)
        for(let i=0; i<64; i+=16) {
            ctx.beginPath();
            ctx.moveTo(i, 0); ctx.lineTo(i, 64);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i); ctx.lineTo(64, i);
            ctx.stroke();
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        return tex;
    },

    createGridPattern: (bgHex, fgHex) => {
        // "Larger squares, Thicker white lines"
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128; 
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bgHex;
        ctx.fillRect(0,0,128,128);
        ctx.strokeStyle = fgHex;
        ctx.lineWidth = 6; // Thicker lines
        
        // Grid spacing 64 (Larger squares within texture unit)
        for(let i=0; i<128; i+=64) {
             // Vertical
             ctx.beginPath();
             ctx.moveTo(i, 0); ctx.lineTo(i, 128);
             ctx.stroke();
             // Horizontal
             ctx.beginPath();
             ctx.moveTo(0, i); ctx.lineTo(128, i);
             ctx.stroke();
        }
        
        // Add border lines? To ensure tile edges match?
        // Canvas wrapping usually handles it if we don't draw on edge pixels or if we align.
        // 0 and 64 and 128.
        
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        // Default repeat 1,1 to verify scaling manually in object
        tex.repeat.set(1, 1); 
        return tex;
    },
    
    createSingleFlowerTex: () => {
         const c = document.createElement('canvas');
         c.width = 128; c.height = 128;
         const cx = c.getContext('2d');
         cx.fillStyle = 'white'; cx.fillRect(0,0,128,128);
         
         cx.translate(64,64);
         // Petals
         cx.fillStyle = '#FFC0CB'; // Pink
         for(let i=0; i<8; i++) {
             cx.beginPath();
             cx.ellipse(0, 30, 15, 40, 0, 0, Math.PI*2);
             cx.fill();
             cx.rotate(Math.PI/4);
         }
         // Center
         cx.beginPath();
         cx.arc(0,0,15,0,Math.PI*2);
         cx.fillStyle = '#FF69B4';
         cx.fill();
         
         return new THREE.CanvasTexture(c);
    }
};