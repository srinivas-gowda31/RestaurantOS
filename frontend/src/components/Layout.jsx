import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ChefHat, LayoutDashboard, Sparkles, ScanLine, LogOut,
  Table, Layers, UtensilsCrossed, BookOpen, Carrot, Truck, Users,
  ClipboardList, Package, Warehouse, ArrowLeftRight, FileText, Tags, Receipt,
} from 'lucide-react';
import { moduleGroups } from '../config/modules';
import { useAuth } from '../context/AuthContext';

const icons = {
  Table, Layers, UtensilsCrossed, BookOpen, Carrot, Truck, Users,
  ClipboardList, Package, Warehouse, ArrowLeftRight, FileText, Tags, Receipt,
};

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive ? 'bg-brand-600 text-white font-medium' : 'text-ink-600 hover:bg-ink-100'
        }`
      }
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-ink-50">
      <aside className="w-64 shrink-0 bg-white border-r border-ink-200 flex flex-col">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-ink-100">
          <div className="bg-brand-600 text-white p-1.5 rounded-lg"><ChefHat className="w-5 h-5" /></div>
          <span className="font-bold text-ink-800">RestaurantOS</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <div className="space-y-1">
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/ai-insights" icon={Sparkles} label="AI Insights" />
            <NavItem to="/invoices" icon={ScanLine} label="AI Invoice Processing" />
          </div>

          {moduleGroups.map((group) => {
            const visibleModules = group.modules.filter((m) => !m.roles || hasRole(...m.roles));
            if (!visibleModules.length) return null;
            return (
              <div key={group.group}>
                <p className="px-3 text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1.5">{group.group}</p>
                <div className="space-y-1">
                  {visibleModules.map((m) => (
                    <NavItem key={m.key} to={`/modules/${m.key}`} icon={icons[m.icon] || Layers} label={m.label} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-ink-100">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-ink-800 truncate">{user?.name}</p>
            <p className="text-xs text-ink-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={handleLogout} className="btn-secondary w-full justify-center">
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
