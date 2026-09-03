import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, ClipboardList, Table2, AlertTriangle, Wallet, Star, Clock, Flame } from 'lucide-react';
import api from '../api/client';

const COLORS = ['#f97316', '#0ea5e9', '#22c55e', '#a855f7', '#ef4444', '#eab308'];

// Default menu items
const DEFAULT_MENU_ITEMS = [
  { id: 1, name: 'Butter Chicken', price: 320, rating: 4.8, icon: '🍗', time: '25 min', badge: 'BESTSELLER' },
  { id: 2, name: 'Paneer Tikka', price: 280, rating: 4.7, icon: '🧀', time: '20 min', badge: 'POPULAR' },
  { id: 3, name: 'Biryani', price: 250, rating: 4.9, icon: '🍚', time: '30 min', badge: 'CHEF\'S CHOICE' },
  { id: 4, name: 'Masala Dosa', price: 180, rating: 4.6, icon: '🥘', time: '15 min', badge: null },
  { id: 5, name: 'Samosas', price: 80, rating: 4.5, icon: '🥟', time: '10 min', badge: 'QUICK' },
  { id: 6, name: 'Gulab Jamun', price: 120, rating: 4.8, icon: '🍮', time: '5 min', badge: 'SWEET' },
];

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'North Indian', icon: '🥘', count: 24 },
  { id: 2, name: 'South Indian', icon: '🍚', count: 18 },
  { id: 3, name: 'Breads', icon: '🍞', count: 12 },
  { id: 4, name: 'Desserts', icon: '🍮', count: 14 },
];

const DEFAULT_RECIPES = [
  { id: 1, name: 'Butter Chicken', ingredients: 12, servings: 4, difficulty: 'Medium', time: 45 },
  { id: 2, name: 'Paneer Tikka', ingredients: 8, servings: 4, difficulty: 'Easy', time: 30 },
  { id: 3, name: 'Biryani', ingredients: 15, servings: 6, difficulty: 'Hard', time: 90 },
];

const DEFAULT_INGREDIENTS = [
  { id: 1, name: 'Tomatoes', stock: 45, unit: 'kg', reorder: 20, status: 'Good' },
  { id: 2, name: 'Onions', stock: 32, unit: 'kg', reorder: 15, status: 'Good' },
  { id: 3, name: 'Paneer', stock: 12, unit: 'kg', reorder: 10, status: 'Medium' },
  { id: 4, name: 'Ginger', stock: 8, unit: 'kg', reorder: 5, status: 'Good' },
];

const DEFAULT_SUPPLIERS = [
  { id: 1, name: 'Fresh Farms', location: 'Mumbai', rating: 4.8, orders: 156 },
  { id: 2, name: 'Daily Produce', location: 'Bangalore', rating: 4.6, orders: 98 },
  { id: 3, name: 'Quality Spices', location: 'Delhi', rating: 4.9, orders: 203 },
];

function StatCard({ icon: Icon, label, value, sub, gradient }) {
  const gradients = {
    orange: 'from-orange-500 to-red-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
  };

  return (
    <div className={`bg-gradient-to-br ${gradients[gradient] || gradients.orange} rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition`}>
      <div className="flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-lg backdrop-blur">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium opacity-90">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
      {sub && <p className="text-xs opacity-80 mt-2">{sub}</p>}
    </div>
  );
}

