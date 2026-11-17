import { memo, useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import type { PointerEvent } from "react";
import { createPortal } from "react-dom";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";
import { MeshPhongMaterial, PerspectiveCamera } from "three";
import { geoContains, geoDistance } from "d3-geo";
import { countries, findCountry } from "@/shared/geography/geography";
import type { CountryFeature, GlobeCity } from "@/shared/geography/geography";
import type { MonitoredService } from "../../types";
import { useSettings } from "@/shared/preferences/useSettings";
import { animateGlobeViewport, expandedGlobeAnchor, getGlobePixelRatio, getGlobeViewport, isGlobeInteractionPoint, restoreGlobeViewport } from "./globeViewport";
import { createGlobeRotation } from "./globeRotation";
import { createGlobeSelection, INITIAL_GLOBE_POSITION, scheduleGlobeFocus } from "./globeFocus";
import { countryObject, createCountryLayer, keepCountryObject } from "./countryLayer";
import { createGlobeResolution, globeExperiments } from "./globePerformance";

const NEON_STATUS_COLORS: Record<string, string> = {
  default: "#ffffff",
  available: "#00ff88",
  unavailable: "#ff1744",
  stale: "#ffe600",
  "no-metrics": "#00e5ff",
};

interface WorldGlobeProps {
  services?: MonitoredService[];
  supportedCountries: Set<string>;
  country?: CountryFeature;
  cities: GlobeCity[];
  city?: GlobeCity;
  selectedServiceId?: string;
  readOnly?: boolean;
  onCountrySelect?: (name: string) => void;
  onCitySelect?: (name: string) => void;
  onPointSelect?: (id: string, name: string) => void;
  onPointHover?: (id: string, active: boolean) => void;
  highlightedCityId?: string;
  focusCity?: GlobeCity;
  rotationPaused?: boolean;
  inline?: boolean;
  expanded?: boolean;
  anchorElement?: HTMLElement | null;
  detailView?: boolean;
}

const noCountries: CountryFeature[] = [];

function WorldGlobe({
  services = [],
  supportedCountries,
  country,
  cities,
  city,
  selectedServiceId,
  readOnly = false,
  onCountrySelect,
  onCitySelect,
  onPointSelect,
  onPointHover,
  highlightedCityId,
  focusCity,
  rotationPaused = false,
  inline = false,
  expanded = false,
  anchorElement,
  detailView = false,
}: WorldGlobeProps) {
  const host = useRef<HTMLDivElement>(null);
  const sceneSurface = useRef<HTMLDivElement>(null);
  const globe = useRef<GlobeMethods | undefined>(undefined);
  const cameraInitialized = useRef(false);
  const cameraCompact = useRef<boolean | null>(null);
  const projectionInitialized = useRef(false);
  const projectionAnchor = useRef<HTMLElement | null | undefined>(undefined);
  const selectionCamera = useRef<ReturnType<typeof createGlobeSelection> | null>(null);
  if (selectionCamera.current === null) selectionCamera.current = createGlobeSelection();
  const rotation = useRef<ReturnType<typeof createGlobeRotation> | null>(null);
  const resolution = useRef<ReturnType<typeof createGlobeResolution> | null>(null);
  const cancelCameraMotion = useRef<() => void>(() => {});
  const viewportMotion = useRef<(() => void) | null>(null);
  const markerElements = useRef(new Map<string, HTMLButtonElement>());
  const touch = useRef<{ id: number; x: number; y: number } | null>(null);
  const [viewport, setViewport] = useState({
    width: 0, height: 0, offset: [0, 0] as [number, number], fieldOfView: 50, visible: false, compact: false,
    portalRoot: null as Element | null,
    anchor: undefined as HTMLElement | null | undefined,
  });
  const [ready, setReady] = useState(false);
  const [painted, setPainted] = useState(false);
  const [hover, setHover] = useState("");
  const [lost, setLost] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(() => typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const { settings } = useSettings();
  const [experiments] = useState(() => globeExperiments(window.location.search, import.meta.env.DEV));
  const rendererConfig = useMemo(() => ({ antialias: true, alpha: true, powerPreference: "high-performance" as const }), []);
  const batched = experiments.batched && !onCountrySelect;
  const countryLayers = useMemo(() => batched ? [createCountryLayer(countries)] : [], [batched]);
  const surface = useMemo(
    () =>
      new MeshPhongMaterial({
        color: "#c2e4e9",
        specular: "#e4f8ed",
        shininess: 12,
      }),
    [],
  );
  const points = useMemo(
    () =>
      cities.filter(
        (entry) =>
          Number.isFinite(entry.latitude) && Number.isFinite(entry.longitude),
      ),
    [cities],
  );
  const cityId = city?.id,
    cityLat = city?.latitude,
    cityLng = city?.longitude;
  const focusLat = focusCity?.latitude, focusLng = focusCity?.longitude;
  const handleReady = useCallback(() => setReady(true), []);

  const countryStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    const priority = ["no-metrics", "available", "stale", "unavailable"];
    for (const service of services) {
      if (service.status === "removed") continue;
      const countryCode = findCountry(service.country ?? "")?.properties.code ||
        (service.country?.length === 2 ? service.country.toUpperCase() : undefined);
      if (!countryCode) continue;
      const current = map.get(countryCode);
      if (!current || priority.indexOf(service.status) > priority.indexOf(current)) {
        map.set(countryCode, service.status);
      }
    }
    return map;
  }, [services]);

  const countryBorderColor = useCallback((feature: object): string => {
    const code = (feature as CountryFeature).properties?.code;
    const status = code ? countryStatusMap.get(code) : undefined;
    if (status && status in NEON_STATUS_COLORS) {
      return NEON_STATUS_COLORS[status]!;
    }
    return NEON_STATUS_COLORS.default!;
  }, [countryStatusMap]);

  const selectedCountryCode = findCountry(services.find(service => service.id === selectedServiceId)?.country ?? "")?.properties.code;
  const countryColor = useCallback((feature: object) => {
    const { code, name } = (feature as CountryFeature).properties;
    return code === selectedCountryCode ? "#00df78" : code === country?.properties.code ? "#087d62" : name === hover ? "#4baf8f"
      : supportedCountries.has(code) ? "#83bfa4" : "#b3cbc2";
  }, [selectedCountryCode, country?.properties.code, hover, supportedCountries]);
  const hoverCountry = useCallback((feature: object | null) => {
    setHover(feature && onCountrySelect ? (feature as CountryFeature).properties.name : "");
  }, [onCountrySelect]);
  const selectCountry = useCallback((feature: object, event: MouseEvent) => {
    if (!readOnly && (!("pointerType" in event) || event.pointerType !== "touch"))
      onCountrySelect?.((feature as CountryFeature).properties.name);
  }, [readOnly, onCountrySelect]);

  useEffect(() => {
    for (const layer of countryLayers) layer.updateColors(countryColor, countryBorderColor);
  }, [countryLayers, countryColor, countryBorderColor]);
  useEffect(() => () => { for (const layer of countryLayers) layer.dispose(); }, [countryLayers]);

  const createMarker = useCallback((point: object) => {
    const entry = point as GlobeCity;
    const count = entry.count ?? 1;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "globe-marker" + (count > 1 ? " globe-marker-cluster" : "") + (entry.id === cityId ? " is-selected" : "") + (entry.missingImpact ? " is-incomplete" : "");
    button.style.setProperty("--marker-color", entry.color ?? "#079e72");
    button.style.setProperty("--marker-size", (entry.size ?? (count > 1 ? 27 : 17)) + "px");
    const label = entry.name + " · " + count + (count === 1 ? " aplicação" : " aplicações") + (entry.valueLabel ? " · " + entry.valueLabel : "");
    button.setAttribute("aria-label", "Explorar " + label);
    button.disabled = readOnly;
    if (count > 1) button.append(document.createTextNode(String(count)));
    const caption = document.createElement("span");
    caption.className = "globe-marker-label";
    caption.textContent = label;
    caption.setAttribute("aria-hidden", "true");
    button.append(caption);
    markerElements.current.set(entry.id, button);
    button.onmouseenter = () => onPointHover?.(entry.id, true);
    button.onmouseleave = () => { if (document.activeElement !== button) onPointHover?.(entry.id, false); };
    button.onfocus = () => onPointHover?.(entry.id, true);
    button.onblur = () => { if (!button.matches(":hover")) onPointHover?.(entry.id, false); };
    button.onclick = event => {
      event.stopPropagation();
      rotation.current?.pause();
      if (onPointSelect) onPointSelect(entry.id, entry.name);
      else onCitySelect?.(entry.name);
    };
    return button;
  }, [cityId, readOnly, onPointSelect, onCitySelect, onPointHover]);

  useEffect(() => {
    for (const [id, element] of markerElements.current) {
      if (!points.some(point => point.id === id)) markerElements.current.delete(id);
      else element.classList.toggle("is-highlighted", id === highlightedCityId);
    }
  }, [highlightedCityId, points, ready]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = (event: MediaQueryListEvent) => setMotionAllowed(!event.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    const controls = globe.current?.controls();
    if (!ready || !controls) return;
    const controller = createGlobeRotation(controls, (callback, delay) => window.setTimeout(callback, delay), id => window.clearTimeout(id));
    const elements = markerElements.current;
    rotation.current = controller;
    const start = () => { cancelCameraMotion.current(); controller.start(); resolution.current?.start(); };
    const end = () => { controller.end(); resolution.current?.end(); };
    controls.addEventListener("start", start);
    controls.addEventListener("end", end);
    return () => {
      controller.dispose();
      controls.removeEventListener("start", start);
      controls.removeEventListener("end", end);
      elements.clear();
      rotation.current = null;
    };
  }, [ready]);

  useEffect(() => {
    rotation.current?.setEnabled(viewport.visible && !rotationPaused && !highlightedCityId && motionAllowed && settings.parallaxEnabled);
  }, [ready, viewport.visible, rotationPaused, highlightedCityId, motionAllowed, settings.parallaxEnabled]);

  const interactionPointAllowed = (x: number, y: number) => {
    const anchor = expanded
      ? { left: 0, top: 0, width: viewport.width, height: viewport.height }
      : (anchorElement ?? host.current)?.getBoundingClientRect();
    return Boolean(anchor && isGlobeInteractionPoint(anchor, x, y));
  };

  useLayoutEffect(() => {
    const element = anchorElement === undefined ? host.current : anchorElement;
    const portalRoot = inline && element ? element : host.current?.closest(".monitoring-shell") ?? document.body;
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!element) { setViewport(previous => previous.visible ? {...previous,visible:false} : previous); return; }
      const anchor = expanded ? { ...expandedGlobeAnchor({ width: document.documentElement.clientWidth, height: window.innerHeight }), bottom: window.innerHeight } : element.getBoundingClientRect();
      const visible = anchor.width > 0 && anchor.height > 0 && anchor.bottom > 0 && anchor.top < window.innerHeight;
      setViewport(previous => {
        if (!visible) return previous.visible ? { ...previous, visible: false } : previous;
        const size = { width: document.documentElement.clientWidth, height: window.innerHeight };
        const next = inline ? { width: anchor.width, height: anchor.height, offset: [0, 0] as [number, number], fieldOfView: 50, compact: true } : { ...getGlobeViewport(size, anchor), compact: size.width <= 900 };
        return previous.visible && previous.width === next.width && previous.height === next.height &&
          previous.offset[0] === next.offset[0] && previous.offset[1] === next.offset[1] &&
          previous.fieldOfView === next.fieldOfView && previous.compact === next.compact && previous.anchor === anchorElement ? previous : { ...next, visible, portalRoot, anchor: anchorElement };
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    if (element) observer.observe(element);
    observer.observe(document.documentElement);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      cancelAnimationFrame(frame);
    };
  }, [inline, expanded, anchorElement, selectedServiceId]);

  useEffect(() => {
    if (!ready || !globe.current) return;
    const renderer = globe.current.renderer();
    const controller = createGlobeResolution(getGlobePixelRatio({ width: viewport.width, height: viewport.height }, window.devicePixelRatio), experiments.adaptive,
      ratio => renderer.setPixelRatio(ratio), (callback, delay) => window.setTimeout(callback, delay), id => window.clearTimeout(id));
    resolution.current = controller;
    return () => { controller.dispose(); resolution.current = null; };
  }, [ready, viewport.width, viewport.height, experiments.adaptive]);

  useEffect(() => {
    if (!ready || !globe.current) return;
    globe.current.renderer().setClearColor(0x000000, 0);
    const scene = globe.current.scene();
    const afterRender = scene.onAfterRender;
    const reveal: typeof afterRender = (...args) => {
      afterRender.apply(scene, args);
      setPainted(true);
      scene.onAfterRender = afterRender;
    };
    scene.onAfterRender = reveal;
    return () => { if (scene.onAfterRender === reveal) scene.onAfterRender = afterRender; };
  }, [ready, experiments.alpha]);

  useEffect(() => {
    if (!ready || !globe.current) return;
    const scene = globe.current.scene();
    const camera = globe.current.camera();
    if (!(camera instanceof PerspectiveCamera)) return;
    const beforeRender = scene.onBeforeRender;
    scene.onBeforeRender = (...args) => {
      beforeRender.apply(scene, args);
      restoreGlobeViewport(camera);
    };
    return () => { scene.onBeforeRender = beforeRender; };
  }, [ready]);

  useLayoutEffect(() => {
    const camera = globe.current?.camera();
    if (!ready || !viewport.visible || !(camera instanceof PerspectiveCamera)) return;
    const resized = camera.view?.fullWidth !== viewport.width || camera.view?.fullHeight !== viewport.height;
    const shared = viewport.anchor !== undefined;
    const navigating = shared && viewport.anchor !== projectionAnchor.current;
    // A navigation can change scrollbar width without being a window resize.
    const duration = projectionInitialized.current && (!resized || navigating) && viewport.visible && motionAllowed && (shared || settings.parallaxEnabled) ? (shared ? 1100 : 650) : 0;
    projectionAnchor.current = viewport.anchor;
    projectionInitialized.current = true;
    const cancel = animateGlobeViewport(camera, viewport, duration, requestAnimationFrame, cancelAnimationFrame);
    viewportMotion.current = cancel;
    const controls = globe.current?.controls();
    const surface = sceneSurface.current;
    const enabled = controls?.enabled;
    const restore = () => { if (controls && enabled !== undefined) controls.enabled = enabled; if (surface) surface.inert = false; };
    const lockInteraction = Boolean(duration && shared && !expanded);
    if (lockInteraction) { if (controls) controls.enabled = false; if (surface) surface.inert = true; }
    const timer = lockInteraction ? window.setTimeout(restore, duration) : undefined;
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      cancel();
      if (viewportMotion.current === cancel) viewportMotion.current = null;
      restore();
    };
  }, [ready, viewport, motionAllowed, settings.parallaxEnabled, expanded]);

  useEffect(() => {
    if (!ready || !globe.current) return;
    const controls = globe.current.controls();
    controls.enablePan = false;
    controls.minDistance = 125;
    controls.maxDistance = 450;
    controls.zoomSpeed = 0.75;
    controls.rotateSpeed = 0.8;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    const layoutChanged = cameraCompact.current !== viewport.compact;
    cameraCompact.current = viewport.compact;
    const duration =
      cameraInitialized.current &&
      !layoutChanged &&
      (anchorElement !== undefined || settings.parallaxEnabled) &&
      motionAllowed
        ? (anchorElement !== undefined ? 1100 : 650)
        : 0;
    const hasFocus = focusLat != null && focusLng != null && Number.isFinite(focusLat) && Number.isFinite(focusLng);
    const returning = selectionCamera.current!.update(selectedServiceId ?? cityId, globe.current.pointOfView());
    if (cameraInitialized.current && !cityId && !country && !hasFocus && !returning && !layoutChanged) return;
    const target =
      cityId && Number.isFinite(cityLat) && Number.isFinite(cityLng)
        ? { lat: cityLat!, lng: cityLng!, altitude: inline ? 1.7 : detailView ? 1.35 : 0.65 }
        : returning ? returning
        : hasFocus
          ? { lat: focusLat, lng: focusLng, altitude: cameraInitialized.current ? globe.current.pointOfView().altitude : INITIAL_GLOBE_POSITION.altitude }
        : country
          ? {
              lat: country.properties.latitude,
              lng: country.properties.longitude,
              altitude: INITIAL_GLOBE_POSITION.altitude,
            }
          : { ...INITIAL_GLOBE_POSITION };
    rotation.current?.pause();
    if (duration) { resolution.current?.start(); resolution.current?.end(duration + 250); }
    const cancel = scheduleGlobeFocus(globe.current, target, country || cityId || hasFocus || returning ? duration : 0,
      cameraInitialized.current && hasFocus && !cityId && !country && !returning ? 180 : 0,
      (callback, delay) => window.setTimeout(callback, delay), id => window.clearTimeout(id));
    cancelCameraMotion.current = cancel;
    cameraInitialized.current = true;
    return cancel;
  }, [ready, country, cityId, cityLat, cityLng, selectedServiceId, focusLat, focusLng, settings.parallaxEnabled, motionAllowed, viewport.compact, inline, detailView, anchorElement]);

  useEffect(() => {
    const canvas = globe.current?.renderer().domElement;
    if (!ready || !canvas) return;
    const contextLost = (event: Event) => {
      event.preventDefault();
      setLost(true);
    };
    canvas.addEventListener("webglcontextlost", contextLost);
    const updateAnimation = () => {
      if (viewport.visible && !document.hidden) globe.current?.resumeAnimation();
      else globe.current?.pauseAnimation();
    };
    updateAnimation();
    document.addEventListener("visibilitychange", updateAnimation);
    return () => {
      canvas.removeEventListener("webglcontextlost", contextLost);
      document.removeEventListener("visibilitychange", updateAnimation);
    };
  }, [ready, viewport.visible]);

  useEffect(
    () => () => {
      surface.dispose();
    },
    [surface],
  );

  function selectTouch(event: PointerEvent<HTMLDivElement>) {
    const start = touch.current;
    touch.current = null;
    if (readOnly || !start || start.id !== event.pointerId || !globe.current) return;
    const bounds = globe.current.renderer().domElement.getBoundingClientRect();
    const x = event.clientX - bounds.left,
      y = event.clientY - bounds.top;
    // Toques rápidos podem terminar antes da atualização do raycast da biblioteca.
    const location = globe.current.toGlobeCoords(x, y);
    if (!location) return;
    const marker = points
      .map((entry) => ({
        entry,
        screen: globe.current!.getScreenCoords(
          entry.latitude!,
          entry.longitude!,
          0.012,
        ),
      }))
      .filter(
        ({ entry }) =>
          geoDistance(
            [entry.longitude!, entry.latitude!],
            [location.lng, location.lat],
          ) < 0.2,
      )
      .sort(
        (a, b) =>
          Math.hypot(a.screen.x - x, a.screen.y - y) -
          Math.hypot(b.screen.x - x, b.screen.y - y),
      )[0];
    if (marker && Math.hypot(marker.screen.x - x, marker.screen.y - y) < 20) {
      if (onPointSelect) onPointSelect(marker.entry.id, marker.entry.name);
      else onCitySelect?.(marker.entry.name);
      return;
    }
    if (!onCountrySelect) return;
    const selected = countries.find((feature) =>
      geoContains(feature, [location.lng, location.lat]),
    );
    if (selected) onCountrySelect?.(selected.properties.name);
  }

  useEffect(() => {
    if (!inline || painted || lost) return;
    const timer = window.setTimeout(() => setLost(true), 12000);
    return () => window.clearTimeout(timer);
  }, [inline, painted, lost]);

  return (
    <div ref={host} className="globe-stage" data-scene="persistent" data-ready={ready && !lost} data-painted={painted && !lost}>
      {viewport.width > 0 && viewport.portalRoot && createPortal(<div
      ref={sceneSurface}
      className={"globe-background" + (inline ? " globe-background--inline" : "")}
      data-intro={painted && motionAllowed && settings.parallaxEnabled}
      data-mask={experiments.mask}
      style={{ visibility: viewport.visible && (painted || lost) ? "visible" : "hidden" }}
      aria-label={readOnly ? "Globo 3D para visualização" : "Globo 3D interativo"}
      onPointerDownCapture={(event) => {
        if (event.target instanceof HTMLCanvasElement && !interactionPointAllowed(event.clientX, event.clientY)) {
          event.stopPropagation();
          return;
        }
        viewportMotion.current?.();
        viewportMotion.current = null;
        cancelCameraMotion.current();
        resolution.current?.start();
        rotation.current?.start();
        if (!readOnly && event.pointerType === "touch")
          touch.current =
            event.isPrimary && event.target instanceof HTMLCanvasElement
              ? { id: event.pointerId, x: event.clientX, y: event.clientY }
              : null;
      }}
      onPointerMoveCapture={(event) => {
        if (
          touch.current &&
          Math.hypot(
            event.clientX - touch.current.x,
            event.clientY - touch.current.y,
          ) > 8
        )
          touch.current = null;
      }}
      onPointerCancelCapture={() => {
        touch.current = null;
        resolution.current?.end();
        rotation.current?.end();
      }}
      onPointerUpCapture={event => { resolution.current?.end(); rotation.current?.end(); selectTouch(event); }}
      onWheelCapture={event => {
        if (!interactionPointAllowed(event.clientX, event.clientY)) {
          event.stopPropagation();
          return;
        }
        viewportMotion.current?.();
        viewportMotion.current = null;
        resolution.current?.start(); resolution.current?.end(); cancelCameraMotion.current(); rotation.current?.pause();
      }}
    >
      {lost ? (
        <p className="globe-fallback" role="status">
          {readOnly
            ? "A visualização 3D foi interrompida."
            : "Mapa indisponível. A localização textual e as métricas continuam disponíveis."}
        </p>
      ) : (
        viewport.width > 0 && (
          <Globe
            ref={globe}
            width={viewport.width}
            height={viewport.height}
            backgroundColor="rgba(0,0,0,0)"
            globeMaterial={surface}
            rendererConfig={rendererConfig}
            globeCurvatureResolution={4}
            atmosphereColor="#88d9be"
            atmosphereAltitude={0.14}
            showGraticules
            animateIn={false}
            showPointerCursor={!readOnly}
            onGlobeReady={handleReady}
            enablePointerInteraction={!readOnly && Boolean(onCountrySelect)}
            polygonsData={batched ? noCountries : countries}
            customLayerData={countryLayers}
            customThreeObject={countryObject}
            customThreeObjectUpdate={keepCountryObject}
            polygonCapColor={countryColor}
            polygonCapCurvatureResolution={6}
            polygonSideColor=""
            polygonStrokeColor={countryBorderColor}
            polygonAltitude={0.009}
            polygonsTransitionDuration={0}
            onPolygonHover={hoverCountry}
            onPolygonClick={selectCountry}
            htmlElementsData={points}
            htmlLat="latitude"
            htmlLng="longitude"
            htmlAltitude={0.012}
            htmlElement={createMarker}
            htmlTransitionDuration={0}
          />
        )
      )}
      <div className="globe-fade" aria-hidden="true" />
      {hover && (
        <span className="globe-hover" role="status">
          {hover}
        </span>
      )}
    </div>, viewport.portalRoot)}
    {inline && !painted && !lost && <p className="globe-fallback" role="status">Carregando mapa…</p>}
    </div>
  );
}

export default memo(WorldGlobe);
