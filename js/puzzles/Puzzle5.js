window.App = window.App || {};
window.App.Puzzles = window.App.Puzzles || {};

// Find the Differences
// Needs two images (img1: original, img2: modified)
// Differences defined as % coordinates (x, y) and radius (r)

window.App.Puzzles.Puzzle5 = {
    id: "puzzle5",
    type: "find-differences",
    q: "Spot the 7 differences between the two pictures.",
    hint: "Look closely at the details.",
    
    // Placeholder Images - User to replace these
    img1: "images/pumpkin.jpeg", // Context 1
    img2: "images/pumpkin_modified.jpeg", // Context 2
    
    // 7 Differences (Placeholders)
    // Coords are Percentages (0-100)
    differences: [
        { x: 8, y: 5, r: 5 },
        { x: 20, y: 13, r: 5 },
        { x: 66, y: 35, r: 5 },
        { x: 45, y: 67, r: 5 },
        { x: 23, y: 95, r: 5 },
        { x: 97, y: 52, r: 5 },
        { x: 80, y: 87, r: 5 }
    ]
};