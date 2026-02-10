// Setup Namespace
window.App = window.App || {};

window.App.CONFIG = {
    colors: {
        heart: 0xff477e,
        heartHighlight: 0xff85a9,
        lock: 0xffd700, // Gold locks
        lockRing: 0xc0c0c0 // Silver rings
    },
    animDuration: 0.8
};

// Puzzles are now populated by js/puzzles/PuzzleRegistry.js
window.App.puzzles = window.App.puzzles || [];

window.App.state = {
    keysCollected: 0,
    totalLocks: 3, // Will be updated
    locks: [], // { mesh, id, solved, puzzle, container }
    rotY: 0,
    rotX: 0,
    isBoxOpen: false
};
