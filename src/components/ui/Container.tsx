import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  isWide?: boolean; 
  className?: string;
}

export function Container({ children, isWide = false, className = '' }: ContainerProps) {
  return (
    <div 
      // Changed max-w-[1600px] to max-w-[100rem] so it scales perfectly with font-size changes
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${
        isWide ? 'max-w-[100rem]' : 'max-w-7xl'
      } ${className}`}
    >
      {children}
    </div>
  );
}