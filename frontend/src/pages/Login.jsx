import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Zap, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { role: 'Owner', email: 'owner@restaurantos.com', icon: '👨‍💼' },
  { role: 'Manager', email: 'manager@restaurantos.com', icon: '📋' },
  { role: 'Chef', email: 'chef@restaurantos.com', icon: '👨‍🍳' },
  { role: 'Waiter', email: 'waiter@restaurantos.com', icon: '🍽️' },
  { role: 'Cashier', email: 'cashier@restaurantos.com', icon: '💳' },
];

const FEATURES = [
  { icon: TrendingUp, title: 'Real-time Analytics', desc: 'Track sales, expenses & profits' },
  { icon: Users, title: 'Team Management', desc: 'Manage staff & roles efficiently' },
  { icon: Zap, title: 'AI-Powered', desc: 'Smart invoice OCR & insights' },
];

export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('owner@restaurantos.com');
  const [password, setPassword] = useState('Password123!');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Features */}
          <div className="hidden md:block space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-3 rounded-2xl">
                  <ChefHat className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">RestaurantOS</h1>
                  <p className="text-sm text-gray-600">AI-Powered Management</p>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Streamline your restaurant operations with our comprehensive management platform. From inventory to invoicing, we've got you covered.
              </p>
            </div>

            <div className="space-y-4">
              {FEATURES.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white/60 backdrop-blur border border-gray-200 hover:border-orange-300 hover:shadow-lg transition">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 h-fit">
                      <Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6">
              {[
                { num: '500+', label: 'Happy Restaurants' },
                { num: '10M+', label: 'Orders Processed' },
                { num: '99.9%', label: 'Uptime' },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{stat.num}</p>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="space-y-6">
            {/* Welcome Header */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to manage your restaurant</p>
            </div>

            {/* Login Card */}
            <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                    <span>⚠️</span>
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in…
                    </>
                  ) : (
                    <>Sign In</>
                  )}
                </button>
              </form>
            </div>

            {/* Demo Accounts */}
            <div className="bg-white/60 backdrop-blur border border-gray-200 rounded-2xl p-6">
              <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Demo Accounts</p>
              <p className="text-xs text-gray-600 mb-4">Password: Password123!</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => setEmail(acc.email)}
                    className="text-left px-3 py-3 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 hover:border-orange-400 hover:shadow-md transition group"
                  >
                    <span className="text-lg">{acc.icon}</span>
                    <p className="font-semibold text-gray-800 group-hover:text-orange-600 transition">{acc.role}</p>
                    <p className="text-gray-500 text-xs truncate">{acc.email}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
