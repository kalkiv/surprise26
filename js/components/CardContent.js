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
        
        // Classy Cream Background
        const grad = ctx.createLinearGradient(0,0,W,H);
        grad.addColorStop(0, '#FFFDD0'); // Cream
        grad.addColorStop(1, '#F5F5DC'); // Beige
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,W,H);
        
        // Elegant Double Border
        ctx.strokeStyle = '#D4AF37'; // Gold
        ctx.lineWidth = 15;
        ctx.strokeRect(40, 40, W-80, H-80);
        
        ctx.strokeStyle = '#C5A028'; // Darker Gold
        ctx.lineWidth = 4;
        ctx.strokeRect(70, 70, W-140, H-140);

        return { canvas, ctx, W, H };
    },

    wrapText: function(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            }
            else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
        return currentY + lineHeight;
    },

    // --- PAGE 1: FRONT COVER ---
    getCoverTexture: function() {
        const { canvas, ctx, W, H } = this.createBaseCanvas();

        ctx.textAlign = 'center';
        
        ctx.save();
        ctx.translate(W, 0); // Correct for back face
        ctx.scale(-1, 1);

        // --- Custom Content Start ---
        
        ctx.fillStyle = '#D4AF37'; // Gold
        ctx.font = 'bold 120px "Georgia", serif';
        ctx.fillText('To my', W/2, H/3);
        ctx.font = 'bold 140px "Georgia", serif';
        ctx.fillText('Sweetie Pie', W/2, H/3 + 140);
        
        // Decor
        ctx.font = '300px Arial';
        ctx.fillText('💝', W/2, H/1.6); // Heart with Ribbon

        // --- Custom Content End ---
        
        ctx.restore();
        
        return new THREE.CanvasTexture(canvas);
    },

    // --- PAGE 2: INSIDE LEFT (Back of Cover) ---
    getInsideLeftTexture: function() {
        const { canvas, ctx, W, H } = this.createBaseCanvas();
        ctx.textAlign = 'center';
        
        // Simple Elegant Graphic
        ctx.font = '400px Arial';
        ctx.fillText('🌹', W/2, H/2);
        
        return new THREE.CanvasTexture(canvas);
    },

    // --- PAGE 3: INSIDE RIGHT (Main Message) ---
    getInsideRightTexture: function() {
        const { canvas, ctx, W, H } = this.createBaseCanvas();
        
        // --- Custom Content Start ---
        
        const text = "I love you soooo much. I am so filled with joy that you are my Valentine this year, and every other year forever. You are always gorgeous you always dress up whenever we go out. It makes me super happy to know how much effort you always put in. I am so happy whenever I get to see you and spend time with you. I just want to squeeze your face and always look at it because it is just sooo cute. Every date we go on makes me feel so whole and every conversation we have about our relationship or our future makes me excited to explore the rest of our lives together.";
        
        const closing = "Happy Valentines day to my favorite person in the whole wide world.";
        
        // Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8B0000'; // Dark Red
        ctx.font = 'italic bold 70px "Georgia", serif';
        // ctx.fillText('My Love,', W/2, 180);

        // Body Text
        ctx.textAlign = 'left'; 
        ctx.fillStyle = '#333'; // Dark Grey for readability
        ctx.font = 'italic 42px "Georgia", serif';
        
        const margin = 100;
        const startY = 160;
        
        // Use wrapText helper
        let nextY = this.wrapText(ctx, text, margin, startY, W - (margin*2), 60);
        
        // Closing - Centered
        ctx.textAlign = 'center';
        ctx.fillStyle = '#D4AF37'; // Gold
        ctx.font = 'bold 45px "Georgia", serif';
        
        this.wrapText(ctx, closing, W/2, nextY + 80, W - (margin*2), 60);
        
        // Heart
        ctx.font = '80px Arial';
        ctx.fillText('❤️', W/2, H - 150);

        // --- Custom Content End ---

        return new THREE.CanvasTexture(canvas);
    }
};