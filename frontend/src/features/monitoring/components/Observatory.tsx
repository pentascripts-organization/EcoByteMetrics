import {lazy,Suspense,useEffect,useId,useMemo,useRef,useState} from "react";
import {useSearchParams} from "react-router-dom";
import {Info,Settings2,ChevronLeft,ChevronRight,Layers3,Maximize2,Pause,Play,SlidersHorizontal,X} from "lucide-react";
import {PortalAnalysis} from "./PortalAnalysis";
import {MonitoringTabs} from "./MonitoringTabs";
import type {EvolutionPanelProps} from "./EvolutionPanel";
import {portalColors} from "../domain/portal";
import {temporalModel} from "../domain/temporal";
import {analysisQuery} from "../domain/analysis";
import {formatNumber,formatEmissions,emissionScale,formatRecordedPeriod} from "@/shared/lib/format";
import "../styles/observatory.css";
const Scene=lazy(()=>import("./TemporalScene"));
const colors=portalColors;
const portalTabs=[{value:'intervalo',label:'Intervalo'},{value:'aplicacoes',label:'Aplicações'},{value:'coletas',label:'Valores'},{value:'detalhes',label:'Sobre os dados'}];
const stamp=(t:number)=>new Date(t).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
export default function Observatory({history,services,metric,onMetric,period,onPeriod,mode,onMode,loading,onOpenService,filterControl,collectionEvents=[]}:EvolutionPanelProps){
 const [params,setParams]=useSearchParams();
 const model=useMemo(()=>temporalModel(history,services,metric,mode),[history,services,metric,mode]);
 const scope=analysisQuery(params.toString()).toString();
 const [defaults,setDefaults]=useState({scope,ids:model.lanes.slice(0,5).map(l=>l.service.id)});

 const query=params.toString();
 const chosen=useMemo(()=>new URLSearchParams(query).getAll("faixa").filter(id=>model.lanes.some(l=>l.service.id===id)),[query,model]);
 const ids=chosen.length?chosen:defaults.ids;
 const [narrow,setNarrow]=useState(()=>typeof window!=="undefined"&&window.matchMedia("(max-width:760px)").matches);
 useEffect(()=>{const q=window.matchMedia("(max-width:760px)");const change=()=>setNarrow(q.matches);q.addEventListener("change",change);return()=>q.removeEventListener("change",change);},[]);
 const mobileService=params.get("faixaAtiva");
 const lanes=useMemo(()=>(narrow?[model.lanes.find(l=>l.service.id===mobileService)??model.lanes.find(l=>ids.includes(l.service.id))]:ids.map(id=>model.lanes.find(l=>l.service.id===id))).filter(l=>l!==undefined).slice(0,5),[ids,model,narrow,mobileService]);
 const [flat,setFlat]=useState(()=>typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
 const [failed,setFailed]=useState(false),[playing,setPlaying]=useState(false);
 const [servicesOpen,setServicesOpen]=useState(false);
 const panel=params.get("painel")??"";
 const analysisOpen=portalTabs.some(t=>t.value===panel);
 const modal=servicesOpen?'services':analysisOpen?'analysis':null;
 const dialogId=useId(),displayId=useId();
 const displayPopover=useRef<HTMLDivElement>(null),detailsButton=useRef<HTMLButtonElement>(null);
 const [displayOpen,setDisplayOpen]=useState(false);
 if(defaults.scope!==scope||(!defaults.ids.length&&model.lanes.length)){setDefaults({scope,ids:model.lanes.slice(0,5).map(l=>l.service.id)});setPlaying(false);}
 const dialog=useRef<HTMLDialogElement>(null);
 const requested=Number(params.get("cursor"));
 const pinned=params.has("cursor")?model.timestamps.indexOf(requested):-1;
 const [playIndex,setPlayIndex]=useState(0);
 const index=playing?playIndex:pinned>=0?pinned:Math.max(0,model.timestamps.length-1);
 const active=lanes.find(l=>l.service.id===params.get("faixaAtiva"))??lanes[0];
 const cell=active?.cells[index];
 const scale=emissionScale(Math.max(0,...model.totals.map(p=>p.value??0)));
 const totalScale=emissionScale(model.summary.emissionsG);
 const unit=metric==="energy"?"kWh":scale.unit;
 const value=(n:number|null|undefined)=>metric==="energy"?formatNumber(n??null):formatEmissions(n??null,scale.divisor);
 const update=(values:Record<string,string>)=>{const next=new URLSearchParams(params);for(const [key,v] of Object.entries(values)){if(v)next.set(key,v);else next.delete(key);}setParams(next);};
 const pick=(i:number,id=active?.service.id??"")=>{setPlaying(false);update({cursor:String(model.timestamps[i]??""),faixaAtiva:id});};
 useEffect(()=>{
  if(!playing)return;
  let current=playIndex;
  const timer=setInterval(()=>{current=Math.min(current+1,model.timestamps.length-1);setPlayIndex(current);if(current>=model.timestamps.length-1){setPlaying(false);setParams(previous=>{const next=new URLSearchParams(previous);next.set("cursor",String(model.timestamps[current]));return next;},{replace:true});}},20000/Math.max(1,model.timestamps.length));
  const hide=()=>{if(document.hidden)setPlaying(false);};document.addEventListener("visibilitychange",hide);
  return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",hide);};
 // The starting index is captured only when playback is started.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[playing,model.timestamps]);
 const freeze=()=>{setPlaying(false);return playing?String(model.timestamps[playIndex]??""):params.get("cursor")??"";};
 const openAnalysis=(tab="intervalo")=>{setServicesOpen(false);displayPopover.current?.hidePopover();update({painel:tab,cursor:freeze()});};
 const closeModal=()=>{setServicesOpen(false);if(analysisOpen)update({painel:""});};
 useEffect(()=>{if(!modal)return;const previous=document.activeElement;const element=dialog.current;const fallback=detailsButton.current;displayPopover.current?.hidePopover();element?.showModal();return()=>{element?.close();if(previous instanceof HTMLElement&&previous.isConnected&&previous!==document.body)previous.focus();else fallback?.focus();};},[modal]);
 if(modal&&playing)setPlaying(false);
 const max=Math.max(.0000001,...lanes.flatMap(l=>l.cells.map(c=>c.value??0)));
 const partial=model.summary.emissionCount<model.summary.count;
 const selectionTime=model.timestamps[index];
 return <section className="observatory observatory--focused monitoring-evolution evolution-panel" aria-label="Observatório temporal">
  <header className="observatory-heading">
   <div className="portal-title"><span className="observatory-eyebrow">EVOLUÇÃO DO AMBIENTE</span><h2>Portal temporal<span>.</span></h2><p>{formatRecordedPeriod(model.first,model.last)}</p></div>
   <dl className="observatory-kpis"><div><dt>Energia no período</dt><dd>{formatNumber(model.summary.energyKwh)} <small>kWh</small></dd></div><div><dt>CO₂e no período {partial&&<button className="portal-quality-button" aria-label="Entender cálculo parcial" onClick={()=>openAnalysis('detalhes')}><Info size={13}/><span>Parcial</span></button>}</dt><dd>{formatEmissions(model.summary.emissionsG,totalScale.divisor)} <small>{totalScale.unit}</small></dd></div></dl>
   <div className="observatory-tools"><span onClickCapture={()=>{if(playing)update({cursor:freeze()});}}>{filterControl}</span><div role="group" aria-label="Métrica da evolução">{(['emissions','energy'] as const).map(m=><button aria-pressed={metric===m} key={m} onClick={()=>{setPlaying(false);onMetric(m);}}>{m==='energy'?'Energia':'CO₂e'}</button>)}</div><select aria-label="Período da evolução" value={period} onChange={e=>{setPlaying(false);onPeriod(e.target.value);}}><option value="24h">Até 24 horas</option><option value="7d">Até 7 dias</option></select></div>
  </header>
  {params.has('cursor')&&pinned<0&&<p className="observatory-notice" role="status">Intervalo fora da seleção; exibindo o último disponível.</p>}
  <div className="observatory-workspace"><section className="observatory-stage evolution-chart-panel" aria-label="Anéis temporais dos serviços">
   <div className="observatory-stage-bar"><button onClick={()=>{update({painel:'',cursor:freeze()});setServicesOpen(true);}}><SlidersHorizontal size={15}/>Aplicações · {lanes.length}</button>
    <button popoverTarget={displayId} aria-expanded={displayOpen} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();if(displayPopover.current){displayPopover.current.style.left=`${Math.max(12,Math.min(innerWidth-324,r.right-300))}px`;displayPopover.current.style.top=`${Math.max(16,Math.min(innerHeight-350,r.bottom+8))}px`;}if(playing)update({cursor:freeze()});}}><Settings2 size={15}/>Exibição <span className="portal-display-label">· {mode==='intervals'?'Por intervalo':'Acumulado'} · {flat?'2D':'3D'}</span></button>
   </div>
   {failed&&<p className="observatory-notice" role="status">Visualização 3D indisponível. A vista plana mantém os mesmos dados.</p>}
   {!model.samples.length?<div className="observatory-empty" role="status"><Layers3 size={36}/><h3>{loading?'Aguardando as primeiras coletas':'Nenhum registro neste período'}</h3><p>Os registros aparecerão após uma coleta ou ao ajustar os filtros.</p></div>:!lanes.some(l=>l.cells.some(c=>c.value!==null))?<div className="observatory-empty"><h3>Ainda faltam dados de emissões</h3><button onClick={()=>onMetric('energy')}>Visualizar energia</button></div>:<div className="observatory-plot">{flat?<svg className="temporal-flat" viewBox="0 0 1000 320" preserveAspectRatio="none" aria-hidden="true">{[0,1,2,3].map(i=><line key={i} x1="25" x2="975" y1={30+i*80} y2={30+i*80} stroke="#dce9e3"/>)}{lanes.map((l,k)=><g key={l.service.id}>{l.cells.map((c,i)=>{if(c.value===null)return null;const next=l.cells[i+1];return <path key={i} d={`M ${25+i/Math.max(1,l.cells.length-1)*950} ${290-c.value/max*260}${next?.value!=null?` L ${25+(i+1)/Math.max(1,l.cells.length-1)*950} ${290-next.value/max*260}`:' l 2 0'}`} stroke={colors[k]} opacity={c.partial?.5:1} strokeWidth="3" fill="none"/>;})}</g>)}<line className="temporal-flat-cursor" x1="0" x2="0" transform={`translate(${25+index/Math.max(1,model.timestamps.length-1)*950} 0)`} y1="20" y2="300" stroke="#00c77a" strokeDasharray="4 4"/></svg>:<Suspense fallback={<p className="observatory-empty">Preparando portal temporal…</p>}><Scene lanes={lanes} index={index} activeId={active?.service.id} label={selectionTime!==undefined?stamp(selectionTime):''} reading={value(lanes.some(l=>l.cells[index]?.value!=null)?lanes.reduce((sum,l)=>sum+(l.cells[index]?.value??0),0):null)} unit={unit} onPick={pick} onFail={()=>{setFailed(true);setFlat(true);}}/></Suspense>}</div>}
   <span className="portal-ring-count">{model.timestamps.length?`Intervalo ${index+1} de ${model.timestamps.length}`:'Aguardando registros'}</span>
  </section>
  <aside className="observatory-inspector"><span className="observatory-eyebrow">{mode==='cumulative'?'ACUMULADO ATÉ':'INTERVALO SELECIONADO'}</span><time>{selectionTime===undefined?'Aguardando registros':stamp(selectionTime)}</time><h3><i style={{background:colors[Math.max(0,lanes.findIndex(l=>l.service.id===active?.service.id))]}}/>{active?.service.name??'Nenhuma aplicação'}</h3>{active?.service.status==='removed'&&<span className="observatory-status">Removido · histórico preservado</span>}<strong className="observatory-reading">{value(cell?.value)} <small>{unit}</small></strong><div className="observatory-inspector-info"><span>Participação na seleção</span><b>{cell?.value!=null&&model.totals[index]?.value?formatNumber(cell.value/model.totals[index]!.value!*100)+'%':'—'}</b></div>{cell?.partial&&<span className="observatory-status">Cálculo parcial</span>}<button ref={detailsButton} className="observatory-primary" onClick={()=>openAnalysis()}>Explorar detalhes <Maximize2 size={15}/></button></aside></div>
  <footer className="observatory-footer"><div className="observatory-timeline"><button aria-label={playing?'Pausar histórico':'Reproduzir histórico'} disabled={model.timestamps.length<2} onClick={()=>{if(playing){update({cursor:freeze()});}else{setPlayIndex(pinned>=0?pinned:0);setPlaying(true);}}}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><button aria-label="Intervalo anterior" disabled={!index} onClick={()=>pick(index-1)}><ChevronLeft size={17}/></button><div className="portal-timeline-track"><div className="portal-timeline-labels"><span>{model.first===null?'':stamp(model.first)}</span><time>{selectionTime===undefined?'Sem registros':stamp(selectionTime)}</time><span>{model.last===null?'':stamp(model.last)}</span></div><div className="observatory-range-wrapper"><input aria-label="Explorar intervalos do histórico" aria-valuetext={selectionTime===undefined?'Sem registros':stamp(selectionTime)} type="range" min="0" max={Math.max(0,model.timestamps.length-1)} value={index} disabled={!model.timestamps.length} onChange={e=>pick(Number(e.target.value))}/><div className="observatory-gap-track" aria-hidden="true">{model.totals.map((t,i)=>t.value===null||model.lanes.some(l=>l.cells[i]?.partial)?<i key={t.timestamp} style={{left:`${i/Math.max(1,model.timestamps.length-1)*100}%`}}/>:null)}</div></div></div><button aria-label="Próximo intervalo" disabled={index>=model.timestamps.length-1} onClick={()=>pick(index+1)}><ChevronRight size={17}/></button></div></footer>
  <div ref={displayPopover} id={displayId} popover="auto" className="portal-display-popover" onToggle={e=>setDisplayOpen(e.newState==='open')}><h3>Exibição</h3><fieldset><legend>Leitura dos valores</legend><div className="observatory-modes" role="group" aria-label="Modo do gráfico"><button aria-pressed={mode==='intervals'} onClick={()=>onMode('intervals')}>Por intervalo</button><button aria-pressed={mode==='cumulative'} onClick={()=>onMode('cumulative')}>Acumulado</button></div></fieldset><fieldset><legend>Visualização</legend><div className="observatory-modes" role="group" aria-label="Dimensão do gráfico"><button aria-pressed={!flat} onClick={()=>setFlat(false)}>Vista 3D</button><button aria-pressed={flat} onClick={()=>setFlat(true)}>Vista plana</button></div></fieldset><details><summary><Info size={14}/>Como ler os anéis</summary><p>Cada anel representa um intervalo; os segmentos mostram a participação dos serviços visíveis. Contornos sem segmentos podem indicar zero ou ausência de cálculo. Consulte os detalhes para distinguir.</p><button aria-label="Sobre estimativas ambientais" onClick={()=>openAnalysis('detalhes')}>Entender os dados</button></details></div>
  {modal&&<dialog ref={dialog} className="observatory-dialog portal-analysis-dialog" aria-labelledby={dialogId} onKeyDown={e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();closeModal();}}} onCancel={e=>{e.preventDefault();closeModal();}}><header><div><span className="observatory-eyebrow">PORTAL TEMPORAL</span><h2 id={dialogId}>{modal==='services'?'Aplicações visíveis':'Explore os dados'}</h2></div><button aria-label="Fechar detalhes" onClick={closeModal}><X size={20}/></button></header>{modal==='services'?<div className="observatory-picker"><p>Escolha de 1 a 5 serviços. Os totais do período consideram todas as aplicações dos filtros.{narrow?' No celular, um serviço é exibido por vez.':''}</p>{model.lanes.map((l,i)=><div className="portal-picker-row" key={l.service.id}><label><input type="checkbox" checked={ids.includes(l.service.id)} disabled={!ids.includes(l.service.id)&&ids.length>=5||ids.includes(l.service.id)&&ids.length<=1} onChange={e=>{const next=new URLSearchParams(params);next.delete('faixa');const selected=e.target.checked?[...ids,l.service.id]:ids.filter(id=>id!==l.service.id);for(const id of selected)next.append('faixa',id);if(!selected.includes(next.get('faixaAtiva')??''))next.set('faixaAtiva',selected[0]!);setParams(next);}}/><span><b>{l.service.name}</b>{l.service.status==='removed'&&<small>Removido · histórico preservado</small>}</span><small>{value(l.total)} {unit}</small></label>{ids.includes(l.service.id)&&<button className="portal-select-service" aria-pressed={active?.service.id===l.service.id} onClick={()=>update({faixaAtiva:l.service.id})}><i style={{background:colors[Math.max(0,ids.indexOf(l.service.id))]}}/>{active?.service.id===l.service.id?'Selecionada':'Selecionar'}</button>}<span className="sr-only">Aplicação {i+1}</span></div>)}</div>:<><MonitoringTabs label="Seções da evolução" className="portal-analysis-tabs" tabs={portalTabs} value={panel} onChange={tab=>update({painel:tab})} panelId={dialogId+'-content'}/><div id={dialogId+'-content'} role="tabpanel" aria-label={portalTabs.find(t=>t.value===panel)?.label}><PortalAnalysis tab={panel} model={model} index={index} activeId={active?.service.id} unit={unit} value={value} mode={mode} events={collectionEvents} onPick={i=>{setPlaying(false);update({cursor:String(model.timestamps[i]??""),painel:""});}} onOpenService={onOpenService}/></div></>}</dialog>}
 </section>;
}
