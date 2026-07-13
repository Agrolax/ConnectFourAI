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
    let lastMoveCells = { 1: null, 2: null };

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
    const btnSoundIcon = document.getElementById('btn-sound-icon');
    const soundModal = document.getElementById('sound-modal');
    const btnCloseSound = document.getElementById('btn-close-sound');
    const gameAudio = new GameAudio();
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
    const resultsModal = document.getElementById('results-modal');
    const resultsCharts = document.getElementById('results-charts');
    const btnOpenResultsLobby = document.getElementById('btn-open-results-lobby');
    const btnCloseResults = document.getElementById('btn-close-results');

    const TYPE_ICONS = {
        human: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 19.5c1.2-3.2 3.5-4.8 6.5-4.8s5.3 1.6 6.5 4.8"/></svg>',
        random: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="15" cy="10" r="1.2" fill="currentColor"/><path d="M9 15h6"/></svg>',
        rule: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/></svg>',
        minimax: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="1.8"/><circle cx="6" cy="12" r="1.8"/><circle cx="18" cy="12" r="1.8"/><circle cx="3.5" cy="19.5" r="1.5"/><circle cx="8.5" cy="19.5" r="1.5"/><circle cx="15.5" cy="19.5" r="1.5"/><circle cx="20.5" cy="19.5" r="1.5"/><path d="M12 6.3v3.2M12 9.5L6.8 11M12 9.5l5.2 1.5M6 13.8v3.2M18 13.8v3.2"/></svg>'
    };

    const WIN_ICON = '<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M8 21h8v-1.5h-2.2V17H17a5 5 0 005-5V8h-2.5A2.5 2.5 0 0017 5.5h-1V4H8v1.5H7A2.5 2.5 0 004.5 8H2v4a5 5 0 005 5h3.2V19.5H8V21zm1.5-8.2H7a2.5 2.5 0 01-2.5-2.5V9.5H7A4 4 0 009.5 12.8zm5 0A4 4 0 0017 9.5h2.5V10.3a2.5 2.5 0 01-2.5 2.5h-2.5z"/></svg>';
    const LOSS_ICON = '<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3.7 13.3a1 1 0 01-1.4 1.4L12 13.4l-2.3 2.3a1 1 0 01-1.4-1.4l2.3-2.3-2.3-2.3a1 1 0 011.4-1.4l2.3 2.3 2.3-2.3a1 1 0 011.4 1.4L13.4 12l2.3 2.3z"/></svg>';
    const DRAW_ICON = '<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 9.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm9 0a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM10.8 13h2.4a1 1 0 010 2h-2.4a1 1 0 010-2z"/></svg>';

    const EVAL_SUMMARY = [
        {
            title: 'Random vs Rule-Based',
            agents: [
                { name: 'Random', wins: 1, draws: 0, avgMs: 0.0012 },
                { name: 'Rule-Based', wins: 29, draws: 0, avgMs: 0.2555 }
            ]
        },
        {
            title: 'Rule-Based vs Minimax',
            agents: [
                { name: 'Rule-Based', wins: 3, draws: 1, avgMs: 0.2719 },
                { name: 'Minimax', wins: 26, draws: 1, avgMs: 33.4204 }
            ]
        },
        {
            title: 'Minimax vs Random',
            agents: [
                { name: 'Minimax', wins: 30, draws: 0, avgMs: 42.5260 },
                { name: 'Random', wins: 0, draws: 0, avgMs: 0.0021 }
            ]
        }
    ];

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

    let tooltipHideTimer = null;

    function positionTooltip(anchor) {
        const rect = anchor.getBoundingClientRect();
        const tipWidth = Math.min(240, window.innerWidth - 16);
        floatingTooltip.style.maxWidth = `${tipWidth}px`;
        floatingTooltip.hidden = false;

        const tipHeight = floatingTooltip.offsetHeight || 36;
        const spaceAbove = rect.top;
        const placeBelow = spaceAbove < tipHeight + 16;

        let left = rect.left + rect.width / 2;
        left = Math.max(8 + tipWidth / 2, Math.min(left, window.innerWidth - 8 - tipWidth / 2));
        floatingTooltip.style.left = `${left}px`;

        if (placeBelow) {
            floatingTooltip.classList.add('below');
            floatingTooltip.style.top = `${rect.bottom + 10}px`;
        } else {
            floatingTooltip.classList.remove('below');
            floatingTooltip.style.top = `${rect.top - 10}px`;
        }
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
        floatingTooltip.classList.remove('below');
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
                    if (el.classList.contains('is-tooltip-open')) hideTooltip();
                    else showTooltip(el, { sticky: true });
                });
            } else if (el.classList.contains('icon-btn')) {
                el.addEventListener('pointerdown', (e) => {
                    if (e.pointerType === 'touch') showTooltip(el, { sticky: true });
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

    function renderResultsCharts() {
        resultsCharts.innerHTML = EVAL_SUMMARY.map((pair, pairIndex) => {
            const rows = pair.agents.map((agent, i) => {
                const pct = (agent.wins / 30) * 100;
                const fillClass = i === 0 ? '' : 'alt';
                return `
                    <div class="bar-row">
                        <span class="bar-label">${agent.name}</span>
                        <div class="bar-track"><div class="bar-fill ${fillClass}" style="width:${pct}%"></div></div>
                        <span class="bar-value">${agent.wins}/30 · ${pct.toFixed(0)}%</span>
                    </div>
                `;
            }).join('');

            const draws = pair.agents[0].draws;
            const drawRow = draws > 0
                ? `<div class="bar-row">
                        <span class="bar-label">Draws</span>
                        <div class="bar-track"><div class="bar-fill soft" style="width:${(draws / 30) * 100}%"></div></div>
                        <span class="bar-value">${draws}/30</span>
                   </div>`
                : '';

            const times = pair.agents.map((a) =>
                `<span class="time-chip">${a.name}: ${a.avgMs.toFixed(4)} ms/move</span>`
            ).join('');

            return `
                <article class="pair-card">
                    <h3>${pair.title}</h3>
                    ${rows}
                    ${drawRow}
                    <div class="pair-times">${times}</div>
                </article>
            `;
        }).join('');
    }

    function openResults() {
        hideTooltip();
        renderResultsCharts();
        resultsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeResults() {
        resultsModal.classList.add('hidden');
        document.body.style.overflow = '';
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
        lastMoveCells = { 1: null, 2: null };
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
        return (5 - rEngine) * 7 + cEngine;
    }

    function getHTMLCell(rEngine, cEngine) {
        return connect4Board.children[getHTMLCellIndex(rEngine, cEngine)];
    }

    function clearLastMoveHighlight(player) {
        if (player) {
            const cell = lastMoveCells[player];
            if (cell) {
                const disc = cell.querySelector('.board-disc');
                if (disc) disc.classList.remove('last-move');
                lastMoveCells[player] = null;
            }
            return;
        }
        [1, 2].forEach((p) => clearLastMoveHighlight(p));
    }

    function markLastMove(rEngine, cEngine, player) {
        clearLastMoveHighlight(player);
        const cell = getHTMLCell(rEngine, cEngine);
        if (!cell) return;
        const disc = cell.querySelector('.board-disc');
        if (disc) {
            disc.classList.add('last-move');
            lastMoveCells[player] = cell;
        }
    }

    function clearDropPreviews() {
        connect4Board.querySelectorAll('.board-cell.drop-preview').forEach((cell) => {
            cell.classList.remove('drop-preview', 'p1', 'p2');
        });
    }

    function updateStatusUI() {
        if (!engine) return;
        moveCountVal.textContent = engine.moveCount;

        const terminal = engine.winner();
        if (terminal !== null) {
            updateEndgameStatus(terminal.player);
            updateClocks();
            return;
        }

        const nextPlayer = engine.currentPlayer();
        player1Card.classList.remove('result-won', 'result-lost', 'result-draw');
        player2Card.classList.remove('result-won', 'result-lost', 'result-draw');

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

    function updateEndgameStatus(winVal) {
        const p1Status = player1Card.querySelector('.player-status-text');
        const p2Status = player2Card.querySelector('.player-status-text');
        player1Card.classList.remove('result-won', 'result-lost', 'result-draw', 'active', 'p1');
        player2Card.classList.remove('result-won', 'result-lost', 'result-draw', 'active', 'p2');

        if (winVal === 0) {
            p1Status.textContent = 'Draw';
            p2Status.textContent = 'Draw';
            player1Card.classList.add('result-draw', 'active', 'p1');
            player2Card.classList.add('result-draw', 'active', 'p2');
            return;
        }

        if (winVal === 1) {
            p1Status.textContent = 'Won';
            p2Status.textContent = 'Lost';
            player1Card.classList.add('result-won', 'active', 'p1');
            player2Card.classList.add('result-lost');
        } else {
            p2Status.textContent = 'Won';
            p1Status.textContent = 'Lost';
            player2Card.classList.add('result-won', 'active', 'p2');
            player1Card.classList.add('result-lost');
        }
    }

    function highlightColumn(col, isHovering) {
        currentHoverColumn = isHovering ? col : null;
        clearDropPreviews();

        const indicators = dropIndicators.children;
        for (let c = 0; c < 7; c++) {
            indicators[c].classList.remove('hover-p1', 'hover-p2');
        }

        const cells = connect4Board.children;
        for (let i = 0; i < 42; i++) {
            cells[i].classList.remove('highlighted-column');
        }

        if (!isHovering || !isGameActive || !engine || engine.isTerminal()) return;

        const activePlayer = engine.currentPlayer();
        const activeAgent = activePlayer === 1 ? agent1 : agent2;
        const isHumanTurn = activeAgent === null;
        if (!isHumanTurn) return;

        const landingRow = engine.getLandingRow(col);
        if (landingRow < 0) return;

        indicators[col].classList.add(activePlayer === 1 ? 'hover-p1' : 'hover-p2');

        for (let i = 0; i < 42; i++) {
            if (parseInt(cells[i].dataset.col, 10) === col) {
                cells[i].classList.add('highlighted-column');
            }
        }

        const landingCell = getHTMLCell(landingRow, col);
        if (landingCell) {
            landingCell.classList.add('drop-preview', activePlayer === 1 ? 'p1' : 'p2');
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
        clearDropPreviews();
    }

    function animateDisc(rEngine, cEngine, player) {
        const cell = getHTMLCell(rEngine, cEngine);
        if (!cell) return;
        cell.innerHTML = '';
        const disc = document.createElement('div');
        disc.classList.add('board-disc', player === 1 ? 'p1' : 'p2');
        cell.appendChild(disc);
        markLastMove(rEngine, cEngine, player);
        gameAudio.playDrop();
    }

    function highlightWinningDiscs(winningCells) {
        winningCells.forEach(([r, c]) => {
            const cell = getHTMLCell(r, c);
            if (cell) cell.classList.add('winning-cell');
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
                if ((p1Agent || p2Agent) && !(p1Agent && p2Agent)) {
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
        if (winnerType === 0) gameAudio.playDraw();
        else {
            const p1Agent = agent1 !== null;
            const p2Agent = agent2 !== null;
            const humanVsAi = (p1Agent || p2Agent) && !(p1Agent && p2Agent);
            if (humanVsAi) {
                const humanWinner = (winnerType === 1 && !p1Agent) || (winnerType === 2 && !p2Agent);
                if (humanWinner) gameAudio.playWin();
                else gameAudio.playLose();
            } else {
                gameAudio.playWin();
            }
        }
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
        if (result === null) return false;

        isGameActive = false;
        stopLoops();

        const winVal = result.player;
        updateEndgameStatus(winVal);
        updateClocks();

        if (winVal === 0) {
            showWinnerModal('Match draw', 'The board is full and there is no winner. Well played.', 0);
            return true;
        }

        highlightWinningDiscs(result.cells);
        const p1Agent = agent1 !== null;
        const p2Agent = agent2 !== null;

        if (!p1Agent && !p2Agent) {
            showWinnerModal('Victory', `Player ${winVal} (Human) connected four and won the match.`, winVal);
        } else if (!p1Agent || !p2Agent) {
            const humanWinner = (winVal === 1 && !p1Agent) || (winVal === 2 && !p2Agent);
            if (humanWinner) {
                const defeatedName = getPlayerLabel(winVal === 1 ? 2 : 1);
                showWinnerModal('Victory', `You connected four and defeated the ${defeatedName}.`, winVal);
            } else {
                // AI won: name the winning agent, not the human loser
                const winnerName = getPlayerLabel(winVal);
                showWinnerModal('Defeat', `The ${winnerName} connected four and won the match.`, winVal);
            }
        } else {
            const winnerColor = winVal === 1 ? 'var(--p1-color)' : 'var(--p2-color)';
            const winnerLabel = getPlayerLabel(winVal);
            const winnerHTML = `<span style="color: ${winnerColor}; font-weight: bold;">${winnerLabel} (Player ${winVal})</span>`;
            showWinnerModal('Match over', `${winnerHTML} has connected four and won.`, winVal);
        }
        return true;
    }

    function handleColumnSelection(col) {
        if (!isGameActive || !engine || engine.isTerminal()) return;
        const currentPl = engine.currentPlayer();
        const activeAgent = currentPl === 1 ? agent1 : agent2;
        if (activeAgent !== null) return;

        try {
            const moveResult = engine.applyMove(col);
            animateDisc(moveResult.row, moveResult.col, currentPl);
            resetTurnClock();
            updateStatusUI();
            if (currentHoverColumn !== null) highlightColumn(currentHoverColumn, true);
            if (!checkTerminalStatus()) {
                const nextAgent = engine.currentPlayer() === 1 ? agent1 : agent2;
                if (nextAgent !== null) scheduleAIMove();
            }
        } catch (err) {
            console.warn('Invalid move: ', err.message);
        }
    }

    function executeAIMove() {
        if (!isGameActive || !engine || engine.isTerminal()) return;
        const currentPl = engine.currentPlayer();
        const agent = currentPl === 1 ? agent1 : agent2;
        if (!agent) return;

        try {
            const col = agent.getMove(engine);
            const result = engine.applyMove(col);
            animateDisc(result.row, result.col, currentPl);
            resetTurnClock();
            updateStatusUI();
            if (!checkTerminalStatus()) {
                const nextAgent = engine.currentPlayer() === 1 ? agent1 : agent2;
                if (nextAgent !== null) scheduleAIMove();
            }
        } catch (err) {
            console.error('AI Error:', err);
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
        const p1Type = selectedPlayer1;
        const p2Type = selectedPlayer2;
        const p1Val = document.getElementById('player1-type-val');
        const p2Val = document.getElementById('player2-type-val');
        const p1Icon = document.getElementById('player1-type-icon');
        const p2Icon = document.getElementById('player2-type-icon');
        if (p1Val) p1Val.textContent = getPlayerLabel(1);
        if (p2Val) p2Val.textContent = getPlayerLabel(2);
        if (p1Icon) p1Icon.innerHTML = TYPE_ICONS[p1Type] || TYPE_ICONS.human;
        if (p2Icon) p2Icon.innerHTML = TYPE_ICONS[p2Type] || TYPE_ICONS.human;
    }

    function handleModeChange() {
        const hasAI = selectedPlayer1 !== 'human' || selectedPlayer2 !== 'human';
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
        let seedVal = null;
        if (randomSeedInput.value.trim() !== '') {
            seedVal = parseInt(randomSeedInput.value, 10);
        }
        const seed1 = seedVal !== null ? seedVal : null;
        const seed2 = seedVal !== null ? seedVal + 1000 : null;

        const make = (type, seed) => {
            if (type === 'human') return null;
            if (type === 'random') return new RandomAgent(seed);
            if (type === 'rule') return new RuleBasedAgent(seed);
            if (type === 'minimax') return new MinimaxAgent(4, seed);
            return null;
        };

        agent1 = make(selectedPlayer1, seed1);
        agent2 = make(selectedPlayer2, seed2);
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
        gameAudio.enterGamePage();
        const activeAgent = engine.currentPlayer() === 1 ? agent1 : agent2;
        if (activeAgent !== null) scheduleAIMove();
    }

    function backToSettings() {
        stopLoops();
        stopClocks();
        closeWinnerModal();
        closeSoundModal();
        hideTooltip();
        isGameActive = false;
        gameAudio.leaveGamePage();
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
        gameAudio.enterGamePage();
        syncSoundIcon();
        const activeAgent = engine.currentPlayer() === 1 ? agent1 : agent2;
        if (activeAgent !== null) scheduleAIMove();
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
    function syncSoundControls() {
        const s = gameAudio.getSettings();
        const master = document.getElementById('audio-master');
        const sfx = document.getElementById('audio-sfx');
        const drop = document.getElementById('audio-drop');
        const result = document.getElementById('audio-result');
        const music = document.getElementById('audio-music');
        const sfxVol = document.getElementById('audio-sfx-vol');
        const musicVol = document.getElementById('audio-music-vol');
        const sfxVal = document.getElementById('audio-sfx-vol-val');
        const musicVal = document.getElementById('audio-music-vol-val');
        if (master) master.checked = s.masterEnabled;
        if (sfx) sfx.checked = s.sfxEnabled;
        if (drop) drop.checked = s.dropEnabled;
        if (result) result.checked = s.resultEnabled;
        if (music) music.checked = s.musicEnabled;
        if (sfxVol) sfxVol.value = Math.round(s.sfxVolume * 100);
        if (musicVol) musicVol.value = Math.round(s.musicVolume * 100);
        if (sfxVal) sfxVal.textContent = `${Math.round(s.sfxVolume * 100)}%`;
        if (musicVal) musicVal.textContent = `${Math.round(s.musicVolume * 100)}%`;
        syncSoundIcon();
    }

    function syncSoundIcon() {
        if (!btnSoundIcon) return;
        const s = gameAudio.getSettings();
        btnSoundIcon.classList.toggle('is-muted', !s.masterEnabled);
    }

    function openSoundModal() {
        hideTooltip();
        syncSoundControls();
        soundModal.classList.remove('hidden');
    }

    function closeSoundModal() {
        soundModal.classList.add('hidden');
    }

    if (btnReset) btnReset.addEventListener('click', resetBoard);
    if (btnBack) btnBack.addEventListener('click', backToSettings);
    if (btnResetIcon) btnResetIcon.addEventListener('click', resetBoard);
    if (btnBackIcon) btnBackIcon.addEventListener('click', backToSettings);
    if (btnSoundIcon) btnSoundIcon.addEventListener('click', openSoundModal);
    if (btnCloseSound) btnCloseSound.addEventListener('click', closeSoundModal);
    soundModal.addEventListener('click', (e) => {
        if (e.target === soundModal) closeSoundModal();
    });

    function bindAudioControl(id, key, isVolume) {
        const el = document.getElementById(id);
        if (!el) return;
        const handler = () => {
            if (isVolume) {
                gameAudio.updateSettings({ [key]: parseInt(el.value, 10) / 100 });
            } else {
                gameAudio.updateSettings({ [key]: el.checked });
            }
            syncSoundControls();
        };
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
    }

    bindAudioControl('audio-master', 'masterEnabled', false);
    bindAudioControl('audio-sfx', 'sfxEnabled', false);
    bindAudioControl('audio-drop', 'dropEnabled', false);
    bindAudioControl('audio-result', 'resultEnabled', false);
    bindAudioControl('audio-music', 'musicEnabled', false);
    bindAudioControl('audio-sfx-vol', 'sfxVolume', true);
    bindAudioControl('audio-music-vol', 'musicVolume', true);

    btnModalReplay.addEventListener('click', () => {
        closeWinnerModal();
        resetBoard();
    });
    btnModalClose.addEventListener('click', () => {
        closeWinnerModal();
        backToSettings();
    });

    if (btnOpenResultsLobby) btnOpenResultsLobby.addEventListener('click', openResults);
    if (btnCloseResults) btnCloseResults.addEventListener('click', closeResults);
    resultsModal.addEventListener('click', (e) => {
        if (e.target === resultsModal) closeResults();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (!resultsModal.classList.contains('hidden')) closeResults();
        if (!soundModal.classList.contains('hidden')) closeSoundModal();
    });

    connect4Board.addEventListener('click', (e) => {
        const cell = e.target.closest('.board-cell');
        if (cell) handleColumnSelection(parseInt(cell.dataset.col, 10));
    });

    connect4Board.addEventListener('mousemove', (e) => {
        const cell = e.target.closest('.board-cell');
        if (cell) highlightColumn(parseInt(cell.dataset.col, 10), true);
        else highlightColumn(null, false);
    });

    connect4Board.addEventListener('mouseleave', () => highlightColumn(null, false));

    dropIndicators.addEventListener('click', (e) => {
        const indicator = e.target.closest('.indicator');
        if (indicator) handleColumnSelection(parseInt(indicator.dataset.col, 10));
    });

    dropIndicators.addEventListener('mousemove', (e) => {
        const indicator = e.target.closest('.indicator');
        if (indicator) highlightColumn(parseInt(indicator.dataset.col, 10), true);
        else highlightColumn(null, false);
    });

    dropIndicators.addEventListener('mouseleave', () => highlightColumn(null, false));

    bindTooltips();
    showScreen('settings');
    handleModeChange();
});
