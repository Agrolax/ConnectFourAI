document.addEventListener('DOMContentLoaded', () => {
    // Game state variables
    let engine = null;
    let agent1 = null;
    let agent2 = null;
    let isGameActive = false;
    let simulationTimeoutId = null;
    let currentHoverColumn = null;

    // DOM Elements
    const gameModeSelect = document.getElementById('game-mode');
    const randomSeedInput = document.getElementById('random-seed');
    const simulationDelayInput = document.getElementById('simulation-delay');
    const delayValLabel = document.getElementById('delay-val');
    const speedControlGroup = document.getElementById('speed-control-group');
    const btnStart = document.getElementById('btn-start');
    const btnReset = document.getElementById('btn-reset');
    
    const currentPlayerVal = document.getElementById('current-player-val');
    const moveCountVal = document.getElementById('move-count-val');
    
    const gameAlert = document.getElementById('game-alert');
    const gameAlertMsg = document.getElementById('game-alert-msg');
    const btnDismissAlert = document.getElementById('btn-dismiss-alert');
    
    const connect4Board = document.getElementById('connect4-board');
    const dropIndicators = document.getElementById('drop-indicators');

    // Initialize board DOM slots (42 cells: 6 rows x 7 cols)
    function initializeBoardUI() {
        connect4Board.innerHTML = '';
        for (let i = 0; i < 42; i++) {
            const cell = document.createElement('div');
            cell.classList.add('board-cell');
            cell.dataset.index = i;
            cell.dataset.col = i % 7;
            cell.dataset.row = Math.floor(i / 7);
            connect4Board.appendChild(cell);
        }
    }

    // Helper: Map engine coordinates (row 0 at bottom, 5 at top) to HTML index
    function getHTMLCellIndex(rEngine, cEngine) {
        const rHtml = 5 - rEngine;
        return rHtml * 7 + cEngine;
    }

    // Helper: Get HTML cell element
    function getHTMLCell(rEngine, cEngine) {
        const index = getHTMLCellIndex(rEngine, cEngine);
        return connect4Board.children[index];
    }

    // Render current player indicator in status card
    function updateStatusUI() {
        if (!engine) return;
        
        moveCountVal.textContent = engine.moveCount;
        
        const nextPlayer = engine.currentPlayer();
        if (nextPlayer === 1) {
            currentPlayerVal.innerHTML = '<span class="token token-p1-small"></span> Player 1';
        } else {
            currentPlayerVal.innerHTML = '<span class="token token-p2-small"></span> Player 2';
        }
    }

    // Highlight whole column on hover
    function highlightColumn(col, isHovering) {
        currentHoverColumn = isHovering ? col : null;
        
        // Highlight indicator
        const indicators = dropIndicators.children;
        for (let c = 0; c < 7; c++) {
            indicators[c].classList.remove('hover-p1', 'hover-p2');
        }

        if (isHovering && isGameActive && engine && !engine.isTerminal()) {
            const activePlayer = engine.currentPlayer();
            
            // Check if player is a human or if the game mode is simulation
            const isHumanTurn = (gameModeSelect.value === 'player-vs-random' && activePlayer === 1);
            
            if (isHumanTurn) {
                indicators[col].classList.add(activePlayer === 1 ? 'hover-p1' : 'hover-p2');
            }
        }

        // Highlight cells in grid
        const cells = connect4Board.children;
        for (let i = 0; i < 42; i++) {
            const cellCol = parseInt(cells[i].dataset.col);
            if (cellCol === col && isHovering) {
                cells[i].classList.add('highlighted-column');
            } else {
                cells[i].classList.remove('highlighted-column');
            }
        }
    }

    // Reset visual effects
    function resetHighlights() {
        const indicators = dropIndicators.children;
        for (let c = 0; c < 7; c++) {
            indicators[c].classList.remove('hover-p1', 'hover-p2');
        }
        const cells = connect4Board.children;
        for (let i = 0; i < 42; i++) {
            cells[i].classList.remove('highlighted-column');
        }
    }

    // Trigger visual disc drop animation
    function animateDisc(rEngine, cEngine, player) {
        const cell = getHTMLCell(rEngine, cEngine);
        if (!cell) return;

        // Clear cell contents first just in case
        cell.innerHTML = '';

        const disc = document.createElement('div');
        disc.classList.add('board-disc');
        disc.classList.add(player === 1 ? 'p1' : 'p2');
        cell.appendChild(disc);
    }

    // Show alert banner
    function showAlert(msg, winnerType) {
        gameAlert.className = 'game-alert-banner';
        if (winnerType === 1) {
            gameAlert.classList.add('winner-p1');
        } else if (winnerType === 2) {
            gameAlert.classList.add('winner-p2');
        } else if (winnerType === 0) {
            gameAlert.classList.add('winner-draw');
        }
        
        gameAlertMsg.textContent = msg;
        gameAlert.style.display = 'flex';
    }

    function dismissAlert() {
        gameAlert.style.display = 'none';
    }

    // Stop execution loops
    function stopLoops() {
        if (simulationTimeoutId) {
            clearTimeout(simulationTimeoutId);
            simulationTimeoutId = null;
        }
    }

    // Check if the game is over and display banner
    function checkTerminalStatus() {
        if (engine.isTerminal()) {
            isGameActive = false;
            stopLoops();
            
            const winVal = engine.winner();
            if (winVal === 0) {
                showAlert("Game Over: It's a draw!", 0);
            } else {
                showAlert(`Game Over: Player ${winVal} (${winVal === 1 ? 'Red' : 'Yellow'}) wins!`, winVal);
            }
            return true;
        }
        return false;
    }

    // Handle column drops (triggered by human click)
    function handleColumnSelection(col) {
        if (!isGameActive || !engine) return;
        if (engine.isTerminal()) return;

        // Verify it is Player 1's turn and mode is player-vs-random
        const mode = gameModeSelect.value;
        const currentPl = engine.currentPlayer();
        
        if (mode === 'player-vs-random' && currentPl === 1) {
            // Human move
            try {
                const moveResult = engine.applyMove(col);
                animateDisc(moveResult.row, moveResult.col, 1);
                updateStatusUI();
                
                // Recalculate hover styling
                if (currentHoverColumn !== null) {
                    highlightColumn(currentHoverColumn, true);
                }

                if (!checkTerminalStatus()) {
                    // Trigger AI response
                    scheduleAIMove();
                }
            } catch (err) {
                console.warn("Invalid move: ", err.message);
            }
        }
    }

    // Run AI move calculation and animation
    function executeAIMove() {
        if (!isGameActive || !engine || engine.isTerminal()) return;

        const currentPl = engine.currentPlayer();
        let agent = null;

        if (currentPl === 1 && agent1) {
            agent = agent1;
        } else if (currentPl === 2 && agent2) {
            agent = agent2;
        }

        if (agent) {
            try {
                const col = agent.getMove(engine);
                const result = engine.applyMove(col);
                animateDisc(result.row, result.col, currentPl);
                updateStatusUI();

                if (!checkTerminalStatus()) {
                    // If simulation mode, queue next step. Otherwise, wait for human input.
                    if (gameModeSelect.value === 'random-vs-random') {
                        scheduleAIMove();
                    }
                }
            } catch (err) {
                console.error("AI Error:", err);
                showAlert(`AI Error: ${err.message}`, 0);
            }
        }
    }

    // Schedule AI move execution based on speed slider
    function scheduleAIMove() {
        stopLoops();
        const delaySecs = parseFloat(simulationDelayInput.value);
        simulationTimeoutId = setTimeout(executeAIMove, delaySecs * 1000);
    }

    // Toggle settings widgets when mode changes
    function handleModeChange() {
        const mode = gameModeSelect.value;
        if (mode === 'random-vs-random') {
            speedControlGroup.style.display = 'block';
        } else {
            speedControlGroup.style.display = 'none';
        }
    }

    // Reset whole game to initial clean slate
    function resetGame() {
        stopLoops();
        isGameActive = false;
        engine = null;
        agent1 = null;
        agent2 = null;
        
        // Reset HTML controls
        gameModeSelect.disabled = false;
        randomSeedInput.disabled = false;
        btnStart.disabled = false;
        
        currentPlayerVal.innerHTML = '<span class="token token-p1-small"></span> Player 1';
        moveCountVal.textContent = '0';
        
        dismissAlert();
        initializeBoardUI();
        resetHighlights();
    }

    // Start a new game with active configs
    function startGame() {
        resetGame();

        engine = new ConnectFourEngine();
        const mode = gameModeSelect.value;
        
        // Retrieve and parse seed value
        let seedVal = null;
        if (randomSeedInput.value.trim() !== '') {
            seedVal = parseInt(randomSeedInput.value);
        }

        // Initialize players/agents
        const seed1 = seedVal !== null ? seedVal : null;
        const seed2 = seedVal !== null ? seedVal + 1000 : null;

        if (mode === 'random-vs-random') {
            agent1 = new RandomAgent(seed1);
            agent2 = new RandomAgent(seed2);
        } else {
            // Player vs Random
            agent2 = new RandomAgent(seed2);
        }

        isGameActive = true;
        
        // Disable settings adjustments while active
        gameModeSelect.disabled = true;
        randomSeedInput.disabled = true;
        btnStart.disabled = true;

        updateStatusUI();

        // If Random vs Random, initiate automated loop immediately
        if (mode === 'random-vs-random') {
            scheduleAIMove();
        }
    }

    // Event Listeners
    gameModeSelect.addEventListener('change', handleModeChange);
    
    simulationDelayInput.addEventListener('input', () => {
        delayValLabel.textContent = `${parseFloat(simulationDelayInput.value).toFixed(1)}s`;
    });

    btnStart.addEventListener('click', startGame);
    btnReset.addEventListener('click', resetGame);
    btnDismissAlert.addEventListener('click', dismissAlert);

    // Board click and hover listeners
    connect4Board.addEventListener('click', (e) => {
        const cell = e.target.closest('.board-cell');
        if (cell) {
            handleColumnSelection(parseInt(cell.dataset.col));
        }
    });

    connect4Board.addEventListener('mousemove', (e) => {
        const cell = e.target.closest('.board-cell');
        if (cell) {
            highlightColumn(parseInt(cell.dataset.col), true);
        } else {
            highlightColumn(null, false);
        }
    });

    connect4Board.addEventListener('mouseleave', () => {
        highlightColumn(null, false);
    });

    // Drop indicator column clicking
    dropIndicators.addEventListener('click', (e) => {
        const indicator = e.target.closest('.indicator');
        if (indicator) {
            handleColumnSelection(parseInt(indicator.dataset.col));
        }
    });

    dropIndicators.addEventListener('mousemove', (e) => {
        const indicator = e.target.closest('.indicator');
        if (indicator) {
            highlightColumn(parseInt(indicator.dataset.col), true);
        } else {
            highlightColumn(null, false);
        }
    });

    dropIndicators.addEventListener('mouseleave', () => {
        highlightColumn(null, false);
    });

    // Run first initialization
    initializeBoardUI();
    handleModeChange();
});
