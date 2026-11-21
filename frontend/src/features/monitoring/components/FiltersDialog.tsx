import { useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { SitePreloadingContext } from "@/shared/ui/sitePreloadingContext";
import { ArrowRight, SlidersHorizontal, X } from "lucide-react";

export function FiltersDialog({ children, onClose, onClear }: { children: ReactNode; onClose: () => void; onClear: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const preloading = useContext(SitePreloadingContext);
  useEffect(() => {
    if (preloading) return;
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, [preloading]);
  return <dialog ref={dialog} id="monitoring-filters" className="monitoring-filter-dialog" aria-labelledby="filter-dialog-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><div><span className="filter-eyebrow"><SlidersHorizontal size={16} />PERSONALIZE SUA VISÃO</span><h2 id="filter-dialog-title">Filtros e histórico</h2><p>Ajuste o ambiente. Descubra o que importa.</p></div><button type="button" aria-label="Fechar filtros" onClick={onClose}><X size={22} aria-hidden="true" /></button></header>
    <div className="filter-dialog-body">{children}</div>
    <footer><button type="button" className="filter-clear-action" onClick={onClear}><X size={15} aria-hidden="true" />Limpar filtros</button><button type="button" onClick={onClose}>Ver resultados <ArrowRight size={17} aria-hidden="true" /></button></footer>
  </dialog>;
}
