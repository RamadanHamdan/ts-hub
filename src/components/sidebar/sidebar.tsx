"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/src/components/session/SessionProvider";
import * as Icons from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setisOpen] = useState(false);

    // swipe gestur tracking
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const [openSections, setOpenSections] = useState<Record<string, boolean>>(
        () => {
            if (typeof window !== "undefined") {
                try {
                    const saved = localStorage.getItem("sidebarAccordionState");
                    if (saved) return JSON.parse(saved);
                } catch (e) { }
            }
            return {};
        },
    );

    const toogleSection = (e: React.MouseEvent, title: string) => {
        e.stopPropagation();
        setOpenSections((prev) => {
            const newState = { ...prev, [title]: prev[title] === false };
            try {
                localStorage.setItem("sidebarAccordionState", JSON.stringify(newState));
            } catch (err) {
                console.error(err);
            }
            return newState;
        });
    };
}