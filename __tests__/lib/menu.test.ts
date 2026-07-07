import { getMenuByRole, MENUS_BY_ROLE, Role } from '@/lib/menu'

describe('Menu Utils', () => {
  describe('getMenuByRole', () => {
    it('should return super_admin menu items', () => {
      const menus = getMenuByRole('super_admin')
      expect(menus).toEqual(MENUS_BY_ROLE['super_admin'])
      expect(menus.some(m => m.title === 'MANAJEMEN')).toBe(true)
    })

    it('should return admin menu items', () => {
      const menus = getMenuByRole('admin')
      expect(menus).toEqual(MENUS_BY_ROLE['admin'])
      expect(menus.some(m => m.title === 'RESERVASI')).toBe(true)
      expect(menus.some(m => m.title === 'MANAJEMEN')).toBe(false)
    })

    it('should return user menu items', () => {
      const menus = getMenuByRole('user')
      expect(menus).toEqual(MENUS_BY_ROLE['user'])
      expect(menus.some(m => m.title === 'DASHBOARD')).toBe(true)
    })

    it('should return empty array for unknown role', () => {
      // Use type assertion to test runtime behavior for unknown roles
      const menus = getMenuByRole('unknown' as Role)
      expect(menus).toEqual([])
    })
  })
})
