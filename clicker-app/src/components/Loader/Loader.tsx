import React from 'react';
import './Loader.css';

const Loader: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center">
      <div className="loader"></div>
    </div>
  );
};

export default Loader;
