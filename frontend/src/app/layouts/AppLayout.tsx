import { useEffect, useRef, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";
import { flushSync } from "react-dom";
import { dashboardTransition } from "@/features/home/domain/dashboardTransition";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/shared/ui/Brand";
import { PageScrollbar } from "@/shared/ui/PageScrollbar";
import { AnalysisProvider } from "@/features/monitoring/providers/AnalysisProvider";

export function AppLayout() {
  const { state, pathname, search } = useLocation();
  const navigate = useNavigate();
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const prepareHome = () => import("@/features/home/HomePage");
  const returnHome = (event: MouseEvent<HTMLElement>) => {
    const link = event.target instanceof Element ? event.target.closest('a[href="/"]') : null;
    if (!link || pathname !== "/dashboard" || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    void (async () => {
      try {
        try { await prepareHome(); } catch { /* The route boundary handles import failures. */ }
        if (!mounted.current) return;
        await dashboardTransition(document, matchMedia("(prefers-reduced-motion: reduce)").matches,
          () => flushSync(() => navigate("/", { state: { dashboardReturn: true } })),
          () => new Promise<void>(resolve => {
            if (document.querySelector(".ecobyte-home main h1, .page-load-error")) { resolve(); return; }
            const finish = () => { observer.disconnect(); clearTimeout(timer); resolve(); };
            const observer = new MutationObserver(() => { if (document.querySelector(".ecobyte-home main h1, .page-load-error")) finish(); });
            const timer = window.setTimeout(finish, 1800);
            observer.observe(document.getElementById("root") ?? document.body, {childList:true, subtree:true});
          }), "home");
      } finally { pending.current = false; }
    })();
  };
  const [entry] = useState(() => state?.homeEntry === "crossfade" ? "crossfade" : state?.homeEntry === "fade" ? "fade" : undefined);
  return <AnalysisProvider>
    <div className="monitoring-shell" data-entry={entry} data-globe-view={new URLSearchParams(search).has("servico") ? "detail" : "overview"}>
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <header className="monitoring-header" onClickCapture={returnHome} onPointerEnter={() => { if (pathname === "/dashboard") void prepareHome().catch(() => {}); }} onFocusCapture={() => { if (pathname === "/dashboard") void prepareHome().catch(() => {}); }}>
        <Brand />
        <Link className="monitoring-home" to="/" aria-label="Voltar ao início"><ArrowLeft size={20} aria-hidden="true" /> <span>Voltar ao início</span></Link>
      </header>
      <main tabIndex={-1} id="main-content" className="monitoring-main"><Outlet /></main>
      {pathname === "/dashboard" && <PageScrollbar />}
    </div>
  </AnalysisProvider>;
}
