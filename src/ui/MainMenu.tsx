import { useMetaStore } from '../meta/MetaStore';
import titleArt from '../assets/title.png';

interface MainMenuProps {
  onPlay: () => void;
  onGarden: () => void;
}

export function MainMenu({ onPlay, onGarden }: MainMenuProps) {
  const { gold, stats } = useMetaStore();

  return (
    <div style={{ ...styles.container, backgroundImage: `url(${titleArt})` }}>
      {/* Bottom panel keeps controls readable over the busy artwork */}
      <div style={styles.panel}>
        <div style={styles.buttons}>
          <button style={styles.playBtn} onClick={onPlay}>
            ▶ Play
          </button>
          <button style={styles.secondaryBtn} onClick={onGarden}>
            🌱 Garden (upgrades)
            <span style={styles.goldBadge}>💰 {gold}</span>
          </button>
        </div>

        {stats.runsCompleted > 0 && (
          <div style={styles.stats}>
            <span>Runs: {stats.runsCompleted}</span>
            <span>Best: {formatTime(stats.bestTime)}</span>
            <span>Kills: {stats.totalKills.toLocaleString()}</span>
          </div>
        )}

        <div style={styles.controls}>
          <strong>Controls:</strong> WASD / Arrow Keys to move · Weapons fire automatically
        </div>
      </div>
    </div>
  );
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute', inset: 0,
    background: '#1a0606',
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
    backgroundRepeat: 'no-repeat',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
    fontFamily: '"Courier New", monospace',
  },
  panel: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    width: '100%', paddingBottom: 40, paddingTop: 60,
    background: 'linear-gradient(180deg, rgba(10,2,2,0) 0%, rgba(10,2,2,0.55) 45%, rgba(10,2,2,0.9) 100%)',
  },
  buttons: { display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', width: 280 },
  playBtn: {
    width: '100%', padding: '16px 0',
    background: 'linear-gradient(135deg, #e63333, #ff6633)',
    border: '2px solid #ff9966',
    borderRadius: 10, color: '#fff', fontSize: 22, fontWeight: 'bold',
    cursor: 'pointer', fontFamily: '"Courier New", monospace',
    boxShadow: '0 4px 20px rgba(230,50,50,0.4)',
    transition: 'transform 0.1s',
  },
  secondaryBtn: {
    width: '100%', padding: '12px 16px',
    background: 'rgba(30,60,15,0.8)',
    border: '1.5px solid #4a8a2a',
    borderRadius: 10, color: '#a8d888', fontSize: 16,
    cursor: 'pointer', fontFamily: '"Courier New", monospace',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  goldBadge: { background: 'rgba(255,230,0,0.15)', borderRadius: 6, padding: '2px 8px', fontSize: 14, color: '#ffe878' },
  stats: { display: 'flex', gap: 28, color: '#c8b890', fontSize: 13, textShadow: '1px 1px 2px #000' },
  controls: { color: '#a89878', fontSize: 13, textAlign: 'center', maxWidth: 360, textShadow: '1px 1px 2px #000' },
};
