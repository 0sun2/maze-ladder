import { useState, useCallback } from 'react';
import InputForm from './components/InputForm';
import EntryButtons from './components/EntryButtons';
import MazeCanvas from './components/MazeCanvas';
import ExitSlots from './components/ExitSlots';
import ResultSummary from './components/ResultSummary';
import AdBanner from './components/AdBanner';
import SiteInfo from './components/SiteInfo';
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
    revealAll,
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

  const handleRevealAll = useCallback(() => {
    revealAll();
  }, [revealAll]);

  // Show result when all revealed
  const showResult = allRevealed && phase === 'maze';
  const siteUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/`;
  const websiteSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '미로 사다리 타기',
    alternateName: ['미로사다리', 'maze-ladder'],
    url: siteUrl,
    description: '결과 예측이 힘든 미로 형식의 사다리타기 게임',
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-8">
      <script type="application/ld+json">
        {websiteSchema}
      </script>

      {/* Header */}
      <header className="pt-6 pb-4 text-center">
        <button
          onClick={handleReset}
          className="inline-flex flex-col items-center text-indigo-600 hover:opacity-80 transition-opacity"
        >
          <div className="text-3xl mb-1">
            {'\uD83C\uDFAF'}
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            미로 사다리 타기
          </h1>
        </button>
        <p className="max-w-md mx-auto mt-3 px-6 text-sm leading-6 text-slate-500">
          결과 예측이 힘든 미로 형식의 사다리타기 게임.
          참가자와 결과를 입력하면 실제 미로를 따라 내려가며 랜덤 결과를 확인할 수 있습니다.
        </p>
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

          {!showResult && (
            <div className="flex justify-center mb-3">
              <button
                onClick={handleRevealAll}
                disabled={animatingIdx !== null}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  animatingIdx !== null
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                바로 전체 결과 보기
              </button>
            </div>
          )}

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

      <SiteInfo />

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 mt-8 pb-4">
        <p>미로 사다리 타기 | 결과가 안 보이는 사다리 게임</p>
      </footer>
    </main>
  );
}

export default App;
