import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col h-screen">
      <Navbar />
      <section className="h-full">
      <Sidebar />
      </section>
    </main>
  );
}
