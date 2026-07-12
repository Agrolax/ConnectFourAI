document.addEventListener('DOMContentLoaded', () => {
    // Game state variables
    let engine = null;
    let agent1 = null;
    let agent2 = null;
    let isGameActive = false;
    let simulationTimeoutId = null;
    let currentHoverColumn = null;

    // DOM Screens
    const settingsScreen = document.getElementById('settings-screen');
    const gameScreen = document.getElementById('game-screen');

    // DOM Form Controls (Landing Page)
    const modesGrid = document.querySelector('.modes-grid');
    const modeCards = document.querySelectorAll('.mode-card:not(.disabled)');
    const randomSeedInput = document.getElementById('random-seed');
    
    let selectedGameMode = 'player-vs-random';
    const simulationDelayInput = document.getElementById('simulation-delay');
    const delayValLabel = document.getElementById('delay-val');
    const speedControlGroup = document.getElementById('speed-control-group');
    const btnStart = document.getElementById('btn-start');
    
    // DOM Controls (Game Page)
    const btnReset = document.getElementById('btn-reset');
    const btnBack = document.getElementById('btn-back');
    const currentPlayerVal = document.getElementById('current-player-val');
    const moveCountVal = document.getElementById('move-count-val');
    const connect4Board = document.getElementById('connect4-board');
    const dropIndicators = document.getElementById('drop-indicators');

    // DOM Modal Elements
    const winnerModal = document.getElementById('winner-modal');
    const winnerCelebrationTitle = document.getElementById('winner-celebration-title');
    const winnerCelebrationMsg = document.getElementById('winner-celebration-msg');
    const btnModalReplay = document.getElementById('btn-modal-replay');
    const btnModalClose = document.getElementById('btn-modal-close');

    // Toggle Screen Views Programmatically (avoid specificity bugs)
    function showScreen(screen) {
        if (screen === 'settings') {
            settingsScreen.classList.remove('hidden');
            gameScreen.classList.add('hidden');
        } else {
            settingsScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');
        }
    }

    // Initialize board slots (42 cells: 6 rows x 7 cols)
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
            const isHumanTurn =
    (
        selectedGameMode === 'player-vs-random' ||
        selectedGameMode === 'player-vs-rule'
    ) &&
    activePlayer === 1;
            
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

        cell.innerHTML = '';
        const disc = document.createElement('div');
        disc.classList.add('board-disc');
        disc.classList.add(player === 1 ? 'p1' : 'p2');
        cell.appendChild(disc);
    }

    // Highlight the winning 4 discs on the board
    function highlightWinningDiscs(winningCells) {
        winningCells.forEach(([r, c]) => {
            const cell = getHTMLCell(r, c);
            if (cell) {
                cell.classList.add('winning-cell');
            }
        });
    }

    // Show celebration modal
    function showWinnerModal(title, msg, winnerType) {
        winnerCelebrationTitle.textContent = title;
        winnerCelebrationMsg.textContent = msg;
        
        const winnerIcon = document.getElementById('winner-icon');
        
        if (winnerType === 1) {
            winnerCelebrationTitle.style.color = 'var(--p1-color)';
            winnerCelebrationTitle.style.textShadow = '0 0 16px rgba(225, 29, 72, 0.6)';
            if (winnerIcon) {
                winnerIcon.textContent = '🏆';
                winnerIcon.style.filter = 'drop-shadow(0 0 12px rgba(225, 29, 72, 0.6))';
            }
        } else if (winnerType === 2) {
            winnerCelebrationTitle.style.color = 'var(--p2-color)';
            winnerCelebrationTitle.style.textShadow = '0 0 16px rgba(6, 182, 212, 0.6)';
            if (winnerIcon) {
                if (
    selectedGameMode === 'player-vs-random' ||
    selectedGameMode === 'player-vs-rule'
) {
                    winnerIcon.textContent = '💀';
                    winnerIcon.style.filter = 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))';
                } else {
                    winnerIcon.textContent = '🏆';
                    winnerIcon.style.filter = 'drop-shadow(0 0 12px rgba(6, 182, 212, 0.6))';
                }
            }
        } else {
            winnerCelebrationTitle.style.color = 'var(--text-secondary)';
            winnerCelebrationTitle.style.textShadow = 'none';
            if (winnerIcon) {
                winnerIcon.textContent = '🤝';
                winnerIcon.style.filter = 'none';
            }
        }

        winnerModal.classList.remove('hidden');
    }

    function closeWinnerModal() {
        winnerModal.classList.add('hidden');
    }

    // Stop execution loops
    function stopLoops() {
        if (simulationTimeoutId) {
            clearTimeout(simulationTimeoutId);
            simulationTimeoutId = null;
        }
    }

    // Check if the game is over and display celebration modal
    function checkTerminalStatus() {
        const result = engine.winner();
        if (result !== null) {
            isGameActive = false;
            stopLoops();
            
            const winVal = result.player;
            if (winVal === 0) {
                showWinnerModal("Match Draw", "The board is full and there is no winner. Well played!", 0);
            } else {
                highlightWinningDiscs(result.cells);
                if (
    selectedGameMode === 'player-vs-random' ||
    selectedGameMode === 'player-vs-rule'
) {
                    if (winVal === 1) {
                        showWinnerModal("Victory!", "You connected four and defeated the Random AI agent!", 1);
                    } else {
                        showWinnerModal("Defeat!", "The Random AI agent connected four and won.", 2);
                    }
                } else {
                    const playerName = winVal === 1 ? "Player 1 (Red)" : "Player 2 (Yellow)";
                    showWinnerModal("Match Over", `${playerName} has connected four in a row!`, winVal);
                }
            }
            return true;
        }
        return false;
    }

    // Handle column drops (triggered by human click)
    function handleColumnSelection(col) {
        if (!isGameActive || !engine) return;
        if (engine.isTerminal()) return;

        const mode = selectedGameMode;
        const currentPl = engine.currentPlayer();
        
        if (
    (
        mode === 'player-vs-random' ||
        mode === 'player-vs-rule'
    ) &&
    currentPl === 1
) {
            try {
                const moveResult = engine.applyMove(col);
                animateDisc(moveResult.row, moveResult.col, 1);
                updateStatusUI();
                
                if (currentHoverColumn !== null) {
                    highlightColumn(currentHoverColumn, true);
                }

                if (!checkTerminalStatus()) {
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
                    if (
    selectedGameMode === 'random-vs-random' ||
    selectedGameMode === 'rule-vs-random'
) {
    scheduleAIMove();
}
                    }
                }
            } catch (err) {
                console.error("AI Error:", err);
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
        const mode = selectedGameMode;
        if (
    mode === 'random-vs-random' ||
    mode === 'rule-vs-random'
) {
    speedControlGroup.style.display = 'block';
} else {
    speedControlGroup.style.display = 'none';
}
    }

    // Reset board only (keeps active settings screen hidden, restart match directly)
    function resetBoard() {
        stopLoops();
        closeWinnerModal();
        
        engine = new ConnectFourEngine();
        const mode = selectedGameMode;
        let seedVal = null;
        if (randomSeedInput.value.trim() !== '') {
            seedVal = parseInt(randomSeedInput.value);
        }

        const seed1 = seedVal !== null ? seedVal : null;
        const seed2 = seedVal !== null ? seedVal + 1000 : null;

if (mode === 'random-vs-random') {
    agent1 = new RandomAgent(seed1);
    agent2 = new RandomAgent(seed2);

} else if (mode === 'player-vs-rule') {
    agent1 = null;
    agent2 = new RuleBasedAgent(seed2);

} else if (mode === 'rule-vs-random') {
    agent1 = new RuleBasedAgent(seed1);
    agent2 = new RandomAgent(seed2);

} else {
    // Player vs Random
    agent1 = null;
    agent2 = new RandomAgent(seed2);
}

        isGameActive = true;
        
        initializeBoardUI();
        updateStatusUI();
        resetHighlights();

        if (
    mode === 'random-vs-random' ||
    mode === 'rule-vs-random'
) {
    scheduleAIMove();
}
    }

    function backToSettings() {
        stopLoops();
        closeWinnerModal();
        isGameActive = false;
        
        modesGrid.classList.remove('match-active');
        showScreen('settings');
    }

    // Start match from configuration page
    function startMatch() {
        initializeBoardUI();
        
        engine = new ConnectFourEngine();
        const mode = selectedGameMode;
        let seedVal = null;
        if (randomSeedInput.value.trim() !== '') {
            seedVal = parseInt(randomSeedInput.value);
        }

        const seed1 = seedVal !== null ? seedVal : null;
        const seed2 = seedVal !== null ? seedVal + 1000 : null;

        if (mode === 'random-vs-random') {
    agent1 = new RandomAgent(seed1);
    agent2 = new RandomAgent(seed2);

} else if (mode === 'player-vs-rule') {
    agent1 = null;
    agent2 = new RuleBasedAgent(seed2);

} else if (mode === 'rule-vs-random') {
    agent1 = new RuleBasedAgent(seed1);
    agent2 = new RandomAgent(seed2);

} else {
    agent1 = null;
    agent2 = new RandomAgent(seed2);
}

        isGameActive = true;
        // Lock mode card changes while playing
        modesGrid.classList.add('match-active');
        
        // Toggle screen visibility
        showScreen('board');
        
        updateStatusUI();
        resetHighlights();

        if (
    mode === 'random-vs-random' ||
    mode === 'rule-vs-random'
) {
    scheduleAIMove();
}
    }

    // Event Listeners
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            if (isGameActive) return;
            modeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedGameMode = card.dataset.value;
            handleModeChange();
        });
    });
    
    simulationDelayInput.addEventListener('input', () => {
        delayValLabel.textContent = `${parseFloat(simulationDelayInput.value).toFixed(1)}s`;
    });

    // Configuration Screen
    btnStart.addEventListener('click', startMatch);

    // Active Match Screen
    btnReset.addEventListener('click', resetBoard);
    btnBack.addEventListener('click', backToSettings);

    // Modal Events
    btnModalReplay.addEventListener('click', () => {
        closeWinnerModal();
        resetBoard();
    });
    btnModalClose.addEventListener('click', () => {
        closeWinnerModal();
        backToSettings();
    });

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
    showScreen('settings');
    handleModeChange();
});
