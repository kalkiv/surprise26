window.App = window.App || {};
window.App.PhoneApps = window.App.PhoneApps || {};

window.App.PhoneApps.SmartHomeApp = class SmartHomeApp {
    updateLight(device, type, val) {
         // Access objects from active scene (IntroScene has them exposed)
         // Check if activeScene is IntroScene
         // In main.js, activeScene is local variable. But window.App.currentScene stores ID.
         // And scene instances are usually stored globally or accessible.
         // We'll rely on global instances being exposed by Main.js or a SceneManager.
         
         const scene = window.App.Scenes.introSceneInstance; 
         if(!scene) return; 
         
         if(device === 'book') {
             const shelf = scene.bookshelf;
             if(!shelf) return;
             
             if(type === 'brightness') {
                 // Brightness logic
                 const factor = parseFloat(val);
                 if(shelf.shelfLampLight) shelf.shelfLampLight.intensity = factor;
                 if(shelf.shelfLampMat) shelf.shelfLampMat.emissiveIntensity = factor * 0.5; 
             } else if(type === 'color') {
                 // Color logic
                 if(shelf.shelfLampLight) shelf.shelfLampLight.color.set(val);
                 if(shelf.shelfLampMat) {
                     shelf.shelfLampMat.color.set(val);
                     shelf.shelfLampMat.emissive.set(val);
                 }
             }
         } else if(device === 'geo') {
             const geo = scene.geometricLamp;
             if(!geo) return;
             
             if(type === 'brightness') {
                 const factor = parseFloat(val);
                 if(geo.light) geo.light.intensity = factor;
                 if(geo.bulbMat) geo.bulbMat.emissiveIntensity = factor * 0.8;
             } else if(type === 'color') {
                 if(geo.light) geo.light.color.set(val);
                 if(geo.bulbMat) {
                     geo.bulbMat.color.set(val);
                     geo.bulbMat.emissive.set(val);
                 }
             }
         }
    }
};

// Register
window.addEventListener('load', () => {
    if(window.App.PhoneManager) {
        window.App.PhoneManager.registerApp('smarthome', new window.App.PhoneApps.SmartHomeApp());
        // Also ensure inline handlers work
        if(window.App.PhoneManager.updateLight) {
            // Already handled by Phone.js proxy calling this app
        }
    }
});