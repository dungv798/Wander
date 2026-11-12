import { useId } from 'react';
import type { ReactNode } from 'react';

interface StopSpec {
  readonly offset: number;
  readonly token: string;
  readonly opacity?: number;
}

/** A unique gradient id for each build (several copies on a page do not share an id). */
function useUid(): string {
  return useId().replace(/[^a-zA-Z0-9]/g, '');
}

/** A multi-stop color ramp; the colors come from CSS tokens so changing the palette changes them too. */
function Stops({ list }: { readonly list: readonly StopSpec[] }) {
  return (
    <>
      {list.map((s) => (
        <stop key={`${s.offset}-${s.token}`} offset={s.offset} style={{ stopColor: `var(${s.token})` }} stopOpacity={s.opacity} />
      ))}
    </>
  );
}

interface ArtProps {
  readonly className?: string;
}

const PLANE_WINDOWS = [168, 184, 200, 216] as const;
const COMPASS_TICKS = Array.from({ length: 12 }, (_, i) => i);
const SUN_RAYS = Array.from({ length: 12 }, (_, i) => i);
const TICK_FULL_STEP = 3;
const DEG_STEP = 30;

/** A passenger plane seen from the side, a smoke tail; decorative (hidden from screen readers). */
export function Plane({ className = 'plane' }: ArtProps): ReactNode {
  const u = useUid();
  return (
    <svg className={className} viewBox="0 0 260 110" aria-hidden="true">
      <defs>
        <linearGradient id={`${u}body`} x1="0" y1="0" x2="0" y2="1">
          <Stops list={[{ offset: 0, token: '--obj-hi' }, { offset: 0.55, token: '--obj-mid' }, { offset: 1, token: '--obj-lo' }]} />
        </linearGradient>
        <linearGradient id={`${u}wing`} x1="0" y1="0" x2="1" y2="1">
          <Stops list={[{ offset: 0, token: '--obj-hi' }, { offset: 1, token: '--obj-lo' }]} />
        </linearGradient>
        <linearGradient id={`${u}trail`} x1="1" y1="0" x2="0" y2="0">
          <Stops list={[{ offset: 0, token: '--obj-hi', opacity: 0.95 }, { offset: 1, token: '--obj-hi', opacity: 0 }]} />
        </linearGradient>
        <radialGradient id={`${u}eng`} cx="40%" cy="35%" r="70%">
          <Stops list={[{ offset: 0, token: '--obj-hi' }, { offset: 1, token: '--obj-accent' }]} />
        </radialGradient>
      </defs>
      <path d="M0 68 C34 62 84 58 128 58 L128 76 C84 78 34 80 0 80Z" fill={`url(#${u}trail)`} />
      <path d="M62 60 L34 22 L56 22 L106 56Z" fill={`url(#${u}wing)`} style={{ stroke: 'var(--obj-edge)' }} strokeWidth="1.5" />
      <path d="M126 62 C156 44 208 42 240 55 C254 60 254 69 240 74 C208 86 156 82 126 74Z" fill={`url(#${u}body)`} style={{ stroke: 'var(--obj-edge)' }} strokeWidth="2" />
      <path d="M150 74 L116 102 L142 102 L190 78Z" fill={`url(#${u}wing)`} style={{ stroke: 'var(--obj-edge)' }} strokeWidth="1.5" />
      <path d="M232 55 C244 55 252 60 252 66" fill="none" style={{ stroke: 'var(--obj-accent)' }} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M140 56 C170 49 212 48 236 57" fill="none" style={{ stroke: 'var(--white)' }} strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <g style={{ fill: 'var(--sky)' }} opacity=".85">
        {PLANE_WINDOWS.map((x) => (
          <ellipse key={x} cx={x} cy="62" rx="5" ry="4.2" />
        ))}
      </g>
      <ellipse cx="140" cy="88" rx="15" ry="8.5" fill={`url(#${u}eng)`} style={{ stroke: 'var(--obj-edge)' }} strokeWidth="1.5" />
    </svg>
  );
}

/** A glass-ball compass with a gently swinging needle (CSS `.ac-needle`); decorative. */
export function Compass({ className = 'compass' }: ArtProps): ReactNode {
  const u = useUid();
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={`${u}ring`} x1="0" y1="0" x2="1" y2="1">
          <Stops list={[{ offset: 0, token: '--obj-hi' }, { offset: 0.5, token: '--obj-mid' }, { offset: 1, token: '--obj-lo' }]} />
        </linearGradient>
        <radialGradient id={`${u}dial`} cx="40%" cy="30%" r="80%">
          <Stops list={[{ offset: 0, token: '--obj-hi' }, { offset: 1, token: '--obj-mid' }]} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#${u}ring)`} style={{ stroke: 'var(--obj-edge)' }} strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill={`url(#${u}dial)`} />
      {COMPASS_TICKS.map((i) => (
        <line key={i} x1="50" y1="13" x2="50" y2={i % TICK_FULL_STEP ? 17 : 21} transform={`rotate(${i * DEG_STEP} 50 50)`} style={{ stroke: 'var(--obj-edge)' }} strokeWidth={i % TICK_FULL_STEP ? 1.4 : 2.4} strokeLinecap="round" />
      ))}
      <g className="ac-needle">
        <path d="M50 22 L58 50 L50 78 L42 50Z" style={{ fill: 'var(--white)', stroke: 'var(--obj-edge)' }} strokeWidth="1" />
        <path d="M50 22 L58 50 L50 50Z" style={{ fill: 'var(--obj-accent)' }} />
        <path d="M50 78 L42 50 L50 50Z" style={{ fill: 'var(--ink-fixed)' }} opacity=".75" />
      </g>
      <circle cx="50" cy="50" r="4" style={{ fill: 'var(--white)', stroke: 'var(--obj-edge)' }} strokeWidth="1.2" />
      <path d="M20 34 A34 34 0 0 1 44 15" fill="none" style={{ stroke: 'var(--white)' }} strokeWidth="4" strokeLinecap="round" opacity=".75" />
    </svg>
  );
}

/** A sun with slowly rotating rays (CSS `.as-rays`); decorative. */
export function Sun({ className = 'sun3d' }: ArtProps): ReactNode {
  const u = useUid();
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <radialGradient id={`${u}core`} cx="38%" cy="32%" r="75%">
          <Stops list={[{ offset: 0, token: '--sun-hi' }, { offset: 1, token: '--sun' }]} />
        </radialGradient>
      </defs>
      <g className="as-rays" style={{ fill: 'var(--sun)' }} opacity=".75">
        {SUN_RAYS.map((i) => (
          <rect key={i} x="57" y="2" width="6" height={i % 2 ? 14 : 22} rx="3" transform={`rotate(${i * DEG_STEP} 60 60)`} />
        ))}
      </g>
      <circle cx="60" cy="60" r="30" fill={`url(#${u}core)`} />
    </svg>
  );
}
