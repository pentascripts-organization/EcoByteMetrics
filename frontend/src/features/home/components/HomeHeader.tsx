import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { HomeBrand } from "@/features/home/components/HomeBrand";

export function HomeHeader() {
  return (
    <header className="site-header" aria-label="Cabeçalho principal">
      <HomeBrand />
      <div className="header-actions">
        <Link className="platform-link" to="/dashboard">
          <span>Monitoramento</span>
          <ArrowUpRight size={19} strokeWidth={1.7} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
