import './Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, radius = 'sm', className = '' }: SkeletonProps) {
  const style: React.CSSProperties = {
    width,
    height,
    borderRadius:
      radius === 'full' ? '999px' :
      radius === 'lg' ? 'var(--ml-radius-lg)' :
      radius === 'md' ? 'var(--ml-radius-md)' : '4px',
  };
  return <span className={`skel ${className}`} style={style} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="skel-card">
      <Skeleton width={56} height={56} radius="full" />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height={14} />
        <div style={{ marginTop: 8 }}><Skeleton width="40%" height={12} /></div>
      </div>
      <Skeleton width={60} height={24} radius="md" />
    </div>
  );
}
