import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Dropdown({ value, options, onChange, placeholder, className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={`dropdown-select ${className}`} ref={rootRef}>
      <button
        type="button"
        className="dropdown-select__input"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={selected ? undefined : 'dropdown-select__placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className="dropdown-select__chevron" />
      </button>
      {open && (
        <div className="dropdown-select__menu">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`dropdown-select__item ${opt.value === value ? 'dropdown-select__item--active' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
              {opt.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
