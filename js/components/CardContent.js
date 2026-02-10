// Card Content Manager
// Use this file to customize the text, images, and layout of each card page.

window.App = window.App || {};

window.App.CardContent = {
    
    // Config
    width: 1024,
    height: 1462,

    // Helper to create the base paper background
    createBaseCanvas: function() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        const W = this.width;
        const H = this.height;
        
        // Background Gradient
        const grad = ctx.createLinearGradient(0,0,W,H);
        grad.addColorStop(0, '#fff0f5'); // Lavender blush
        grad.addColorStop(1, '#ffe6ea');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,W,H);
        
        // Paper Texture / Border
        ctx.strokeStyle = '#ffb7c5';
        ctx.lineWidth = 20;
        ctx.strokeRect(30, 30, W-60, H-60);

        return { canvas, ctx, W, H };
    },

    // --- PAGE 1: FRONT COVER ---
    getCoverTexture: function() {
        const { canvas, ctx, W, H } = this.createBaseCanvas();

        ctx.textAlign = 'center';
        
        // IMPORTANT: The cover is rendered on the "BackSide" of the mesh visible when closed.
        // We must MIRROR the drawing context so it reads correctly.
        ctx.save();
        ctx.translate(W, 0);
        ctx.scale(-1, 1);

        // --- Custom Content Start ---
        
        ctx.fillStyle = '#ff477e';
        ctx.font = 'bold 120px "Segoe UI", sans-serif';
        ctx.fillText('Dear Vidhi', W/2, H/3);
        
        // Big Heart
        ctx.font = '400px Arial';
        ctx.fillText('💌', W/2, H/1.8);

        // --- Custom Content End ---
        
        ctx.restore();
        
        return new THREE.CanvasTexture(canvas);
    },

    // --- PAGE 2: INSIDE LEFT (Back of Cover) ---
    getInsideLeftTexture: function() {
        const { canvas, ctx, W, H } = this.createBaseCanvas();
        ctx.textAlign = 'center';

        // --- Custom Content Start ---

        ctx.fillStyle = '#ff477e';
        ctx.font = '80px "Segoe UI", sans-serif';
        ctx.fillText('With Love,', W/2, H/2 - 50);
        
        ctx.font = 'bold 80px "Segoe UI", sans-serif';
        ctx.fillText('Vinny', W/2, H/2 + 50);

        // --- Custom Content End ---

        return new THREE.CanvasTexture(canvas);
    },

    // --- PAGE 3: INSIDE RIGHT (Main Message) ---
    getInsideRightTexture: function() {
        const { canvas, ctx, W, H } = this.createBaseCanvas();
        ctx.textAlign = 'center';

        // --- Custom Content Start ---

        ctx.fillStyle = '#ffffff';
        // (Optional white box behind text if needed)
        // ctx.fillRect(100, 100, W-200, H-200); 
        
        ctx.fillStyle = '#d6336c';
        ctx.font = 'bold 90px "Segoe UI", sans-serif';
        ctx.fillText('HAPPY', W/2, 250);
        ctx.fillText('VALENTINES', W/2, 350);
        ctx.fillText('DAY!', W/2, 450);
        
        ctx.fillStyle = '#333';
        ctx.font = '50px "Segoe UI", sans-serif';
        ctx.fillText('I love you sooooooooo much!', W/2, 600);
        
        // Divider Line
        ctx.beginPath();
        ctx.moveTo(W/2 - 100, 680);
        ctx.lineTo(W/2 + 100, 680);
        ctx.strokeStyle = '#ff477e';
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.font = 'italic 55px Georgia, serif';
        ctx.fillStyle = '#555';
        
        const lines = [
            "This key opens the gates",
            "to happiness and joy.",
            "May your heart always",
            "be full of love."
        ];
        lines.forEach((line, i) => {
            ctx.fillText(line, W/2, 800 + (i * 80));
        });
        
        ctx.font = '100px Arial';
        ctx.fillText('💖', W/2, 1250);

        // --- Custom Content End ---

        return new THREE.CanvasTexture(canvas);
    }
};