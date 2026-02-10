window.App = window.App || {};

// Aggregate all defined puzzles into the global array used by the app
window.App.puzzles = [
    window.App.Puzzles.Puzzle1,
    window.App.Puzzles.Puzzle2,
    window.App.Puzzles.Puzzle3,
    window.App.Puzzles.Puzzle4,
    window.App.Puzzles.Puzzle5,
    window.App.Puzzles.Puzzle6
].filter(p => !!p); // Filter out any undefineds if file missing