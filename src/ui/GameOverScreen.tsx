import type { GameResult } from '../game/Game';

interface GameOverScreenProps {
  result: GameResult;
  isVictory: boolean;
  onMainMenu: () => void;
  onRestart: () => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function GameOverScreen({ result, isVictory, onMainMenu, onRestart }: GameOverScreenProps) {
  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={isVictory ? styles.victoryTitle : styles.defeatTitle}>
          {isVictory ? '🏆 Victory!' : '💀 Defeated!'}
        </div>
        <div style={styles.message}>
          {isVictory
            ? 'Tommy survived the garden assault!'
            : 'The garden was overrun... try again!'}
        </div>

        <div style={styles.stats}>
          <Stat icon="⏱" label="Survived" value={formatTime(result.survived)} />
          <Stat icon="💀" label="Enemies Killed" value={result.kills.toLocaleString()} />
          <Stat icon="⭐" label="Score" value={result.score.toLocaleString()} />
          <Stat icon="💰" label="Gold Earned" value={result.gold.toString()} highlight />
        </div>

        <div style={styles.goldNote}>💰 {result.gold} gold added to your Garden!</div>

        <div style={styles.buttons}>
          <button style={styles.restartBtn} onClick={onRestart}>▶ Play Again</button>
          <button style={styles.menuBtn} onClick={onMainMenu}>🏠 Main Menu</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div style={styles.stat}>
      <span style={styles.statIcon}>{icon}</span>
      <span style={styles.statLabel}>{label}</span>
      <span style={highlight ? styles.statValueHighlight : styles.statValue}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, fontFamily: '"Courier New", monospace' },
  panel: { background: 'linear-gradient(160deg, #1a1a2e, #0d0d1a)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '36px 40px', maxWidth: 440, width: '90vw', textAlign: 'center' },
  victoryTitle: { color: '#ffe060', fontSize: 40, fontWeight: 'bold', marginBottom: 8, textShadow: '0 0 20px rgba(255,220,60,0.6)' },
  defeatTitle: { color: '#ff4444', fontSize: 40, fontWeight: 'bold', marginBottom: 8, textShadow: '0 0 20px rgba(255,60,60,0.5)' },
  message: { color: '#aaa', fontSize: 15, marginBottom: 28 },
  stats: { background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 },
  stat: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  statIcon: { fontSize: 18, width: 28 },
  statLabel: { flex: 1, color: '#888', fontSize: 14, textAlign: 'left' },
  statValue: { color: '#ddd', fontSize: 16, fontWeight: 'bold' },
  statValueHighlight: { color: '#ffe878', fontSize: 18, fontWeight: 'bold' },
  goldNote: { color: '#ffe878', fontSize: 13, marginBottom: 24, opacity: 0.8 },
  buttons: { display: 'flex', gap: 12, justifyContent: 'center' },
  restartBtn: { padding: '12px 28px', background: 'linear-gradient(135deg, #e63333, #ff6633)', border: '2px solid #ff9966', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 'bold', cursor: 'pointer', fontFamily: '"Courier New", monospace' },
  menuBtn: { padding: '12px 28px', background: 'rgba(40,40,60,0.8)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#aaa', fontSize: 15, cursor: 'pointer', fontFamily: '"Courier New", monospace' },
};
