export type Role = "super_admin" | "admin" | "tamu";

export type MenuItem = {
   label: string;
   href: string;
   icon: string;
};

export type MenuSection = {
    title: string;
    icon: string;
    items: MenuItem[];
};

export const MENUS_BY_ROLE: Record<Role, MenuSection[]> = {
    super_admin: [
        {
            title: "Input Reservasi",
            icon: "Calendar",
            items: [
                { label: "Input Reservasi", href: "/reservasi/input", icon: "Calendar",}
            ]
        }
    ],
}

export function getMenuByRole(role: Role): MenuSection[] {
    return MENUS_BY_ROLE[role] ?? [];
}