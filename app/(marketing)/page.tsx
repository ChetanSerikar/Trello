import Image from "next/image";
import { Button } from "@/components/ui/button"
import HeroSection from "@/components/hero-section";
import Features from "@/components/features-1";


export default function Home() {
  return (
      // <div className="container mt-24">Hi</div>
      <div>
        <HeroSection/>
        <Features/>
      </div>
  );
}
