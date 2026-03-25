import { useState } from 'react';
import PresetButtons from './PresetButtons';

const MIN_COUNT = 2;
const MAX_COUNT = 6;

export default function InputForm({ onGenerate }) {
  const [count, setCount] = useState(4);
  const [participants, setParticipants] = useState(
    Array.from({ length: 4 }, (_, i) => `참여자${i + 1}`)
  );
  const [results, setResults] = useState(
    Array.from({ length: 4 }, (_, i) => `결과${i + 1}`)
  );

  const updateCount = (newCount) => {
    const c = Math.max(MIN_COUNT, Math.min(MAX_COUNT, newCount));
    setCount(c);
    setParticipants((prev) => {
      const arr = [...prev];
      while (arr.length < c) arr.push(`참여자${arr.length + 1}`);
      return arr.slice(0, c);
    });
    setResults((prev) => {
      const arr = [...prev];
      while (arr.length < c) arr.push(`결과${arr.length + 1}`);
      return arr.slice(0, c);
    });
  };

  const updateParticipant = (idx, value) => {
    setParticipants((prev) => {
      const arr = [...prev];
      arr[idx] = value;
      return arr;
    });
  };

  const updateResult = (idx, value) => {
    setResults((prev) => {
      const arr = [...prev];
      arr[idx] = value;
      return arr;
    });
  };

  const applyPreset = (presetResults) => {
    setResults(presetResults);
  };

  const handleSubmit = () => {
    const p = participants.map((v, i) => v.trim() || `참여자${i + 1}`);
    const r = results.map((v, i) => v.trim() || `결과${i + 1}`);
    onGenerate(p, r);
  };

  return (
    <section className="w-full max-w-md mx-auto px-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
        누가 걸릴까?
      </h1>
      <p className="text-center text-gray-500 mb-6">
        미로 사다리로 정하자!
      </p>

      {/* 참여자 수 */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <span className="text-sm text-gray-600 font-medium">참여자 수</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateCount(count - 1)}
            disabled={count <= MIN_COUNT}
            className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:bg-indigo-200 transition-colors"
          >
            -
          </button>
          <span className="w-8 text-center text-xl font-bold text-gray-800">{count}</span>
          <button
            onClick={() => updateCount(count + 1)}
            disabled={count >= MAX_COUNT}
            className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:bg-indigo-200 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* 입력 필드 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">참여자</div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">결과</div>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="contents">
            <input
              type="text"
              value={participants[i] || ''}
              onChange={(e) => updateParticipant(i, e.target.value)}
              placeholder={`참여자${i + 1}`}
              className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300
                         transition-all"
            />
            <input
              type="text"
              value={results[i] || ''}
              onChange={(e) => updateResult(i, e.target.value)}
              placeholder={`결과${i + 1}`}
              className="px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300
                         transition-all"
            />
          </div>
        ))}
      </div>

      {/* 프리셋 */}
      <PresetButtons count={count} onApply={applyPreset} />

      {/* CTA */}
      <button
        onClick={handleSubmit}
        className="w-full mt-6 py-3.5 rounded-xl bg-indigo-500 text-white font-bold text-lg
                   shadow-lg shadow-indigo-200 hover:bg-indigo-600
                   active:scale-[0.98] transition-all"
      >
        미로 생성하기
      </button>
    </section>
  );
}
