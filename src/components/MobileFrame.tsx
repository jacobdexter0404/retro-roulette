import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col items-center justify-center sm:p-4 overflow-hidden">
      {/* Outer container */}
      <div className="w-full max-w-md h-screen sm:h-[844px] bg-black sm:border sm:border-zinc-800 sm:rounded-2xl flex flex-col relative shadow-2xl overflow-hidden">
        {/* Inner App Content */}
        <div className="flex-1 flex flex-col overflow-y-auto relative min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
};
