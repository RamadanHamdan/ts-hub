"use client";

import * as React from "react"
import { useState } from "react"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ListIcon, HomeIcon, PenIcon, Calendar, CheckIcon, Search } from "lucide-react"
import SearchableSelect from '@/components/ui/SearchableSelect'
import Link from "next/link"

import { SidebarProvider } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header";
import { Separator } from "@radix-ui/react-separator";
import { Select } from "@radix-ui/react-select";

const dataKamar = [
    { value: "TD.1134", label: "TD.1134" },
    { value: "TB.1534", label: "TB.1534" },
    { value: "TA.2118", label: "TA.2118" },
    { value: "TA.0812", label: "TA.0812" },
    { value: "TC.0826", label: "TC.0826" },
    { value: "TA.0933", label: "TA.0933" },
    { value: "TC.1608", label: "TC.1608" },
    { value: "TC.0630", label: "TC.0630" },
    { value: "TA.0931", label: "TA.0931" },
    { value: "TA.0932", label: "TA.0932" },
    { value: "TB.1728", label: "TB.1728" },
    { value: "TB.0919", label: "TB.0919" },
    { value: "TC.1727", label: "TC.1727" },
    { value: "TD.1028", label: "TD.1028" },
    { value: "TD.2126", label: "TD.2126" },
    { value: "TA.1126", label: "TA.1126" },
    { value: "TC.0507", label: "TC.0507" },
    { value: "TD.1134", label: "TD.1134" },
    { value: "TC.1727", label: "TC.1727" },
    { value: "TC.0826", label: "TC.0826" },
    { value: "TD.1028", label: "TD.1028" },
    { value: "TB.0919", label: "TB.0919" },
    { value: "GAA TB.0508", label: "GAA TB.0508" },
    { value: "GAA TC.0528", label: "GAA TC.0528" },
    { value: "GAA TB.0622", label: "GAA TB.0622" },
    { value: "GAA TB.0510", label: "GAA TB.0510" },
    { value: "TB.0510 GAA", label: "TB.0510 GAA" },
    { value: "TB.0508 GAA", label: "TB.0508 GAA" },
    { value: "TC.0528 GAA", label: "TC.0528 GAA" },
]

const dataDuration = [
    { value: "1 Malam", label: "1 Malam" },
    { value: "Halfday Malam", label: "Halfday Malam" },
    { value: "Transit", label: "Transit" },
    { value: "Extend", label: "Extend" },
]

const data = {
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
                <ListIcon
                />
            ),
        },
    ],
    documents: [],
    navSecondary: [],
}


export default function InputReservasiPage() {

    const [tipeKamar, setTipeKamar] = useState("");
    const [typeDuration, setTypeDuration] = useState("");

    return (
        <SidebarProvider
            className="h-screen pl-2 px-2 py-1.5"
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 60)",
                    "--header-height": "calc(var(--spacing) * 12)",
                }
            }

        >
            <AppSidebar variant="inset" />
            <SidebarInset
                className=''>
                <SiteHeader />
                <div className="flex h-full overflow-hidden max-h-screen">
                    <section className="mt-4 rounded-2xl bg-white p-8">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                            <div className="flex flex-col px-4 py-2">
                                <label className="text-sm font-medium">
                                    Nama Tamu
                                </label>
                                <Input type="text" placeholder="Nama Tamu" className="mt-1 rounded-xl px-4 min-h-11" />
                            </div>
                            <div className="flex flex-col px-4 py-2">
                                <label className="text-sm font-medium">
                                    Tipe Kamar
                                </label>
                                <SearchableSelect
                                    value={tipeKamar}
                                    onChange={(value) => setTipeKamar(value)}
                                    options={dataKamar}
                                    className="mt-1"
                                />
                            </div>
                            <div className='flex flex-col px-4 py-2'>
                                <label htmlFor="" className="text-sm font-medium">
                                    Duration
                                </label>
                                <SearchableSelect
                                    value={typeDuration}
                                    onChange={(value) => setTypeDuration(value)}
                                    options={dataDuration}
                                    className="mt-1"
                                />
                            </div>
                            <div className='flex flex-col px-4 py-2'>
                                <label htmlFor="" className="text-sm font-medium">
                                    Check In
                                </label>
                                <Input type="date" placeholder="Check In" className="mt-1 rounded-xl px-4 min-h-11" />
                            </div>
                            <div className='flex flex-col px-4 py-2'>
                                <label htmlFor="" className="text-sm font-medium">
                                    Check Out
                                </label>
                                <Input type="date" placeholder="Check Out" className="mt-1 rounded-xl px-4 min-h-11" />
                            </div>
                            <div className='flex flex-col px-4 py-2'>
                                <label htmlFor="" className="text-sm font-medium">
                                    Harga
                                </label>
                                <Input type="number" placeholder="Harga" className="mt-1 rounded-xl px-4 min-h-11" />
                            </div>
                            <div className='flex flex-col px-4 py-2'>
                                <label htmlFor="" className="text-sm font-medium">
                                    Uang Masuk
                                </label>
                                <Input type="number" placeholder="Uang Masuk" className="mt-1 rounded-xl px-4 min-h-11" />
                            </div>
                            <div className='flex flex-col px-4 py-2'>
                                <label htmlFor="" className="text-sm font-medium">
                                    Sisa Pembayaran
                                </label>
                                <Input type="number" placeholder="Harga" className="mt-1 rounded-xl px-4 min-h-11" />
                            </div>
                            <div className='flex flex-col px-4 py-2'>
                                <label htmlFor="" className="text-sm font-medium">
                                    Note Pelunasan
                                </label>
                                <Input type="text" placeholder="Harga" className="mt-1 rounded-xl px-4 min-h-11" />
                            </div>
                            <div className='flex flex-col px-4 py-2'>
                                <label htmlFor="" className="text-sm font-medium">
                                    Note Tamu / Note Admin
                                </label>
                                <Input type="text" placeholder="Harga" className="mt-1 rounded-xl px-4 min-h-11" />
                            </div>
                            <div className='flex flex-col px-4 py-2'>
                                <label htmlFor="" className="text-sm font-medium">
                                    Apart
                                </label>
                                <Input type="text" placeholder="Harga" className="mt-1 rounded-xl px-4 min-h-11" />
                            </div>
                        </div>
                    </section>
                </div>
            </SidebarInset>
            <Sidebar collapsible="offcanvas" className="bg-white">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                className="data-[slot=sidebar-menu-button]:p-1.5!"
                            >
                                <Link href="/">
                                    <HomeIcon className="size-5!" />
                                    <span className="text-base font-semibold">Tempat Singgah</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent>
                    <NavMain items={data.navMain} />
                    <NavDocuments items={data.documents} />
                    <NavSecondary items={data.navSecondary} className="mt-auto" />
                </SidebarContent>
                <SidebarFooter>
                    <NavUser user={data.user} />
                </SidebarFooter>
            </Sidebar>
        </SidebarProvider >
    )
}
