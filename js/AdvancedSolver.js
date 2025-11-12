import { MINE } from './constants.js';

export class AdvancedSolver {
    constructor(board) {
        this.board = board;
    }

    findBestMove() {
        const basicMove = this.findBasicMove();
        if (basicMove) return basicMove;

        const probabilities = this.calculateProbabilities();
        return this.selectLowestProbabilityMove(probabilities);
    }

    findBasicMove() {
        const safeMoves = [];
        const mineMoves = [];

        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                if (!this.board.revealed[row][col] || this.board.cells[row][col] <= 0) continue;

                const neighbors = this.getNeighbors(row, col);
                const unrevealed = neighbors.filter(n => !this.board.revealed[n.row][n.col] && !this.board.flagged[n.row][n.col]);
                const flagged = neighbors.filter(n => this.board.flagged[n.row][n.col]);
                const mineCount = this.board.cells[row][col];

                if (flagged.length === mineCount && unrevealed.length > 0) {
                    safeMoves.push(...unrevealed);
                }

                if (flagged.length + unrevealed.length === mineCount && unrevealed.length > 0) {
                    mineMoves.push(...unrevealed);
                }
            }
        }

        if (safeMoves.length > 0) {
            const unique = this.removeDuplicates(safeMoves);
            return { type: 'reveal', row: unique[0].row, col: unique[0].col, probability: 0 };
        }

        if (mineMoves.length > 0) {
            const unique = this.removeDuplicates(mineMoves);
            return { type: 'flag', row: unique[0].row, col: unique[0].col, probability: 1 };
        }

        return null;
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

    calculateProbabilities() {
        const probabilities = Array(this.board.rows).fill(null).map(() => Array(this.board.cols).fill(-1));
        const definite = this.findDefiniteCells();

        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                if (this.board.revealed[row][col] || this.board.flagged[row][col]) continue;

                const key = `${row},${col}`;
                if (definite.safe.has(key)) {
                    probabilities[row][col] = 0;
                } else if (definite.mines.has(key)) {
                    probabilities[row][col] = 1;
                } else {
                    const prob = this.calculateCellProbability(row, col);
                    probabilities[row][col] = prob;
                }
            }
        }

        return probabilities;
    }

    findDefiniteCells() {
        const safe = new Set();
        const mines = new Set();

        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                if (!this.board.revealed[row][col] || this.board.cells[row][col] <= 0) continue;

                const neighbors = this.getNeighbors(row, col);
                const unrevealed = neighbors.filter(n => !this.board.revealed[n.row][n.col] && !this.board.flagged[n.row][n.col]);
                const flagged = neighbors.filter(n => this.board.flagged[n.row][n.col]);
                const mineCount = this.board.cells[row][col];

                if (flagged.length === mineCount) {
                    unrevealed.forEach(cell => safe.add(`${cell.row},${cell.col}`));
                }

                if (flagged.length + unrevealed.length === mineCount) {
                    unrevealed.forEach(cell => mines.add(`${cell.row},${cell.col}`));
                }
            }
        }

        return { safe, mines };
    }

    calculateCellProbability(row, col) {
        const revealedNeighbors = this.getRevealedNeighbors(row, col);
        
        if (revealedNeighbors.length === 0) {
            const totalUnrevealed = this.countTotalUnrevealed();
            const remainingMines = this.board.totalMines - this.board.getFlagsCount();
            return totalUnrevealed > 0 ? remainingMines / totalUnrevealed : 0;
        }

        let totalProb = 0;
        let count = 0;

        for (const neighbor of revealedNeighbors) {
            const mineCount = this.board.cells[neighbor.row][neighbor.col];
            if (mineCount <= 0) continue;

            const neighborNeighbors = this.getNeighbors(neighbor.row, neighbor.col);
            const unrevealed = neighborNeighbors.filter(n => !this.board.revealed[n.row][n.col] && !this.board.flagged[n.row][n.col]);
            const flagged = neighborNeighbors.filter(n => this.board.flagged[n.row][n.col]);

            const remainingMines = mineCount - flagged.length;
            if (unrevealed.length > 0) {
                totalProb += remainingMines / unrevealed.length;
                count++;
            }
        }

        return count > 0 ? totalProb / count : 0.5;
    }

    getRevealedNeighbors(row, col) {
        const neighbors = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const newRow = row + dr;
                const newCol = col + dc;
                if (this.board.isValid(newRow, newCol) && this.board.revealed[newRow][newCol]) {
                    neighbors.push({ row: newRow, col: newCol });
                }
            }
        }
        return neighbors;
    }

    selectLowestProbabilityMove(probabilities) {
        let minProb = 2;
        let bestMoves = [];

        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                const prob = probabilities[row][col];
                if (prob < 0) continue;

                if (prob < minProb) {
                    minProb = prob;
                    bestMoves = [{ row, col }];
                } else if (prob === minProb) {
                    bestMoves.push({ row, col });
                }
            }
        }

        if (bestMoves.length === 0) return null;

        const corners = bestMoves.filter(m => 
            (m.row === 0 || m.row === this.board.rows - 1) &&
            (m.col === 0 || m.col === this.board.cols - 1)
        );

        const selected = corners.length > 0 ? corners[0] : bestMoves[0];
        return { type: 'reveal', row: selected.row, col: selected.col, probability: minProb };
    }

    countTotalUnrevealed() {
        let count = 0;
        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                if (!this.board.revealed[row][col] && !this.board.flagged[row][col]) {
                    count++;
                }
            }
        }
        return count;
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

    getProbabilities() {
        return this.calculateProbabilities();
    }
}



