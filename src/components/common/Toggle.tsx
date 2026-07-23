export function Toggle({
  on,
  onClick,
  className = '',
}: {
  on: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`toggle ${on ? 'toggle--on' : ''} ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-pressed={on}
    >
      <span className="toggle__knob" />
    </button>
  );
}
