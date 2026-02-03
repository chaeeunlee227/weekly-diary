// Authentication component for login/signup
import { useState, useEffect } from 'react';
import { auth, isSupabaseConfigured } from '../lib/supabase';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is already logged in
    auth.getCurrentUser().then(setUser);

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await auth.signUp(email, password);
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { data, error } = await auth.signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'discord' | 'facebook' | 'twitter') => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await auth.signInWithOAuth(provider);
      if (error) throw error;
      // OAuth will redirect, so we don't need to do anything else here
    } catch (err: any) {
      setError(err.message || 'An error occurred during OAuth sign-in');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    setUser(null);
  };

  // Show configuration message if Supabase isn't set up
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-md mx-auto">
          <div className="bg-gray-50 border-b sticky top-0 z-10">
            <div className="px-4 py-4">
              <h1 className="text-center mb-3">Weekly Diary</h1>
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="font-semibold mb-4">Database Setup Required</h2>
              <div className="text-sm text-gray-600 space-y-3">
                <p>To use authentication and save your diary entries, you need to configure Supabase.</p>
                <div>
                  <p className="font-medium mb-2">Steps to set up:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Create a Supabase account at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a></li>
                    <li>Create a new project</li>
                    <li>Run the SQL schema from <code className="bg-gray-100 px-1 rounded text-xs">DATABASE_SETUP.md</code></li>
                    <li>Get your project URL and anon key from Settings → API</li>
                    <li>Create a <code className="bg-gray-100 px-1 rounded text-xs">.env.local</code> file with:</li>
                  </ol>
                </div>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                  VITE_SUPABASE_URL=your-project-url<br/>
                  VITE_SUPABASE_ANON_KEY=your-anon-key
                </div>
                <p className="text-xs text-gray-500">
                  See <code className="bg-gray-100 px-1 rounded">IMPLEMENTATION_STEPS.md</code> for detailed instructions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header - matching app style */}
        <div className="bg-gray-50 border-b sticky top-0 z-10">
          <div className="px-4 py-4">
            <h1 className="text-center mb-3">Weekly Diary</h1>
          </div>
        </div>

        {/* Auth Form */}
        <div className="px-4 py-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="font-semibold mb-4 text-center">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
              
              {message && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  {message}
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
              
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>

            {/* OAuth Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div>
              <button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
