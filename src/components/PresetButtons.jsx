const PRESETS = [
  {
    label: '커피 내기',
    icon: '\u2615',
    generate: (count) => {
      const r = Array(count).fill('면제');
      r[0] = '커피 사기';
      return r;
    },
  },
  {
    label: '청소 당번',
    icon: '\uD83E\uDDF9',
    generate: (count) => {
      const tasks = ['청소', '설거지', '분리수거', '쓰레기통', '화장실', '유리창'];
      const r = [];
      for (let i = 0; i < count; i++) {
        r.push(i < tasks.length ? tasks[i] : '면제');
      }
      return r;
    },
  },
  {
    label: '벌칙 게임',
    icon: '\uD83C\uDFB2',
    generate: (count) => {
      const r = Array(count).fill('면제');
      r[0] = '벌칙!';
      return r;
    },
  },
];

export default function PresetButtons({ count, onApply }) {
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {PRESETS.map((preset) => (
        <button
          key={preset.label}
          onClick={() => onApply(preset.generate(count))}
          className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm
                     hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-gray-200"
        >
          {preset.icon} {preset.label}
        </button>
      ))}
    </div>
  );
}
