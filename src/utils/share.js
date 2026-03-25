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

export async function shareToKakaoTalk(mazeData) {
  if (typeof window === 'undefined') {
    throw new Error('window unavailable');
  }

  const { title, description, url } = buildShareMessage(mazeData);
  const kakao = window.Kakao;

  if (!kakao?.Share?.sendDefault) {
    throw new Error('kakao sdk unavailable');
  }

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
