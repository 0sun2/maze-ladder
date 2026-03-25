const COLORS = ['#4F7DF2', '#EF4444', '#22C55E', '#F59E0B', '#A855F7', '#F97316'];

export default function EntryButtons({ participants, revealed, animatingIdx, onSelect }) {
  return (
    <div className="flex justify-around px-2 mb-2">
      {participants.map((name, idx) => {
        const isRevealed = revealed.includes(idx);
        const isAnimating = animatingIdx === idx;
        const color = COLORS[idx % COLORS.length];

        return (
          <button
            key={idx}
            onClick={() => !isRevealed && !isAnimating && animatingIdx === null && onSelect(idx)}
            disabled={isRevealed || isAnimating || animatingIdx !== null}
            className="px-2 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-white
                       transition-all min-w-[50px]
                       disabled:cursor-not-allowed"
            style={{
              backgroundColor: isRevealed ? '#9CA3AF' : color,
              opacity: isRevealed ? 0.5 : 1,
              transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
              boxShadow: isAnimating ? `0 0 12px ${color}` : 'none',
            }}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
