import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Swords, Gamepad2, Trophy,
  History, LogOut, Shield, Skull, Settings, ScrollText, Gift
} from 'lucide-react';
import clsx from 'clsx';
import { getUserRank } from '../../utils/helpers';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/actividades', label: 'Actividades', icon: Swords },
  { path: '/juegos', label: 'Juegos', icon: Gamepad2 },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/codex', label: 'Codex', icon: ScrollText },
  { path: '/hoyo', label: 'Hoyo de la Verguenza', icon: Skull },
  { path: '/history', label: 'Historial', icon: History },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const rank = getUserRank(user?.recommender_points || 0, user?.override_rank);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-council-darker/80 backdrop-blur-xl border-r border-medieval-gold/[0.08] flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-medieval-gold/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-neon-gold">
            <Shield className="w-5 h-5 text-council-darker" />
          </div>
          <div>
            <h1 className="text-lg font-bold neon-text medieval-display">The Council</h1>
            <p className="text-[10px] text-medieval-gold/40 medieval-text">El Consejo</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-medieval-gold/10 text-medieval-gold shadow-sm'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]',
              path === '/hoyo' && !isActive && 'text-medieval-crimson-light/40 hover:text-medieval-crimson-light/70',
              path === '/hoyo' && isActive && 'bg-medieval-crimson/10 text-medieval-crimson-light',
            )}
          >
            <Icon className="w-4 h-4" />
            <span className={path === '/hoyo' ? 'text-xs' : ''}>{label}</span>
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-2',
              isActive
                ? 'bg-medieval-royal-light/10 text-medieval-royal-light'
                : 'text-medieval-royal-light/40 hover:text-medieval-royal-light/70 hover:bg-white/[0.03]'
            )}
          >
            <Settings className="w-4 h-4" />
            Admin Panel
          </NavLink>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-medieval-gold/[0.08]">
        <NavLink
          to={`/profile/${user?.id}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-medieval-gold/30">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-gold flex items-center justify-center text-xs font-bold text-council-darker">
                {user?.discord_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/80 truncate">{user?.discord_name}</p>
            <p className="text-[9px] text-medieval-gold/30 font-mono uppercase tracking-wider">
              {rank.latin}
            </p>
          </div>
          <span className="text-sm">{rank.emoji}</span>
        </NavLink>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 mt-1 rounded-xl text-sm text-white/30 hover:text-medieval-crimson-light/70 hover:bg-medieval-crimson/5 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesion
        </button>
        <p className="text-center text-[8px] text-white/[0.08] uppercase tracking-[0.2em] font-mono mt-3">
          Hecha por El Viejo
        </p>
      </div>
    </aside>
  );
}
