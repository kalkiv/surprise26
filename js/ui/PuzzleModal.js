// PuzzleModal.js
window.App = window.App || {};

window.App.PuzzleModal = class {
    constructor(onSolveCallback) {
        this.onSolveCallback = onSolveCallback;
        this.activeLockId = null;
        this.currentPuzzle = null;
        
        // Puzzle State for Picture Puzzle
        this.gridState = []; 
        this.selectedTileIndex = null;
        
        // Puzzle State for Paint By Numbers
        this.paintGridState = []; // Array of Color Indices (0 = empty, 1..6 = colors)
        this.selectedColorIndex = 1; // Default to first color
        
        this.cacheElements();
        this.bindEvents();
    }
    
    cacheElements() {
        this.elements = {
            modal: document.getElementById('puzzle-modal'),
            modalCard: document.querySelector('.modal-card'),
            modalTitle: document.getElementById('puzzle-title'),
            modalQuestion: document.getElementById('puzzle-question'),
            modalInput: document.getElementById('puzzle-answer'),
            btnCancel: document.getElementById('modal-cancel'), // Keeping ref to remove it
            btnSubmit: document.getElementById('modal-submit'),
            modalActions: document.querySelector('.modal-actions')
        };
    }
    
    bindEvents() {
        // Remove Cancel Button if it exists (we use click-off to close now)
        if(this.elements.btnCancel) {
            this.elements.btnCancel.remove();
            this.elements.btnCancel = null;
        }
        
        // Click off modal to close
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.close();
            }
        });
        
        if(this.elements.btnSubmit) {
            this.elements.btnSubmit.addEventListener('click', () => this.checkAnswer());
        }
        
        if(this.elements.modalInput) {
            this.elements.modalInput.addEventListener('keydown', (e) => { 
                if(e.key === 'Enter') this.checkAnswer(); 
            });
        }
    }
    
    open(id) {
        this.activeLockId = id;
        this.isSolved = false; // Reset solve state
        
        // Fetch Puzzle Data
        const lock = window.App.state.locks.find(l => l.id === id);
        const puzzle = lock ? lock.puzzle : null;
        this.currentPuzzle = puzzle;

        this.elements.modalTitle.innerText = `Lock #${id+1}`;
        this.elements.modalQuestion.innerText = puzzle ? puzzle.q : "No Puzzle Configured";
        
        // Reset UI
        this.elements.modalInput.value = "";
        this.elements.modalInput.classList.remove('hidden');
        this.elements.btnSubmit.textContent = "Check"; // Always start as Check
        // btnCancel is removed
        this.elements.btnSubmit.classList.remove('btn-primary'); // Remove highlight if present
        
        // Remove helper buttons if any
        const clearBtn = document.getElementById('btn-pbn-clear');
        if(clearBtn) clearBtn.remove();
        
        // Remove any existing dynamic puzzle elements
        const existingGrid = this.elements.modalCard.querySelector('.puzzle-grid');
        if(existingGrid) existingGrid.remove();
        
        const existingPaintGrid = this.elements.modalCard.querySelector('.paint-grid');
        if(existingPaintGrid) existingPaintGrid.remove();

        const existingPalette = this.elements.modalCard.querySelector('.paint-palette');
        if(existingPalette) existingPalette.remove();

        const existingCwGrid = this.elements.modalCard.querySelector('.crossword-grid');
        if(existingCwGrid) existingCwGrid.remove();
        
        const existingStrands = this.elements.modalCard.querySelector('.strands-container');
        if(existingStrands) existingStrands.remove();

        const existingDiffs = this.elements.modalCard.querySelector('.diff-container');
        if(existingDiffs) existingDiffs.remove();
        
        const existingHangman = this.elements.modalCard.querySelector('.hangman-container');
        if(existingHangman) existingHangman.remove();

        const clueBox = document.querySelector('.crossword-clue-box');
        if(clueBox) clueBox.remove();
        
        // Remove wide class by default
        this.elements.modalCard.classList.remove('wide');
        
        // Remove global keyboard listener if exists
        if(this.boundHangmanHandler) {
            document.removeEventListener('keydown', this.boundHangmanHandler);
            this.boundHangmanHandler = null;
        }

        if (puzzle) {
            if (puzzle.type === 'find-differences') {
                this.elements.modalCard.classList.add('wide');
            }

            if (puzzle.type === 'picture-puzzle' || puzzle.type === 'picture-5x5') {
                this.setupPicturePuzzle(puzzle);
            } else if (puzzle.type === 'paint-by-numbers') {
                this.setupPaintByNumbers(puzzle);
            } else if (puzzle.type === 'crossword') {
                this.setupCrossword(puzzle);
            } else if (puzzle.type === 'strands') {
                this.setupStrands(puzzle);
            } else if (puzzle.type === 'find-differences') {
                this.setupFindDifferences(puzzle);
            } else if (puzzle.type === 'hangman') {
                this.setupHangman(puzzle);
            } else {
                // Standard Text Puzzle
                this.elements.modalInput.focus();
            }
        }
        
        this.elements.modal.classList.add('active');
    }
    
    setupPicturePuzzle(puzzle) {
        this.elements.modalInput.classList.add('hidden');
        this.elements.btnSubmit.textContent = "Check";
        
        const rows = puzzle.rows || 5;
        const cols = puzzle.cols || 5;
        const totalTiles = rows * cols;
        
        // Initialize State
        const savedState = window.App.state.puzzleProgress && window.App.state.puzzleProgress[puzzle.id];
        if (savedState && savedState.length === totalTiles) {
            this.gridState = [...savedState];
        } else {
            this.gridState = Array.from({length: totalTiles}, (_, i) => i);
            for (let i = this.gridState.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.gridState[i], this.gridState[j]] = [this.gridState[j], this.gridState[i]];
            }
        }
        
        this.selectedTileIndex = null;
        
        // Create Grid DOM
        const grid = document.createElement('div');
        grid.className = 'puzzle-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`; 
        
        const containerWidth = 300;
        const tileWidth = containerWidth / cols;
        const tileHeight = containerWidth / rows;
        
        this.gridState.forEach((tileIndex, positionIndex) => {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';
            tile.dataset.pos = positionIndex;
            tile.style.backgroundImage = `url(${puzzle.imageUrl})`;
            tile.style.backgroundSize = `${containerWidth}px ${containerWidth}px`;
            tile.style.height = `${tileHeight}px`;

            const origCol = tileIndex % cols;
            const origRow = Math.floor(tileIndex / cols);
            const origX = origCol * tileWidth;
            const origY = origRow * tileHeight;
            
            tile.style.backgroundPosition = `-${origX}px -${origY}px`;
            tile.addEventListener('click', () => this.handleTileClick(positionIndex));
            grid.appendChild(tile);
        });
        
        this.elements.modalCard.insertBefore(grid, document.querySelector('.modal-actions'));
    }

    setupPaintByNumbers(puzzle) {
        this.elements.modalInput.classList.add('hidden');
        this.elements.btnSubmit.textContent = "Check";
        
        // 1. Setup State
        const rows = puzzle.rows || 10;
        const cols = puzzle.cols || 10;
        const total = rows * cols;
        
        const savedState = window.App.state.puzzleProgress && window.App.state.puzzleProgress[puzzle.id];
        if(savedState && savedState.length === total) {
            this.paintGridState = [...savedState];
        } else {
            this.paintGridState = new Array(total).fill(0); // 0 = empty
        }
        this.selectedColorIndex = 1;

        // 2. Render Palette
        const paletteContainer = document.createElement('div');
        paletteContainer.className = 'paint-palette';
        
        // Colors
        puzzle.palette.forEach((color, idx) => {
            const colorIdx = idx + 1; // 1-based index
            const swatch = document.createElement('div');
            swatch.className = 'paint-color';
            swatch.style.backgroundColor = color;
            swatch.textContent = colorIdx;
            if(colorIdx === this.selectedColorIndex) swatch.classList.add('selected');
            
            swatch.addEventListener('click', () => {
                this.selectedColorIndex = colorIdx;
                // Update UI visually
                Array.from(paletteContainer.children).forEach(c => c.classList.remove('selected'));
                swatch.classList.add('selected');
            });
            paletteContainer.appendChild(swatch);
        });

        // Eraser Tool
        const eraser = document.createElement('div');
        eraser.className = 'paint-color'; // Reuse style base
        eraser.style.backgroundColor = '#ccc';
        eraser.style.backgroundImage = 'linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff), linear-gradient(45deg, #fff 25%, transparent 25%, transparent 75%, #fff 75%, #fff)'; // Checkerboard logic for transparency visual, or just simple icon
        eraser.style.backgroundSize = '10px 10px';
        eraser.style.backgroundPosition = '0 0, 5px 5px';
        eraser.innerHTML = '🧽'; // Eraser Icon
        eraser.title = "Eraser";
        
        eraser.addEventListener('click', () => {
            this.selectedColorIndex = -1; // -1 for Eraser
            Array.from(paletteContainer.children).forEach(c => c.classList.remove('selected'));
            eraser.classList.add('selected');
        });
        paletteContainer.appendChild(eraser);
        
        // 3. Render Grid
        const grid = document.createElement('div');
        grid.className = 'paint-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        this.renderPaintGrid(grid, puzzle);

        // 4. Inject
        const actions = document.querySelector('.modal-actions');
        this.elements.modalCard.insertBefore(paletteContainer, actions);
        this.elements.modalCard.insertBefore(grid, actions);
        
        // 5. Add Clear Button
        const clearBtn = document.createElement('button');
        clearBtn.id = 'btn-pbn-clear';
        clearBtn.className = 'btn btn-secondary';
        clearBtn.textContent = 'Clear';
        clearBtn.style.marginRight = 'auto'; // Push others to right? CSS gap handles spacing usually
        clearBtn.onclick = () => {
             this.paintGridState.fill(0);
             this.renderPaintGrid(grid, puzzle); // Re-render logic
        };
        
        // Insert Clear button as first child of actions
        actions.insertBefore(clearBtn, actions.firstChild);
    }
    
    setupCrossword(puzzle) {
        this.elements.modalInput.classList.add('hidden');
        this.elements.btnSubmit.textContent = "Check";
        
        const cols = puzzle.gridCols || 12;
        const rows = puzzle.gridRows || 12;
        
        // 1. Build Data Model
        const gridMap = {};
        
        puzzle.words.forEach(w => {
            const letters = w.word.toUpperCase().split('');
            letters.forEach((l, idx) => {
                let gx = w.x; 
                let gy = w.y;
                if(w.dir === 'across') gx += idx;
                if(w.dir === 'down') gy += idx;
                
                const key = `${gx}-${gy}`;
                if(!gridMap[key]) {
                    gridMap[key] = { char: l, num: null, inWords: [] };
                }
                gridMap[key].inWords.push(w);
                
                // If it's the start, set number
                if(idx === 0) gridMap[key].num = w.num;
            });
        });
        
        // 2. Load State (User inputs)
        const savedState = window.App.state.puzzleProgress && window.App.state.puzzleProgress[puzzle.id];
        const userInputs = savedState || {}; // Key: 'x-y', Value: 'A'
        
        // 3. Render
        const container = document.createElement('div');
        container.className = 'crossword-container'; 

        const clueBox = document.createElement('div');
        clueBox.className = 'crossword-clue-box';
        clueBox.textContent = puzzle.hint || "Select a square";
        container.appendChild(clueBox);

        const grid = document.createElement('div');
        grid.className = 'crossword-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        // Render 1-based coordinates
        for(let r=1; r<=rows; r++) {
            for(let c=1; c<=cols; c++) {
                const key = `${c}-${r}`;
                const cellData = gridMap[key];
                
                const cell = document.createElement('div');
                cell.className = 'crossword-cell';
                
                if(cellData) {
                    cell.className += ' input-cell';
                    
                    if(cellData.num) {
                        const numSpan = document.createElement('span');
                        numSpan.className = 'cell-num';
                        numSpan.textContent = cellData.num;
                        cell.appendChild(numSpan);
                    }
                    
                    const input = document.createElement('input');
                    input.maxLength = 1;
                    input.dataset.key = key;
                    input.value = userInputs[key] || '';
                    
                    // Events
                    input.addEventListener('focus', () => {
                        this.activeCrosswordWord = cellData.inWords[0]; 
                        if(this.activeCrosswordWord && !cellData.inWords.includes(this.activeCrosswordWord)) {
                             // Switch
                             this.activeCrosswordWord = cellData.inWords[0];
                        }
                        this.updateCrosswordHighlights(grid, clueBox, puzzle);
                    });
                    
                    input.addEventListener('input', (e) => {
                         // Move Focus
                         if(e.target.value.length === 1) {
                             this.moveCrosswordFocus(c, r, 1);
                         }
                    });
                    
                    input.addEventListener('keydown', (e) => {
                        if(e.key === 'Backspace' && e.target.value === '') {
                             this.moveCrosswordFocus(c, r, -1);
                        }
                    });

                    cell.appendChild(input);
                }
                
                grid.appendChild(cell);
            }
        }
        
        container.appendChild(grid);
        this.elements.modalCard.insertBefore(container, document.querySelector('.modal-actions'));
    }
    
    setupStrands(puzzle) {
        this.elements.modalInput.classList.add('hidden');
        this.elements.btnSubmit.textContent = "Check";

        const cols = puzzle.cols || 6;
        const rows = puzzle.rows || 8;
        const gridStr = puzzle.grid || "";
        const words = puzzle.words || [];

        // State
        this.strandsPath = []; // Array of indices
        
        // Load Progress (Words + Paths)
        const saved = window.App.state.puzzleProgress && window.App.state.puzzleProgress[puzzle.id];
        
        if (saved && !Array.isArray(saved) && saved.words) {
            // New Format: { words: [], paths: [] }
            this.strandsFoundWords = [...saved.words];
            this.strandsFoundPaths = [...saved.paths];
        } else if (Array.isArray(saved)) {
            // Old Format: ['WORD']
            this.strandsFoundWords = [...saved];
            this.strandsFoundPaths = []; // Lost paths, but words preserved
        } else {
            this.strandsFoundWords = [];
            this.strandsFoundPaths = [];
        }
        
        let isSelecting = false; // "Click-Hover-Click" or "Drag" mode
        
        // DOM
        const container = document.createElement('div');
        container.className = 'strands-container';
        container.style.position = 'relative'; // For SVG overlay
        
        // SVG Overlay for Lines
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none'; // Click through
        svg.style.zIndex = '5';
        
        const foundGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        svg.appendChild(foundGroup);
        
        // Dynamic path line
        const currentLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        currentLine.setAttribute("stroke", "rgba(110, 68, 255, 0.5)");
        currentLine.setAttribute("stroke-width", "8");
        currentLine.setAttribute("fill", "none");
        currentLine.setAttribute("stroke-linecap", "round");
        currentLine.setAttribute("stroke-linejoin", "round");
        svg.appendChild(currentLine);
        
        const grid = document.createElement('div');
        grid.className = 'strands-grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        grid.style.position = 'relative';
        grid.style.zIndex = '10';
        
        // Word List Removed

        // Render Cells
        const cells = []; // Store refs
        for(let i=0; i<gridStr.length; i++) {
             const cell = document.createElement('div');
             cell.className = 'strands-cell';
             cell.textContent = gridStr[i];
             cell.dataset.idx = i;
             
             // Valid Adjacency Check
             const isValidNext = (nextIdx) => {
                 const lastIdx = this.strandsPath[this.strandsPath.length-1];
                 const cx = nextIdx % cols;
                 const cy = Math.floor(nextIdx / cols);
                 const lx = lastIdx % cols;
                 const ly = Math.floor(lastIdx / cols);
                 const dist = Math.max(Math.abs(cx-lx), Math.abs(cy-ly));
                 return dist === 1;
             };

             const onClick = (e) => {
                 if(!isSelecting) {
                     // Start Selection
                     isSelecting = true;
                     this.strandsPath = [i];
                     updateSelection();
                 } else {
                     // If clicking last cell again or just general click, End Selection
                     endSelection();
                 }
             };
             
             const onPointerEnter = (e) => {
                 if(!isSelecting) return;
                 // Add to path logic
                 if(!this.strandsPath.includes(i)) {
                     if(isValidNext(i)) {
                         this.strandsPath.push(i);
                         updateSelection();
                     }
                 } else if (this.strandsPath.length > 1 && this.strandsPath[this.strandsPath.length-2] === i) {
                     // Backtrack
                     this.strandsPath.pop();
                     updateSelection();
                 }
             };
             
             cell.addEventListener('click', onClick);
             cell.addEventListener('mouseenter', onPointerEnter);
             
             grid.appendChild(cell);
             cells.push(cell);
        }
        
        // Restore Visuals from Saved State
        if (this.strandsFoundPaths.length > 0) {
            this.strandsFoundPaths.forEach(path => {
                path.forEach(idx => {
                    if(cells[idx]) cells[idx].classList.add('found');
                });
            });
        }
        
        const getPoints = (idxArray) => {
             return idxArray.map(idx => {
                    const c = idx % cols;
                    const r = Math.floor(idx / cols);
                    const x = c * 50 + 20;
                    const y = r * 50 + 20;
                    return `${x},${y}`;
                }).join(" ");
        };

        const updateSelection = () => {
             // 1. Highlight Cells
            cells.forEach((c, idx) => {
                if(this.strandsPath.includes(idx)) c.classList.add('selected');
                else c.classList.remove('selected');
            });
            
            // 2. Draw Current Path
            if(this.strandsPath.length > 0) {
                currentLine.setAttribute("points", getPoints(this.strandsPath));
            } else {
                currentLine.setAttribute("points", "");
            }
            
            // 3. Draw Found Paths
            foundGroup.innerHTML = '';
            this.strandsFoundPaths.forEach(path => {
                const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                line.setAttribute("points", getPoints(path));
                line.setAttribute("stroke", "rgba(255, 71, 126, 0.6)"); // Primary color
                line.setAttribute("stroke-width", "8");
                line.setAttribute("fill", "none");
                line.setAttribute("stroke-linecap", "round");
                line.setAttribute("stroke-linejoin", "round");
                foundGroup.appendChild(line);
            });
        };
        
        const endSelection = () => {
            if(!isSelecting) return;
            isSelecting = false;
            
            // Check Word
            const formedWord = this.strandsPath.map(idx => gridStr[idx]).join("");
            const revWord = formedWord.split('').reverse().join('');
            
            let found = false;
            
            if(words.includes(formedWord) && !this.strandsFoundWords.includes(formedWord)) {
                this.strandsFoundWords.push(formedWord);
                found = true;
            } else if (words.includes(revWord) && !this.strandsFoundWords.includes(revWord)) {
                 this.strandsFoundWords.push(revWord);
                 found = true;
            }
            
            if(found) {
                this.strandsFoundPaths.push([...this.strandsPath]);
                this.strandsPath.forEach(idx => cells[idx].classList.add('found'));
            }
            
            this.strandsPath = []; 
            updateSelection();
        };
        
        container.appendChild(svg); // SVG behind/over items depending on z, placed first here
        container.appendChild(grid);
        this.elements.modalCard.insertBefore(container, document.querySelector('.modal-actions'));
        
        // Initial Draw of stored paths
        updateSelection();
    }

    setupFindDifferences(puzzle) {
        this.elements.modalInput.classList.add('hidden');
        this.elements.btnSubmit.textContent = "Check";
        
        // State
        const saved = window.App.state.puzzleProgress && window.App.state.puzzleProgress[puzzle.id];
        this.foundDiffs = saved ? [...saved] : [];
        
        // DOM
        const container = document.createElement('div');
        container.className = 'diff-container';
        container.style.marginBottom = '20px'; // Fix spacing
        
        const createWrapper = (src, isInteractable) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'diff-wrapper';
            
            const img = document.createElement('img');
            img.src = src;
            img.className = 'diff-image';
            wrapper.appendChild(img);
            
            // Add click handler (only need one interactable, or both?)
            // Usually finding diffs works on either side.
            wrapper.addEventListener('click', (e) => {
                const rect = wrapper.getBoundingClientRect();
                const xPct = ((e.clientX - rect.left) / rect.width) * 100;
                const yPct = ((e.clientY - rect.top) / rect.height) * 100;
                
                checkClick(xPct, yPct);
            });
            
            return wrapper;
        };
        
        // Render wrappers
        const w1 = createWrapper(puzzle.img1);
        const w2 = createWrapper(puzzle.img2);
        
        container.appendChild(w1);
        container.appendChild(w2);
        
        // Logic
        const checkClick = (x, y) => {
            let foundIndex = -1;
            
            puzzle.differences.forEach((diff, idx) => {
                // Calculate distance. Sqrt((x1-x2)^2 + (y1-y2)^2)
                // Note: Aspect ratio might skew distance if using raw % logic for circle check?
                // Assuming circle check in % space is acceptable approximation or images are roughly square/consistent.
                const dist = Math.sqrt(Math.pow(x - diff.x, 2) + Math.pow(y - diff.y, 2));
                
                if (dist <= diff.r) {
                    foundIndex = idx;
                }
            });
            
            if (foundIndex !== -1 && !this.foundDiffs.includes(foundIndex)) {
                this.foundDiffs.push(foundIndex);
                renderMarker(foundIndex);
            }
        };
        
        const renderMarker = (diffIndex) => {
            // Draw marker on BOTH images
            const diff = puzzle.differences[diffIndex];
            [w1, w2].forEach(wrapper => {
                const marker = document.createElement('div');
                marker.className = 'diff-marker';
                marker.style.left = `${diff.x}%`;
                marker.style.top = `${diff.y}%`;
                // Calculate pixel size for radius or use %?
                // r is in %, so width/height in %.
                // We want circle.
                // Assuming wrapper is responsive, % is fine.
                // 2 * r width.
                marker.style.width = `${diff.r * 2}%`;
                // height needs to match aspect. 
                // Hard to get perfect circle with % on non-square container.
                // Better to use aspect-ratio css or fixed size?
                // Let's use % width and assume mostly square or accept oval.
                // OR use px based on wrapper width.
                marker.style.height = `${diff.r * 2}%`; // Makes circle if container square.
                // Fix for Aspect Ratio:
                // We can't easily know aspect ratio in JS without loading image or measuring.
                // Let's assume oval markers are fine or try to use `aspect-ratio: 1` in CSS?
                marker.style.aspectRatio = "1/1";
                wrapper.appendChild(marker);
            });
        };
        
        // Render existing found
        this.foundDiffs.forEach(idx => renderMarker(idx));

        this.elements.modalCard.insertBefore(container, document.querySelector('.modal-actions'));
    }

    setupHangman(puzzle) {
        this.elements.modalInput.classList.add('hidden');
        this.elements.btnSubmit.textContent = "Check";
        
        // Word Bucket
        const BUCKET = ['SWEETHEART', 'VALENTINE', 'CHOCOLATEY'];
        
        // State
        const saved = window.App.state.puzzleProgress && window.App.state.puzzleProgress[puzzle.id];
        
        if (saved) {
            this.hangmanGuessed = saved.guessed || [];
            this.hangmanMistakes = saved.mistakes || 0;
            this.hangmanTarget = saved.target || BUCKET[0]; // Fallback
        } else {
            this.hangmanGuessed = [];
            this.hangmanMistakes = 0;
            // Pick Random
            this.hangmanTarget = BUCKET[Math.floor(Math.random() * BUCKET.length)];
        }
        
        const maxMistakes = puzzle.maxMistakes || 6;
        
        // DOM
        const container = document.createElement('div');
        container.className = 'hangman-container';
        container.style.marginBottom = '20px'; // Fix spacing
        
        // Status (Mistakes)
        const status = document.createElement('div');
        status.className = 'hangman-status';
        container.appendChild(status);
        
        // Word Display
        const wordDisplay = document.createElement('div');
        wordDisplay.className = 'hangman-word';
        container.appendChild(wordDisplay);
        
        // Keyboard
        const keyboard = document.createElement('div');
        keyboard.className = 'hangman-keyboard';
        container.appendChild(keyboard);
        
        // Functions
        const render = () => {
             // Update Status
             status.textContent = `Mistakes: ${this.hangmanMistakes} / ${maxMistakes}`;
             if(this.hangmanMistakes >= maxMistakes) {
                 status.textContent = "GAME OVER";
                 status.style.color = "red";
                 
                 // Reuse Keyboard Area for Retry Button
                 keyboard.innerHTML = '';
                 const retryBtn = document.createElement('button');
                 retryBtn.className = 'btn btn-secondary';
                 retryBtn.textContent = 'Try Again (New Word)';
                 retryBtn.onclick = () => {
                     // Reset State
                     this.hangmanGuessed = [];
                     this.hangmanMistakes = 0;
                     // New Word
                     this.hangmanTarget = BUCKET[Math.floor(Math.random() * BUCKET.length)];
                     render();
                 };
                 keyboard.appendChild(retryBtn);
                 
                 // Don't render word/keyboard normally
                 return;
             }
             
             // Update Word
             wordDisplay.innerHTML = '';
             const letters = this.hangmanTarget.split('');
             let allCorrect = true;
             
             letters.forEach(char => {
                 const slot = document.createElement('div');
                 slot.className = 'hangman-letter';
                 
                 if(char === ' ' || !/[A-Z]/.test(char)) {
                     slot.textContent = char;
                     slot.classList.add('space');
                 } else {
                     if(this.hangmanGuessed.includes(char)) {
                         slot.textContent = char;
                     } else {
                         slot.textContent = "";
                         allCorrect = false;
                     }
                 }
                 wordDisplay.appendChild(slot);
             });
             
             // Update Keyboard
             keyboard.innerHTML = '';
             const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
             alphabet.forEach(char => {
                 const key = document.createElement('div');
                 key.className = 'hangman-key';
                 key.textContent = char;
                 
                 const isUsed = this.hangmanGuessed.includes(char);
                 if(isUsed) {
                     key.classList.add('used');
                 }
                 
                 key.addEventListener('click', () => {
                     if(!isUsed && this.hangmanMistakes < maxMistakes) {
                         handleGuess(char);
                     }
                 });
                 
                 keyboard.appendChild(key);
             });
             
        };
        
        const handleGuess = (char) => {
            if(this.hangmanGuessed.includes(char) || this.hangmanMistakes >= maxMistakes) return;
            
            this.hangmanGuessed.push(char);
            
            if(!this.hangmanTarget.includes(char)) {
                this.hangmanMistakes++;
                this.shake(container);
            }
            
            render();
        };
        
        // Handle Physical Keyboard
        this.boundHangmanHandler = (e) => {
            if(this.hangmanMistakes >= maxMistakes) return;
            
            const key = e.key.toUpperCase();
            if(/^[A-Z]$/.test(key)) {
                handleGuess(key);
            }
        };
        document.addEventListener('keydown', this.boundHangmanHandler);
        
        // Initial Render
        render(); // Run once to build UI
        
        this.elements.modalCard.insertBefore(container, document.querySelector('.modal-actions'));
    }

    updateCrosswordHighlights(grid, clueBox, puzzle) {
        if(!this.activeCrosswordWord) return;
        
        const w = this.activeCrosswordWord;
        clueBox.textContent = `${w.num} ${w.dir.toUpperCase()}: ${w.clue}`;
        
        // Clear Highlights
        grid.querySelectorAll('.crossword-cell').forEach(c => c.classList.remove('highlight'));
        
        // Highlight active word cells
        const len = w.word.length;
        for(let i=0; i<len; i++) {
            let gx = w.x; 
            let gy = w.y;
            if(w.dir === 'across') gx += i;
            if(w.dir === 'down') gy += i;
            
            const key = `${gx}-${gy}`;
            const input = grid.querySelector(`input[data-key="${key}"]`);
            if(input) input.parentElement.classList.add('highlight');
        }
    }
    
    moveCrosswordFocus(c, r, dirNum) { 
        if(!this.activeCrosswordWord) return;
        const w = this.activeCrosswordWord;
        
        let currentIndex = -1;
        const len = w.word.length;
        
        for(let i=0; i<len; i++) {
            let gx = w.x; 
            let gy = w.y;
            if(w.dir === 'across') gx += i;
            if(w.dir === 'down') gy += i;
            if(gx === c && gy === r) {
                currentIndex = i;
                break;
            }
        }
        
        if(currentIndex === -1) return; 
        
        const nextIndex = currentIndex + dirNum;
        if(nextIndex >= 0 && nextIndex < len) {
             let nx = w.x; 
             let ny = w.y;
             if(w.dir === 'across') nx += nextIndex;
             if(w.dir === 'down') ny += nextIndex;
             
             const nextInput = document.querySelector(`input[data-key="${nx}-${ny}"]`);
             if(nextInput) nextInput.focus();
        }
    }

    renderPaintGrid(gridElement, puzzle) {
        gridElement.innerHTML = ''; // Clear Cells
        const target = puzzle.target || [];
        
        this.paintGridState.forEach((colorIndex, pos) => {
            const cell = document.createElement('div');
            cell.className = 'paint-cell';
            
            // If painted, show color
            if(colorIndex > 0) {
                cell.style.backgroundColor = puzzle.palette[colorIndex - 1];
                cell.textContent = '';
            } else {
                // Show Number Hint if not painted
                // If we have a target map, show the required number
                // If paint-by-numbers implies the user SEES the numbers.
                const hintNum = target[pos] || '';
                cell.textContent = hintNum;
                cell.style.backgroundColor = '#fff';
            }
            
            cell.addEventListener('click', () => {
                // Handle Eraser
                if(this.selectedColorIndex === -1) {
                    if(this.paintGridState[pos] !== 0) {
                        this.paintGridState[pos] = 0;
                        // Reset Visual
                        cell.style.backgroundColor = '#fff'; // Assuming white bg for empty
                        const hintNum = target[pos] || '';
                        cell.textContent = hintNum;
                    }
                    return;
                }

                // Paint Logic
                if(this.paintGridState[pos] !== this.selectedColorIndex) {
                    this.paintGridState[pos] = this.selectedColorIndex;
                    // Update visual
                    cell.style.backgroundColor = puzzle.palette[this.selectedColorIndex - 1];
                    cell.textContent = '';
                }
            });
            
            gridElement.appendChild(cell);
        });
    }

    handleTileClick(clickedPosIndex) {
        const grid = this.elements.modalCard.querySelector('.puzzle-grid');
        const tiles = grid.children;
        
        if (this.selectedTileIndex === null) {
            // Select First
            this.selectedTileIndex = clickedPosIndex;
            tiles[clickedPosIndex].classList.add('selected');
        } else if (this.selectedTileIndex === clickedPosIndex) {
            // Deselect
            tiles[clickedPosIndex].classList.remove('selected');
            this.selectedTileIndex = null;
        } else {
            // Swap
            this.swapTiles(this.selectedTileIndex, clickedPosIndex);
            
            // Clear Selection
            tiles[this.selectedTileIndex].classList.remove('selected');
            this.selectedTileIndex = null;
        }
    }
    
    swapTiles(posA, posB) {
        // Swap in State
        [this.gridState[posA], this.gridState[posB]] = [this.gridState[posB], this.gridState[posA]];
        
        this.updateTileVisuals();
    }
    
    updateTileVisuals() {
        if(!this.currentPuzzle) return;
        
        const grid = this.elements.modalCard.querySelector('.puzzle-grid');
        const tiles = grid.children;
        const cols = this.currentPuzzle.cols || 5;
        const rows = this.currentPuzzle.rows || 5;
        const containerWidth = 300;
        const tileWidth = containerWidth / cols;
        const tileHeight = containerWidth / rows;
        
        this.gridState.forEach((tileIndex, pos) => {
            const tile = tiles[pos];
            const origCol = tileIndex % cols;
            const origRow = Math.floor(tileIndex / cols);
            
            const origX = origCol * tileWidth;
            const origY = origRow * tileHeight;
            
            tile.style.backgroundPosition = `-${origX}px -${origY}px`;
        });
    }
    
    close() {
        // SAVE PROGRESS
        if(this.currentPuzzle) {
             const type = this.currentPuzzle.type || '';
             window.App.state.puzzleProgress = window.App.state.puzzleProgress || {};
             
             if(type === 'paint-by-numbers') {
                 window.App.state.puzzleProgress[this.currentPuzzle.id] = [...this.paintGridState];
             }
             else if(type.startsWith('picture')) {
                 window.App.state.puzzleProgress[this.currentPuzzle.id] = [...this.gridState];
             }
             else if(type === 'crossword') {
                 const inputs = {};
                 const grid = document.querySelector('.crossword-grid');
                 if(grid) {
                    grid.querySelectorAll('input').forEach(inp => {
                        inputs[inp.dataset.key] = inp.value.toUpperCase();
                    });
                    window.App.state.puzzleProgress[this.currentPuzzle.id] = inputs;
                 }
             }
             else if(type === 'strands') {
                 window.App.state.puzzleProgress[this.currentPuzzle.id] = {
                     words: [...(this.strandsFoundWords || [])],
                     paths: [...(this.strandsFoundPaths || [])]
                 };
             }
             else if(type === 'find-differences') {
                 window.App.state.puzzleProgress[this.currentPuzzle.id] = [...(this.foundDiffs || [])];
             }
             else if(type === 'hangman') {
                 // Save guessed letters
                 window.App.state.puzzleProgress[this.currentPuzzle.id] = {
                     guessed: [...(this.hangmanGuessed || [])],
                     mistakes: this.hangmanMistakes || 0,
                     target: this.hangmanTarget // Save target so we resume correct word
                 };
             }
        }
        
        // Cleanup Hangman
        if(this.boundHangmanHandler) {
            document.removeEventListener('keydown', this.boundHangmanHandler);
            this.boundHangmanHandler = null;
        }

        this.elements.modal.classList.remove('active');
        this.activeLockId = null;
        this.currentPuzzle = null;
    }
    
    checkAnswer() {
        if(this.activeLockId === null) return;
        
        // If already solved, click means "Unlock" / Proceed
        if(this.isSolved) {
            if(this.onSolveCallback) this.onSolveCallback(this.activeLockId);
            this.close();
            return;
        }
        
        const type = (this.currentPuzzle && this.currentPuzzle.type) || '';
        const isPicture = type.startsWith('picture');
        const isPaint = type === 'paint-by-numbers';
        const isStrands = type === 'strands';
        const isDiff = type === 'find-differences';
        const isHangman = type === 'hangman';
        
        let isValid = false;
        
        if(isHangman) {
            const word = (this.hangmanTarget || this.currentPuzzle.word || '').toUpperCase();
            isValid = word.split('').every(char => {
                if(char === ' ' || !/[A-Z]/.test(char)) return true;
                return this.hangmanGuessed.includes(char);
            });
            
            if(!isValid) {
                const container = document.querySelector('.hangman-container');
                this.shake(container);
            }
        } 
        else if(isDiff) {
            isValid = (this.foundDiffs && this.foundDiffs.length === (this.currentPuzzle.differences.length || 7));
            if(!isValid) {
                const diffContainer = document.querySelector('.diff-container');
                this.shake(diffContainer);
            }
        }
        else if(isStrands) {
             isValid = (this.strandsFoundWords && this.strandsFoundWords.length === this.currentPuzzle.words.length);
             if(!isValid) {
                 const container = document.querySelector('.strands-container');
                 this.shake(container);
             }
        }
        else if(isPaint) {
            const target = this.currentPuzzle.target || [];
            isValid = true;
            for(let i=0; i<target.length; i++) {
                if(this.paintGridState[i] !== target[i]) {
                    isValid = false;
                    break;
                }
            }
            
            if(!isValid) {
                 const grid = this.elements.modalCard.querySelector('.paint-grid');
                 this.shake(grid);
            }
        }
        else if (type === 'crossword') {
            isValid = true;
            this.currentPuzzle.words.forEach(w => {
                 const letters = w.word.toUpperCase().split('');
                 letters.forEach((l, idx) => {
                    let gx = w.x; 
                    let gy = w.y;
                    if(w.dir === 'across') gx += idx;
                    if(w.dir === 'down') gy += idx;
                    
                    const input = document.querySelector(`input[data-key="${gx}-${gy}"]`);
                    if(!input || input.value.toUpperCase() !== l) {
                        isValid = false;
                        if(input) {
                            input.parentElement.style.backgroundColor = '#ffcccc';
                            setTimeout(() => { if(input) input.parentElement.style.backgroundColor = ''; }, 1000);
                        }
                    }
                 });
            });
            
            if(!isValid) {
                 const grid = document.querySelector('.crossword-grid');
                 this.shake(grid);
            }
        }
        else if (isPicture) {
            isValid = true;
            for(let i=0; i<this.gridState.length; i++) {
                if(this.gridState[i] !== i) {
                    isValid = false;
                    break;
                }
            }
            if (!isValid) {
                const grid = this.elements.modalCard.querySelector('.puzzle-grid');
                this.shake(grid);
            }
        } else {
            // Standard Text Puzzle
            if(this.currentPuzzle && this.currentPuzzle.answer) {
                 const val = this.elements.modalInput.value.trim().toLowerCase();
                 // Supports array of answers or single string
                 if(Array.isArray(this.currentPuzzle.answer)) {
                     isValid = this.currentPuzzle.answer.map(a=>a.toLowerCase()).includes(val);
                 } else {
                     isValid = (val === this.currentPuzzle.answer.toLowerCase());
                 }
                 
                 if(!isValid) {
                     this.shake(this.elements.modalInput);
                 }
            } else {
                // If no answer defined, assume correct (e.g. read-only text?)
                isValid = true; 
            }
        }
        
        if(isValid) {
            this.setSolvedState();
        } else {
            this.flashButtonError();
        }
    }
    
    flashButtonError() {
        const btn = this.elements.btnSubmit;
        
        // Save original inline styles (usually empty if class-based)
        const prevTransition = btn.style.transition;
        const prevBg = btn.style.backgroundColor;
        const prevColor = btn.style.color;
        const prevBorder = btn.style.borderColor;
        
        // Apply Red Flash
        btn.style.transition = 'background-color 0.2s, border-color 0.2s';
        btn.style.backgroundColor = '#ff4444';
        btn.style.borderColor = '#ff4444'; 
        btn.style.color = 'white';
        
        setTimeout(() => {
            btn.style.transition = prevTransition;
            btn.style.backgroundColor = prevBg;
            btn.style.borderColor = prevBorder;
            btn.style.color = prevColor;
        }, 500);
    }

    setSolvedState() {
        this.isSolved = true;
        this.elements.btnSubmit.textContent = "Unlock";
        this.elements.btnSubmit.classList.add('btn-primary');
    }
    
    shake(element) {
        if(!element) return;
        element.style.transition = 'transform 0.1s';
        element.style.transform = "translateX(5px)";
        setTimeout(() => element.style.transform = "translateX(-5px)", 100);
        setTimeout(() => element.style.transform = "translateX(0)", 200);
    }
};