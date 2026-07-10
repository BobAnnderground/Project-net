import { getBrandIcon } from '../../lib/brandIcons';

interface ServiceIconProps {
  name: string;
  fallback: string;
  size?: number;
}

export function ServiceIcon({ name, fallback, size = 18 }: ServiceIconProps) {
  const brand = getBrandIcon(name);

  if (!brand) {
    return <>{fallback}</>;
  }

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={`#${brand.hex}`}
      aria-label={brand.title}
    >
      <path d={brand.path} />
    </svg>
  );
}
