const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.0/kakao.min.js';
const SHARE_PARAM = 'shared';
const SHARE_IMAGE_PATH = '/kakao-share-card.svg';

let kakaoSdkPromise = null;

function getCurrentUrl() {
  if (typeof window === 'undefined') {
    return null;
  }

  return new URL(window.location.href);
}

function encodePayload(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function decodePayload(value) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}

function buildSharePayload(mazeData) {
  return {
    participants: mazeData.participants,
    results: mazeData.results,
    mapping: mazeData.mapping,
  };
}

export function buildShareUrl(mazeData) {
  const currentUrl = getCurrentUrl();

  if (!currentUrl) {
    return '';
  }

  if (!mazeData) {
    return currentUrl.toString();
  }

  const shareUrl = new URL(`${currentUrl.origin}${currentUrl.pathname}`);
  shareUrl.searchParams.set(SHARE_PARAM, encodePayload(buildSharePayload(mazeData)));
  return shareUrl.toString();
}

export function parseSharedMazeData() {
  const currentUrl = getCurrentUrl();

  if (!currentUrl) {
    return null;
  }

  const encoded = currentUrl.searchParams.get(SHARE_PARAM);

  if (!encoded) {
    return null;
  }

  try {
    const payload = decodePayload(encoded);
    const { participants, results, mapping } = payload;

    if (!Array.isArray(participants) || !Array.isArray(results) || !mapping || typeof mapping !== 'object') {
      return null;
    }

    if (participants.length === 0 || participants.length !== results.length) {
      return null;
    }

    const hasAllMappings = participants.every((name) => typeof mapping[name] === 'string');

    if (!hasAllMappings) {
      return null;
    }

    return {
      participants,
      results,
      mapping,
      sharedMode: true,
    };
  } catch {
    return null;
  }
}

export function clearSharedUrl() {
  const currentUrl = getCurrentUrl();

  if (!currentUrl || !currentUrl.searchParams.has(SHARE_PARAM)) {
    return;
  }

  const nextUrl = new URL(`${currentUrl.origin}${currentUrl.pathname}`);
  window.history.replaceState({}, '', nextUrl.toString());
}

export function buildShareMessage(mazeData) {
  const { participants, mapping } = mazeData;
  const resultLines = participants
    .map((name) => `${name} → ${mapping[name]}`)
    .join('\n');

  const url = buildShareUrl(mazeData);

  return {
    title: '미로 사다리 타기',
    description: `미로 사다리 타기 결과\n\n${resultLines}`,
    url,
    fullText: `미로 사다리 타기 결과\n\n${resultLines}\n\n${url}`,
  };
}

export async function copyShareLink(mazeData) {
  const url = buildShareUrl(mazeData);

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
  const imageUrl = new URL(SHARE_IMAGE_PATH, window.location.origin).toString();

  kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title,
      description,
      imageUrl,
      imageWidth: 1200,
      imageHeight: 630,
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
