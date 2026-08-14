import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OnboardingCoachmarkProps {
  step: 2 | 3 | 4;
  text: string;
  onSkip: () => void;
  onPrev: () => void;
  onNext: () => void;
  showPrev?: boolean;
  isLast?: boolean;
  className?: string;
}

export function OnboardingCoachmark({
  step,
  text,
  onSkip,
  onPrev,
  onNext,
  showPrev = true,
  isLast = false,
  className,
}: OnboardingCoachmarkProps) {
  return (
    <div className={`coachmark${className ? ` ${className}` : ''}`}>
      <p className="coachmark__text">{text}</p>
      <div className="coachmark__footer">
        <button className="hero-banner__btn hero-banner__btn--secondary" onClick={onSkip}>
          Skip tips
        </button>
        <div className="coachmark__pager">
          <span className="coachmark__step">{step} / 4</span>
          {showPrev && (
            <button className="coachmark__nav-btn" onClick={onPrev} aria-label="Previous tip">
              <ChevronLeft size={14} />
            </button>
          )}
          {isLast ? (
            <button className="hero-banner__btn hero-banner__btn--secondary" onClick={onNext}>
              Got it
            </button>
          ) : (
            <button className="coachmark__nav-btn" onClick={onNext} aria-label="Next tip">
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
