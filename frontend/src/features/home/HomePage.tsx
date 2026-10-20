import { ProjectOverview } from "@/features/home/components/ProjectOverview";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { Hero } from "@/features/home/components/Hero";
import { Solutions } from "@/features/home/components/Solutions";
import { content } from "@/features/home/data/content";
import "@/features/home/styles/hero.css";
import "@/features/home/styles/overview.css";

export function HomePage() {
  const copy = content.pt;

  return (
    <div className="ecobyte-home site-shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <HomeHeader />
      <main id="conteudo" tabIndex={-1}>
        <Hero copy={copy.hero} />
        <Solutions copy={copy.solutions} />
        <ProjectOverview />
      </main>
    </div>
  );
}
