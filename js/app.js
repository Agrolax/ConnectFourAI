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
    const playerOptionLists = document.querySelectorAll('.player-options');
    const p1OptionCards = document.querySelectorAll('.player-options[data-player="1"] .player-option-card');
    const p2OptionCards = document.querySelectorAll('.player-options[data-player="2"] .player-option-card');
    const randomSeedInput = document.getElementById('random-seed');
    
    let selectedPlayer1 = 'human';
    let selectedPlayer2 = 'random';
    const simulationDelayInput = document.getElementById('simulation-delay');
    const delayValLabel = document.getElementById('delay-val');
    const speedControlGroup = document.getElementById('speed-control-group');
    const btnStart = document.getElementById('btn-start');
    
    // DOM Controls (Game Page)
    const btnReset = document.getElementById('btn-reset');
    const btnBack = document.getElementById('btn-back');
    const player1Card = document.getElementById('player1-card');
    const player2Card = document.getElementById('player2-card');
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
            player1Card.classList.add('active', 'p1');
            player1Card.querySelector('.player-status-text').textContent = 'Next Turn';
            
            player2Card.classList.remove('active', 'p2');
            player2Card.querySelector('.player-status-text').textContent = 'Waiting';
        } else {
            player2Card.classList.add('active', 'p2');
            player2Card.querySelector('.player-status-text').textContent = 'Next Turn';
            
            player1Card.classList.remove('active', 'p1');
            player1Card.querySelector('.player-status-text').textContent = 'Waiting';
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
            const activeAgent = activePlayer === 1 ? agent1 : agent2;
            const isHumanTurn = (activeAgent === null);
            
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
        winnerCelebrationMsg.innerHTML = msg;
        
        const winnerIcon = document.getElementById('winner-icon');
        
        if (winnerType === 1 || winnerType === 2) {
            const glowColor = winnerType === 1 ? 'rgba(225, 29, 72, 0.6)' : 'rgba(6, 182, 212, 0.6)';
            winnerCelebrationTitle.style.color = winnerType === 1 ? 'var(--p1-color)' : 'var(--p2-color)';
            winnerCelebrationTitle.style.textShadow = `0 0 16px ${glowColor}`;
            if (winnerIcon) {
                const p1Agent = agent1 !== null;
                const p2Agent = agent2 !== null;
                
                let iconText = '🏆';
                if (!p1Agent && !p2Agent) {
                    iconText = '🏆';
                } else if (!p1Agent || !p2Agent) {
                    const humanWinner = (winnerType === 1 && !p1Agent) || (winnerType === 2 && !p2Agent);
                    iconText = humanWinner ? '🏆' : '💀';
                }
                
                winnerIcon.textContent = iconText;
                winnerIcon.style.filter = `drop-shadow(0 0 12px ${glowColor})`;
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
                
                const p1Agent = agent1 !== null;
                const p2Agent = agent2 !== null;

                if (!p1Agent && !p2Agent) {
                    // Player vs Player
                    showWinnerModal("Victory!", `Player ${winVal} connected four and won the match!`, winVal);
                } else if (!p1Agent || !p2Agent) {
                    // Player vs AI
                    const humanWinner = (winVal === 1 && !p1Agent) || (winVal === 2 && !p2Agent);
                    
                    let agentName = "AI";
                    const activeAgent = winVal === 1 ? agent2 : agent1;
                    if (activeAgent instanceof RandomAgent) agentName = "Random";
                    else if (activeAgent instanceof RuleBasedAgent) agentName = "Rule-Based";
                    else if (activeAgent instanceof MinimaxAgent) agentName = "Minimax";

                    if (humanWinner) {
                        showWinnerModal("Victory!", `You connected four and defeated the ${agentName} AI agent!`, winVal);
                    } else {
                        showWinnerModal("Defeat!", `The ${agentName} AI agent connected four and won.`, winVal);
                    }
                } else {
                    // AI vs AI
                    const winnerColor = winVal === 1 ? 'var(--p1-color)' : 'var(--p2-color)';
                    const winnerHTML = `<span style="color: ${winnerColor}; font-weight: bold;">Player ${winVal}</span>`;
                    showWinnerModal("Match Over", `${winnerHTML} has connected four in a row!`, winVal);
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

        const currentPl = engine.currentPlayer();
        const activeAgent = currentPl === 1 ? agent1 : agent2;
        
        if (activeAgent === null) {
            try {
                const moveResult = engine.applyMove(col);
                animateDisc(moveResult.row, moveResult.col, currentPl);
                updateStatusUI();
                
                if (currentHoverColumn !== null) {
                    highlightColumn(currentHoverColumn, true);
                }

                if (!checkTerminalStatus()) {
                    const nextPlayer = engine.currentPlayer();
                    const nextAgent = nextPlayer === 1 ? agent1 : agent2;
                    if (nextAgent !== null) {
                        scheduleAIMove();
                    }
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
                    const nextPlayer = engine.currentPlayer();
                    const nextAgent = nextPlayer === 1 ? agent1 : agent2;
                    if (nextAgent !== null) {
                        scheduleAIMove();
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

    // Update match mode text display at top of board panel
    function updateMatchModeIndicator() {
        const getLabel = (type) => {
            if (type === 'human') return 'Human';
            if (type === 'random') return 'Random AI';
            if (type === 'rule') return 'Rule-Based AI';
            if (type === 'minimax') return 'Minimax AI';
            return 'Unknown';
        };
        const p1 = getLabel(selectedPlayer1);
        const p2 = getLabel(selectedPlayer2);
        const indicator = document.getElementById('match-mode-indicator');
        if (indicator) {
            indicator.textContent = `${p1} vs ${p2}`;
        }
    }

    // Toggle settings widgets when mode changes (show always, disable if inapplicable)
    function handleModeChange() {
        const hasAI = (selectedPlayer1 !== 'human' || selectedPlayer2 !== 'human');
        const seedInput = document.getElementById('random-seed');
        const delayInput = document.getElementById('simulation-delay');
        const seedGroup = seedInput.closest('.control-group');
        
        if (hasAI) {
            seedInput.disabled = false;
            delayInput.disabled = false;
            seedGroup.classList.remove('settings-inactive');
            speedControlGroup.classList.remove('settings-inactive');
        } else {
            seedInput.disabled = true;
            delayInput.disabled = true;
            seedGroup.classList.add('settings-inactive');
            speedControlGroup.classList.add('settings-inactive');
        }
    }

    // Reset board only (keeps active settings screen hidden, restart match directly)
    function resetBoard() {
        stopLoops();
        closeWinnerModal();
        
        engine = new ConnectFourEngine();
        const p1Type = selectedPlayer1;
        const p2Type = selectedPlayer2;
        let seedVal = null;
        if (randomSeedInput.value.trim() !== '') {
            seedVal = parseInt(randomSeedInput.value);
        }

        const seed1 = seedVal !== null ? seedVal : null;
        const seed2 = seedVal !== null ? seedVal + 1000 : null;

        // Player 1 agent
        if (p1Type === 'human') {
            agent1 = null;
        } else if (p1Type === 'random') {
            agent1 = new RandomAgent(seed1);
        } else if (p1Type === 'rule') {
            agent1 = new RuleBasedAgent(seed1);
        } else if (p1Type === 'minimax') {
            agent1 = new MinimaxAgent(4, seed1);
        }

        // Player 2 agent
        if (p2Type === 'human') {
            agent2 = null;
        } else if (p2Type === 'random') {
            agent2 = new RandomAgent(seed2);
        } else if (p2Type === 'rule') {
            agent2 = new RuleBasedAgent(seed2);
        } else if (p2Type === 'minimax') {
            agent2 = new MinimaxAgent(4, seed2);
        }

        isGameActive = true;
        
        initializeBoardUI();
        updateStatusUI();
        resetHighlights();
        updateMatchModeIndicator();

        const currentPl = engine.currentPlayer();
        const activeAgent = currentPl === 1 ? agent1 : agent2;
        if (activeAgent !== null) {
            scheduleAIMove();
        }
    }

    function backToSettings() {
        stopLoops();
        closeWinnerModal();
        isGameActive = false;
        
        playerOptionLists.forEach(el => el.classList.remove('match-active'));
        showScreen('settings');
    }

    // Start match from configuration page
    function startMatch() {
        initializeBoardUI();
        
        engine = new ConnectFourEngine();
        const p1Type = selectedPlayer1;
        const p2Type = selectedPlayer2;
        let seedVal = null;
        if (randomSeedInput.value.trim() !== '') {
            seedVal = parseInt(randomSeedInput.value);
        }

        const seed1 = seedVal !== null ? seedVal : null;
        const seed2 = seedVal !== null ? seedVal + 1000 : null;

        // Player 1 agent
        if (p1Type === 'human') {
            agent1 = null;
        } else if (p1Type === 'random') {
            agent1 = new RandomAgent(seed1);
        } else if (p1Type === 'rule') {
            agent1 = new RuleBasedAgent(seed1);
        } else if (p1Type === 'minimax') {
            agent1 = new MinimaxAgent(4, seed1);
        }

        // Player 2 agent
        if (p2Type === 'human') {
            agent2 = null;
        } else if (p2Type === 'random') {
            agent2 = new RandomAgent(seed2);
        } else if (p2Type === 'rule') {
            agent2 = new RuleBasedAgent(seed2);
        } else if (p2Type === 'minimax') {
            agent2 = new MinimaxAgent(4, seed2);
        }

        isGameActive = true;
        // Lock player option changes while playing
        playerOptionLists.forEach(el => el.classList.add('match-active'));
        
        // Toggle screen visibility
        showScreen('board');
        
        updateStatusUI();
        resetHighlights();
        updateMatchModeIndicator();

        const currentPl = engine.currentPlayer();
        const activeAgent = currentPl === 1 ? agent1 : agent2;
        if (activeAgent !== null) {
            scheduleAIMove();
        }
    }

    // Event Listeners for Player Option Selection Cards
    p1OptionCards.forEach(card => {
        card.addEventListener('click', () => {
            if (isGameActive) return;
            p1OptionCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedPlayer1 = card.dataset.value;
            handleModeChange();
        });
    });

    p2OptionCards.forEach(card => {
        card.addEventListener('click', () => {
            if (isGameActive) return;
            p2OptionCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedPlayer2 = card.dataset.value;
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