function MenuCard({ item }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition group">
      <div className="relative bg-gradient-to-br from-orange-100 to-red-100 h-32 flex items-center justify-center text-5xl">
        {item.icon}
        {item.badge && (
          <span className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {item.badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 group-hover:text-orange-600 transition">{item.name}</h3>
        <div className="flex items-center gap-2 my-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium text-gray-700">{item.rating}</span>
          <Clock className="w-4 h-4 text-gray-400 ml-auto" />
          <span className="text-xs text-gray-600">{item.time}</span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-gray-900">₹{item.price}</p>
          <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm hover:shadow-lg transition">
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard'));
  }, []);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6 text-ink-400">Loading dashboard…</div>;

  const salesSeries = data.salesOverview.map((d) => ({
    date: new Date(d.day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    total: parseFloat(d.total),
  }));

  const expenseSeries = data.monthlyExpenses.map((d) => ({
    month: new Date(d.month).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
    total: parseFloat(d.total),
  }));

  const profit = data.profitOverview;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your restaurant overview.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={Wallet} label="30-Day Revenue" value={`₹${profit.revenue.toLocaleString('en-IN')}`} gradient="orange" />
          <StatCard icon={profit.profit >= 0 ? TrendingUp : TrendingDown} label="30-Day Profit" value={`₹${profit.profit.toLocaleString('en-IN')}`} sub={`Margin: ${profit.marginPct}%`} gradient="green" />
          <StatCard icon={ClipboardList} label="Active Orders" value={data.activeOrders.reduce((s, o) => s + parseInt(o.count), 0)} gradient="blue" />
          <StatCard icon={AlertTriangle} label="Low Stock Items" value={data.lowStockItems.length} gradient="purple" />
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <h2 className="font-bold text-gray-900 mb-5 text-lg">Sales Overview (14 days)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={salesSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#666" />
                <YAxis tick={{ fontSize: 12 }} stroke="#666" />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <h2 className="font-bold text-gray-900 mb-5 text-lg">Monthly Expenses</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={expenseSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#666" />
                <YAxis tick={{ fontSize: 12 }} stroke="#666" />
                <Tooltip />
                <Bar dataKey="total" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Menu Items Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🍽️ Today's Featured Menu</h2>
            <p className="text-gray-600">Popular dishes your customers love</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {DEFAULT_MENU_ITEMS.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Four Column Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Menu Categories */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <h2 className="font-bold text-gray-900 mb-4">Menu Categories</h2>
            <div className="space-y-3">
              {DEFAULT_CATEGORIES.map((cat) => (
                <div key={cat.id} className="flex items-center gap-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg hover:from-orange-100 hover:to-red-100 transition">
                  <span className="text-3xl">{cat.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{cat.name}</p>
                    <p className="text-xs text-gray-600">{cat.count} items</p>
                  </div>
                  <button className="text-orange-600 hover:text-orange-700 font-medium text-sm">Edit</button>
                </div>
              ))}
            </div>
          </div>

          {/* Table Occupancy */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-4"><Table2 className="w-5 h-5 text-orange-600" /><h2 className="font-bold text-gray-900">Table Occupancy</h2></div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.tableOccupancy} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                  {data.tableOccupancy.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recipe & Ingredient Management */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <h2 className="font-bold text-gray-900 mb-4">📖 Recipe Management</h2>
            <div className="space-y-3">
              {DEFAULT_RECIPES.map((recipe) => (
                <div key={recipe.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{recipe.name}</p>
                    <p className="text-xs text-gray-600">{recipe.ingredients} ingredients • {recipe.servings} servings</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold px-2 py-1 rounded ${recipe.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : recipe.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {recipe.difficulty}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{recipe.time} min</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <h2 className="font-bold text-gray-900 mb-4">🥘 Ingredient Management</h2>
            <div className="space-y-3">
              {DEFAULT_INGREDIENTS.map((ing) => (
                <div key={ing.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg hover:shadow-md transition">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{ing.name}</p>
                    <p className="text-xs text-gray-600">{ing.stock}/{ing.reorder} {ing.unit}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${ing.status === 'Good' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {ing.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Supplier & Stock Management */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <h2 className="font-bold text-gray-900 mb-4">🚚 Supplier Management</h2>
            <div className="space-y-3">
              {DEFAULT_SUPPLIERS.map((supplier) => (
                <div key={supplier.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:shadow-md transition">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{supplier.name}</p>
                    <p className="text-xs text-gray-600">{supplier.location}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{supplier.rating}</span>
                    </div>
                    <p className="text-xs text-gray-600">{supplier.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <h2 className="font-bold text-gray-900 mb-4">⚠️ Low Stock Items</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-sm text-gray-600">All ingredients are stocked above reorder level.</p>
                </div>
              ) : (
                data.lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-gray-700 font-medium">{item.name}</span>
                    <span className="text-red-600 font-bold text-xs">{item.current_stock} / {item.reorder_level}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Additional Summaries */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <h2 className="font-bold text-gray-900 mb-4">📊 Purchase Summary</h2>
            <div className="space-y-3">
              {data.purchaseSummary.map((p) => (
                <div key={p.status} className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg hover:shadow-md transition">
                  <span className="capitalize font-semibold text-gray-800">{p.status}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{p.count} orders</p>
                    <p className="text-xs text-gray-600">₹{parseFloat(p.total).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
            <h2 className="font-bold text-gray-900 mb-4">🤝 Supplier Summary</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.supplierSummary.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-green-50 rounded-lg hover:shadow-md transition">
                  <span className="text-gray-700 font-semibold">{s.name}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{s.orders_count} POs</p>
                    <p className="text-xs text-gray-600">₹{parseFloat(s.total_spent).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
