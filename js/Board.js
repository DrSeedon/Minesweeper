import { MINE } from './constants.js';

export class Board {
    constructor(rows, cols, totalMines) {
        this.rows = rows;
        this.cols = cols;
        this.totalMines = totalMines;
        this.cells = Array(rows).fill(null).map(() => Array(cols).fill(0));
        this.revealed = Array(rows).fill(null).map(() => Array(cols).fill(false));
        this.flagged = Array(rows).fill(null).map(() => Array(cols).fill(false));
    }

    placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.totalMines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            if (this.cells[row][col] === MINE) continue;
            if (Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1) continue;
            
            this.cells[row][col] = MINE;
            minesPlaced++;
            
            this.updateNeighborCounts(row, col);
        }
    }

    updateNeighborCounts(row, col) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const newRow = row + dr;
                const newCol = col + dc;
                if (this.isValid(newRow, newCol) && this.cells[newRow][newCol] !== MINE) {
                    this.cells[newRow][newCol]++;
                }
            }
        }
    }

    isValid(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    revealCell(row, col) {
        if (!this.isValid(row, col) || this.revealed[row][col] || this.flagged[row][col]) {
            return;
        }
        
        this.revealed[row][col] = true;
        
        if (this.cells[row][col] === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr !== 0 || dc !== 0) {
                        this.revealCell(row + dr, col + dc);
                    }
                }
            }
        }
    }

    toggleFlag(row, col) {
        if (this.revealed[row][col]) return false;
        this.flagged[row][col] = !this.flagged[row][col];
        return this.flagged[row][col];
    }

    revealAllMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.cells[row][col] === MINE) {
                    this.revealed[row][col] = true;
                }
            }
        }
    }

    revealAllSafe() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.cells[row][col] !== MINE && !this.revealed[row][col]) {
                    this.revealed[row][col] = true;
                }
            }
        }
    }

    checkWin() {
        let revealedCount = 0;
        let correctFlags = 0;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.revealed[row][col]) revealedCount++;
                if (this.flagged[row][col] && this.cells[row][col] === MINE) correctFlags++;
            }
        }
        
        const totalCells = this.rows * this.cols;
        return revealedCount === totalCells - this.totalMines || correctFlags === this.totalMines;
    }

    isMine(row, col) {
        return this.cells[row][col] === MINE;
    }

    getFlagsCount() {
        let count = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.flagged[row][col]) count++;
            }
        }
        return count;
    }
}

