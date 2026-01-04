import React, { useState, useEffect, useMemo } from 'react';
import { BOARD_SIZE } from '../gameHelpers';
import socket from '../sockets/socket';
import toast from 'react-hot-toast';

const BattleField = ({ roomId, username, myBoard, currentTurn, setTurn, winner, setWinner }) => {
  // state for tracking shots fired at the opponent's board
  const [opponentBoardShots, setOpponentBoardShots] = useState(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );

  // state for tracking shots fired by the opponent at the user's board
  const [myBoardShots, setMyBoardShots] = useState(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );

  // memoized empty 10x10 grid to represent the opponent's hidden territory
  const emptyBoard = useMemo(() => 
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)), 
  []);

  const columns = [' ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  useEffect(() => {
    // internal function to handle incoming game updates from the server
    const handleUpdateGame = (data) => {
      const { r, c, result, shooter, nextTurn, sunkShip, gameOver, isForfeit } = data;

      // logic for handling a win by forfeit if the opponent leaves
      if (isForfeit && gameOver) {
        toast.success(`Opponent fled the battlefield! You win by forfeit! 🏆`, {
          duration: 6000,
        });
        setWinner(gameOver);
        return; 
      }

      // notification logic when a ship is sunk
      if (sunkShip) {
        const message = shooter === username 
          ? `You sunk the enemy's ${sunkShip}! 💥` 
          : `Your ${sunkShip} has been sunk! 💀`;
        toast(message, { duration: 4000 });
      }

      // update the correct board state based on who fired the shot
      if (shooter) {
        if (shooter === username) {
          setOpponentBoardShots(prev => {
            const newBoard = prev.map(row => [...row]);
            newBoard[r][c] = sunkShip ? 'sunk' : result;
            return newBoard;
          });
        } else {
          setMyBoardShots(prev => {
            const newBoard = prev.map(row => [...row]);
            newBoard[r][c] = sunkShip ? 'sunk' : result;
            return newBoard;
          });
        }
      }

      // sync turn and winner status with the parent component
      if (nextTurn) setTurn(nextTurn);
      if (gameOver) setWinner(gameOver);
    };

    // setting up the socket listener
    socket.on("update_game", handleUpdateGame);
    
    // cleaning up the listener when the component is removed
    return () => socket.off("update_game", handleUpdateGame);
  }, [username, setTurn, setWinner, roomId]);

  // function to handle clicking on a cell to fire a shot
  const handleFire = (r, c) => {
    if (winner) return; 
    
    // check if the coordinate was already shot at
    if (opponentBoardShots[r][c] !== null) {
      toast.error("You already fired there!");
      return;
    }

    // verify if it is the user's turn
    if (currentTurn !== username) {
      toast.error("Wait for your turn!");
      return;
    }
    
    // emit the fire event to the server
    socket.emit("fire", { roomId, r, c });
  };

  // function to render the 10x10 game grid
  const renderGrid = (boardToRender, isOpponent) => (
    <div className="grid-container">

      <div className="grid-row">
        {columns.map(char => <div key={char} className="label-cell">{char}</div>)}
      </div>

      {boardToRender.map((row, r) => (
        <div key={r} className="grid-row">
          <div className="label-cell side-label">{r + 1}</div>
          {row.map((cell, c) => {
            // get the shot result for this specific cell
            const shotResult = isOpponent ? opponentBoardShots[r][c] : myBoardShots[r][c];
            
            // logic for ship visibility on the player's own board
            const isShipVisible = !isOpponent && cell !== null && shotResult !== 'hit' && shotResult !== 'sunk';
            
            return (
              <div
                key={c}
                className={`cell 
                  ${isShipVisible ? 'cell-ship' : ''} 
                  ${shotResult === 'hit' ? 'hit-green' : ''} 
                  ${shotResult === 'miss' ? 'miss-red' : ''}
                  ${shotResult === 'sunk' ? 'sunk-blue' : ''} 
                `}
                // attach click handler only to the opponent's board
                onClick={() => isOpponent && handleFire(r, c)}
              >
                {/* visual markers for hits, misses, and sunk ships */}
                {shotResult === 'hit' && 'X'}
                {shotResult === 'sunk' && '❌'}
                {shotResult === 'miss' && '•'}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div className="battle-container">

      <div className="turn-indicator">
        {winner ? (
          <h3 className="winner-msg">Winner: {winner} 🏆</h3>
        ) : (
          <h3 className={currentTurn === username ? "your-turn" : "enemy-turn"}>
            {currentTurn === username ? "YOUR TURN 🎯" : `${currentTurn} is aiming ⌛...`}
          </h3>
        )}
      </div>

      {/* main layout with both boards side-by-side */}
      <div className="battle-boards-row">
        <div className="board-wrapper">
          <h4>YOUR FLEET</h4>
          {renderGrid(myBoard, false)}
        </div>
        <div className="board-wrapper">
          <h4>ENEMY TERRITORY</h4>
          {renderGrid(emptyBoard, true)}
        </div>
      </div>
    </div>
  );
};

export default BattleField;