import { useState, useCallback } from 'react';
import InputForm from './components/InputForm';
import EntryButtons from './components/EntryButtons';
import MazeCanvas from './components/MazeCanvas';
import ExitSlots from './components/ExitSlots';
import ResultSummary from './components/ResultSummary';
import AdBanner from './components/AdBanner';
import { useMazeGenerator } from './hooks/useMazeGenerator';

function App() {
  const [phase, setPhase] = useState('input'); // input | maze | result
  const [speed, setSpeed] = useState('normal');
  const [inputCache, setInputCache] = useState(null);

  const {
    mazeData,
    revealed,
    animatingIdx,
    allRevealed,
    generate,
    revealParticipant,
    startAnimation,
    finishAnimation,
  } = useMazeGenerator();

  const handleGenerate = useCallback((participants, results) => {
    setInputCache({ participants, results });
    generate(participants, results);
    setPhase('maze');
  }, [generate]);

  const handleSelectEntry = useCallback((idx) => {
    startAnimation(idx);
  }, [startAnimation]);

  const handleAnimationEnd = useCallback((idx) => {
    revealParticipant(idx);
    finishAnimation();
  }, [revealParticipant, finishAnimation]);

  const handleRetry = useCallback(() => {
    if (inputCache) {
      generate(inputCache.participants, inputCache.results);
    }
  }, [inputCache, generate]);

  const handleReset = useCallback(() => {
    setPhase('input');
  }, []);

  // Show result when all revealed
  const showResult = allRevealed && phase === 'maze';

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-8">
      {/* Header */}
      <header className="pt-6 pb-4 text-center">
        <div className="text-3xl mb-1">
          {'\uD83C\uDFAF'}
        </div>
        <h1 className="text-lg font-bold text-indigo-600 tracking-tight">
          미로 사다리 타기
        </h1>
      </header>

      {/* Input Phase */}
      {phase === 'input' && (
        <>
          <InputForm onGenerate={handleGenerate} />
          <AdBanner className="mt-6" />
        </>
      )}

      {/* Maze Phase */}
      {phase === 'maze' && mazeData && (
        <section className="w-full max-w-lg mx-auto px-2">
          {/* Speed Control */}
          <div className="flex justify-center gap-2 mb-3">
            {['slow', 'normal', 'fast'].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${speed === s
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
              >
                {s === 'slow' ? '느리게' : s === 'normal' ? '보통' : '빠르게'}
              </button>
            ))}
          </div>

          {/* Entry Buttons */}
          <EntryButtons
            participants={mazeData.participants}
            revealed={revealed}
            animatingIdx={animatingIdx}
            onSelect={handleSelectEntry}
          />

          {/* Maze */}
          <MazeCanvas
            mazeData={mazeData}
            revealed={revealed}
            animatingIdx={animatingIdx}
            onAnimationEnd={handleAnimationEnd}
            speed={speed}
          />

          {/* Exit Slots */}
          <ExitSlots mazeData={mazeData} revealed={revealed} />

          {/* Instruction */}
          {!showResult && revealed.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-3">
              이름을 클릭해서 미로를 탐험하세요!
            </p>
          )}

          {/* Result Summary */}
          {showResult && (
            <>
              <ResultSummary
                mazeData={mazeData}
                onRetry={handleRetry}
                onReset={handleReset}
              />
              <AdBanner />
            </>
          )}

          {!showResult && <AdBanner className="mt-4" />}
        </section>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 mt-8 pb-4">
        <p>미로 사다리 타기 | 결과가 안 보이는 사다리 게임</p>
      </footer>
    </main>
  );
}

export default App;
