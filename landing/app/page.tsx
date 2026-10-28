import SebgHero from "@/components/SebgHero";
import Statement from "@/components/Statement";
import RelevoManifesto from "@/components/RelevoManifesto";
import KelvinProcess from "@/components/KelvinProcess";
import SpecSection from "@/components/SpecSection";
import StashTools from "@/components/StashTools";
import HalftoneFooter from "@/components/HalftoneFooter";
import CaptureGallery from "@/components/CaptureGallery";
import WipeBand from "@/components/WipeBand";

export default function Home() {
  return (
    <main>
      <SebgHero />
      <Statement />
      <WipeBand color="rgb(235,225,212)" words="EXTRACT · PRESS · TRANSMUTE" />
      <CaptureGallery />
      <RelevoManifesto />
      <WipeBand color="rgb(225,219,204)" words="CAPTURE · SETTLE · COMPILE · DIFF" />
      <KelvinProcess />
      <WipeBand color="rgb(255,255,255)" words="ZERO VIBES · ZERO SLOP · ALL CRAFT" />
      <SpecSection />
      <WipeBand color="rgb(11,11,11)" words="DOM → DNA → YOUR STACK" />
      <StashTools />
      <HalftoneFooter />
    </main>
  );
}
