import Image from "next/image";
import Sidebar from "@/src/components/sidebar";

export default function Home() {
  return (
    <>
      <div className="flex">
        <Sidebar />
      </div>
    </>
  );
}
