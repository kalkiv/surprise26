window.App = window.App || {};
window.App.Puzzles = window.App.Puzzles || {};

// Strands-style Word Search
// 6 cols x 8 rows = 48 letters
// Words: escaperooms, dinner, movies, dancing, boardgames, painting

window.App.Puzzles.Puzzle4 = {
    id: "puzzle4",
    type: "strands", 
    q: "Find the hidden words related to us.",
    hint: "Drag across adjacent letters to form composed words.",
    cols: 6,
    rows: 8,
    // Provide grid as a single string row-by-row
    // Layout logic: Packing words sequentially for simplicity
    // DINNER
    // MOVIES
    // DANCIN
    // GPAINT
    // INGBOA
    // RDGAME
    // SESCAP
    // EROOMS
    /*
      Checking adjacency of breaks:
      DINNER. Next MOVIES.
      MOVIES. Next DANCING.
      DANCING (D A N C I N | G). N is (2,5), G is (3,0). Not adjacent.
      Need to rearrange to ensure adjacency if words span lines? 
      Or just assume standard word search where words are lines.
      "Spanagram game" (Strands) means snaking words.
      
      Revised Layout (boustrophedon / snaking):
      R1: D I N N E R  (DINNER ->)
      R2: S E I V O M  (<- MOVIES connects to R at (0,5)? No R is (0,5), M is (1,5))
          (0,5) is R. (1,5) is M. Yes, adjacent vertically.
      R3: D A N C I N  (DANCIN ->)
                      G (at 4,0?)
      Let's act simple: I'll put them in predictable rows/cols.
      The user can update the grid string to match their image "exactly".
    */
    grid: "INGBOATNIARGESCPDADIAPEMNERESSNADRMSCNOOIEINGMOV",
    words: [
        "DINNER",
        "MOVIES",
        "DANCING",
        "PAINTING",
        "BOARDGAMES",
        "ESCAPEROOMS"
    ]
};