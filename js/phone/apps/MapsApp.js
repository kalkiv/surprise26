window.App = window.App || {};
window.App.PhoneApps = window.App.PhoneApps || {};

window.App.PhoneApps.MapsApp = class MapsApp {
    constructor() {
        this.container = document.getElementById('app-maps');
    }

    onOpen() {
        if (!this.container) return;
        this.render();
    }

    render() {
        let contentEl = this.container.querySelector('.app-content');
        if(!contentEl) {
            contentEl = document.createElement('div');
            contentEl.className = 'app-content';
            this.container.appendChild(contentEl);
        }
        
        // Map Container Style
        contentEl.innerHTML = '';
        contentEl.style.display = 'block';
        contentEl.style.position = 'relative';
        contentEl.style.background = '#a3ccff'; // Ocean Blue
        contentEl.style.overflow = 'hidden';
        
        // --- High Quality SVG World Map Background ---
        const mapSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        mapSvg.setAttribute("viewBox", "0 0 1000 500");
        mapSvg.setAttribute("preserveAspectRatio", "none"); // Allow stretching
        mapSvg.style.position = 'absolute';
        mapSvg.style.width = '100%';
        mapSvg.style.height = '100%'; // Will fill container, stretching if needed
        mapSvg.style.top = '0';
        mapSvg.style.left = '0';
        mapSvg.style.opacity = '0.7'; // Fade slightly so dots pop
        mapSvg.style.transform = 'scaleY(0.5)'; // Compressed vertically
        mapSvg.style.transformOrigin = 'center';
        
        const landColor = "#dbeecf";
        
        // Simplified Standard World Map Paths (Not warped for grid)
        
        // North America
        const na = document.createElementNS("http://www.w3.org/2000/svg", "path");
        na.setAttribute("d", "M80,50 Q200,-20 350,50 L320,150 L250,280 L220,280 L180,150 L80,100 Z");
        na.setAttribute("fill", landColor);
        mapSvg.appendChild(na);

        // South America
        const sa = document.createElementNS("http://www.w3.org/2000/svg", "path");
        sa.setAttribute("d", "M250,280 L350,280 L400,350 L320,480 L280,380 Z");
        sa.setAttribute("fill", landColor);
        mapSvg.appendChild(sa);

        // Europe
        const eur = document.createElementNS("http://www.w3.org/2000/svg", "path");
        eur.setAttribute("d", "M450,50 L600,50 L600,150 L500,180 L450,150 Z");
        eur.setAttribute("fill", landColor);
        mapSvg.appendChild(eur);

        // Africa
        const afr = document.createElementNS("http://www.w3.org/2000/svg", "path");
        afr.setAttribute("d", "M480,200 L650,200 L700,350 L600,450 L480,300 Z");
        afr.setAttribute("fill", landColor);
        mapSvg.appendChild(afr);

        // Asia
        const asia = document.createElementNS("http://www.w3.org/2000/svg", "path");
        asia.setAttribute("d", "M600,50 L950,50 L950,250 L800,350 L650,300 L600,150 Z");
        asia.setAttribute("fill", landColor);
        mapSvg.appendChild(asia);
        
        // Australia
        const aus = document.createElementNS("http://www.w3.org/2000/svg", "path");
        aus.setAttribute("d", "M800,350 L950,350 L920,450 L820,450 Z");
        aus.setAttribute("fill", landColor);
        mapSvg.appendChild(aus);
        
        contentEl.appendChild(mapSvg);

        // Label
        const label = document.createElement('div');
        label.textContent = "World Map";
        label.style.position = 'absolute';
        label.style.top = '10px';
        label.style.left = '10px';
        label.style.fontFamily = 'sans-serif';
        label.style.fontSize = '12px';
        label.style.color = '#555';
        label.style.fontWeight = 'bold';
        contentEl.appendChild(label);
        
        // --- Dot and Line Container ---
        // Full width/height to map to map coordinates directly
        const dotsContainer = document.createElement('div');
        dotsContainer.style.position = 'absolute';
        dotsContainer.style.top = '0';
        dotsContainer.style.left = '0';
        dotsContainer.style.width = '100%';
        dotsContainer.style.height = '100%';
        contentEl.appendChild(dotsContainer);

        // Manual Grid Mapping to ensure Dots hit Land ("Fit on Green")
        // Col 0: Americas Vertical (x=26%)
        // Col 1: Europe/Africa (x=50%)
        // Col 2: Asia (x=68%)
        // Col 3: Asia East (x=83%)
        // Col 4: Asia/Aus Far East (x=92%)
        
        // Rows: Condensed Vertically [40%, 50%, 60%]
        
        const colX = [28, 52, 70, 82, 92]; // Percentages
        const rowY = [40, 50, 60];         // Even more compact vertically

        // Pattern Points
        const pattern = [
            // I (Col 0)
            {c:0, r:0}, {c:0, r:1}, {c:0, r:2},
            // . (Col 1)
            {c:1, r:1},
            // U (Col 2,3,4)
            {c:2, r:0}, {c:2, r:1}, {c:2, r:2},
            {c:3, r:2}, 
            {c:4, r:2}, {c:4, r:1}, {c:4, r:0},
        ];

        // --- Draw Lines (SVG) ---
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.style.position = 'absolute';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.top = '0';
        svg.style.left = '0';
        dotsContainer.appendChild(svg);

        // Helper to get coords from manual grid
        const getPct = (c, r) => {
            return {
                x: colX[c],
                y: rowY[r]
            };
        };

        // Draw "I" Line
        // (0,0) -> (0,2)
        const pI_start = getPct(0, 0);
        const pI_end = getPct(0, 2);
        
        const lineI = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lineI.setAttribute("x1", pI_start.x + "%");
        lineI.setAttribute("y1", pI_start.y + "%");
        lineI.setAttribute("x2", pI_end.x + "%");
        lineI.setAttribute("y2", pI_end.y + "%");
        lineI.setAttribute("stroke", "red");
        lineI.setAttribute("stroke-width", "2");
        svg.appendChild(lineI);

        // Draw "U" Polyline
        // (2,0) -> (2,2) -> (3,2) -> (4,2) -> (4,0)
        // Wait, C4 Bottom is (4,2). C4 Top is (4,0).
        // My Logic for pattern: C4 All.
        const pathData = [
            getPct(2, 0),
            getPct(2, 2),
            getPct(3, 2),
            getPct(4, 2),
            getPct(4, 0)
        ];
        
        const pointsStr = pathData.map(p => `${p.x}%,${p.y}%`).join(' '); // Polyline is safer with pixel coords usually but % might work in SVG if viewBox not set. NO, % works in x1/y1 attributes but points="" usually expects numbers relative to coordinate system.
        // Better to use <path> with M L commands using percentage strings if SVG allows? No.
        // Or calculate pixel positions? We don't know pixel size easily here.
        // Use x1/y1 for segments.
        
        // Segment 1: (2,0) -> (2,2)
        let pts = [
            {c:2, r:0}, {c:2, r:2}, // Vertical Left
            {c:2, r:2}, {c:3, r:2}, // Bottom Left
            {c:3, r:2}, {c:4, r:2}, // Bottom Right
            {c:4, r:2}, {c:4, r:0}  // Vertical Right
        ];
        
        for(let i=0; i<pts.length; i+=2) {
            const p1 = getPct(pts[i].c, pts[i].r);
            const p2 = getPct(pts[i+1].c, pts[i+1].r);
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", p1.x + "%");
            line.setAttribute("y1", p1.y + "%");
            line.setAttribute("x2", p2.x + "%");
            line.setAttribute("y2", p2.y + "%");
            line.setAttribute("stroke", "red");
            line.setAttribute("stroke-width", "2");
            svg.appendChild(line);
        }

        // --- Draw Dots ---
        pattern.forEach(p => {
            const dot = document.createElement('div');
            dot.style.position = 'absolute';
            dot.style.width = '12px';
            dot.style.height = '12px';
            dot.style.backgroundColor = '#ff0000'; // Red
            dot.style.borderRadius = '50%';
            dot.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';
            
            // Calc Position
            const pos = getPct(p.c, p.r);
            
            dot.style.left = `calc(${pos.x}% - 6px)`;
            dot.style.top = `calc(${pos.y}% - 6px)`;
            
            dotsContainer.appendChild(dot);
        });
    }
};

// Register
window.addEventListener('load', () => {
    if(window.App.PhoneManager) {
        window.App.PhoneManager.registerApp('maps', new window.App.PhoneApps.MapsApp());
    }
});