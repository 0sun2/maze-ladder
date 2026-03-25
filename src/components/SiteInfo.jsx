const INFO_SECTIONS = [
  {
    id: 'about',
    title: '서비스 소개',
    content: [
      '미로 사다리 타기는 기존 사다리 타기처럼 결과가 미리 읽히지 않도록, 실제 미로를 따라 결과를 확인하는 랜덤 게임입니다.',
      '회식 벌칙, 커피 내기, 순서 정하기처럼 가볍게 랜덤 결과를 정해야 하는 상황에서 누구나 빠르게 사용할 수 있도록 만들었습니다.',
      '참가자 수에 맞춰 미로가 새로 생성되며, 각 참가자는 상단 입구에서 출발해 자신에게 연결된 하단 결과를 확인하게 됩니다.',
    ],
  },
  {
    id: 'how-to',
    title: '이용 방법',
    content: [
      '참여자 이름과 결과 항목을 입력한 뒤 미로를 생성합니다.',
      '상단에 표시된 참여자 버튼을 누르면 해당 참가자의 팩맨 캐릭터가 미로를 따라 이동합니다.',
      '결과를 하나씩 확인할 수도 있고, 필요하면 바로 전체 결과 보기를 눌러 한 번에 확인할 수도 있습니다.',
    ],
  },
  {
    id: 'faq',
    title: '자주 묻는 질문',
    content: [
      'Q. 결과는 정말 랜덤인가요? A. 참가자와 결과 매핑은 생성 시점에 랜덤으로 결정되고, 그 뒤 실제 미로가 생성됩니다.',
      'Q. 같은 입력으로 다시 하면 결과가 같나요? A. 아닙니다. 다시 생성하면 미로와 매핑이 새로 만들어집니다.',
      'Q. 모바일에서도 사용할 수 있나요? A. 네. 모바일 화면에서도 바로 사용할 수 있도록 구성되어 있습니다.',
    ],
  },
  {
    id: 'privacy',
    title: '개인정보처리방침',
    content: [
      '이 사이트는 회원가입 없이 사용할 수 있는 단순 웹 도구이며, 입력한 참여자 이름과 결과 항목은 브라우저 내 현재 세션에서만 사용됩니다.',
      '운영자는 사용자가 입력한 항목을 별도 데이터베이스에 저장하지 않습니다. 향후 광고 또는 통계 도구가 추가되면 관련 안내를 이 페이지에 업데이트할 예정입니다.',
      '구글 애드센스 등 제3자 광고 도구가 적용되는 경우, 쿠키 또는 기기 정보가 광고 제공과 측정 목적으로 사용될 수 있습니다.',
    ],
  },
  {
    id: 'contact',
    title: '문의',
    content: [
      '서비스 이용 중 확인이 필요한 운영 정책이나 공지 사항은 이 안내 영역을 기준으로 지속적으로 갱신합니다.',
      '오류 제보, 개선 요청, 제휴 문의가 필요한 경우 배포 채널에 연결된 공식 안내 수단을 통해 순차적으로 대응합니다.',
      '문의 방식이 확정되면 별도 페이지를 만들지 않고 이 영역에서 바로 확인할 수 있게 안내를 추가합니다.',
    ],
  },
];

export default function SiteInfo() {
  return (
    <section id="site-info" className="w-full max-w-3xl mx-auto px-4 mt-10">
      <div className="rounded-3xl border border-indigo-100 bg-white/80 backdrop-blur px-5 py-6 shadow-sm">
        <div className="mb-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-indigo-400 mb-2">
            SERVICE INFO
          </p>
          <h2 className="text-xl font-bold text-slate-800">
            서비스 안내
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-6">
            광고 승인과 사용자 안내에 필요한 기본 정보를 정리해 둔 영역입니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {INFO_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              {section.title}
            </a>
          ))}
        </div>

        <div className="space-y-3">
          {INFO_SECTIONS.map((section) => (
            <details
              key={section.id}
              id={section.id}
              className="group rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
            >
              <summary className="cursor-pointer list-none font-semibold text-slate-800 flex items-center justify-between">
                <span>{section.title}</span>
                <span className="text-slate-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                {section.content.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
