const COLORS = ['#4F7DF2', '#EF4444', '#22C55E', '#F59E0B', '#A855F7', '#F97316'];

export default function ExitSlots({ mazeData, revealed }) {
  const { exitOrder, results } = mazeData;

  return (
    <div className="flex justify-around px-2 mt-2">
      {results.map((result, exitIdx) => {
        // Find which participant maps to this exit
        const participantIdx = exitOrder.indexOf(exitIdx);
        const isRevealed = revealed.includes(participantIdx);
        const color = COLORS[participantIdx % COLORS.length];

        return (
          <div
            key={exitIdx}
            className="px-2 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-center
                       min-w-[50px] transition-all duration-500"
            style={{
              backgroundColor: isRevealed ? color : '#E5E7EB',
              color: isRevealed ? 'white' : '#9CA3AF',
              transform: isRevealed ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {isRevealed ? result : '?'}
          </div>
        );
      })}
    </div>
  );
}
