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
        { label: 'Room Status', href: '/room-status', icon: 'Bed'},
      ],
    },
    {
      title: 'MANAJEMEN',
      icon: 'ShieldCheck',
      items: [
        { label: 'Kelola Users', href: '/users', icon: 'UserCog' },
        { label: 'Parameter', href: '/parameter', icon: 'Settings' },
        { label: 'Kelola Unit', href: '/unit', icon: 'Building'}
      ],
    },
  ],
  admin: [
    {
      title: 'RESERVASI',
      icon: 'Calendar',
      items: [
        { label: 'Input Reservasi', href: '/input-reservasi', icon: 'Home' },
        { label: 'Room Status', href: '/room-status', icon: 'Bed'},
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