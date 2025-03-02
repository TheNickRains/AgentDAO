import React from 'react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Governance Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Active Proposals */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900">Active Proposals</h2>
                <div className="mt-4 space-y-4">
                  {/* Sample Proposal Card */}
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium">Treasury Allocation Q1 2024</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Proposal to allocate funds for Q1 2024 initiatives
                    </p>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-sm text-blue-600">Ends in 2 days</span>
                      <button className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        Vote Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voting History */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900">Your Voting History</h2>
                <div className="mt-4 space-y-4">
                  {/* Sample History Item */}
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium">Protocol Upgrade v2.1</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      You voted: FOR
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm text-gray-500">Voted 3 days ago</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        Passed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 