"use client";

import { lazy, Suspense, type ComponentType } from "react";

/**
 * The scripted part of every section below the fold, loaded after the hero.
 *
 * Each section's words and placeholder art are in the page's HTML, at their
 * final size, and its stylesheet loads with the page (the section imports it,
 * not the stage). What waits is only the script that makes a section move:
 * it is fetched once the hero is awake and the browser has a quiet moment,
 * and each section then wakes up on its own.
 *
 * Measured on the production build (a phone, CPU four times slower, slow and
 * fast 4G): today the hero wakes at the same moment with or without this,
 * because the fonts and React weigh far more than these scripts do. It is
 * here for what comes next. Once the scenes carry real illustration runtimes
 * (Rive or Lottie), load those through here too and the hero stays light.
 *
 * Two things to know:
 * - React writes each of these sections at the end of the HTML and moves it
 *   into place with a line of inline script as it arrives. That is how it
 *   streams large boundaries. The page is briefly shorter than it will be,
 *   which is why StartAtTop holds a link's place until it has settled.
 * - `next/dynamic` was tried first and measured slower: with the page
 *   rendered on the server it fetches every part straight away, puts no
 *   boundary round it, and adds a blocking stylesheet request for each.
 *
 * To go back to loading everything with the page, export each part straight
 * from its file here (`export { SealedStage } from "./sealed/SealedStage"`).
 */

/** Settles once the hero has had the first of everything. On the server, at once. */
const afterHero: Promise<void> =
  typeof window === "undefined"
    ? Promise.resolve()
    : new Promise((resolve) => {
        // React wakes the hero first, in back-to-back tasks; the first idle moment comes after that.
        if ("requestIdleCallback" in window) window.requestIdleCallback(() => resolve(), { timeout: 2000 });
        // Safari has no idle callback: give the hero a moment, then go.
        else setTimeout(resolve, 300);
      });

/** A client component whose script is fetched after the hero's. Its server-rendered HTML stands in until then. */
function later<Props extends object>(load: () => Promise<ComponentType<Props>>) {
  const Scripted = lazy(async () => {
    await afterHero;
    return { default: await load() };
  }) as unknown as ComponentType<Props>;

  return function Later(props: Props) {
    return (
      // Its own boundary, so the hero never waits for it.
      <Suspense fallback={null}>
        <Scripted {...props} />
      </Suspense>
    );
  };
}

// 2. The kitchen table.
export const KitchenStage = later(() => import("./kitchen-table/KitchenStage").then((m) => m.KitchenStage));
export const SearchBar = later(() => import("./kitchen-table/SearchBar").then((m) => m.SearchBar));

// 3. Fill it, a little at a time.
export const FillStage = later(() => import("./fill-it/FillStage").then((m) => m.FillStage));
export const HandOffNote = later(() => import("./fill-it/HandOffNote").then((m) => m.HandOffNote));

// 4. Say it, for later.
export const SayStage = later(() => import("./say-it/SayStage").then((m) => m.SayStage));

// 5. Sealed. Even from us.
export const SealedStage = later(() => import("./sealed/SealedStage").then((m) => m.SealedStage));

// 6. It grows with you.
export const GrowsStage = later(() => import("./grows/GrowsStage").then((m) => m.GrowsStage));

// 7. When the time comes.
export const OpeningScene = later(() => import("./opening/OpeningScene").then((m) => m.OpeningScene));

// 8. For families, right now.
export const Asked = later(() => import("./families/Asked").then((m) => m.Asked));

// 9. Give it to your people.
export const OrgPanel = later(() => import("./organisations/OrgPanel").then((m) => m.OrgPanel));

// 10. The final scene.
export const FinalStage = later(() => import("./closing/FinalStage").then((m) => m.FinalStage));
