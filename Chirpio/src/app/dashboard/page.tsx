'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface SocialAccount {
  id: string;
  user_id: string;
  platform: string;
  access_token: string;
  profile_data?: any;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [facebookAccount, setFacebookAccount] = useState<SocialAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    checkUser();
    checkFacebookConnection();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const checkFacebookConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'facebook')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching Facebook account:', error);
      } else if (data) {
        setFacebookAccount(data);
      }
    } catch (error) {
      console.error('Error checking Facebook connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectFacebook = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!,
      redirect_uri: process.env.NEXT_PUBLIC_FACEBOOK_REDIRECT_URI!,
      scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,publish_to_groups',
      response_type: 'code',
    });

    window.location.href = `https://www.facebook.com/v17.0/dialog/oauth?${params.toString()}`;
  };

  const disconnectFacebook = async () => {
    if (!facebookAccount) return;

    setDisconnecting(true);
    try {
      const response = await fetch('/api/oauth/facebook/disconnect', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect');
      }

      setFacebookAccount(null);
    } catch (error) {
      console.error('Error disconnecting Facebook:', error);
      alert('Failed to disconnect Facebook account');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <p className="text-gray-600">You need to be logged in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your social media connections</p>
        </div>

        {/* Facebook Connection Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Facebook</h3>
                <p className="text-sm text-gray-500">
                  {facebookAccount ? 'Connected to Facebook' : 'Connect your Facebook account'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              {facebookAccount ? (
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Connected
                  </span>
                  <button
                    onClick={disconnectFacebook}
                    disabled={disconnecting}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectFacebook}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Connect Facebook
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('success') === 'facebook_connected' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Facebook account connected successfully!
                </p>
              </div>
            </div>
          </div>
        )}

        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('error') && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  Error: {new URLSearchParams(window.location.search).get('error')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 