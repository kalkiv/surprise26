window.App = window.App || {};

window.App.PhotoGallery = class {
    constructor() {
        this.photos = [
            'gallery/IMG_0173.JPG',
            'gallery/IMG_4542.jpeg',
            'gallery/IMG_4961.jpeg',
            'gallery/IMG_5686.jpeg',
            'gallery/IMG_6725.JPG',
            'gallery/IMG_7202.jpeg',
            'gallery/IMG_7415.jpeg',
            'gallery/IMG_7554.jpeg',
            'gallery/IMG_7582.jpeg',
            'gallery/IMG_7672.JPG'
        ];
        this.currentIndex = 0;
        this.textures = {};
    }

    getTexture(index) {
        // Safety check for empty array
        if (this.photos.length === 0) return null;
        
        // Handle negative wrapping
        if (index < 0) {
            index = (index % this.photos.length + this.photos.length) % this.photos.length;
        }
        
        const url = this.photos[index % this.photos.length];
        if(!this.textures[url]) {
            const loader = new THREE.TextureLoader();
            this.textures[url] = loader.load(url);
            this.textures[url].colorSpace = THREE.SRGBColorSpace;
        }
        return this.textures[url];
    }
    
    getNextCount() {
        return this.photos.length;
    }

    createPolaroidMesh() {
        // Group for the whole item
        const group = new THREE.Group();
        
        // 1. White Backing (The Paper)
        // Dimensions: Scaled up to be closer to card size (Card is 3.5 x 5)
        // Let's make polaroid approx 2.5 x 3.0
        const width = 2.5;
        const height = 3.0;
        
        const paperGeo = new THREE.BoxGeometry(width, height, 0.02);
        const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        const paper = new THREE.Mesh(paperGeo, paperMat);
        paper.castShadow = true;
        paper.receiveShadow = true;
        group.add(paper);
        
        // 2. The Photo Area
        // Square photo area
        const photoSize = 2.1; // Width - margins
        const photoGeo = new THREE.PlaneGeometry(photoSize, photoSize);
        const photoMat = new THREE.MeshBasicMaterial({ color: 0x222222 }); // Start black or placeholder
        const photo = new THREE.Mesh(photoGeo, photoMat);
        
        // Position calculation:
        // Height 3.0. Center 0. Top edge +1.5.
        // Margin top 0.2. Photo Top +1.3.
        // Photo center = +1.3 - (2.1 / 2) = 1.3 - 1.05 = 0.25
        photo.position.set(0, 0.25, 0.015);
        group.add(photo);
        
        // Store reference to update texture
        group.userData.photoMesh = photo;
        
        return group;
    }
};

window.App.GalleryInstance = new window.App.PhotoGallery();