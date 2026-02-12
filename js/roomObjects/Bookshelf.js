window.App = window.App || {};
window.App.RoomObjects = window.App.RoomObjects || {};

window.App.RoomObjects.Bookshelf = class Bookshelf {
    constructor() {
        this.group = new THREE.Group();
        this.init();
    }

    init() {
        // Bookshelf (Right Corner area X=-30, Z=35)
        // Structure (Facing Z-, Towards Bed)
        // Width is X (14 - Skinnier). Depth is Z (10).
        
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x090909, roughness: 0.6 });
        
        const shelfWidthX = 14;
        const shelfDepthZ = 10;
        const shelfHeight = 40;
        // Angled Posts
        // Top supported at back, Bottom supported at front.
        // H=40, Z goes from Front(+4) to Back(-4). Delta Z = -8.
        const postLen = Math.sqrt(40*40 + 8*8);
        const postAngle = Math.atan2(8, 40); // Lean back angle
        const angledPostGeo = new THREE.BoxGeometry(2, postLen, 2);

        // Left Post
        const lPost = new THREE.Mesh(angledPostGeo, woodMat);
        lPost.position.set(-shelfWidthX/2 + 1, shelfHeight/2, 0);
        lPost.rotation.x = postAngle;
        this.group.add(lPost);

        // Right Post
        const rPost = new THREE.Mesh(angledPostGeo, woodMat);
        rPost.position.set(shelfWidthX/2 - 1, shelfHeight/2, 0);
        rPost.rotation.x = postAngle;
        this.group.add(rPost);
          
        // Shelves
        const shelfPlank = new THREE.BoxGeometry(shelfWidthX, 1, shelfDepthZ);
        for(let y=5; y<40; y+=10) {
            const plank = new THREE.Mesh(shelfPlank, woodMat);
            plank.position.set(0, y, 0);
            plank.castShadow = true;
            plank.receiveShadow = true;
            this.group.add(plank);
        }
    }
};