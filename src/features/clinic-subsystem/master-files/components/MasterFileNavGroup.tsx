import { ChevronDown, ChevronRight } from 'lucide-react';
import type { MasterFileRouteGroup } from '../masterFileRoutes';

interface Props {
  group: MasterFileRouteGroup;
  currentRoute: string;
  clinicId: string;
  routeBase?: string;
  collapsed: boolean;
  sidebarCollapsed: boolean;
  onToggle: () => void;
  onNavigate: (route: string) => void;
  countByKey: Record<string, number>;
}

export function MasterFileNavGroup({
  group,
  currentRoute,
  clinicId,
  routeBase,
  collapsed,
  sidebarCollapsed,
  onToggle,
  onNavigate,
  countByKey
}: Props) {
  const baseRoute = routeBase || `/clinic/${clinicId}/master-files`;

  return (
    <div className="master-file-nav-group">
      <button
        type="button"
        className="master-file-nav-group__header"
        onClick={onToggle}
        aria-expanded={!collapsed}
        title={sidebarCollapsed ? group.label : undefined}
      >
        <span>{group.label}</span>
        {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
      </button>

      {!collapsed && (
        <div className="master-file-nav-group__items">
          {group.items.map((item) => {
            const Icon = item.icon;
            const route = `${baseRoute}/${item.routeSuffix}`;
            const isActive = currentRoute === route;
            const count = item.countKey ? countByKey[item.countKey] ?? 0 : 0;

            return (
              <button
                key={item.key}
                type="button"
                className={`master-file-nav-group__item ${isActive ? 'active' : ''}`}
                onClick={() => !item.disabled && onNavigate(route)}
                disabled={item.disabled}
                title={item.disabled ? 'Available in a later phase' : undefined}
              >
                <span className="master-file-nav-group__item-main">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </span>
                <span className="master-file-nav-group__count">{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
