const COLORS = ['#4F7DF2', '#EF4444', '#22C55E', '#F59E0B', '#A855F7', '#F97316'];

export default function ResultSummary({ mazeData, onRetry, onReset }) {
  const { participants, mapping } = mazeData;

  return (
    <section className="w-full max-w-md mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
        전체 결과
      </h2>

      <div className="space-y-2 mb-6">
        {participants.map((name, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-white shadow-sm"
          >
            <span
              className="font-bold text-sm"
              style={{ color: COLORS[idx % COLORS.length] }}
            >
              {name}
            </span>
            <span className="text-gray-400 mx-2">&rarr;</span>
            <span className="font-bold text-sm text-gray-800">
              {mapping[name]}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 py-3 rounded-xl bg-indigo-100 text-indigo-600 font-bold
                     hover:bg-indigo-200 transition-colors"
        >
          다시 하기
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold
                     hover:bg-gray-200 transition-colors"
        >
          처음부터
        </button>
      </div>

      <ShareButton mazeData={mazeData} />
    </section>
  );
}

function ShareButton({ mazeData }) {
  const { participants, mapping } = mazeData;

  const handleShare = async () => {
    const text = participants
      .map((name) => `${name} → ${mapping[name]}`)
      .join('\n');

    const shareData = {
      title: '미로 사다리 타기 결과',
      text: `미로 사다리 타기 결과!\n\n${text}\n\n미로 사다리로 정해보세요!`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.text);
        alert('결과가 클립보드에 복사되었습니다!');
      } catch {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = shareData.text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('결과가 클립보드에 복사되었습니다!');
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-full mt-3 py-3 rounded-xl bg-green-500 text-white font-bold
                 hover:bg-green-600 transition-colors"
    >
      공유하기
    </button>
  );
}
