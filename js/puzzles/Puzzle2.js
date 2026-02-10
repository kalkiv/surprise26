window.App = window.App || {};
window.App.Puzzles = window.App.Puzzles || {};

// Color Mapping (Indices 1-6)
// 1: Pink (Petals)
// 2: Dark Pink (Shadows)
// 3: Yellow (Center)
// 4: Green (Stem)
// 5: Dark Green (Leaves)
// 6: Sky Blue (Background)

const P2_PALETTE = [
    '#E7A8A8', // 1: Hot Pink
    '#D5605E', // 2: Medium Violet Red
    '#F5E150', // 3: Gold
    '#7CB856', // 4: Lime Green
    '#000000', // 5: Dark Green
    '#FFFFFF'  // 6: Light Cyan
];

// 10x10 Flower Pattern
// 6=Bg, 1=Petal, 2=DarkPetal, 3=Center, 4=Stem, 5=Leaf
const P2_TARGET = [
    6, 5, 5, 6, 6, 6, 6, 5, 5, 6,
    5, 4, 4, 2, 1, 1, 2, 4, 4, 5,
    5, 4, 2, 2, 1, 1, 2, 2, 4, 5,
    6, 2, 2, 1, 3, 3, 1, 2, 2, 6,
    6, 1, 1, 3, 3, 3, 3, 1, 1, 6,
    6, 1, 1, 3, 3, 3, 3, 1, 1, 6,
    6, 2, 2, 1, 3, 3, 1, 2, 2, 6,
    5, 4, 2, 2, 1, 1, 2, 2, 4, 5,
    5, 4, 4, 2, 1, 1, 2, 4, 4, 5,
    6, 5, 5, 6, 6, 6, 6, 5, 5, 6
];

window.App.Puzzles.Puzzle2 = {
    id: "puzzle2",
    type: "paint-by-numbers",
    q: "Paint the flower by numbers.",
    hint: "Match the numbers to the colors.",
    palette: P2_PALETTE,
    target: P2_TARGET,
    cols: 10,
    rows: 10
};