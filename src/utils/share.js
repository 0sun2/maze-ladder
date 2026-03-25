const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.0/kakao.min.js';

let kakaoSdkPromise = null;

function getShareUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.href;
}

export function buildShareMessage(mazeData) {
  const { participants, mapping } = mazeData;
  const resultLines = participants
    .map((name) => `${name} → ${mapping[name]}`)
    .join('\n');

  const url = getShareUrl();

  return {
    title: '미로 사다리 타기',
    description: `미로 사다리 타기 결과\n\n${resultLines}`,
    url,
    fullText: `미로 사다리 타기 결과\n\n${resultLines}\n\n${url}`,
  };
}

export async function copyShareLink() {
  const url = getShareUrl();

  if (!url) {
    throw new Error('share url unavailable');
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = url;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function getKakaoJsKey() {
  return import.meta.env.VITE_KAKAO_JS_KEY?.trim() || '';
}

function loadKakaoSdk() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window unavailable'));
  }

  if (window.Kakao?.Share?.sendDefault) {
    return Promise.resolve(window.Kakao);
  }

  if (kakaoSdkPromise) {
    return kakaoSdkPromise;
  }

  kakaoSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${KAKAO_SDK_URL}"]`);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.Kakao), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('kakao sdk load failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(window.Kakao);
    script.onerror = () => reject(new Error('kakao sdk load failed'));
    document.head.appendChild(script);
  });

  return kakaoSdkPromise;
}

async function getInitializedKakao() {
  const jsKey = getKakaoJsKey();

  if (!jsKey) {
    throw new Error('kakao js key unavailable');
  }

  const kakao = await loadKakaoSdk();

  if (!kakao?.init) {
    throw new Error('kakao sdk unavailable');
  }

  if (!kakao.isInitialized?.()) {
    kakao.init(jsKey);
  }

  if (!kakao?.Share?.sendDefault) {
    throw new Error('kakao sdk unavailable');
  }

  return kakao;
}

export async function shareToKakaoTalk(mazeData) {
  if (typeof window === 'undefined') {
    throw new Error('window unavailable');
  }

  const { title, description, url } = buildShareMessage(mazeData);
  const kakao = await getInitializedKakao();

  kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title,
      description,
      imageUrl: `${window.location.origin}/favicon.svg`,
      link: {
        mobileWebUrl: url,
        webUrl: url,
      },
    },
    buttons: [
      {
        title: '미로 사다리 타기 열기',
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
    ],
  });
}
