import {useEffect, useRef} from 'react';
import * as THREE from 'three';
import type {TemporalLane} from '../domain/temporal';
import {portalSegments, portalWindow} from '../domain/portal';

type Props = {
  lanes: TemporalLane[]; index: number; label: string; reading: string; unit: string; activeId?: string;
  onPick: (index: number, id: string) => void; onFail: () => void;
};
type Ring = {group: THREE.Group; target: THREE.Vector3; opacity: number; scale: number; displayedOpacity: number};

export default function TemporalScene({lanes, index, label, reading, unit, activeId, onPick, onFail}: Props) {
  const host = useRef<HTMLDivElement>(null), caption = useRef<HTMLDivElement>(null);
  const selection = useRef({index, activeId}), draw = useRef<() => void>(() => {});
  const callbacks = useRef({onPick, onFail});
  useEffect(() => {callbacks.current = {onPick, onFail};});
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer | undefined, observer: ResizeObserver | undefined;
    let frame = 0, disposed = false;
    const scene = new THREE.Scene(), rings = new Map<number, Ring>();
    const camera = new THREE.OrthographicCamera(-6.7, 6.7, 4, -4, .1, 100);
    camera.position.set(0, 0, 20); camera.lookAt(0, 0, 0);
    const release = (group: THREE.Object3D) => group.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
      }
    });
    const cleanup = () => {
      disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); release(scene);
      renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove(); draw.current = () => {};
    };
    try {
      renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setClearColor(0xffffff, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .85;
      renderer.domElement.setAttribute('aria-hidden', 'true'); el.prepend(renderer.domElement);
      scene.add(new THREE.AmbientLight(0xeafff6, 1.4));
      const light = new THREE.DirectionalLight(0xffffff, 1.8); light.position.set(-4, 6, 8); scene.add(light);
      const fill = new THREE.DirectionalLight(0x54ffc4, .8); fill.position.set(4, -3, 5); scene.add(fill);
      const createRing = (i: number) => {
        const group = new THREE.Group(); group.rotation.set(.09, -.27, -.12);
        const add = (geometry: THREE.BufferGeometry, color: string, opacity: number) => {
          const material = new THREE.MeshPhysicalMaterial({color, transparent: true, opacity, side: THREE.DoubleSide,
            roughness: .2, metalness: .08, clearcoat: 1, depthWrite: false, emissive: color, emissiveIntensity: .12});
          const mesh = new THREE.Mesh(geometry, material); mesh.userData = {index: i, id: '', opacity};
          group.add(mesh); return mesh;
        };
        add(new THREE.RingGeometry(2.12, 2.66, 128), '#c8f6e7', .18).position.z = -.22;
        add(new THREE.TorusGeometry(2.65, .014, 6, 128), '#8adcc1', .65);
        add(new THREE.TorusGeometry(2.12, .012, 6, 128), '#a4e6d5', .45);
        portalSegments(lanes, i).forEach(segment => {
          const gap = Math.min(.035, segment.length * .15);
          const mesh = add(new THREE.TorusGeometry(2.39, .19, 14, Math.max(3, Math.ceil(segment.length * 22)), segment.length - gap), segment.color, segment.partial ? .48 : .94);
          mesh.rotation.z = segment.start + gap / 2; mesh.userData.id = segment.id;
        });
        // Missing intervals retain an outline, never a fabricated zero-value segment.
        scene.add(group); return {group, target: new THREE.Vector3(), opacity: 0, scale: 1, displayedOpacity: 0};
      };
      const paint = () => {if (!disposed && !document.hidden) renderer?.render(scene, camera);};
      let initialized = false;
      draw.current = () => {
        cancelAnimationFrame(frame);
        const {index: selected, activeId: id} = selection.current;
        const visible = portalWindow(lanes[0]?.cells.length ?? 0, selected);
        for (const [i, ring] of rings) if (!visible.includes(i)) {scene.remove(ring.group); release(ring.group); rings.delete(i);}
        visible.forEach((i, rank) => {
          let ring = rings.get(i);
          if (!ring) {ring = createRing(i); rings.set(i, ring); ring.group.position.set(.1 + rank * .34, .15 + rank * .16, -rank * .65);}
          ring.target.set(i === selected ? -1.45 : -.35 + rank * .34, i === selected ? -.35 : .2 + rank * .16, i === selected ? 3 : -rank * .65);
          ring.opacity = i === selected ? 1 : .22 + rank * .025;
          ring.scale = i === selected ? 1.06 : .94 - rank * .045;
          ring.group.children.forEach(object => {object.userData.highlight = i === selected && object.userData.id === id;});
        });
        const starts = new Map([...rings].map(([i, r]) => [i, {position:r.group.position.clone(),scale:r.group.scale.x,opacity:r.displayedOpacity}]));
        const start = performance.now();
        const reduced = !initialized || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        initialized = true;
        const animate = (time: number) => {
          const t = reduced ? 1 : Math.min(1, (time - start) / 420), ease = t * t * (3 - 2 * t);
          for (const [i, ring] of rings) {
            const from = starts.get(i)!;
            ring.group.position.lerpVectors(from.position, ring.target, ease);
            ring.group.scale.setScalar(from.scale + (ring.scale - from.scale) * ease);
            ring.displayedOpacity = from.opacity + (ring.opacity - from.opacity) * ease;
            ring.group.children.forEach(object => {
              if (object instanceof THREE.Mesh) {
                object.material.opacity = object.userData.opacity * ring.displayedOpacity;
                object.material.emissiveIntensity = object.userData.highlight ? .55 : .12;
              }
            });
          }
          const front = rings.get(selected);
          if (caption.current && front) {
            const p = front.group.position.clone().project(camera);
            caption.current.style.left = `${(p.x + 1) * 50}%`; caption.current.style.top = `${(1 - p.y) * 50}%`;
          }
          paint(); if (t < 1 && !document.hidden) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
      };
      const resize = () => {
        const {width, height} = el.getBoundingClientRect(); if (!width || !height) return;
        const aspect = width / height, half = Math.max(3.45, 5.1 / aspect);
        camera.left = -half * aspect; camera.right = half * aspect; camera.top = half; camera.bottom = -half;
        camera.updateProjectionMatrix(); renderer!.setSize(width, height); draw.current();
      };
      observer = new ResizeObserver(resize); observer.observe(el); resize();
      const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
      const hit = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, 1 - (e.clientY - rect.top) / rect.height * 2);
        ray.setFromCamera(pointer, camera);
        return ray.intersectObjects([...rings.values()].map(r => r.group), true)[0]?.object.userData;
      };
      const move = (e: PointerEvent) => {el.style.cursor = hit(e) ? 'pointer' : 'default';};
      const click = (e: PointerEvent) => {
        const p = hit(e); if (p) callbacks.current.onPick(p.index as number, p.id as string || selection.current.activeId || lanes[0]?.service.id || '');
      };
      const lost = (e: Event) => {e.preventDefault(); callbacks.current.onFail();};
      const visible = () => draw.current();
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', click);
      renderer.domElement.addEventListener('webglcontextlost', lost); document.addEventListener('visibilitychange', visible);
      return () => {
        el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', click);
        renderer?.domElement.removeEventListener('webglcontextlost', lost); document.removeEventListener('visibilitychange', visible); cleanup();
      };
    } catch {cleanup(); callbacks.current.onFail();}
  }, [lanes]);
  useEffect(() => {selection.current = {index, activeId}; draw.current();}, [index, activeId]);
  return <div className="temporal-scene temporal-portal" ref={host}>
    <div className="temporal-portal-caption" ref={caption} aria-hidden="true"><span>SELEÇÃO VISÍVEL</span><time>{label}</time><strong>{reading} <small>{unit}</small></strong><i/></div>
  </div>;
}
