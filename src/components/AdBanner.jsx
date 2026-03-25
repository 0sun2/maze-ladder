import { useEffect, useRef } from 'react';

export default function AdBanner({ slot = 'auto', format = 'auto', className = '' }) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (window.adsbygoogle && adRef.current) {
        window.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch {
      // AdSense not loaded
    }
  }, []);

  return (
    <div className={`w-full flex justify-center my-4 ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '90px' }}
        data-ad-client="ca-pub-2765828461077710"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
