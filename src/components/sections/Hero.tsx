import { BoxArt } from "./hero/art/BoxArt";
import { HouseArt } from "./hero/art/HouseArt";
import { StreetArt } from "./hero/art/StreetArt";
import { TableArt } from "./hero/art/TableArt";
import { WindowArt } from "./hero/art/WindowArt";
import { HeroScene } from "./hero/HeroScene";

// 1. Hero: "Your life, in the years that follow". The zoom in, from the street to the box.
export function Hero() {
  return (
    <section id="hero" aria-labelledby="hero-headline">
      <HeroScene
        street={<StreetArt />}
        house={<HouseArt />}
        windowFrame={<WindowArt />}
        table={<TableArt />}
        box={<BoxArt />}
      />
    </section>
  );
}
