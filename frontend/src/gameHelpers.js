export const BOARD_SIZE = 10;
export const SHIPS = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
];

export const createEmptyBoard = () => 
  Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));