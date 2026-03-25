import { copyShareLink, shareToKakaoTalk } from '../utils/share';

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
  const handleCopyLink = async () => {
    try {
      await copyShareLink();
      alert('링크가 복사되었습니다!');
    } catch {
      alert('링크 복사에 실패했습니다.');
    }
  };

  const handleKakaoShare = async () => {
    try {
      await shareToKakaoTalk(mazeData);
    } catch (error) {
      if (error instanceof Error && error.message === 'kakao js key unavailable') {
        alert('카카오 JavaScript 키가 비어 있습니다. Cloudflare Pages 환경변수 `VITE_KAKAO_JS_KEY`를 확인하세요.');
        return;
      }
      if (error instanceof Error && error.message === 'kakao sdk unavailable') {
        alert('카카오 SDK 초기화에 실패했습니다. 앱 키와 도메인 설정을 다시 확인하세요.');
        return;
      }
      if (error instanceof Error && error.message === 'kakao sdk load failed') {
        alert('카카오 SDK 스크립트를 불러오지 못했습니다. 네트워크 상태나 브라우저 차단 설정을 확인하세요.');
        return;
      }
      alert('카카오톡 공유에 실패했습니다.');
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      <button
        onClick={handleKakaoShare}
        className="py-3 rounded-xl bg-yellow-300 text-yellow-950 font-bold
                   hover:bg-yellow-400 transition-colors"
      >
        카카오톡 공유
      </button>
      <button
        onClick={handleCopyLink}
        className="py-3 rounded-xl bg-green-500 text-white font-bold
                   hover:bg-green-600 transition-colors"
      >
        링크 복사하기
      </button>
    </div>
  );
}
