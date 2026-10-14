import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style, ...props }) => {
  return (
    <div
      className={`agri-shimmer rounded-xl ${className}`}
      style={style}
      {...props}
    />
  );
};

export const SkeletonCircle: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = '' }) => {
  return (
    <div
      className={`agri-shimmer rounded-full shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}> = ({ lines = 1, className = '', lastLineWidth = '70%' }) => {
  return (
    <div className={`space-y-2 w-full ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className="agri-shimmer h-3.5 rounded-md"
          style={{
            width: idx === lines - 1 && lines > 1 ? lastLineWidth : '100%',
          }}
        />
      ))}
    </div>
  );
};

export const SkeletonBadge: React.FC<{ width?: string | number; height?: number; className?: string }> = ({
  width = '80px',
  height = 24,
  className = '',
}) => {
  return (
    <div
      className={`agri-shimmer rounded-full ${className}`}
      style={{ width, height }}
    />
  );
};
