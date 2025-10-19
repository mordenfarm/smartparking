import React from 'react';

const Header = () => (
  <header className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-white tracking-wider animate-shine bg-[linear-gradient(110deg,#a5b4fc,45%,#f9a8d4,55%,#a5b4fc)] bg-[length:250%_100%] bg-clip-text text-transparent">
        SmartPark
      </h1>
      <p className="text-gray-300 text-sm italic">get there and park smart</p>
    </div>
    <style>{`
      @keyframes shine {
        to {
          background-position-x: -250%;
        }
      }
      .animate-shine {
        animation: shine 5s linear infinite;
      }
    `}</style>
  </header>
);

export default Header;