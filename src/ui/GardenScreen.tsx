import { useMetaStore } from '../meta/MetaStore';
import { GARDEN_UPGRADE_DEFS } from '../meta/GardenUpgrades';

interface GardenScreenProps {
  onBack: () => void;
}

export function GardenScreen({ onBack }: GardenScreenProps) {
  const { gold, gardenLevels, purchaseUpgrade } = useMetaStore();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <div style={styles.title}>🌱 The Garden</div>
        <div style={styles.gold}>💰 {gold} gold</div>
      </div>

      <div style={styles.subtitle}>Permanent upgrades that persist between runs</div>

      <div style={styles.grid}>
        {GARDEN_UPGRADE_DEFS.map((def) => {
          const level = gardenLevels[def.id] ?? 0;
          const maxed = level >= def.maxLevel;
          const cost = maxed ? 0 : def.costAtLevel(level);
          const canAfford = gold >= cost;

          return (
            <div key={def.id} style={{ ...styles.card, opacity: maxed ? 0.6 : 1 }}>
              <div style={styles.cardIcon}>{def.icon}</div>
              <div style={styles.cardName}>{def.name}</div>
              <div style={styles.cardDesc}>{def.desc}</div>
              <div style={styles.levelBar}>
                {Array.from({ length: def.maxLevel }).map((_, i) => (
                  <div key={i} style={{ ...styles.pip, background: i < level ? '#4a8a2a' : 'rgba(255,255,255,0.1)' }} />
                ))}
              </div>
              {maxed ? (
                <div style={styles.maxedTag}>MAXED</div>
              ) : (
                <button
                  style={{ ...styles.buyBtn, opacity: canAfford ? 1 : 0.5, cursor: canAfford ? 'pointer' : 'not-allowed' }}
                  onClick={() => purchaseUpgrade(def.id)}
                  disabled={!canAfford}
                >
                  💰 {cost}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg, #0a1e04 0%, #102808 100%)',
    fontFamily: '"Courier New", monospace',
    overflow: 'auto', padding: 20,
  },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 },
  backBtn: { padding: '8px 16px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#aaa', cursor: 'pointer', fontFamily: '"Courier New", monospace', fontSize: 14 },
  title: { flex: 1, color: '#a8d888', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  gold: { color: '#ffe878', fontSize: 18, fontWeight: 'bold', minWidth: 80, textAlign: 'right' },
  subtitle: { color: '#607850', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, maxWidth: 900, margin: '0 auto' },
  card: { background: 'rgba(20,40,10,0.85)', border: '1px solid rgba(80,140,40,0.35)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' },
  cardIcon: { fontSize: 30 },
  cardName: { color: '#c8e8a0', fontWeight: 'bold', fontSize: 13 },
  cardDesc: { color: '#708860', fontSize: 12, flexGrow: 1 },
  levelBar: { display: 'flex', gap: 3, justifyContent: 'center', marginTop: 4 },
  pip: { width: 16, height: 6, borderRadius: 3 },
  buyBtn: { marginTop: 4, padding: '7px 0', background: 'linear-gradient(135deg, #2a5a10, #3a7a18)', border: '1px solid #5a9a28', borderRadius: 7, color: '#c8e880', fontWeight: 'bold', fontSize: 13, fontFamily: '"Courier New", monospace' },
  maxedTag: { color: '#ffe878', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
};
