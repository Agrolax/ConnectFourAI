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
    let lastTurnElapsedMs = 0;
    let lastTurnPlayer = null;
    let freezeTurnClock = false;

    const settingsScreen = document.getElementById('settings-screen');
    const gameScreen = document.getElementById('game-screen');

    const playerOptionLists = document.querySelectorAll('.player-options');
    const p1OptionCards = document.querySelectorAll('.player-options[data-player="1"] .player-option-card');
    const p2OptionCards = document.querySelectorAll('.player-options[data-player="2"] .player-option-card');
    const randomSeedInput = document.getElementById('random-seed');

    let selectedPlayer1 = 'human';
    let selectedPlayer2 = 'minimax';
    const simulationDelayInput = document.getElementById('simulation-delay');
    const delayValLabel = document.getElementById('delay-val');
    const speedControlGroup = document.getElementById('speed-control-group');
    const btnStart = document.getElementById('btn-start');

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
    const winnerIcon = document.getElementById('winner-icon');
    const winnerCelebrationTitle = document.getElementById('winner-celebration-title');
    const winnerCelebrationMsg = document.getElementById('winner-celebration-msg');
    const btnModalReplay = document.getElementById('btn-modal-replay');
    const btnModalClose = document.getElementById('btn-modal-close');
    const floatingTooltip = document.getElementById('floating-tooltip');
    const resultsModal = document.getElementById('results-modal');
    const resultsCharts = document.getElementById('results-charts');
    const btnOpenResults = document.getElementById('btn-open-results');
    const btnCloseResults = document.getElementById('btn-close-results');
    const githubModal = document.getElementById('github-modal');
    const btnOpenGithub = document.getElementById('btn-open-github');
    const btnCloseGithub = document.getElementById('btn-close-github');

    const TYPE_ICONS = {
        human: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 19.5c1.2-3.2 3.5-4.8 6.5-4.8s5.3 1.6 6.5 4.8"/></svg>',
        random: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="10" r="1.2" fill="currentColor"/><circle cx="15" cy="10" r="1.2" fill="currentColor"/><path d="M9 15h6"/></svg>',
        rule: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/></svg>',
        minimax: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="1.8"/><circle cx="6" cy="12" r="1.8"/><circle cx="18" cy="12" r="1.8"/><circle cx="3.5" cy="19.5" r="1.5"/><circle cx="8.5" cy="19.5" r="1.5"/><circle cx="15.5" cy="19.5" r="1.5"/><circle cx="20.5" cy="19.5" r="1.5"/><path d="M12 6.3v3.2M12 9.5L6.8 11M12 9.5l5.2 1.5M6 13.8v3.2M18 13.8v3.2"/></svg>'
    };

    const RESULT_ICONS = {
        win: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/></svg>',
        loss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></svg>',
        draw: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 10h8M8 14h8"/></svg>'
    };

    const EVAL_SUMMARY = [
        {
            title: 'Random vs Rule-Based',
            short: 'Random vs Rule',
            agents: [
                { key: 'random', name: 'Random', wins: 1, draws: 0, avgMs: 0.0012 },
                { key: 'rule', name: 'Rule-Based', wins: 29, draws: 0, avgMs: 0.2555 }
            ]
        },
        {
            title: 'Rule-Based vs Minimax',
            short: 'Rule vs Minimax',
            agents: [
                { key: 'rule', name: 'Rule-Based', wins: 3, draws: 1, avgMs: 0.2719 },
                { key: 'minimax', name: 'Minimax', wins: 26, draws: 1, avgMs: 33.4204 }
            ]
        },
        {
            title: 'Minimax vs Random',
            short: 'Minimax vs Random',
            agents: [
                { key: 'minimax', name: 'Minimax', wins: 30, draws: 0, avgMs: 42.5260 },
                { key: 'random', name: 'Random', wins: 0, draws: 0, avgMs: 0.0021 }
            ]
        }
    ];
    let selectedEvalPair = 0;

    function formatClock(ms) {
        const totalSec = Math.max(0, Math.floor(ms / 1000));
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function formatTurnClock(ms) {
        const safeMs = Math.max(0, Math.floor(ms));
        const mins = Math.floor(safeMs / 60000);
        const secs = Math.floor((safeMs % 60000) / 1000);
        const millis = safeMs % 1000;
        if (mins > 0) {
            return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
        }
        return `${secs}.${millis.toString().padStart(3, '0')}s`;
    }

    function updateClocks() {
        if (!matchStartMs) return;
        const now = Date.now();
        timeElapsedVal.textContent = formatClock(now - matchStartMs);

        if (freezeTurnClock && lastTurnPlayer) {
            turnClockVal.hidden = false;
            turnClockVal.textContent = formatTurnClock(lastTurnElapsedMs);
            turnClockVal.classList.remove('p1', 'p2');
            turnClockVal.classList.add(lastTurnPlayer === 1 ? 'p1' : 'p2');
            return;
        }

        if (isGameActive && turnStartMs && engine && !engine.isTerminal()) {
            const nextPlayer = engine.currentPlayer();
            const elapsed = now - turnStartMs;
            lastTurnElapsedMs = elapsed;
            lastTurnPlayer = nextPlayer;
            turnClockVal.hidden = false;
            turnClockVal.textContent = formatTurnClock(elapsed);
            turnClockVal.classList.remove('p1', 'p2');
            turnClockVal.classList.add(nextPlayer === 1 ? 'p1' : 'p2');
        } else if (!freezeTurnClock) {
            turnClockVal.hidden = true;
            turnClockVal.classList.remove('p1', 'p2');
        }
    }

    function startClocks() {
        matchStartMs = Date.now();
        turnStartMs = Date.now();
        lastTurnElapsedMs = 0;
        lastTurnPlayer = null;
        freezeTurnClock = false;
        if (clockIntervalId) clearInterval(clockIntervalId);
        updateClocks();
        clockIntervalId = setInterval(updateClocks, 50);
    }

    function captureTurnElapsed(player) {
        if (!turnStartMs) return;
        lastTurnElapsedMs = Date.now() - turnStartMs;
        lastTurnPlayer = player;
    }

    function resetTurnClock() {
        turnStartMs = Date.now();
        updateClocks();
    }

    function freezeLastTurnClock() {
        freezeTurnClock = true;
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
        const pair = EVAL_SUMMARY[selectedEvalPair] || EVAL_SUMMARY[0];
        const cards = pair.agents.map((agent, i) => {
            const pct = (agent.wins / 30) * 100;
            const icon = TYPE_ICONS[agent.key] || TYPE_ICONS.random;
            return `
                <article class="eval-agent ${i === 1 ? 'alt' : ''}">
                    <div class="eval-agent-head">
                        <div class="eval-agent-title">
                            <span class="eval-agent-icon" aria-hidden="true">${icon}</span>
                            <h3>${agent.name}</h3>
                        </div>
                        <span class="eval-winrate">${pct.toFixed(0)}%</span>
                    </div>
                    <div class="eval-bar-track"><div class="eval-bar-fill" style="width:${pct}%"></div></div>
                    <div class="eval-stats">
                        <div class="eval-stat"><span>Wins</span><strong>${agent.wins}/30</strong></div>
                        <div class="eval-stat"><span>Draws</span><strong>${agent.draws}/30</strong></div>
                        <div class="eval-stat"><span>Avg ms</span><strong>${agent.avgMs.toFixed(2)}</strong></div>
                    </div>
                </article>
            `;
        }).join('');
        resultsCharts.innerHTML = `<div class="eval-compare">${cards}</div>`;
    }

    function setEvalPair(index) {
        selectedEvalPair = index;
        document.querySelectorAll('.eval-tab').forEach((tab) => {
            const active = parseInt(tab.dataset.pair, 10) === index;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        renderResultsCharts();
    }

    function openResults() {
        hideTooltip();
        if (btnOpenResults) btnOpenResults.classList.add('is-pressed');
        setEvalPair(selectedEvalPair);
        resultsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeResults() {
        resultsModal.classList.add('hidden');
        document.body.style.overflow = '';
        if (btnOpenResults) btnOpenResults.classList.remove('is-pressed');
    }

    function openGithubModal() {
        hideTooltip();
        githubModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => btnCloseGithub.focus());
    }

    function closeGithubModal() {
        githubModal.classList.add('hidden');
        document.body.style.overflow = '';
        btnOpenGithub.focus();
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
        disc.classList.add('board-disc', 'dropping', player === 1 ? 'p1' : 'p2');
        cell.appendChild(disc);
        const endDrop = () => disc.classList.remove('dropping');
        disc.addEventListener('animationend', endDrop, { once: true });
        setTimeout(endDrop, 500);
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
        winnerIcon.innerHTML = winnerType === 0
            ? RESULT_ICONS.draw
            : title === 'Defeat'
                ? RESULT_ICONS.loss
                : RESULT_ICONS.win;

        if (winnerType === 1 || winnerType === 2) {
            const glowColor = winnerType === 1 ? 'rgba(225, 29, 72, 0.6)' : 'rgba(6, 182, 212, 0.6)';
            const resultColor = winnerType === 1 ? 'var(--p1-color)' : 'var(--p2-color)';
            winnerCelebrationTitle.style.color = resultColor;
            winnerIcon.style.color = resultColor;
            winnerCelebrationTitle.style.textShadow = `0 0 16px ${glowColor}`;
        } else {
            winnerCelebrationTitle.style.color = 'var(--text-secondary)';
            winnerIcon.style.color = 'var(--text-secondary)';
            winnerCelebrationTitle.style.textShadow = 'none';
        }

        stopClocks();
        freezeLastTurnClock();
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
        scrollEndgameIntoViewOnMobile();
    }

    function scrollEndgameIntoViewOnMobile() {
        if (window.matchMedia('(min-width: 901px)').matches) return;
        requestAnimationFrame(() => {
            winnerModal.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
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
            captureTurnElapsed(currentPl);
            if (engine.winner() !== null) freezeTurnClock = true;
            else resetTurnClock();
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
            captureTurnElapsed(currentPl);
            if (engine.winner() !== null) freezeTurnClock = true;
            else resetTurnClock();
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
        gameAudio.playReset();
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
        const muted = !s.masterEnabled;
        const muteToggle = document.getElementById('audio-mute-toggle');
        const soundBody = document.getElementById('sound-body');
        const sfxToggle = document.getElementById('audio-sfx-toggle');
        const musicToggle = document.getElementById('audio-music-toggle');
        const sfxSettings = document.getElementById('sound-sfx-settings');
        const musicSettings = document.getElementById('sound-music-settings');
        const drop = document.getElementById('audio-drop');
        const result = document.getElementById('audio-result');
        const sfxVol = document.getElementById('audio-sfx-vol');
        const musicVol = document.getElementById('audio-music-vol');
        const sfxVal = document.getElementById('audio-sfx-vol-val');
        const musicVal = document.getElementById('audio-music-vol-val');

        if (muteToggle) muteToggle.setAttribute('aria-checked', muted ? 'true' : 'false');
        if (soundBody) soundBody.classList.toggle('is-disabled', muted);
        if (sfxToggle) sfxToggle.setAttribute('aria-checked', s.sfxEnabled ? 'true' : 'false');
        if (musicToggle) musicToggle.setAttribute('aria-checked', s.musicEnabled ? 'true' : 'false');
        if (sfxSettings) sfxSettings.classList.toggle('is-disabled', !s.sfxEnabled);
        if (musicSettings) musicSettings.classList.toggle('is-disabled', !s.musicEnabled);
        if (drop) drop.checked = s.dropEnabled;
        if (result) result.checked = s.resultEnabled;
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
                // Update label immediately without resetting the slider mid-drag
                if (key === 'sfxVolume') {
                    const sfxVal = document.getElementById('audio-sfx-vol-val');
                    if (sfxVal) sfxVal.textContent = `${el.value}%`;
                }
                if (key === 'musicVolume') {
                    const musicVal = document.getElementById('audio-music-vol-val');
                    if (musicVal) musicVal.textContent = `${el.value}%`;
                }
                syncSoundIcon();
                return;
            }
            gameAudio.updateSettings({ [key]: el.checked });
            syncSoundControls();
        };
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
    }

    bindAudioControl('audio-drop', 'dropEnabled', false);
    bindAudioControl('audio-result', 'resultEnabled', false);
    bindAudioControl('audio-sfx-vol', 'sfxVolume', true);
    bindAudioControl('audio-music-vol', 'musicVolume', true);

    function bindEnableToggle(id, key) {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('click', () => {
            const enabled = el.getAttribute('aria-checked') === 'true';
            gameAudio.updateSettings({ [key]: !enabled });
            syncSoundControls();
        });
    }

    bindEnableToggle('audio-sfx-toggle', 'sfxEnabled');
    bindEnableToggle('audio-music-toggle', 'musicEnabled');

    const muteToggle = document.getElementById('audio-mute-toggle');
    if (muteToggle) {
        muteToggle.addEventListener('click', () => {
            const muted = muteToggle.getAttribute('aria-checked') === 'true';
            gameAudio.updateSettings({ masterEnabled: muted }); // currently muted -> unmute
            syncSoundControls();
        });
    }

    document.querySelectorAll('.eval-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            setEvalPair(parseInt(tab.dataset.pair, 10));
        });
    });

    btnModalReplay.addEventListener('click', () => {
        closeWinnerModal();
        resetBoard();
    });
    btnModalClose.addEventListener('click', () => {
        closeWinnerModal();
        backToSettings();
    });

    if (btnOpenResults) btnOpenResults.addEventListener('click', openResults);
    if (btnCloseResults) btnCloseResults.addEventListener('click', closeResults);
    resultsModal.addEventListener('click', (e) => {
        if (e.target === resultsModal) closeResults();
    });
    btnOpenGithub.addEventListener('click', openGithubModal);
    btnCloseGithub.addEventListener('click', closeGithubModal);
    githubModal.addEventListener('click', (e) => {
        if (e.target === githubModal) closeGithubModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (!githubModal.classList.contains('hidden')) {
            closeGithubModal();
            return;
        }
        if (!resultsModal.classList.contains('hidden')) closeResults();
        if (!soundModal.classList.contains('hidden')) closeSoundModal();
    });

    function getBoardColumnAtX(clientX) {
        const firstRowCells = Array.from(connect4Board.children).slice(0, 7);
        const boardRect = connect4Board.getBoundingClientRect();
        if (firstRowCells.length !== 7 || clientX < boardRect.left || clientX > boardRect.right) {
            return null;
        }

        let nearestColumn = 0;
        let nearestDistance = Infinity;
        firstRowCells.forEach((cell, column) => {
            const rect = cell.getBoundingClientRect();
            const distance = Math.abs(clientX - (rect.left + rect.width / 2));
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestColumn = column;
            }
        });
        return nearestColumn;
    }

    connect4Board.addEventListener('click', (e) => {
        const column = getBoardColumnAtX(e.clientX);
        if (column !== null) handleColumnSelection(column);
    });

    connect4Board.addEventListener('mousemove', (e) => {
        const column = getBoardColumnAtX(e.clientX);
        highlightColumn(column, column !== null);
    });

    connect4Board.addEventListener('mouseleave', () => highlightColumn(null, false));

    connect4Board.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        const column = getBoardColumnAtX(e.clientX);
        highlightColumn(column, column !== null);
    });

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

    dropIndicators.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        const indicator = e.target.closest('.indicator');
        if (indicator) highlightColumn(parseInt(indicator.dataset.col, 10), true);
    });

    bindTooltips();
    showScreen('settings');
    handleModeChange();
});
