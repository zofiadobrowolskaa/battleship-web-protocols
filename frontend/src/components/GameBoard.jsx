import React, { useState } from 'react';
import { BOARD_SIZE, createEmptyBoard, SHIPS } from '../gameHelpers';
import toast from 'react-hot-toast';

const GameBoard = ({ onBoardReady }) => {

  const [board, setBoard] = useState(createEmptyBoard());
  const [selectedShip, setSelectedShip] = useState(null);
  
  // keeps track of which ships (by name) have already been successfully placed.
  const [placedShips, setPlacedShips] = useState([]);

  // stores the {r, c} coordinates of the first click when placing a ship.
  const [firstClick, setFirstClick] = useState(null);

  const columns = [' ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  // handles selecting a ship from the sidebar.
  const handleShipSelect = (ship) => {
    if (placedShips.includes(ship.name)) {
      // ship exists on board: remove it
      removeShip(ship.name);
    } else {
      // ship not placed: select it for placement and reset any partial clicks
      setSelectedShip(ship);
      setFirstClick(null);
    }
  };

  const removeShip = (shipName) => {
    // create a new board where cells occupied by this ship are reset to null
    const newBoard = board.map(row =>
      row.map(cell => cell === shipName ? null : cell)
    );

    setBoard(newBoard);
    setPlacedShips(prev => prev.filter(s => s !== shipName));

    // deselect if the current "tool" was the ship we just removed
    if (selectedShip?.name === shipName) {
      setSelectedShip(null);
    }

    toast(`${shipName} removed from board`, { icon: '🗑️' });
  };

  // ships can't touch each other, checks the 8 cells surrounding a coordinate (r, c).
  const hasNeighboringShip = (r, c, currentBoard) => {
    // loop from -1 to +1 to check the surrounding 3x3 area
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const neighborRow = r + i;
        const neighborCol = c + j;

        // ensure we are checking coordinates that actually exist on the grid
        if (
          neighborRow >= 0 && neighborRow < BOARD_SIZE &&
          neighborCol >= 0 && neighborCol < BOARD_SIZE
        ) {
          // if any surrounding cell is not null, there is a neighbor
          if (currentBoard[neighborRow][neighborCol] !== null) {
            return true;
          }
        }
      }
    }
    return false;
  };


  const handleCellClick = (r, c) => {

    if (!selectedShip) {
      toast.error("Please select a ship from the list first!");
      return;
    }

    // selecting the starting point
    if (!firstClick) {

      if (board[r][c] !== null) {
        toast.error("This coordinate is already occupied!");
        return;
      }

      // adjacency check
      if (hasNeighboringShip(r, c, board)) {
        toast.error("Too close! Ships must have at least one clear cell between them.");
        return;
      }

      setFirstClick({ r, c });
      toast.success(`Select the end position for your ${selectedShip.name}`);

    } else {
      // selecting the end point and attempting to "draw" the ship
      placeShip(firstClick.r, firstClick.c, r, c);
    }
  };

  // logic to calculate path, validate it, and update the board state.
  const placeShip = (r1, c1, r2, c2) => {
    const isHorizontal = r1 === r2;
    const isVertical = c1 === c2;

    if (!isHorizontal && !isVertical) {
      toast.error("Ships must be placed either horizontally or vertically!");
      setFirstClick(null);
      return;
    }

    // calculate length based on coordinates
    const length = isHorizontal
      ? Math.abs(c1 - c2) + 1
      : Math.abs(r1 - r2) + 1;

    if (length !== selectedShip.size) {
      toast.error(
        `Invalid size! The ${selectedShip.name} requires exactly ${selectedShip.size} cells.`
      );
      setFirstClick(null);
      return;
    }

    const cellsToFill = [];
    const startR = Math.min(r1, r2);
    const endR = Math.max(r1, r2);
    const startC = Math.min(c1, c2);
    const endC = Math.max(c1, c2);

    // iterating through every cell the ship will occupy to verify rules
    for (let i = startR; i <= endR; i++) {
      for (let j = startC; j <= endC; j++) {

        // double check for overlap (in case user clicked through existing ships)
        if (board[i][j] !== null) {
          toast.error("Ships cannot overlap!");
          setFirstClick(null);
          return;
        }

        // check the adjacency rule for every cell in the ship's path
        if (hasNeighboringShip(i, j, board)) {
          toast.error("Too close! Ships must have at least one clear cell between them.");
          setFirstClick(null);
          return;
        }

        cellsToFill.push([i, j]);
      }
    }

    // update board state using a deep clone to maintain immutability
    const newBoard = board.map(row => [...row]);
    cellsToFill.forEach(([r, c]) => {
      newBoard[r][c] = selectedShip.name;
    });

    setBoard(newBoard);
    setPlacedShips([...placedShips, selectedShip.name]);
    setSelectedShip(null);
    setFirstClick(null);

    toast.success(`${selectedShip.name} successfully deployed!`, { icon: '🚢' });
  };

  return (
    <div className="setup-container">
      <h2 className="setup-header">Game Lobby</h2>

      <div className="setup-content">
  
        <div className="ships-to-place">
          <h3>Ships to place</h3>
          {SHIPS.map((ship) => (
            <div
              key={ship.name}
              className={`
                ship-item
                ${selectedShip?.name === ship.name ? 'active' : ''}
                ${placedShips.includes(ship.name) ? 'placed' : ''}
              `}
              onClick={() => handleShipSelect(ship)}
            >
              <input
                type="checkbox"
                checked={placedShips.includes(ship.name)}
                readOnly
              />
              <span className="ship-info">
                {ship.name} ({ship.size} cells)
              </span>
            </div>
          ))}
        </div>

        <div className="board-section">
          <h3>Place your ships</h3>

          <div className="grid-container">

            {/* column headers (A-J) */}
            <div className="grid-row">
              {columns.map(char => (
                <div key={char} className="label-cell">{char}</div>
              ))}
            </div>

            {/* rendering the 10x10 grid */}
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="grid-row">
                {/* row headers (1-10) */}
                <div className="label-cell side-label">
                  {rowIndex + 1}
                </div>

                {row.map((cell, colIndex) => (
                  <div
                    key={colIndex}
                    className={`
                      cell
                      ${cell ? 'cell-ship' : ''}
                      ${firstClick?.r === rowIndex && firstClick?.c === colIndex ? 'cell-start' : ''}
                    `}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  />
                ))}
              </div>
            ))}
          </div>

          <button
            className="start-btn"
            disabled={placedShips.length < SHIPS.length}
            onClick={() => onBoardReady(board)}
          >
            {placedShips.length < SHIPS.length
              ? `Deployment: ${placedShips.length}/${SHIPS.length}`
              : "Ready to Battle!"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;