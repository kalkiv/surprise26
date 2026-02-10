window.App = window.App || {};
window.App.Puzzles = window.App.Puzzles || {};

window.App.Puzzles.Puzzle3 = {
    id: "puzzle3",
    type: "crossword",
    q: "Solve the crossword by filling in the blanks.",
    hint: "Click on a square to view the clue.",
    gridCols: 10,
    gridRows: 13,
    words: [
        { num: 1, word: 'TAMARIND', x: 2, y: 6, dir: 'across', clue: 'cats name in English' },
        { num: 2, word: 'EGG', x: 2, y: 10, dir: 'across', clue: 'nickname for you' },
        { num: 3, word: 'MINIGOLF', x: 4, y: 6, dir: 'down', clue: 'third valentines date activity' },
        { num: 3, word: 'MOCHA', x: 3, y: 2, dir: 'down', clue: 'chocolatey coffee' },
        { num: 4, word: 'OCTOBER', x: 4, y: 11, dir: 'across', clue: 'month we started dating' },
        { num: 5, word: 'FLOWERS', x: 6, y: 1, dir: 'down', clue: 'traditional valentines day gift' },
        { num: 6, word: 'MONKEY', x: 5, y: 3, dir: 'across', clue: 'nickname for me' },
        { num: 7, word: 'NYC', x: 1, y: 4, dir: 'across', clue: 'longest trip we have taken to date' },
        { num: 8, word: 'PLATO', x: 6, y: 9, dir: 'across', clue: 'favorite game app' },
        { num: 9, word: 'TREE', x: 9, y: 9, dir: 'down', clue: 'favorite anniversary gift' }
    ]
};