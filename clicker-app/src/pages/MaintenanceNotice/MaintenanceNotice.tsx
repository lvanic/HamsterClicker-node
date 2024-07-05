import React from 'react';

const MaintenanceNotice: React.FC = () => {
  return (
    <div className="bg-yellow-200 border-l-4 border-yellow-500 p-4 rounded-lg shadow-md">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-yellow-800">Технические работы в процессе</p>
          <p className="text-sm text-yellow-700">Извините за временные неудобства, наш сайт находится на обслуживании.</p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceNotice;
