import { Link, useLocation } from 'react-router';
import { Home, TrendingUp, Lightbulb, User } from 'lucide-react';
import type { CSSProperties } from 'react';

interface BottomNavProps {
  activePath?: string;
  className?: string;
  style?: CSSProperties;
  ariaHidden?: boolean;
}

export function BottomNav({ activePath, className = '', style, ariaHidden = false }: BottomNavProps) {
  const location = useLocation();
  const currentPath = activePath ?? location.pathname;
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/insights', icon: Lightbulb, label: 'Insights' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav
      className={`bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl safe-area-bottom ${className}`}
      style={style}
      aria-hidden={ariaHidden || undefined}
    >
      <div className="max-w-md mx-auto flex justify-around items-center h-[68px] px-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-colors ${
                isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bottom-nav-icon-active' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-0.5">{item.label}</span>
              {isActive && <span className="bottom-nav-active-pill absolute top-1.5 h-1 w-6 rounded-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
