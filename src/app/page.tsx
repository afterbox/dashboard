import { FamilySupport } from "@/components/sections/FamilySupport";
import { FillIt } from "@/components/sections/FillIt";
import { FinalScene } from "@/components/sections/FinalScene";
import { Footer } from "@/components/sections/Footer";
import { ForOrganisations } from "@/components/sections/ForOrganisations";
import { GrowsWithYou } from "@/components/sections/GrowsWithYou";
import { Hero } from "@/components/sections/Hero";
import { KitchenTable } from "@/components/sections/KitchenTable";
import { Nav } from "@/components/sections/Nav";
import { SayIt } from "@/components/sections/SayIt";
import { Sealed } from "@/components/sections/Sealed";
import { WhenTheTimeComes } from "@/components/sections/WhenTheTimeComes";

// The landing page: one story, in the order of docs/landing-page-story.md.
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <KitchenTable />
        <FillIt />
        <SayIt />
        <Sealed />
        <GrowsWithYou />
        <WhenTheTimeComes />
        <FamilySupport />
        <ForOrganisations />
        <FinalScene />
      </main>
      <Footer />
    </>
  );
}
