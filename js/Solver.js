import { MINE } from './constants.js';

export class Solver {
    constructor(board) {
        this.board = board;
    }

    findSafeMove() {
        const moves = this.analyzeBoard();
        if (moves.safeCells.length > 0) {
            return { type: 'reveal', row: moves.safeCells[0].row, col: moves.safeCells[0].col };
        }
        if (moves.mineCells.length > 0) {
            return { type: 'flag', row: moves.mineCells[0].row, col: moves.mineCells[0].col };
        }
        return this.makeRandomMove();
    }

    analyzeBoard() {
        const safeCells = [];
        const mineCells = [];

        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                if (!this.board.revealed[row][col]) continue;
                if (this.board.cells[row][col] <= 0) continue;

                const neighbors = this.getNeighbors(row, col);
                const unrevealed = neighbors.filter(n => !this.board.revealed[n.row][n.col] && !this.board.flagged[n.row][n.col]);
                const flagged = neighbors.filter(n => this.board.flagged[n.row][n.col]);
                const mineCount = this.board.cells[row][col];

                if (flagged.length === mineCount && unrevealed.length > 0) {
                    safeCells.push(...unrevealed);
                }

                if (flagged.length + unrevealed.length === mineCount && unrevealed.length > 0) {
                    mineCells.push(...unrevealed);
                }
            }
        }

        return { 
            safeCells: this.removeDuplicates(safeCells), 
            mineCells: this.removeDuplicates(mineCells) 
        };
    }

    getNeighbors(row, col) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (this.board.isValid(newRow, newCol)) {
                    neighbors.push({ row: newRow, col: newCol });
                }
            }
        }
        return neighbors;
    }

    removeDuplicates(cells) {
        const seen = new Set();
        return cells.filter(cell => {
            const key = `${cell.row},${cell.col}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    makeRandomMove() {
        const unrevealed = [];
        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                if (!this.board.revealed[row][col] && !this.board.flagged[row][col]) {
                    unrevealed.push({ row, col });
                }
            }
        }

        if (unrevealed.length === 0) return null;

        const corners = unrevealed.filter(cell => 
            (cell.row === 0 || cell.row === this.board.rows - 1) &&
            (cell.col === 0 || cell.col === this.board.cols - 1)
        );

        if (corners.length > 0) {
            const random = corners[Math.floor(Math.random() * corners.length)];
            return { type: 'reveal', row: random.row, col: random.col };
        }

        const random = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        return { type: 'reveal', row: random.row, col: random.col };
    }
}

