import React, { useState, useRef, useEffect } from 'react';
import { HomeIcon, MapIcon, NotificationsIcon, SettingsIcon } from './Icons';
import type { ActiveTab } from '../types';

interface DockProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const tabs: { id: ActiveTab, label: string, icon: React.ReactElement }[] = [
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'map', label: 'Map', icon: <MapIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <NotificationsIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

interface DockItemProps {
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const DockItem = React.forwardRef<HTMLButtonElement, DockItemProps>(
  ({ icon, label, isActive, onClick }, ref) => {
    return (
      <button 
        ref={ref}
        onClick={onClick} 
        className={`relative z-10 flex flex-col items-center justify-center gap-1 w-1/4 h-full transition-all duration-300 focus:outline-none active:scale-90`}
      >
        <div className={`transition-all duration-300 ${isActive ? 'text-cyan-400 text-3xl -translate-y-2' : 'text-gray-400 text-2xl'}`}>{icon}</div>
        <span className={`text-xs font-medium transition-all duration-300 ${isActive ? 'opacity-100 text-white' : 'opacity-0 -translate-y-2'}`}>{label}</span>
      </button>
    );
  }
);


const Dock = ({ activeTab, setActiveTab }: DockProps) => {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [sliderStyle, setSliderStyle] = useState({ width: 0, left: 0, opacity: 0 });

  useEffect(() => {
      // Use a timeout to allow the DOM to update and animations to start before we measure
      const timeoutId = setTimeout(() => {
          const activeIndex = tabs.findIndex(t => t.id === activeTab);
          const activeButton = buttonRefs.current[activeIndex];
          
          if (activeButton) {
              const labelSpan = activeButton.querySelector('span');
              if (labelSpan) {
                  const labelWidth = labelSpan.offsetWidth;
                  const PADDING = 20; // 10px padding on each side
                  const sliderWidth = labelWidth + PADDING;
                  const sliderLeft = activeButton.offsetLeft + (activeButton.offsetWidth - sliderWidth) / 2;

                  setSliderStyle({
                      width: sliderWidth,
                      left: sliderLeft,
                      opacity: 1
                  });
              }
          }
      }, 50); // A small delay is sufficient

      return () => clearTimeout(timeoutId);
  }, [activeTab]);

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-sm z-50 group">
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition duration-300"></div>
      <div className="relative bg-slate-950/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-700">
        <div className="relative flex justify-around items-center h-20 px-2">
          
          {/* Sliding Indicator */}
          <div
            className="absolute top-[calc(50%+8px)] -translate-y-1/2 h-6 rounded-full bg-slate-800/80 border border-slate-700 transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)]"
            style={{
                left: `${sliderStyle.left}px`,
                width: `${sliderStyle.width}px`,
                opacity: sliderStyle.opacity
            }}
          />

          {tabs.map((tab, index) => (
            <DockItem 
              ref={el => buttonRefs.current[index] = el}
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)} 
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Dock;