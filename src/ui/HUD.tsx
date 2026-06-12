import type { LiveStats } from '../game/Game';

interface HUDProps {
  stats: LiveStats;
  isPaused: boolean;
  onTogglePause: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Crisp pixel-style outline used on the big readouts (Vampire-Survivors look).
const OUTLINE = '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 3px 0 #000';

export function HUD({ stats, isPaused, onTogglePause }: HUDProps) {
  const xpPct = Math.max(0, Math.min(100, (stats.xp / stats.xpToNext) * 100));

  return (
    <div style={styles.container}>
      {/* Full-width XP bar pinned to the very top — the signature VS element. */}
      <div style={styles.xpBar}>
        <div style={{ ...styles.xpFill, width: `${xpPct}%` }} />
        <div style={styles.lvBadge}>LV {stats.level}</div>
        <div style={styles.xpText}>{stats.xp} / {stats.xpToNext}</div>
      </div>

      {/* Big centered timer. */}
      <div style={styles.timer}>{formatTime(stats.elapsed)}</div>

      {/* Counters (top-right). */}
      <div style={styles.counters}>
        <div style={styles.counter}><span>💰</span><span style={styles.counterNum}>{stats.gold}</span></div>
        <div style={styles.counter}><span>💀</span><span style={styles.counterNum}>{stats.kills}</span></div>
        <button style={styles.pauseBtn} onClick={onTogglePause}>{isPaused ? '▶' : 'II'}</button>
      </div>

      {/* Inventory — weapons on top, passives below, as framed square slots (top-left, VS-style). */}
      <div style={styles.inventory}>
        <div style={styles.invRow}>
          {stats.weapons.map((w) => (
            <div key={w.name} style={styles.slot} title={`${w.name} Lv.${w.level}${w.stacks > 1 ? ` ×${w.stacks}` : ''}`}>
              <div style={styles.slotIcon}>{w.icon}</div>
              <div style={styles.slotBadge}>{w.stacks > 1 ? `×${w.stacks}` : w.level}</div>
            </div>
          ))}
        </div>
        {stats.passives.length > 0 && (
          <div style={styles.invRow}>
            {stats.passives.map((p) => (
              <div key={p.name} style={{ ...styles.slot, ...styles.slotPassive }} title={`${p.name} (${p.level}/${p.maxLevel})`}>
                <div style={styles.slotIcon}>{p.icon}</div>
                <div style={styles.slotBadge}>{p.level}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute', inset: 0,
    pointerEvents: 'none',
    fontFamily: '"Courier New", monospace',
    userSelect: 'none',
  },

  // --- XP bar (full width, top edge) ---
  xpBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 20,
    background: 'rgba(8,12,24,0.85)',
    borderBottom: '2px solid #000',
    overflow: 'hidden',
  },
  xpFill: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg, #7fe3ff 0%, #29a3e0 55%, #1c7fc4 100%)',
    boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.25)',
    transition: 'width 0.15s',
  },
  lvBadge: {
    position: 'absolute', left: 8, top: 0, bottom: 0,
    display: 'flex', alignItems: 'center',
    color: '#fff', fontSize: 13, fontWeight: 'bold', letterSpacing: 1,
    textShadow: OUTLINE,
  },
  xpText: {
    position: 'absolute', right: 10, top: 0, bottom: 0,
    display: 'flex', alignItems: 'center',
    color: '#e8f6ff', fontSize: 11, fontWeight: 'bold',
    textShadow: '1px 1px 0 #000',
  },

  // --- Timer (centered, big) ---
  timer: {
    position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)',
    color: '#fff', fontSize: 34, fontWeight: 'bold', letterSpacing: 2,
    textShadow: OUTLINE,
  },

  // --- Counters (top-right) ---
  counters: {
    position: 'absolute', top: 30, right: 12,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  counter: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(8,12,24,0.8)', border: '2px solid #000', borderRadius: 6,
    padding: '3px 9px', fontSize: 15,
  },
  counterNum: { color: '#ffe878', fontSize: 14, fontWeight: 'bold', textShadow: '1px 1px 0 #000', minWidth: 16, textAlign: 'right' },
  pauseBtn: {
    pointerEvents: 'auto',
    background: 'rgba(8,12,24,0.8)', border: '2px solid #000', borderRadius: 6,
    color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 'bold',
    padding: '4px 10px', letterSpacing: 1, fontFamily: '"Courier New", monospace',
  },

  // --- Inventory (top-left, below the XP bar — VS placement) ---
  inventory: {
    position: 'absolute', top: 26, left: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5,
  },
  invRow: { display: 'flex', gap: 5, justifyContent: 'flex-start' },
  slot: {
    position: 'relative', width: 38, height: 38,
    background: 'rgba(8,12,24,0.78)', border: '2px solid #caa030', borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.6)',
  },
  slotPassive: { border: '2px solid #5a8a3a' },
  slotIcon: { fontSize: 22, lineHeight: 1 },
  slotBadge: {
    position: 'absolute', right: -3, bottom: -5,
    background: '#1a1408', border: '1px solid #caa030', borderRadius: 4,
    color: '#ffe878', fontSize: 9, fontWeight: 'bold', padding: '0 3px',
    minWidth: 12, textAlign: 'center',
  },
};
