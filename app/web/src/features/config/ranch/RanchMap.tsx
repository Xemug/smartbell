import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useRef } from 'react';

import { createTileSession, GOOGLE_LOGO } from './googleTiles';
import type { Pin } from './pin';
import { DEFAULT_CENTER } from './pin';

// Hosted builds set a browser key for Google's tiles; dev uses OpenStreetMap's free server.
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// A drawn pin instead of Leaflet's PNG marker, whose image paths break under a bundler.
const pinIcon = L.divIcon({
  className: 'text-primary',
  html: '<svg viewBox="0 0 24 32" width="32" height="42" aria-hidden="true"><path fill="currentColor" stroke="white" stroke-width="1.5" d="M12 1C6 1 1.5 5.4 1.5 11.2 1.5 18.6 12 31 12 31s10.5-12.4 10.5-19.8C22.5 5.4 18 1 12 1z"/><circle cx="12" cy="11" r="4" fill="white"/></svg>',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

interface RanchMapProps {
  pin: Pin | null;
  /** Drag the pin, or tap the map to drop it there. */
  editable: boolean;
  onMove: (pin: Pin) => void;
  label: string;
}

/** Map tiles and a draggable pin. Loaded on demand: Leaflet stays out of main. */
export default function RanchMap({ pin, editable, onMove, label }: RanchMapProps) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const move = useRef(onMove);
  move.current = onMove;

  useEffect(() => {
    if (!element.current) return;
    const instance = L.map(element.current, { scrollWheelZoom: false }).setView(
      pin ? [pin.latitude, pin.longitude] : DEFAULT_CENTER,
      pin ? 14 : 6,
    );
    const stop = new AbortController();
    if (GOOGLE_KEY) addGoogleTiles(instance, GOOGLE_KEY, stop.signal);
    else
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(instance);
    map.current = instance;
    return () => {
      stop.abort();
      instance.remove();
      map.current = null;
      marker.current = null;
    };
    // The view is set once; later pins move the marker, and the camera only to keep it in view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The marker follows `pin` (a reset after Cancelar, a reload) and `editable`.
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    if (!pin) {
      marker.current?.remove();
      marker.current = null;
      return;
    }
    const at: L.LatLngExpression = [pin.latitude, pin.longitude];
    if (!marker.current) {
      const created = L.marker(at, { icon: pinIcon, keyboard: false }).addTo(instance);
      marker.current = created;
      created.on('dragend', () => {
        const { lat, lng } = created.getLatLng();
        move.current({ latitude: lat, longitude: lng });
      });
      instance.setView(at, Math.max(instance.getZoom(), 14));
    } else {
      marker.current.setLatLng(at);
      // A pin placed from the address can land off screen; a drag or tap never does.
      if (!instance.getBounds().contains(at))
        instance.setView(at, Math.max(instance.getZoom(), 14));
    }
    if (editable) marker.current.dragging?.enable();
    else marker.current.dragging?.disable();
  }, [pin, editable]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !editable) return;
    const drop = (event: L.LeafletMouseEvent) =>
      move.current({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    instance.on('click', drop);
    return () => {
      instance.off('click', drop);
    };
  }, [editable]);

  return (
    <div
      ref={element}
      role="region"
      aria-label={label}
      className="z-0 h-64 w-full overflow-hidden rounded-moon-i-sm border lg:h-80"
    />
  );
}

/** Google's tiles with its logo, and the copyright for the visible area kept up to date. */
function addGoogleTiles(instance: L.Map, key: string, signal: AbortSignal) {
  const Logo = L.Control.extend({
    onAdd: () => {
      const logo = L.DomUtil.create('img');
      logo.src = GOOGLE_LOGO;
      logo.alt = 'Google';
      logo.style.height = '18px';
      return logo;
    },
  });
  new Logo({ position: 'bottomleft' }).addTo(instance);
  instance.attributionControl.setPrefix(false);
  createTileSession(key, signal)
    .then((session) => {
      if (signal.aborted) return;
      const layer = L.tileLayer(session.url, { maxZoom: session.maxZoom }).addTo(instance);
      let shown = '';
      const credit = () => {
        const bounds = instance.getBounds();
        session
          .copyright({
            zoom: instance.getZoom(),
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          })
          .then((text) => {
            if (signal.aborted || text === shown) return;
            if (shown) instance.attributionControl.removeAttribution(shown);
            instance.attributionControl.addAttribution(text);
            shown = text;
          })
          .catch(() => undefined);
      };
      instance.on('moveend', credit);
      layer.on('remove', () => instance.off('moveend', credit));
      credit();
    })
    // No tiles is better than OSM's server in production: the pin and address still work.
    .catch(() => undefined);
}
