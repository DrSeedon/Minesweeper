import { DIFFICULTIES } from './constants.js';
import { Board } from './Board.js';
import { UI } from './UI.js';
import { Solver } from './Solver.js';
import { AdvancedSolver } from './AdvancedSolver.js';

export class Game {
    constructor() {
        this.ui = new UI();
        this.currentDifficulty = 'easy';
        this.board = null;
        this.solver = null;
        this.advancedSolver = null;
        this.firstClick = true;
        this.gameOver = false;
        this.timer = 0;
        this.timerInterval = null;
        this.solveDelay = 200;
        this.autoSolving = false;
        this.safeAutoSolving = false;
        this.quickStart = false;
        this.showProbabilities = false;
        this.lastSolverMove = null;
        this.autoRestart = false;
        this.restoreAutoSolve = false;
        this.restoreSafeAuto = false;
        
        this.stats = this.loadStats();
        
        this.initEventListeners();
        this.initGame();
        this.ui.updateGameStats(this.stats);
    }
    
    loadStats() {
        const saved = localStorage.getItem('minesweeperStats');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            ai: { wins: 0, losses: 0, totalTime: 0, avgTime: 0 },
            player: { wins: 0, losses: 0, totalTime: 0, avgTime: 0 }
        };
    }
    
    saveStats() {
        localStorage.setItem('minesweeperStats', JSON.stringify(this.stats));
    }
    
    clearStats(type) {
        if (type === 'ai' || type === 'player') {
            this.stats[type] = { wins: 0, losses: 0, totalTime: 0, avgTime: 0 };
        }
        this.saveStats();
        this.ui.updateGameStats(this.stats);
    }
    
    updateStatsOnGameEnd(isWin, isAI) {
        const type = isAI ? 'ai' : 'player';
        
        if (isWin) {
            this.stats[type].wins++;
        } else {
            this.stats[type].losses++;
        }
        
        this.stats[type].totalTime += this.timer;
        const total = this.stats[type].wins + this.stats[type].losses;
        this.stats[type].avgTime = Math.round(this.stats[type].totalTime / total);
        
        this.saveStats();
        this.ui.updateGameStats(this.stats);
    }

    initEventListeners() {
        this.ui.startBtn.addEventListener('click', () => this.initGame());
        this.ui.playAgainBtn.addEventListener('click', () => this.initGame());
        this.ui.closeOverlayBtn.addEventListener('click', () => this.ui.hideOverlay());
        
        this.ui.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentDifficulty = btn.dataset.difficulty;
                this.ui.setActiveDifficulty(this.currentDifficulty);
                this.initGame();
            });
        });

        this.ui.autoSolveToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.ui.safeAutoToggle.checked = false;
                this.stopSafeAuto();
                this.startAutoSolve();
            } else {
                this.stopAutoSolve();
            }
        });

        this.ui.safeAutoToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.ui.autoSolveToggle.checked = false;
                this.stopAutoSolve();
                this.startSafeAuto();
            } else {
                this.stopSafeAuto();
            }
        });
        
        this.ui.delaySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.solveDelay = Math.max(1, value);
            this.ui.delayValue.textContent = value;
        });

        this.ui.xrayToggle.addEventListener('change', (e) => {
            this.ui.toggleXRay(e.target.checked);
        });

        this.ui.quickStartToggle.addEventListener('change', (e) => {
            this.quickStart = e.target.checked;
        });

        this.ui.autoRestartToggle.addEventListener('change', (e) => {
            this.autoRestart = e.target.checked;
        });

        this.ui.advancedToggle.addEventListener('change', (e) => {
            this.ui.toggleAdvanced(e.target.checked);
            this.updateUI();
        });

        this.ui.probabilityToggle.addEventListener('change', (e) => {
            this.showProbabilities = e.target.checked;
            this.updateUI();
        });

        this.ui.stepBtn.addEventListener('click', () => this.solveOneStep());
        
        this.ui.clearAiStatsBtn.addEventListener('click', () => this.clearStats('ai'));
        this.ui.clearPlayerStatsBtn.addEventListener('click', () => this.clearStats('player'));
    }

    initGame() {
        this.stopTimer();
        this.stopAutoSolve();
        this.stopSafeAuto();
        this.gameOver = false;
        this.firstClick = true;
        this.timer = 0;
        this.lastSolverMove = null;
        
        let rows, cols, mines;
        
        if (this.currentDifficulty === 'custom') {
            const custom = this.ui.getCustomSettings();
            rows = custom.rows;
            cols = custom.cols;
            mines = custom.mines;
            
            const maxMines = Math.floor(rows * cols * 0.9);
            mines = Math.min(mines, maxMines);
            
            if (mines !== custom.mines) {
                this.ui.customMines.value = mines;
            }
        } else {
            const difficulty = DIFFICULTIES[this.currentDifficulty];
            rows = difficulty.rows;
            cols = difficulty.cols;
            mines = difficulty.mines;
        }
        
        this.board = new Board(rows, cols, mines);
        this.solver = new Solver(this.board);
        this.advancedSolver = new AdvancedSolver(this.board);
        
        this.ui.renderBoard(rows, cols, 
            (row, col) => this.handleCellClick(row, col),
            (row, col) => this.handleRightClick(row, col)
        );
        
        this.ui.hideOverlay();
        this.ui.setAutoSolveEnabled(false);
        this.ui.setStepEnabled(false);
        
        if (this.quickStart) {
            this.generateAndRevealEmptyCells();
            
            if (this.restoreAutoSolve) {
                setTimeout(() => {
                    this.ui.autoSolveToggle.checked = true;
                    this.startAutoSolve();
                }, 100);
                this.restoreAutoSolve = false;
            }
            
            if (this.restoreSafeAuto) {
                setTimeout(() => {
                    this.ui.safeAutoToggle.checked = true;
                    this.startSafeAuto();
                }, 100);
                this.restoreSafeAuto = false;
            }
        }
        
        this.updateUI();
    }

    generateAndRevealEmptyCells() {
        const centerRow = Math.floor(this.board.rows / 2);
        const centerCol = Math.floor(this.board.cols / 2);
        
        this.board.placeMines(centerRow, centerCol);
        
        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                if (this.board.cells[row][col] === 0) {
                    this.board.revealCell(row, col);
                }
            }
        }
        
        this.firstClick = false;
        this.startTimer();
        this.ui.setAutoSolveEnabled(true);
        this.ui.setStepEnabled(true);
        this.updateUI();
    }

    handleCellClick(row, col, isSolverMove = false) {
        if (this.gameOver || this.board.revealed[row][col] || this.board.flagged[row][col]) {
            return;
        }
        
        if (this.firstClick) {
            this.board.placeMines(row, col);
            this.firstClick = false;
            this.startTimer();
            this.ui.setAutoSolveEnabled(true);
            this.ui.setStepEnabled(true);
            this.updateUI();
        }
        
        if (this.board.isMine(row, col)) {
            this.gameOver = true;
            this.stopTimer();
            
            const wasAutoSolving = this.autoSolving;
            const wasSafeAuto = this.safeAutoSolving;
            
            this.stopAutoSolve();
            this.stopSafeAuto();
            this.board.revealAllMines();
            
            if (isSolverMove) {
                this.ui.updateAllCells(this.board, null, { row, col });
            } else {
                this.ui.updateAllCells(this.board);
            }
            
            this.ui.showOverlay(false, this.timer);
            
            const isAI = wasAutoSolving || wasSafeAuto;
            this.updateStatsOnGameEnd(false, isAI);
            
            if (this.autoRestart) {
                this.restoreAutoSolve = wasAutoSolving;
                this.restoreSafeAuto = wasSafeAuto;
                setTimeout(() => {
                    this.ui.hideOverlay();
                    this.initGame();
                    setTimeout(() => {
                        const centerRow = Math.floor(this.board.rows / 2);
                        const centerCol = Math.floor(this.board.cols / 2);
                        this.handleCellClick(centerRow, centerCol);
                        
                        if (!this.quickStart) {
                            setTimeout(() => {
                                if (this.restoreAutoSolve) {
                                    this.ui.autoSolveToggle.checked = true;
                                    this.startAutoSolve();
                                    this.restoreAutoSolve = false;
                                }
                                
                                if (this.restoreSafeAuto) {
                                    this.ui.safeAutoToggle.checked = true;
                                    this.startSafeAuto();
                                    this.restoreSafeAuto = false;
                                }
                            }, 100);
                        }
                    }, 100);
                }, 100);
            }
            return;
        }
        
        this.board.revealCell(row, col);
        this.updateUI();
        this.checkWin();
    }

    handleRightClick(row, col) {
        if (this.gameOver || this.board.revealed[row][col]) return;
        
        this.board.toggleFlag(row, col);
        this.ui.updateCell(row, col, this.board);
        this.updateUI();
        this.checkWin();
    }

    checkWin() {
        if (this.board.checkWin()) {
            this.gameOver = true;
            this.stopTimer();
            
            const wasAutoSolving = this.autoSolving;
            const wasSafeAuto = this.safeAutoSolving;
            
            this.stopAutoSolve();
            this.stopSafeAuto();
            this.board.revealAllSafe();
            this.ui.updateAllCells(this.board);
            this.ui.showOverlay(true, this.timer);
            
            const isAI = wasAutoSolving || wasSafeAuto;
            this.updateStatsOnGameEnd(true, isAI);
            
            if (this.autoRestart) {
                this.restoreAutoSolve = wasAutoSolving;
                this.restoreSafeAuto = wasSafeAuto;
                setTimeout(() => {
                    this.ui.hideOverlay();
                    this.initGame();
                    setTimeout(() => {
                        const centerRow = Math.floor(this.board.rows / 2);
                        const centerCol = Math.floor(this.board.cols / 2);
                        this.handleCellClick(centerRow, centerCol);
                        
                        if (!this.quickStart) {
                            setTimeout(() => {
                                if (this.restoreAutoSolve) {
                                    this.ui.autoSolveToggle.checked = true;
                                    this.startAutoSolve();
                                    this.restoreAutoSolve = false;
                                }
                                
                                if (this.restoreSafeAuto) {
                                    this.ui.safeAutoToggle.checked = true;
                                    this.startSafeAuto();
                                    this.restoreSafeAuto = false;
                                }
                            }, 100);
                        }
                    }, 100);
                }, 100);
            }
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateUI();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateUI() {
        this.ui.updateStats(
            this.board.totalMines,
            this.timer,
            this.board.getFlagsCount()
        );

        const probabilities = this.showProbabilities && !this.gameOver ?
            this.advancedSolver.getProbabilities() : null;
        this.ui.updateAllCells(this.board, probabilities);
    }

    async solveOneStep() {
        if (this.gameOver || this.firstClick || this.autoSolving || this.safeAutoSolving) return;

        const move = this.advancedSolver.findBestMove();
        if (!move) return;

        if (move.type === 'reveal') {
            this.handleCellClick(move.row, move.col, true);
        } else if (move.type === 'flag') {
            this.handleRightClick(move.row, move.col);
        }
    }

    async startSafeAuto() {
        if (this.firstClick || this.gameOver) return;
        
        this.safeAutoSolving = true;
        
        while (this.safeAutoSolving && !this.gameOver) {
            const move = this.advancedSolver.findBasicMove();
            
            if (!move) {
                this.stopSafeAuto();
                break;
            }

            if (move.type === 'reveal') {
                this.handleCellClick(move.row, move.col, true);
            } else if (move.type === 'flag') {
                this.handleRightClick(move.row, move.col);
            }

            if (this.solveDelay > 0 && !this.gameOver && this.safeAutoSolving) {
                await new Promise(resolve => setTimeout(resolve, this.solveDelay));
            }
        }
    }

    stopSafeAuto() {
        this.safeAutoSolving = false;
        if (this.ui.safeAutoToggle) {
            this.ui.safeAutoToggle.checked = false;
        }
    }

    async startAutoSolve() {
        if (this.firstClick || this.gameOver) return;
        
        this.autoSolving = true;
        
        while (this.autoSolving && !this.gameOver) {
            const move = this.advancedSolver.findBestMove();
            
            if (!move) {
                this.stopAutoSolve();
                break;
            }

            if (move.type === 'reveal') {
                this.handleCellClick(move.row, move.col, true);
            } else if (move.type === 'flag') {
                this.handleRightClick(move.row, move.col);
            }

            if (this.solveDelay > 0 && !this.gameOver && this.autoSolving) {
                await new Promise(resolve => setTimeout(resolve, this.solveDelay));
            }
        }
    }

    stopAutoSolve() {
        this.autoSolving = false;
        if (this.ui.autoSolveToggle) {
            this.ui.autoSolveToggle.checked = false;
        }
    }
}



