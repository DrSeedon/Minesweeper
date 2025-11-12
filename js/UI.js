import { CELL_SIZE, MINE } from './constants.js';

export class UI {
    constructor() {
        this.gameBoard = document.getElementById('gameBoard');
        this.startBtn = document.getElementById('startBtn');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.closeOverlayBtn = document.getElementById('closeOverlayBtn');
        this.minesCountEl = document.getElementById('minesCount');
        this.timerEl = document.getElementById('timer');
        this.flagsCountEl = document.getElementById('flagsCount');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.difficultyBtns = document.querySelectorAll('.btn-difficulty');
        this.autoSolveToggle = document.getElementById('autoSolveToggle');
        this.safeAutoToggle = document.getElementById('safeAutoToggle');
        this.delaySlider = document.getElementById('delaySlider');
        this.delayValue = document.getElementById('delayValue');
        this.xrayToggle = document.getElementById('xrayToggle');
        this.quickStartToggle = document.getElementById('quickStartToggle');
        this.autoRestartToggle = document.getElementById('autoRestartToggle');
        this.advancedToggle = document.getElementById('advancedToggle');
        this.probabilityToggle = document.getElementById('probabilityToggle');
        this.stepBtn = document.getElementById('stepBtn');
        this.customSettings = document.getElementById('customSettings');
        this.customRows = document.getElementById('customRows');
        this.customCols = document.getElementById('customCols');
        this.customMines = document.getElementById('customMines');
        this.minesPercent = document.getElementById('minesPercent');
        
        this.aiWins = document.getElementById('aiWins');
        this.aiLosses = document.getElementById('aiLosses');
        this.aiWinRate = document.getElementById('aiWinRate');
        this.aiAvgTime = document.getElementById('aiAvgTime');
        this.playerWins = document.getElementById('playerWins');
        this.playerLosses = document.getElementById('playerLosses');
        this.playerWinRate = document.getElementById('playerWinRate');
        this.playerAvgTime = document.getElementById('playerAvgTime');
        this.clearAiStatsBtn = document.getElementById('clearAiStats');
        this.clearPlayerStatsBtn = document.getElementById('clearPlayerStats');
        
        this.initCustomControls();
    }
    
