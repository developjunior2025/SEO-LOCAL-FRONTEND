import { useState } from 'react';

const DEFAULT_FALLBACK = '/assets/categories/category-default.webp';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

interface SafeImageInnerProps extends SafeImageProps {
  requestedSrc: string;
  fallback: string;
}

function SafeImageInner({ requestedSrc, fallback, ...props }: SafeImageInnerProps) {
  const [src, setSrc] = useState(requestedSrc);

  return (
    <img
      {...props}
      src={src}
      onError={(event) => {
        if (src !== fallback) setSrc(fallback);
        props.onError?.(event);
      }}
    />
  );
}

export default function SafeImage({ fallback = DEFAULT_FALLBACK, ...props }: SafeImageProps) {
  const requestedSrc = props.src || fallback;
  return <SafeImageInner key={requestedSrc} {...props} requestedSrc={requestedSrc} fallback={fallback} />;
}
