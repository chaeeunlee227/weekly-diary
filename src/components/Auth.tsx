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
          </div>
        </div>
      </div>
    </div>
  );
}