    initCustomControls() {
        const limits = {
            customRows: { min: 5, max: 50, step: 1 },
            customCols: { min: 5, max: 44, step: 1 },
            customMines: { min: 1, max: 9999, step: 1 }
        };
        
        let holdInterval = null;
        let holdTimeout = null;
        let currentDelay = 200;
        
        const getMinesMax = () => {
            const rows = parseInt(this.customRows.value) || 5;
            const cols = parseInt(this.customCols.value) || 5;
            return Math.floor(rows * cols * 0.9);
        };
        
        const updateMinesPercent = () => {
            const rows = parseInt(this.customRows.value) || 5;
            const cols = parseInt(this.customCols.value) || 5;
            const mines = parseInt(this.customMines.value) || 1;
            const total = rows * cols;
            const percent = Math.round((mines / total) * 100);
            this.minesPercent.textContent = `${percent}%`;
        };
        
        const updateValue = (target, action) => {
            const input = document.getElementById(target);
            const limit = limits[target];
            let value = parseInt(input.value) || 0;
            
            let max = limit.max;
            if (target === 'customMines') {
                max = Math.min(limit.max, getMinesMax());
            }
            
            if (action === 'increase') {
                value = Math.min(value + limit.step, max);
            } else if (action === 'decrease') {
                value = Math.max(value - limit.step, limit.min);
            }
            
            input.value = value;
            
            if (target === 'customRows' || target === 'customCols') {
                const minesMax = getMinesMax();
                const currentMines = parseInt(this.customMines.value) || 1;
                if (currentMines > minesMax) {
                    this.customMines.value = minesMax;
                }
            }
            
            updateMinesPercent();
        };
        
        const startHold = (target, action) => {
            currentDelay = 200;
            let counter = 0;
            
            const repeat = () => {
                updateValue(target, action);
                counter++;
                
                if (counter > 5) currentDelay = 50;
                if (counter > 15) currentDelay = 20;
                if (counter > 30) currentDelay = 10;
                
                holdInterval = setTimeout(repeat, currentDelay);
            };
            
            holdTimeout = setTimeout(() => {
                repeat();
            }, 300);
        };
        
        const stopHold = () => {
            if (holdTimeout) {
                clearTimeout(holdTimeout);
                holdTimeout = null;
            }
            if (holdInterval) {
                clearTimeout(holdInterval);
                holdInterval = null;
            }
            currentDelay = 200;
        };
        
        document.querySelectorAll('.btn-control').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                const target = e.target.dataset.target;
                const action = e.target.dataset.action;
                updateValue(target, action);
                startHold(target, action);
            });
            
            btn.addEventListener('mouseup', stopHold);
            btn.addEventListener('mouseleave', stopHold);
            btn.addEventListener('touchend', stopHold);
            btn.addEventListener('touchcancel', stopHold);
        });
        
        document.querySelectorAll('.btn-minmax').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.dataset.target;
                const action = e.target.dataset.action;
                const input = document.getElementById(target);
                const limit = limits[target];
                
                if (action === 'min') {
                    input.value = limit.min;
                } else if (action === 'max') {
                    if (target === 'customMines') {
                        input.value = getMinesMax();
                    } else {
                        input.value = limit.max;
                    }
                }
                
                updateMinesPercent();
            });
        });
        
        const validateInput = (input, limitKey) => {
            const limit = limits[limitKey];
            let value = parseInt(input.value) || limit.min;
            
            let max = limit.max;
            if (limitKey === 'customMines') {
                max = Math.min(limit.max, getMinesMax());
            }
            
            value = Math.max(limit.min, Math.min(value, max));
            input.value = value;
            
            if (limitKey === 'customRows' || limitKey === 'customCols') {
                const minesMax = getMinesMax();
                const currentMines = parseInt(this.customMines.value) || 1;
                if (currentMines > minesMax) {
                    this.customMines.value = minesMax;
                }
            }
            
            updateMinesPercent();
        };
        
        this.customRows.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
        
        this.customCols.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
        
        this.customMines.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
        
        this.customRows.addEventListener('blur', () => validateInput(this.customRows, 'customRows'));
        this.customCols.addEventListener('blur', () => validateInput(this.customCols, 'customCols'));
        this.customMines.addEventListener('blur', () => validateInput(this.customMines, 'customMines'));
        
        this.customRows.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                validateInput(this.customRows, 'customRows');
                this.customRows.blur();
            }
        });
        
        this.customCols.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                validateInput(this.customCols, 'customCols');
                this.customCols.blur();
            }
        });
        
        this.customMines.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                validateInput(this.customMines, 'customMines');
                this.customMines.blur();
            }
        });
        
        this.minesPercent.addEventListener('click', () => {
            const currentPercent = parseInt(this.minesPercent.textContent) || 0;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'mines-percent-input';
            input.value = currentPercent;
            input.maxLength = 2;
            
            const finishEdit = () => {
                let percent = parseInt(input.value) || 1;
                percent = Math.max(1, Math.min(90, percent));
                
                const rows = parseInt(this.customRows.value) || 5;
                const cols = parseInt(this.customCols.value) || 5;
                const total = rows * cols;
                const mines = Math.floor((total * percent) / 100);
                
                this.customMines.value = Math.max(1, mines);
                this.minesPercent.textContent = `${percent}%`;
                this.minesPercent.style.display = '';
                input.remove();
                updateMinesPercent();
            };
            
            input.addEventListener('blur', finishEdit);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    finishEdit();
                } else if (e.key === 'Escape') {
                    this.minesPercent.style.display = '';
                    input.remove();
                }
            });
            
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
            
            this.minesPercent.style.display = 'none';
            this.minesPercent.parentNode.insertBefore(input, this.minesPercent);
            input.focus();
            input.select();
        });
    }

    renderBoard(rows, cols, onCellClick, onCellRightClick) {
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${cols}, ${CELL_SIZE}px)`;
        this.gameBoard.style.gridTemplateRows = `repeat(${rows}, ${CELL_SIZE}px)`;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement('button');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => onCellClick(row, col));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    onCellRightClick(row, col);
                });
                
                this.gameBoard.appendChild(cell);
            }
        }
    }

    updateCell(row, col, board, probability = null, highlight = false) {
        const cell = this.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        cell.classList.remove('revealed', 'flagged', 'mine', 'prob-safe', 'prob-mine', 'solver-error');
        cell.textContent = '';
        cell.querySelector('.cell-probability')?.remove();
        
        if (highlight) {
            cell.classList.add('solver-error');
        }
        
        if (board.cells[row][col] === MINE) {
            cell.dataset.xray = '💣';
        } else {
            cell.removeAttribute('data-xray');
        }
        
        if (board.flagged[row][col]) {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
        } else if (board.revealed[row][col]) {
            cell.classList.add('revealed');
            
            if (board.cells[row][col] === MINE) {
                cell.classList.add('mine');
                cell.textContent = '💣';
            } else if (board.cells[row][col] > 0) {
                const originalCount = board.cells[row][col];
                const flagsAround = this.countFlagsAround(row, col, board);
                const remaining = originalCount - flagsAround;
                
                cell.dataset.original = originalCount;
                cell.dataset.remaining = remaining > 0 ? remaining : '';
                cell.dataset.count = originalCount;
                
                if (!document.body.classList.contains('advanced-mode')) {
                    cell.textContent = originalCount;
                }
            }
        } else if (probability !== null && probability >= 0) {
            if (probability === 0) {
                cell.classList.add('prob-safe');
                const probSpan = document.createElement('span');
                probSpan.className = 'cell-probability';
                probSpan.style.color = '#000';
                probSpan.style.fontWeight = '900';
                probSpan.textContent = '✓';
                probSpan.style.fontSize = '1.2rem';
                cell.appendChild(probSpan);
            } else if (probability >= 0.99) {
                cell.classList.add('prob-mine');
                const probSpan = document.createElement('span');
                probSpan.className = 'cell-probability';
                probSpan.style.color = '#fff';
                probSpan.style.fontWeight = '900';
                probSpan.textContent = '💣';
                probSpan.style.fontSize = '1.2rem';
                cell.appendChild(probSpan);
            } else {
                const probSpan = document.createElement('span');
                probSpan.className = 'cell-probability';
                const percent = Math.round(probability * 100);
                probSpan.textContent = percent + '%';
                probSpan.style.color = this.getGradientColor(percent);
                
                cell.appendChild(probSpan);
            }
        }
    }
    
    getGradientColor(percent) {
        const clampedPercent = Math.max(0, Math.min(100, percent));
        
        let r, g, b;
        
        if (clampedPercent <= 50) {
            const ratio = clampedPercent / 50;
            r = Math.round(6 + (255 - 6) * ratio);
            g = Math.round(255 - (51 * ratio));
            b = Math.round(165 - (165 * ratio));
        } else {
            const ratio = (clampedPercent - 50) / 50;
            r = 255;
            g = Math.round(204 - (204 * ratio));
            b = Math.round(0 + (110 * ratio));
        }
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    countFlagsAround(row, col, board) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (board.isValid(newRow, newCol) && board.flagged[newRow][newCol]) {
                    count++;
                }
            }
        }
        return count;
    }

    setAutoSolveEnabled(enabled) {
        this.autoSolveToggle.disabled = !enabled;
        this.safeAutoToggle.disabled = !enabled;
        if (!enabled) {
            this.autoSolveToggle.checked = false;
            this.safeAutoToggle.checked = false;
        }
    }

    toggleXRay(enabled) {
        document.body.classList.toggle('xray-mode', enabled);
    }

    toggleAdvanced(enabled) {
        document.body.classList.toggle('advanced-mode', enabled);
    }

    setStepEnabled(enabled) {
        this.stepBtn.disabled = !enabled;
    }

    updateAllCells(board, probabilities = null, highlightCell = null) {
        for (let row = 0; row < board.rows; row++) {
            for (let col = 0; col < board.cols; col++) {
                const prob = probabilities ? probabilities[row][col] : null;
                const isHighlight = highlightCell && highlightCell.row === row && highlightCell.col === col;
                this.updateCell(row, col, board, prob, isHighlight);
            }
        }
    }

    updateStats(mines, timer, flags) {
        this.minesCountEl.textContent = mines;
        this.timerEl.textContent = String(timer).padStart(3, '0');
        this.flagsCountEl.textContent = flags;
    }

    showOverlay(isWin, timer) {
        this.gameOverlay.classList.add('show');
        
        if (isWin) {
            this.overlayTitle.textContent = '🎉 Victory!';
            this.overlayMessage.textContent = `You cleared the field in ${timer} seconds!`;
        } else {
            this.overlayTitle.textContent = '💥 Game Over';
            this.overlayMessage.textContent = 'You hit a mine! Try again?';
        }
    }

    hideOverlay() {
        this.gameOverlay.classList.remove('show');
    }

    setActiveDifficulty(difficulty) {
        this.difficultyBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });
        
        if (difficulty === 'custom') {
            this.customSettings.classList.add('active');
        } else {
            this.customSettings.classList.remove('active');
        }
    }
    
    getCustomSettings() {
        return {
            rows: parseInt(this.customRows.value),
            cols: parseInt(this.customCols.value),
            mines: parseInt(this.customMines.value)
        };
    }
    
    updateGameStats(stats) {
        this.aiWins.textContent = stats.ai.wins;
        this.aiLosses.textContent = stats.ai.losses;
        const aiTotal = stats.ai.wins + stats.ai.losses;
        const aiWinRate = aiTotal > 0 ? Math.round((stats.ai.wins / aiTotal) * 100) : 0;
        this.aiWinRate.textContent = `${aiWinRate}%`;
        this.aiAvgTime.textContent = stats.ai.avgTime > 0 ? `${stats.ai.avgTime}s` : '0s';
        
        this.playerWins.textContent = stats.player.wins;
        this.playerLosses.textContent = stats.player.losses;
        const playerTotal = stats.player.wins + stats.player.losses;
        const playerWinRate = playerTotal > 0 ? Math.round((stats.player.wins / playerTotal) * 100) : 0;
        this.playerWinRate.textContent = `${playerWinRate}%`;
        this.playerAvgTime.textContent = stats.player.avgTime > 0 ? `${stats.player.avgTime}s` : '0s';
    }
}

