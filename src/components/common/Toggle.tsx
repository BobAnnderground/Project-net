export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`toggle ${on ? 'toggle--on' : ''}`}
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
