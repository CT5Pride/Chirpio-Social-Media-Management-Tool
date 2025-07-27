'use client';

import { useEffect, useState } from 'react';

export default function ConfirmationPage() {
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success) {
      setStatus(`✅ ${success}`);
    } else if (error) {
      setStatus(`❌ Error: ${error}`);
    } else {
      setStatus('No status provided');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Chirpio Backend</h1>
          <p className="text-gray-600 mb-6">Backend API Status</p>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-900">{status}</p>
          </div>

          <div className="space-y-4 text-left">
            <h2 className="text-lg font-semibold text-gray-900">Available Endpoints:</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• <code className="bg-gray-100 px-2 py-1 rounded">GET /api/oauth/facebook/callback</code></li>
              <li>• <code className="bg-gray-100 px-2 py-1 rounded">POST /api/ai-suggest</code></li>
              <li>• <code className="bg-gray-100 px-2 py-1 rounded">POST /api/post/create</code></li>
              <li>• <code className="bg-gray-100 px-2 py-1 rounded">DELETE /api/oauth/facebook/disconnect</code></li>
            </ul>
          </div>

          <div className="mt-6">
            <a 
              href="/dashboard" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 