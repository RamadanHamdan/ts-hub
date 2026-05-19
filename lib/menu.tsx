"use client";
import React from "react";
import { ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, HomeIcon, PenIcon } from "lucide-react"

export type MenuItem = {
    title: string;
    url: string;
    icon: React.ReactNode;
    items?: MenuItem[];
    isActive?: boolean;
}

export type SidebarMenuItem = {
    title: string;
    url: string;
    icon: React.ReactNode;
    items?: SidebarMenuItem[];
    isActive?: boolean;
}

export default function NavMenu() {
    return {
        user: {
            name: "super admin",
            user: "ramadan",
            avatar: "/avatars/shadcn.jpg",
        },
        navMain: [
            {
                title: "Input Reservasi",
                url: "/input-reservasi",
                icon: (
                    <PenIcon />
                ),
            },
            {
                title: "Tracking Reservasi",
                url: "#",
                icon: (
                    <ListIcon />
                ),
            },
            {
                title: "Analytics",
                url: "#",
                icon: (
                    <ChartBarIcon />
                ),
            },
            {
                title: "Projects",
                url: "#",
                icon: (
                    <FolderIcon />
                ),
            },
            {
                title: "Team",
                url: "#",
                icon: (
                    <UsersIcon />
                ),
            },
        ],
        navClouds: [
            {
                title: "Capture",
                icon: (
                    <CameraIcon />
                ),
                isActive: true,
                url: "#",
                items: [
                    {
                        title: "Active Proposals",
                        url: "#",
                    },
                    {
                        title: "Archived",
                        url: "#",
                    },
                ],
            },
            {
                title: "Proposal",
                icon: (
                    <FileTextIcon />
                ),
                url: "#",
                items: [
                    {
                        title: "Active Proposals",
                        url: "#",
                    },
                    {
                        title: "Archived",
                        url: "#",
                    },
                ],
            },
            {
                title: "Prompts",
                icon: (
                    <FileTextIcon />
                ),
                url: "#",
                items: [
                    {
                        title: "Active Proposals",
                        url: "#",
                    },
                    {
                        title: "Archived",
                        url: "#",
                    },
                ],
            },
        ],
        navSecondary: [
            {
                title: "Settings",
                url: "#",
                icon: (
                    <Settings2Icon />
                ),
            },
            {
                title: "Get Help",
                url: "#",
                icon: (
                    <CircleHelpIcon />
                ),
            },
            {
                title: "Search",
                url: "#",
                icon: (
                    <SearchIcon />
                ),
            },
        ],
        documents: [
            {
                name: "Data Library",
                url: "#",
                icon: (
                    <DatabaseIcon />
                ),
            },
            {
                name: "Reports",
                url: "#",
                icon: (
                    <FileChartColumnIcon />
                ),
            },
            {
                name: "Word Assistant",
                url: "#",
                icon: (
                    <FileIcon />
                ),
            },
        ],
    }
}