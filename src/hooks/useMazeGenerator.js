import { useState, useCallback } from 'react';
import { generateMaze } from '../utils/mazeAlgorithm';

export function useMazeGenerator() {
  const [mazeData, setMazeData] = useState(null);
  const [revealed, setRevealed] = useState([]);
  const [animatingIdx, setAnimatingIdx] = useState(null);

  const generate = useCallback((participants, results) => {
    const count = participants.length;
    const { grid, paths, entries, exits, cols, rows, exitOrder } = generateMaze(count);

    // Create participant -> result mapping based on exitOrder
    const mapping = {};
    participants.forEach((name, i) => {
      const exitIdx = exitOrder[i];
      mapping[name] = results[exitIdx];
    });

    setMazeData({ grid, paths, entries, exits, cols, rows, mapping, participants, results, exitOrder });
    setRevealed([]);
    setAnimatingIdx(null);
  }, []);

  const revealParticipant = useCallback((idx) => {
    setRevealed((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  }, []);

  const revealAll = useCallback(() => {
    setRevealed(() => (
      mazeData
        ? Array.from({ length: mazeData.participants.length }, (_, idx) => idx)
        : []
    ));
    setAnimatingIdx(null);
  }, [mazeData]);

  const startAnimation = useCallback((idx) => {
    setAnimatingIdx(idx);
  }, []);

  const finishAnimation = useCallback(() => {
    setAnimatingIdx(null);
  }, []);

  const allRevealed = mazeData ? revealed.length === mazeData.participants.length : false;

  return {
    mazeData,
    revealed,
    animatingIdx,
    allRevealed,
    generate,
    revealParticipant,
    revealAll,
    startAnimation,
    finishAnimation,
  };
}
