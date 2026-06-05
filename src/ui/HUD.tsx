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

export function HUD({ stats, isPaused, onTogglePause }: HUDProps) {
  const xpPct = Math.max(0, (stats.xp / stats.xpToNext) * 100);

  return (
    <div style={styles.container}>
      {/* Top bar — HP now lives under the player; show a compact HP readout + timer + stats */}
      <div style={styles.topBar}>
        <div style={styles.hpReadout}>❤️ {stats.hp}/{stats.maxHp}</div>

        {/* Timer (center) */}
        <div style={styles.timer}>{formatTime(stats.elapsed)}</div>

        {/* Gold + kills (right) */}
        <div style={styles.statsRight}>
          <span>💰 {stats.gold}</span>
          <span style={{ marginLeft: 12 }}>💀 {stats.kills}</span>
          <button style={styles.pauseBtn} onClick={onTogglePause}>{isPaused ? '▶' : '⏸'}</button>
        </div>
      </div>

      {/* XP bar (below top bar) */}
      <div style={styles.xpRow}>
        <div style={styles.xpLabel}>Lv.{stats.level}</div>
        <div style={styles.xpBarTrack}>
          <div style={{ ...styles.xpBarFill, width: `${xpPct}%` }} />
        </div>
        <div style={styles.xpLabel}>{stats.xp}/{stats.xpToNext}</div>
      </div>

      {/* Weapon slots (bottom-left) */}
      <div style={styles.weaponSlots}>
        {stats.weapons.map((w) => (
          <div key={w.name} style={styles.weaponSlot} title={`${w.name} Lv.${w.level}${w.stacks > 1 ? ` ×${w.stacks}` : ''}`}>
            <div style={styles.weaponIcon}>{w.icon}</div>
            <div style={styles.weaponLevel}>Lv.{w.level}{w.stacks > 1 ? ` ×${w.stacks}` : ''}</div>
          </div>
        ))}
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
  topBar: {
    position: 'absolute', top: 10, left: 10, right: 10,
    display: 'flex', alignItems: 'center', gap: 12,
  },
  hpReadout: { flex: 1, color: '#ff9aa2', fontSize: 14, fontWeight: 'bold', textShadow: '1px 1px 3px #000' },
  timer: { flex: 0, color: '#fff', fontSize: 22, fontWeight: 'bold', textShadow: '2px 2px 4px #000', minWidth: 80, textAlign: 'center' },
  statsRight: { flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', color: '#ffe878', fontSize: 14, fontWeight: 'bold', textShadow: '1px 1px 3px #000', pointerEvents: 'auto' },
  pauseBtn: { marginLeft: 14, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 16, padding: '2px 10px', pointerEvents: 'auto' },
  xpRow: { position: 'absolute', top: 50, left: 10, right: 10, display: 'flex', alignItems: 'center', gap: 6 },
  xpLabel: { color: '#a0e8ff', fontSize: 11, textShadow: '1px 1px 2px #000', minWidth: 36 },
  xpBarTrack: { flex: 1, height: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(100,200,255,0.3)' },
  xpBarFill: { height: '100%', background: 'linear-gradient(90deg, #30b8e0, #60f0ff)', borderRadius: 4, transition: 'width 0.15s' },
  weaponSlots: { position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 8, pointerEvents: 'none' },
  weaponSlot: { background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '4px 8px', textAlign: 'center', minWidth: 44 },
  weaponIcon: { fontSize: 20 },
  weaponLevel: { color: '#ffe878', fontSize: 10, fontWeight: 'bold' },
};
