
import React from 'react';

// FIX: Add global declaration for ion-icon web component to allow its use in JSX.
// This definition includes the 'class' attribute, which is standard for web components.
// The namespace is changed to React.JSX to align with modern JSX transforms.
declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      // FIX: Use import('react').HTMLAttributes to correctly reference React's types in a global declaration.
      'ion-icon': import('react').HTMLAttributes<HTMLElement> & {
        name: string;
        class?: string;
      };
    }
  }
}

// FIX: Changed 'className' to 'class' for all icons to comply with web component standards.
export const HomeIcon = ({ className = "w-6 h-6" }) => <ion-icon name="home-outline" class={className}></ion-icon>;
export const MapIcon = ({ className = "w-6 h-6" }) => <ion-icon name="map-outline" class={className}></ion-icon>;
export const NotificationsIcon = ({ className = "w-6 h-6" }) => <ion-icon name="notifications-outline" class={className}></ion-icon>;
export const SettingsIcon = ({ className = "w-6 h-6" }) => <ion-icon name="settings-outline" class={className}></ion-icon>;
export const CarIcon = ({ className = "w-6 h-6" }) => <ion-icon name="car-sport-outline" class={className}></ion-icon>;
export const WalletIcon = ({ className = "w-6 h-6" }) => <ion-icon name="wallet-outline" class={className}></ion-icon>;
export const ClockIcon = ({ className = "w-6 h-6" }) => <ion-icon name="time-outline" class={className}></ion-icon>;
export const CheckmarkCircleIcon = ({ className = "w-6 h-6" }) => <ion-icon name="checkmark-circle-outline" class={className}></ion-icon>;
export const CloseCircleIcon = ({ className = "w-6 h-6" }) => <ion-icon name="close-circle-outline" class={className}></ion-icon>;
export const LocationIcon = ({ className = "w-6 h-6" }) => <ion-icon name="location-outline" class={className}></ion-icon>;
export const TrashIcon = ({ className = "w-6 h-6" }) => <ion-icon name="trash-outline" class={className}></ion-icon>;
export const AddIcon = ({ className = "w-6 h-6" }) => <ion-icon name="add-circle-outline" class={className}></ion-icon>;
export const BarChartIcon = ({ className = "w-6 h-6" }) => <ion-icon name="bar-chart-outline" class={className}></ion-icon>;
export const LineChartIcon = ({ className = "w-6 h-6" }) => <ion-icon name="analytics-outline" class={className}></ion-icon>;
export const LogOutIcon = ({ className = "w-6 h-6" }) => <ion-icon name="log-out-outline" class={className}></ion-icon>;
export const PersonIcon = ({ className = "w-6 h-6" }) => <ion-icon name="person-circle-outline" class={className}></ion-icon>;
export const LayersIcon = ({ className = "w-6 h-6" }) => <ion-icon name="layers-outline" class={className}></ion-icon>;
export const ChevronDownIcon = ({ className = "w-6 h-6" }) => <ion-icon name="chevron-down-outline" class={className}></ion-icon>;
export const LockClosedIcon = ({ className = "w-6 h-6" }) => <ion-icon name="lock-closed-outline" class={className}></ion-icon>;
export const GoogleLogoIcon = ({ className = "w-6 h-6" }) => <ion-icon name="logo-google" class={className}></ion-icon>;
export const CashIcon = ({ className = "w-4 h-4 text-white" }) => <ion-icon name="cash-outline" class={className}></ion-icon>;
export const CalendarIcon = ({ className = "w-4 h-4 text-white" }) => <ion-icon name="calendar-outline" class={className}></ion-icon>;
export const TrendingUpIcon = ({ className = "w-4 h-4 text-white" }) => <ion-icon name="trending-up-outline" class={className}></ion-icon>;
export const ConstructIcon = ({ className = "w-4 h-4 text-white" }) => <ion-icon name="construct-outline" class={className}></ion-icon>;
export const DocumentTextIcon = ({ className = "w-4 h-4 text-white" }) => <ion-icon name="document-text-outline" class={className}></ion-icon>;


export const SpinnerIcon = ({ className = "w-6 h-6" }) => (
  <svg className={`${className} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
