import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ArrowRight, SlidersHorizontal, X } from "lucide-react";

export function FiltersDialog({ children, onClose, onClear }: { children: ReactNode; onClose: () => void; onClear: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} id="monitoring-filters" className="monitoring-filter-dialog" aria-labelledby="filter-dialog-title" onClose={onClose}>
    <header><div><span className="filter-eyebrow"><SlidersHorizontal size={16} />PERSONALIZE SUA VISÃO</span><h2 id="filter-dialog-title">Filtros e histórico</h2><p>Ajuste o ambiente. Descubra o que importa.</p></div><button type="button" aria-label="Fechar filtros" onClick={() => dialog.current?.close()}><X size={22} aria-hidden="true" /></button></header>
    <div className="filter-dialog-body">{children}</div>
    <footer><button type="button" className="filter-clear-action" onClick={onClear}><X size={15} aria-hidden="true" />Limpar filtros</button><button type="button" onClick={() => dialog.current?.close()}>Ver resultados <ArrowRight size={17} aria-hidden="true" /></button></footer>
  </dialog>;
}
