'use client';

import React from 'react';

export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Tailwind Test Page</h1>
        <p className="text-gray-600 mb-4">This page tests if Tailwind CSS is working correctly.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-100 p-4 rounded-lg text-red-800">Red Box</div>
          <div className="bg-green-100 p-4 rounded-lg text-green-800">Green Box</div>
          <div className="bg-blue-100 p-4 rounded-lg text-blue-800">Blue Box</div>
          <div className="bg-yellow-100 p-4 rounded-lg text-yellow-800">Yellow Box</div>
        </div>
        <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Test Button
        </button>
      </div>
    </div>
  );
} 