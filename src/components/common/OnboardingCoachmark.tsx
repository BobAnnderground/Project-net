import { forwardRef, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface OnboardingCoachmarkProps {
  step: 2 | 3 | 4;
  text: string;
  onSkip: () => void;
  onPrev: () => void;
  onNext: () => void;
  showPrev?: boolean;
  isLast?: boolean;
  className?: string;
  // Lets a caller measure a target element and position the tooltip
  // against it in JS (see Services.tsx) instead of hardcoded CSS
  // coordinates — needed when the anchor isn't known until render.
  style?: CSSProperties;
}

export const OnboardingCoachmark = forwardRef<HTMLDivElement, OnboardingCoachmarkProps>(function OnboardingCoachmark(
  { step, text, onSkip, onPrev, onNext, showPrev = true, isLast = false, className, style },
  ref
) {
  return (
    <div ref={ref} className={`coachmark${className ? ` ${className}` : ''}`} style={style}>
      <p className="coachmark__text">{text}</p>
      <div className="coachmark__footer">
        <button className="btn" onClick={onSkip}>
          Skip tips
        </button>
        <div className="coachmark__pager">
          <span className="coachmark__step">{step} / 4</span>
          <div className="coachmark__nav-group">
            {showPrev && (
              <button className="coachmark__nav-btn" onClick={onPrev} aria-label="Previous tip">
                <ArrowLeft size={14} />
              </button>
            )}
            {isLast ? (
              <button className="btn" onClick={onNext}>
                Got it
              </button>
            ) : (
              <button className="coachmark__nav-btn" onClick={onNext} aria-label="Next tip">
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
