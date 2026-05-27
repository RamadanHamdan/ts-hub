export type Role = 'super_admin' | 'admin' | 'user'

export type MenuItem = {
  label: string
  href: string
  icon: string
}

export type MenuSection = {
  title: string
  icon: string
  items: MenuItem[]
}

export const MENUS_BY_ROLE: Record<Role, MenuSection[]> = {
  super_admin: [
    {
      title: 'DASHBOARD',
      icon: 'LayoutDashboard',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
      ],
    },
    {
      title: 'RESERVASI',
      icon: 'Calendar',
      items: [
        { label: 'Input Reservasi', href: '/input-reservasi', icon: 'CalendarPlus' },
        { label: 'Tracking Reservasi', href: '/tracking-reservasi', icon: 'BarChart3' },
      ],
    },
    {
      title: 'USER MANAGEMENT',
      icon: 'Users',
      items: [
        { label: 'Kelola Users', href: '/users', icon: 'UserCog' },
      ],
    },
  ],
  admin: [
    {
      title: 'RESERVASI',
      icon: 'Calendar',
      items: [
        { label: 'Input Reservasi', href: '/input-reservasi', icon: 'CalendarPlus' },
        { label: 'Tracking Reservasi', href: '/tracking-reservasi', icon: 'BarChart3' },
      ],
    },
  ],
  user: [
    {
      title: 'DASHBOARD',
      icon: 'LayoutDashboard',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
      ],
    },
  ],
}

export function getMenuByRole(role: Role): MenuSection[] {
  return MENUS_BY_ROLE[role] ?? []
}