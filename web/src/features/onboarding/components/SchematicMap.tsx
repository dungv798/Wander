import { useId } from 'react';
import { HALF } from '../../../shared/const/math.const.ts';
import type { MapMarker, MapRoute } from '../../../shared/map/map.types.ts';

const M_PER_DEG_LAT = 110540;
const M_PER_DEG_LON = 111320;
const PAD_RATIO = 0.4;
const MIN_SPAN_M = 600;
const PIN_RATIO = 0.075;
const MUTED_SCALE = 0.55;
const BADGE_RATIO = 0.55;
const FONT_RATIO = 0.62;
const HALF_TURN_DEG = 180;
const RAD = Math.PI / HALF_TURN_DEG;
const RING_RATIO = 1.12;
const BADGE_OFFSET = 0.8;

interface SchematicMapProps {
  readonly markers: readonly MapMarker[];
  readonly route: MapRoute | null;
  /** The pins that must fit the frame (null = all). */
  readonly focus: readonly string[] | null;
  readonly label: string;
}

interface Placed {
  readonly marker: MapMarker;
  readonly x: number;
  readonly y: number;
}

/** Projects longitude/latitude to flat meters around a base latitude (accurate enough for the distance of a few tens of km of a trip). */
function place(markers: readonly MapMarker[]): Placed[] {
  const lat0 = markers.reduce((s, m) => s + m.lat, 0) / Math.max(1, markers.length);
  return markers.map((m) => ({ marker: m, x: m.lon * M_PER_DEG_LON * Math.cos(lat0 * RAD), y: -m.lat * M_PER_DEG_LAT }));
}

/** The view (viewBox) that hugs the points that must fit, with padding; a minimum frame so a single point is not zoomed too far. */
function viewBoxOf(points: readonly Placed[]): { x: number; y: number; w: number; h: number } {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const w = Math.max(MIN_SPAN_M, Math.max(...xs) - Math.min(...xs));
  const h = Math.max(MIN_SPAN_M, Math.max(...ys) - Math.min(...ys));
  const cx = (Math.max(...xs) + Math.min(...xs)) / HALF;
  const cy = (Math.max(...ys) + Math.min(...ys)) / HALF;
  return { x: cx - (w * (1 + PAD_RATIO)) / HALF, y: cy - (h * (1 + PAD_RATIO)) / HALF, w: w * (1 + PAD_RATIO), h: h * (1 + PAD_RATIO) };
}

/** An illustrative diagram that replaces the base map when tiles cannot load: a grid background, numbered photo pins and a line in the order of visits (not a route). */
export function SchematicMap({ markers, route, focus, label }: SchematicMapProps) {
  const uid = useId();
  const all = place(markers);
  const shown = focus ? all.filter((p) => focus.includes(p.marker.id)) : all;
  if (shown.length === 0) return <div className="ob-schematic" role="img" aria-label={label} />;
  const vb = viewBoxOf(shown);
  const r = Math.max(vb.w, vb.h) * PIN_RATIO;
  const byId = new Map(all.map((p) => [p.marker.id, p]));
  const line = (route?.ids ?? []).flatMap((id) => byId.get(id) ?? []).map((p) => `${p.x},${p.y}`).join(' ');
  return (
    <svg className="ob-schematic" role="img" aria-label={label} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        {all.map((p) => (
          <clipPath key={p.marker.id} id={`${uid}-${p.marker.id}`}>
            <circle cx={p.x} cy={p.y} r={r} />
          </clipPath>
        ))}
      </defs>
      {line ? <polyline className="ob-route" points={line} fill="none" strokeWidth={r * BADGE_RATIO} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {all.map((p) => {
        const rr = p.marker.muted ? r * MUTED_SCALE : r;
        return (
          <g key={p.marker.id} className={p.marker.muted ? 'muted' : undefined}>
            <circle className="ob-pinring" cx={p.x} cy={p.y} r={rr * RING_RATIO} />
            {p.marker.muted || !p.marker.thumb ? <circle className="ob-pinmuted" cx={p.x} cy={p.y} r={rr} /> : <image href={p.marker.thumb} x={p.x - rr} y={p.y - rr} width={rr * HALF} height={rr * HALF} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${uid}-${p.marker.id})`} />}
            {p.marker.num ? (
              <>
                <circle className="ob-pinbadge" cx={p.x + rr * BADGE_OFFSET} cy={p.y - rr * BADGE_OFFSET} r={r * BADGE_RATIO} />
                <text className="ob-pinnum" x={p.x + rr * BADGE_OFFSET} y={p.y - rr * BADGE_OFFSET} fontSize={r * FONT_RATIO} textAnchor="middle" dominantBaseline="central">
                  {p.marker.num}
                </text>
              </>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
