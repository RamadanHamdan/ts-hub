"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InputReservasiPage() {
    return (
        <div className="p-4">
            <div className="flex gap-2">
                <Input placeholder="Email" />
                <Button>Submit</Button>
            </div>
        </div>
    );
}
