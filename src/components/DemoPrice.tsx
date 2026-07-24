import { isDemoDataEnabled } from '@/lib/apiConfig';

interface DemoPriceProps {
  price: string | number;
  className?: string;
  fallback?: string;
  children?: React.ReactNode;
}

export default function DemoPrice({ price, className = '', fallback = 'Consultar precio', children }: DemoPriceProps) {
  if (!isDemoDataEnabled()) {
    return <span className={className}>{fallback}</span>;
  }
  return <span className={className}>{children || price}</span>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function demoPriceLabel(price: string | number, fallback = 'Consultar precio'): string | number {
  return isDemoDataEnabled() ? price : fallback;
}
