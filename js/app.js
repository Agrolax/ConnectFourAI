document.addEventListener('DOMContentLoaded', () => {
    let engine = null;
    let agent1 = null;
    let agent2 = null;
    let isGameActive = false;
    let simulationTimeoutId = null;
    let currentHoverColumn = null;
    let matchStartMs = null;
    let turnStartMs = null;
    let clockIntervalId = null;
    let lastMoveCell = null;

    const settingsScreen = document.getElementById('settings-screen');
    const gameScreen = document.getElementById('game-screen');

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

    const btnReset = document.getElementById('btn-reset');
    const btnBack = document.getElementById('btn-back');
    const btnResetIcon = document.getElementById('btn-reset-icon');
    const btnBackIcon = document.getElementById('btn-back-icon');
    const player1Card = document.getElementById('player1-card');
    const player2Card = document.getElementById('player2-card');
    const moveCountVal = document.getElementById('move-count-val');
    const timeElapsedVal = document.getElementById('time-elapsed-val');
    const turnClockVal = document.getElementById('turn-clock-val');
    const connect4Board = document.getElementById('connect4-board');
    const dropIndicators = document.getElementById('drop-indicators');

    const winnerModal = document.getElementById('winner-modal');
    const winnerCelebrationTitle = document.getElementById('winner-celebration-title');
    const winnerCelebrationMsg = document.getElementById('winner-celebration-msg');
    const btnModalReplay = document.getElementById('btn-modal-replay');
    const btnModalClose = document.getElementById('btn-modal-close');
    const floatingTooltip = document.getElementById('floating-tooltip');

    const WIN_ICON = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M7 6H5a3 3 0 003 5M17 6h2a3 3 0 01-3 5"/></svg>';
    const LOSS_ICON = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>';
    const DRAW_ICON = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="12" r="3"/><circle cx="16" cy="12" r="3"/><path d="M11 12h2"/></svg>';

    function formatClock(ms) {
        const totalSec = Math.max(0, Math.floor(ms / 1000));
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function updateClocks() {
        if (!matchStartMs) return;
        const now = Date.now();
        timeElapsedVal.textContent = formatClock(now - matchStartMs);

        if (isGameActive && turnStartMs && engine && !engine.isTerminal()) {
            const nextPlayer = engine.currentPlayer();
            turnClockVal.hidden = false;
            turnClockVal.textContent = formatClock(now - turnStartMs);
            turnClockVal.classList.remove('p1', 'p2');
            turnClockVal.classList.add(nextPlayer === 1 ? 'p1' : 'p2');
        } else {
            turnClockVal.hidden = true;
            turnClockVal.classList.remove('p1', 'p2');
        }
    }

    function startClocks() {
        matchStartMs = Date.now();
        turnStartMs = Date.now();
        if (clockIntervalId) clearInterval(clockIntervalId);
        updateClocks();
        clockIntervalId = setInterval(updateClocks, 250);
    }

    function resetTurnClock() {
        turnStartMs = Date.now();
        updateClocks();
    }

    function stopClocks() {
        if (clockIntervalId) {
            clearInterval(clockIntervalId);
            clockIntervalId = null;
        }
        updateClocks();
    }

    // Mobile-friendly tooltips (hover + focus + tap)
    let tooltipHideTimer = null;

    function positionTooltip(anchor) {
        const rect = anchor.getBoundingClientRect();
        const tipWidth = Math.min(240, window.innerWidth - 16);
        let left = rect.left + rect.width / 2;
        left = Math.max(8 + tipWidth / 2, Math.min(left, window.innerWidth - 8 - tipWidth / 2));
        const top = Math.max(8, rect.top - 10);
        floatingTooltip.style.maxWidth = `${tipWidth}px`;
        floatingTooltip.style.left = `${left}px`;
        floatingTooltip.style.top = `${top}px`;
    }

    function showTooltip(anchor, { sticky = false } = {}) {
        const text = anchor.getAttribute('data-tooltip');
        if (!text) return;
        if (tooltipHideTimer) {
            clearTimeout(tooltipHideTimer);
            tooltipHideTimer = null;
        }
        document.querySelectorAll('.is-tooltip-open').forEach((el) => el.classList.remove('is-tooltip-open'));
        floatingTooltip.textContent = text;
        floatingTooltip.hidden = false;
        anchor.classList.add('is-tooltip-open');
        positionTooltip(anchor);
        if (sticky) {
            tooltipHideTimer = setTimeout(hideTooltip, 1800);
        }
    }

    function hideTooltip() {
        if (tooltipHideTimer) {
            clearTimeout(tooltipHideTimer);
            tooltipHideTimer = null;
        }
        floatingTooltip.hidden = true;
        floatingTooltip.textContent = '';
        document.querySelectorAll('.is-tooltip-open').forEach((el) => el.classList.remove('is-tooltip-open'));
    }

    function bindTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach((el) => {
            el.addEventListener('mouseenter', () => showTooltip(el));
            el.addEventListener('mouseleave', () => {
                if (document.activeElement !== el) hideTooltip();
            });
            el.addEventListener('focus', () => showTooltip(el));
            el.addEventListener('blur', hideTooltip);

            if (el.classList.contains('tooltip-trigger')) {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (el.classList.contains('is-tooltip-open')) {
                        hideTooltip();
                    } else {
                        showTooltip(el, { sticky: true });
                    }
                });
            } else if (el.classList.contains('icon-btn')) {
                // Phone: brief label on press; desktop: hover/focus already covers it
                el.addEventListener('pointerdown', (e) => {
                    if (e.pointerType === 'touch') {
                        showTooltip(el, { sticky: true });
                    }
                });
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('[data-tooltip]') && !e.target.closest('.floating-tooltip')) {
                hideTooltip();
            }
        });

        window.addEventListener('scroll', hideTooltip, true);
        window.addEventListener('resize', hideTooltip);
    }

    function showScreen(screen) {
        if (screen === 'settings') {
            settingsScreen.classList.remove('hidden');
            gameScreen.classList.add('hidden');
        } else {
            settingsScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');
        }
    }

    function initializeBoardUI() {
        connect4Board.innerHTML = '';
        lastMoveCell = null;
        for (let i = 0; i < 42; i++) {
            const cell = document.createElement('div');
            cell.classList.add('board-cell');
            cell.dataset.index = i;
            cell.dataset.col = i % 7;
            cell.dataset.row = Math.floor(i / 7);
            connect4Board.appendChild(cell);
        }
    }

    function getHTMLCellIndex(rEngine, cEngine) {
        const rHtml = 5 - rEngine;
        return rHtml * 7 + cEngine;
    }

    function getHTMLCell(rEngine, cEngine) {
        const index = getHTMLCellIndex(rEngine, cEngine);
        return connect4Board.children[index];
    }

    function clearLastMoveHighlight() {
        if (lastMoveCell) {
            const disc = lastMoveCell.querySelector('.board-disc');
            if (disc) disc.classList.remove('last-move');
            lastMoveCell = null;
        }
        connect4Board.querySelectorAll('.board-disc.last-move').forEach((d) => d.classList.remove('last-move'));
    }

    function markLastMove(rEngine, cEngine) {
        clearLastMoveHighlight();
        const cell = getHTMLCell(rEngine, cEngine);
        if (!cell) return;
        const disc = cell.querySelector('.board-disc');
        if (disc) {
            disc.classList.add('last-move');
            lastMoveCell = cell;
        }
    }

    function updateStatusUI() {
        if (!engine) return;

        moveCountVal.textContent = engine.moveCount;

        const nextPlayer = engine.currentPlayer();

        if (nextPlayer === 1) {
            player1Card.classList.add('active', 'p1');
            player1Card.querySelector('.player-status-text').textContent = 'Next move';

            player2Card.classList.remove('active', 'p2');
            player2Card.querySelector('.player-status-text').textContent = 'Waiting';
        } else {
            player2Card.classList.add('active', 'p2');
            player2Card.querySelector('.player-status-text').textContent = 'Next move';

            player1Card.classList.remove('active', 'p1');
            player1Card.querySelector('.player-status-text').textContent = 'Waiting';
        }

        updateClocks();
    }

    function highlightColumn(col, isHovering) {
        currentHoverColumn = isHovering ? col : null;

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

        const cells = connect4Board.children;
        for (let i = 0; i < 42; i++) {
            const cellCol = parseInt(cells[i].dataset.col, 10);
            if (cellCol === col && isHovering) {
                cells[i].classList.add('highlighted-column');
            } else {
                cells[i].classList.remove('highlighted-column');
            }
        }
    }

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

    function animateDisc(rEngine, cEngine, player) {
        const cell = getHTMLCell(rEngine, cEngine);
        if (!cell) return;

        cell.innerHTML = '';
        const disc = document.createElement('div');
        disc.classList.add('board-disc');
        disc.classList.add(player === 1 ? 'p1' : 'p2');
        cell.appendChild(disc);
        markLastMove(rEngine, cEngine);
    }

    function highlightWinningDiscs(winningCells) {
        winningCells.forEach(([r, c]) => {
            const cell = getHTMLCell(r, c);
            if (cell) {
                cell.classList.add('winning-cell');
            }
        });
    }

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

                let iconHtml = WIN_ICON;
                if (!p1Agent && !p2Agent) {
                    iconHtml = WIN_ICON;
                } else if (!p1Agent || !p2Agent) {
                    const humanWinner = (winnerType === 1 && !p1Agent) || (winnerType === 2 && !p2Agent);
                    iconHtml = humanWinner ? WIN_ICON : LOSS_ICON;
                }

                winnerIcon.innerHTML = iconHtml;
                winnerIcon.style.filter = `drop-shadow(0 0 12px ${glowColor})`;
                winnerIcon.style.color = winnerType === 1 ? 'var(--p1-color)' : 'var(--p2-color)';
            }
        } else {
            winnerCelebrationTitle.style.color = 'var(--text-secondary)';
            winnerCelebrationTitle.style.textShadow = 'none';
            if (winnerIcon) {
                winnerIcon.innerHTML = DRAW_ICON;
                winnerIcon.style.filter = 'none';
                winnerIcon.style.color = 'var(--text-secondary)';
            }
        }

        stopClocks();
        winnerModal.classList.remove('hidden');
    }

    function closeWinnerModal() {
        winnerModal.classList.add('hidden');
    }

    function stopLoops() {
        if (simulationTimeoutId) {
            clearTimeout(simulationTimeoutId);
            simulationTimeoutId = null;
        }
    }

    function checkTerminalStatus() {
        const result = engine.winner();
        if (result !== null) {
            isGameActive = false;
            stopLoops();

            const winVal = result.player;
            if (winVal === 0) {
                showWinnerModal('Match draw', 'The board is full and there is no winner. Well played.', 0);
            } else {
                highlightWinningDiscs(result.cells);

                const p1Agent = agent1 !== null;
                const p2Agent = agent2 !== null;

                if (!p1Agent && !p2Agent) {
                    showWinnerModal('Victory', `Player ${winVal} (Human) connected four and won the match.`, winVal);
                } else if (!p1Agent || !p2Agent) {
                    const humanWinner = (winVal === 1 && !p1Agent) || (winVal === 2 && !p2Agent);
                    const agentName = getPlayerLabel(winVal === 1 ? 2 : 1);

                    if (humanWinner) {
                        showWinnerModal('Victory', `You connected four and defeated the ${agentName}.`, winVal);
                    } else {
                        showWinnerModal('Defeat', `The ${agentName} connected four and won the match.`, winVal);
                    }
                } else {
                    const winnerColor = winVal === 1 ? 'var(--p1-color)' : 'var(--p2-color)';
                    const winnerLabel = getPlayerLabel(winVal);
                    const winnerHTML = `<span style="color: ${winnerColor}; font-weight: bold;">${winnerLabel} (Player ${winVal})</span>`;
                    showWinnerModal('Match over', `${winnerHTML} has connected four and won.`, winVal);
                }
            }
            return true;
        }
        return false;
    }

    function handleColumnSelection(col) {
        if (!isGameActive || !engine) return;
        if (engine.isTerminal()) return;

        const currentPl = engine.currentPlayer();
        const activeAgent = currentPl === 1 ? agent1 : agent2;

        if (activeAgent === null) {
            try {
                const moveResult = engine.applyMove(col);
                animateDisc(moveResult.row, moveResult.col, currentPl);
                resetTurnClock();
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
                console.warn('Invalid move: ', err.message);
            }
        }
    }

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
                resetTurnClock();
                updateStatusUI();

                if (!checkTerminalStatus()) {
                    const nextPlayer = engine.currentPlayer();
                    const nextAgent = nextPlayer === 1 ? agent1 : agent2;
                    if (nextAgent !== null) {
                        scheduleAIMove();
                    }
                }
            } catch (err) {
                console.error('AI Error:', err);
            }
        }
    }

    function scheduleAIMove() {
        stopLoops();
        const delaySecs = parseFloat(simulationDelayInput.value);
        simulationTimeoutId = setTimeout(executeAIMove, delaySecs * 1000);
    }

    function getPlayerLabel(index) {
        const type = index === 1 ? selectedPlayer1 : selectedPlayer2;
        if (type === 'human') return 'Human';
        if (type === 'random') return 'Random AI';
        if (type === 'rule') return 'Rule-Based AI';
        if (type === 'minimax') return 'Minimax AI';
        return 'Unknown';
    }

    function updateMatchModeIndicator() {
        const p1 = getPlayerLabel(1);
        const p2 = getPlayerLabel(2);
        const p1Val = document.getElementById('player1-type-val');
        const p2Val = document.getElementById('player2-type-val');
        if (p1Val) p1Val.textContent = p1;
        if (p2Val) p2Val.textContent = p2;
    }

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

    function createAgents() {
        const p1Type = selectedPlayer1;
        const p2Type = selectedPlayer2;
        let seedVal = null;
        if (randomSeedInput.value.trim() !== '') {
            seedVal = parseInt(randomSeedInput.value, 10);
        }

        const seed1 = seedVal !== null ? seedVal : null;
        const seed2 = seedVal !== null ? seedVal + 1000 : null;

        if (p1Type === 'human') {
            agent1 = null;
        } else if (p1Type === 'random') {
            agent1 = new RandomAgent(seed1);
        } else if (p1Type === 'rule') {
            agent1 = new RuleBasedAgent(seed1);
        } else if (p1Type === 'minimax') {
            agent1 = new MinimaxAgent(4, seed1);
        }

        if (p2Type === 'human') {
            agent2 = null;
        } else if (p2Type === 'random') {
            agent2 = new RandomAgent(seed2);
        } else if (p2Type === 'rule') {
            agent2 = new RuleBasedAgent(seed2);
        } else if (p2Type === 'minimax') {
            agent2 = new MinimaxAgent(4, seed2);
        }
    }

    function resetBoard() {
        stopLoops();
        closeWinnerModal();
        hideTooltip();

        engine = new ConnectFourEngine();
        createAgents();

        isGameActive = true;

        initializeBoardUI();
        updateStatusUI();
        resetHighlights();
        updateMatchModeIndicator();
        startClocks();

        const currentPl = engine.currentPlayer();
        const activeAgent = currentPl === 1 ? agent1 : agent2;
        if (activeAgent !== null) {
            scheduleAIMove();
        }
    }

    function backToSettings() {
        stopLoops();
        stopClocks();
        closeWinnerModal();
        hideTooltip();
        isGameActive = false;

        playerOptionLists.forEach((el) => el.classList.remove('match-active'));
        showScreen('settings');
    }

    function startMatch() {
        initializeBoardUI();

        engine = new ConnectFourEngine();
        createAgents();

        isGameActive = true;
        playerOptionLists.forEach((el) => el.classList.add('match-active'));

        showScreen('board');

        updateStatusUI();
        resetHighlights();
        updateMatchModeIndicator();
        startClocks();

        const currentPl = engine.currentPlayer();
        const activeAgent = currentPl === 1 ? agent1 : agent2;
        if (activeAgent !== null) {
            scheduleAIMove();
        }
    }

    p1OptionCards.forEach((card) => {
        card.addEventListener('click', () => {
            if (isGameActive) return;
            p1OptionCards.forEach((c) => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedPlayer1 = card.dataset.value;
            handleModeChange();
        });
    });

    p2OptionCards.forEach((card) => {
        card.addEventListener('click', () => {
            if (isGameActive) return;
            p2OptionCards.forEach((c) => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedPlayer2 = card.dataset.value;
            handleModeChange();
        });
    });

    simulationDelayInput.addEventListener('input', () => {
        delayValLabel.textContent = `${parseFloat(simulationDelayInput.value).toFixed(1)}s`;
    });

    btnStart.addEventListener('click', startMatch);

    if (btnReset) btnReset.addEventListener('click', resetBoard);
    if (btnBack) btnBack.addEventListener('click', backToSettings);
    if (btnResetIcon) btnResetIcon.addEventListener('click', resetBoard);
    if (btnBackIcon) btnBackIcon.addEventListener('click', backToSettings);

    btnModalReplay.addEventListener('click', () => {
        closeWinnerModal();
        resetBoard();
    });
    btnModalClose.addEventListener('click', () => {
        closeWinnerModal();
        backToSettings();
    });

    connect4Board.addEventListener('click', (e) => {
        const cell = e.target.closest('.board-cell');
        if (cell) {
            handleColumnSelection(parseInt(cell.dataset.col, 10));
        }
    });

    connect4Board.addEventListener('mousemove', (e) => {
        const cell = e.target.closest('.board-cell');
        if (cell) {
            highlightColumn(parseInt(cell.dataset.col, 10), true);
        } else {
            highlightColumn(null, false);
        }
    });

    connect4Board.addEventListener('mouseleave', () => {
        highlightColumn(null, false);
    });

    dropIndicators.addEventListener('click', (e) => {
        const indicator = e.target.closest('.indicator');
        if (indicator) {
            handleColumnSelection(parseInt(indicator.dataset.col, 10));
        }
    });

    dropIndicators.addEventListener('mousemove', (e) => {
        const indicator = e.target.closest('.indicator');
        if (indicator) {
            highlightColumn(parseInt(indicator.dataset.col, 10), true);
        } else {
            highlightColumn(null, false);
        }
    });

    dropIndicators.addEventListener('mouseleave', () => {
        highlightColumn(null, false);
    });

    bindTooltips();
    showScreen('settings');
    handleModeChange();
});
