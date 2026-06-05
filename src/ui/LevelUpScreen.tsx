import type { Upgrade } from '../game/upgrades/UpgradeRegistry';

interface LevelUpScreenProps {
  options: Upgrade[];
  level: number;
  onChoose: (upgrade: Upgrade) => void;
}

export function LevelUpScreen({ options, level, onChoose }: LevelUpScreenProps) {
  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.title}>🎉 Level {level}!</div>
        <div style={styles.subtitle}>Choose an upgrade:</div>
        <div style={styles.cards}>
          {options.map((upgrade) => (
            <button key={upgrade.id} style={styles.card} onClick={() => onChoose(upgrade)}>
              <div style={styles.cardIcon}>{upgrade.icon}</div>
              <div style={styles.cardName}>{upgrade.name}</div>
              <div style={styles.cardType}>{typeLabel(upgrade.type)}</div>
              <div style={styles.cardDesc}>{upgrade.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function typeLabel(type: string): string {
  switch (type) {
    case 'weapon_levelup': return '⬆ Level Up';
    case 'weapon_stack':   return '➕ Stack';
    case 'new_weapon':     return '🆕 New Weapon';
    case 'passive':        return '✨ Passive';
    default:               return type;
  }
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  panel: {
    background: 'linear-gradient(160deg, #1a2e10 0%, #0d1a08 100%)',
    border: '2px solid #4a8a2a',
    borderRadius: 16,
    padding: '28px 32px',
    maxWidth: 700,
    width: '90vw',
    fontFamily: '"Courier New", monospace',
    boxShadow: '0 0 40px rgba(80,200,60,0.3)',
  },
  title: {
    color: '#ffe878',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadow: '0 0 12px rgba(255,230,100,0.6)',
    marginBottom: 4,
  },
  subtitle: { color: '#a8d888', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  cards: { display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' },
  card: {
    background: 'rgba(30,50,15,0.9)',
    border: '1.5px solid rgba(100,180,60,0.4)',
    borderRadius: 12,
    padding: '18px 20px',
    width: 180,
    cursor: 'pointer',
    textAlign: 'center',
    fontFamily: '"Courier New", monospace',
    transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
    color: '#cceebb',
  },
  cardIcon: { fontSize: 36, marginBottom: 8 },
  cardName: { color: '#e8f8c0', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  cardType: { color: '#80c060', fontSize: 11, marginBottom: 8, opacity: 0.8 },
  cardDesc: { color: '#99bb88', fontSize: 12, lineHeight: 1.5 },
};
