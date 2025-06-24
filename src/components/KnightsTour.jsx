import React, { useState, useEffect, useRef } from 'react';
import { FaChessKnight } from 'react-icons/fa';
import '../styles/KnightsTour.css';

const moves = [
  [2, 1], [1, 2], [-1, 2], [-2, 1],
  [-2, -1], [-1, -2], [1, -2], [2, -1]
];

const useBeep = (freq = 440, duration = 150) => {
  const audioCtx = useRef(null);

  const beep = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioCtx.current.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
    oscillator.connect(audioCtx.current.destination);
    oscillator.start();
    oscillator.stop(audioCtx.current.currentTime + duration / 1000);
  };

  return beep;
};

function KnightsTour({ puzzle, cols }) {
  const rows = Math.ceil(puzzle.length / cols);

  const [board, setBoard] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);
  const [moveNumber, setMoveNumber] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState([]);

  const beepMove = useBeep(600, 100);
  const beepUndo = useBeep(300, 150);
  const beepDone = useBeep(900, 300);

  useEffect(() => {
    const newBoard = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        const index = i * cols + j;
        if (index < puzzle.length) {
          if (puzzle[index] === '1') {
            row.push(-1);
          } else {
            row.push(null);
          }
        } else {
          // Fill extra cells in last row to keep rectangular board, block them
          row.push(null);
        }
      }
      newBoard.push(row);
    }
    setBoard(newBoard);
    setCurrentPos(null);
    setMoveNumber(0);
    setVisitedCount(0);
    setDone(false);
    setHistory([]);
  }, [puzzle, cols, rows]);

  const totalAvailableCells = board.flat().filter(cell => cell !== null).length;

  const isValidMove = (x, y) => {
    if (x < 0 || y < 0 || x >= rows || y >= cols) return false;
    if (board[x][y] === null) return false;
    if (board[x][y] !== -1) return false;
    if (currentPos === null) return true;
    const dx = x - currentPos.x;
    const dy = y - currentPos.y;
    return moves.some(([mx, my]) => mx === dx && my === dy);
  };

  const nextAvailableMoves = () => {
    if (!currentPos) return [];
    return moves
      .map(([dx, dy]) => ({ x: currentPos.x + dx, y: currentPos.y + dy }))
      .filter(({ x, y }) => isValidMove(x, y));
  };

  const handleCellClick = (x, y) => {
    if (done) return;
    if (!isValidMove(x, y)) return;

    const newBoard = board.map(row => row.slice());
    const newMoveNumber = moveNumber + 1;
    newBoard[x][y] = newMoveNumber;

    setBoard(newBoard);
    setHistory([...history, { pos: currentPos, moveNumber }]);
    setCurrentPos({ x, y });
    setMoveNumber(newMoveNumber);
    setVisitedCount(visitedCount + 1);
    beepMove();

    if (visitedCount + 1 === totalAvailableCells) {
      setDone(true);
      beepDone();
    }
  };

  const undo = () => {
    if (history.length === 0) return;

    const last = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);

    const newBoard = board.map(row => row.slice());
    if (currentPos) {
      newBoard[currentPos.x][currentPos.y] = -1;
    }

    setBoard(newBoard);
    setCurrentPos(last.pos);
    setMoveNumber(last.moveNumber);
    setVisitedCount(last.moveNumber);
    setHistory(newHistory);
    setDone(false);
    beepUndo();
  };

  const restart = () => {
    const newBoard = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        const index = i * cols + j;
        if (index < puzzle.length) {
          row.push(puzzle[index] === '1' ? -1 : null);
        } else {
          row.push(null);
        }
      }
      newBoard.push(row);
    }
    setBoard(newBoard);
    setCurrentPos(null);
    setMoveNumber(0);
    setVisitedCount(0);
    setDone(false);
    setHistory([]);
  };

  const nextMoves = nextAvailableMoves();
  const stuck = !done && currentPos && nextMoves.length === 0;

  // Calculate container width and height based on cols, rows, and cell size (50px)
  const containerWidth = cols * 50;
  // Add extra height for controls and messages (approx 120px)
  const containerHeight = rows * 50 + 120;

  return (
    <div
      className="knights-tour-container"
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    >
      <div
        className="board"
        style={{
          gridTemplateColumns: `repeat(${cols}, 50px)`,
          gridTemplateRows: `repeat(${rows}, 50px)`,
        }}
      >
        {board.map((row, i) =>
          row.map((cell, j) => {
            const isStart = currentPos && currentPos.x === i && currentPos.y === j;
            const isNextMove = nextMoves.some(pos => pos.x === i && pos.y === j);

            return (
              <div
                key={`${i}-${j}`}
                className={`cell
                  ${cell === null ? 'blocked' : ''}
                  ${cell === -1 ? 'available' : ''}
                  ${isStart ? 'current' : ''}
                  ${isNextMove && !done ? 'next-move' : ''}
                  ${cell > 0 ? 'visited' : ''}
                `}
                onClick={() => handleCellClick(i, j)}
                title={
                  cell === null ? 'Blocked' :
                    cell === -1 ? 'Available' :
                      `Move #${cell}`
                }
              >
                {cell > 0 ? cell : ''}
                {isStart && (
                  <FaChessKnight className="knight-icon" />
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="controls">
        <button onClick={undo} disabled={history.length === 0 || done} className="btn">Undo</button>
        <button onClick={restart} className="btn">Restart</button>
      </div>

      <div className="messages">
        {!currentPos && !done && (
          <div className="instructions">
            Click any available cell to place the knight and start the tour.
          </div>
        )}
        {currentPos && !done && (
          <div className="instructions">
            Move the knight by clicking on valid cells. Moves made: {moveNumber}/{totalAvailableCells}
          </div>
        )}
        {stuck && (
          <div className="warning">
            ⚠️ No more available moves! The tour ended early.
          </div>
        )}
        {done && (
          <div className="success">
            ✅ Knight's tour complete! You visited all cells.
          </div>
        )}
      </div>
    </div>
  );
}

export default KnightsTour;
