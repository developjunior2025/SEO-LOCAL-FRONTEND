import { useState } from 'react';

const DEFAULT_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, sans-serif' font-size='12' fill='%239ca3af' font-weight='bold'%3EImagen no disponible%3C/text%3E%3C/svg%3E";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export default function SafeImage({ fallback = DEFAULT_FALLBACK, ...props }: SafeImageProps) {
  const [src, setSrc] = useState(props.src || fallback);

  return (
    <img
      {...props}
      src={src}
      onError={(event) => {
        setSrc(fallback);
        props.onError?.(event);
      }}
    />
  );
}
