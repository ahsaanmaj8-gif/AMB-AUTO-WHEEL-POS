import React from "react";

// Loading Spinner
export const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-40">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

// Table Skeleton
export const TableSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Table Header */}
      <div className="h-10 bg-gray-300 rounded mb-4"></div>

      {/* Table Rows */}
      <div className="flex gap-2 mb-3">
        <div className="h-8 bg-gray-200 flex-1 rounded"></div>
        <div className="h-8 bg-gray-200 flex-1 rounded"></div>
        <div className="h-8 bg-gray-200 flex-1 rounded"></div>
        <div className="h-8 bg-gray-200 flex-1 rounded"></div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="h-8 bg-gray-200 flex-1 rounded"></div>
        <div className="h-8 bg-gray-200 flex-1 rounded"></div>
        <div className="h-8 bg-gray-200 flex-1 rounded"></div>
        <div className="h-8 bg-gray-200 flex-1 rounded"></div>
      </div>

      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 flex-1 rounded"></div>
        <div className="h-8 bg-gray-200 flex-1 rounded"></div>
        <div className="h-8 bg-gray-200 flex-1 rounded"></div>
        <div className="h-8 bg-gray-200 flex-1 rounded"></div>
      </div>
    </div>
  );
};

// Card Skeleton
export const CardSkeleton = () => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="bg-white p-4 rounded shadow animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-3"></div>
          <div className="h-8 bg-gray-300 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
};