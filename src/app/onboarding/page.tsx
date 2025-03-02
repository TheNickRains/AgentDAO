import React from 'react';
import Link from 'next/link';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to DAO Governance
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose how you'd like to get started
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {/* Web3 Native Card */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-medium text-gray-900">Web3 Native</h3>
            <p className="mt-2 text-sm text-gray-500">
              Connect your existing wallet and start participating in governance
            </p>
            <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
              Connect Wallet
            </button>
          </div>

          {/* Email Only Card */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-medium text-gray-900">Email Only</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started with just your email - we'll create a wallet for you
            </p>
            <form className="mt-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Get Started
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Already have an account? Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 