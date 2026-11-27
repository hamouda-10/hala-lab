import { useEffect, useRef } from 'react';
import { mountPrismEngine } from '../lib/prismEngine';

interface PrismStageProps {
  copyRef: React.RefObject<HTMLDivElement | null>;
}

export function PrismStage({ copyRef }: PrismStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const glRef = useRef<HTMLCanvasElement | null>(null);
  const fxRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const stageEl = stageRef.current;
    const glCanvas = glRef.current;
    const fxCanvas = fxRef.current;
    if (!stageEl || !glCanvas || !fxCanvas) return;

    const cleanup = mountPrismEngine({
      stageEl,
      glCanvas,
      fxCanvas,
      isRtl: true,
      getCopyBottom: () => {
        const el = copyRef.current;
        if (!el) return 320;
        const stageRect = stageEl.getBoundingClientRect();
        const copyRect = el.getBoundingClientRect();
        return Math.max(220, copyRect.bottom - stageRect.top);
      },
    });

    return cleanup;
  }, [copyRef]);

  return (
    <div ref={stageRef} className="stage" aria-hidden="true">
      <canvas ref={glRef} id="gl" />
      <canvas ref={fxRef} id="fx" />
    </div>
  );
}
