import { useEffect, useState } from 'react';
import type { ChestReward } from '../game/upgrades/UpgradeRegistry';

interface ChestOpenScreenProps {
  reward: ChestReward;
  onClaim: (reward: ChestReward) => void;
}

export function ChestOpenScreen({ reward, onClaim }: ChestOpenScreenProps) {
  const [phase, setPhase] = useState<'shaking' | 'revealed'>('shaking');

  useEffect(() => {
    const id = setTimeout(() => setPhase('revealed'), 1300);
    return () => clearTimeout(id);
  }, []);

  return (
    <div style={styles.overlay}>
      <style>{KEYFRAMES}</style>
      <div style={styles.panel}>
        {phase === 'shaking' ? (
          <div style={styles.stage}>
            <div style={styles.shakeChest}>🎁</div>
            <div style={styles.rays} />
            <div style={styles.openingLabel}>Opening…</div>
          </div>
        ) : (
          <div style={styles.reveal}>
            <div style={styles.burstChest}>✨🎁✨</div>
            <div style={styles.goldLine}>💰 +{reward.gold} gold</div>
            <div style={styles.card}>
              <div style={styles.cardIcon}>{reward.upgrade.icon}</div>
              <div style={styles.cardName}>{reward.upgrade.name}</div>
              <div style={styles.cardDesc}>{reward.upgrade.description}</div>
            </div>
            <button style={styles.claimBtn} onClick={() => onClaim(reward)}>Claim!</button>
          </div>
        )}
      </div>
    </div>
  );
}

const KEYFRAMES = `
@keyframes chestShake {
  0%, 100% { transform: rotate(0deg) scale(1); }
  20% { transform: rotate(-12deg) scale(1.05); }
  40% { transform: rotate(12deg) scale(1.05); }
  60% { transform: rotate(-8deg) scale(1.1); }
  80% { transform: rotate(8deg) scale(1.1); }
}
@keyframes raysSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes burstPop {
  0% { transform: scale(0.2); opacity: 0; }
  60% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes cardRise { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  panel: {
    background: 'linear-gradient(160deg, #2a230a 0%, #14100a 100%)',
    border: '2px solid #caa030',
    borderRadius: 16,
    padding: '32px 40px',
    minWidth: 320,
    fontFamily: '"Courier New", monospace',
    boxShadow: '0 0 50px rgba(255,210,80,0.35)',
    textAlign: 'center',
  },
  stage: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 },
  shakeChest: { fontSize: 90, animation: 'chestShake 0.5s ease-in-out infinite', zIndex: 2 },
  rays: {
    position: 'absolute', width: 200, height: 200,
    background: 'conic-gradient(rgba(255,225,100,0.25) 0deg, transparent 20deg, rgba(255,225,100,0.25) 40deg, transparent 60deg, rgba(255,225,100,0.25) 80deg, transparent 100deg, rgba(255,225,100,0.25) 120deg, transparent 140deg, rgba(255,225,100,0.25) 160deg, transparent 180deg, rgba(255,225,100,0.25) 200deg, transparent 220deg, rgba(255,225,100,0.25) 240deg, transparent 260deg, rgba(255,225,100,0.25) 280deg, transparent 300deg, rgba(255,225,100,0.25) 320deg, transparent 340deg)',
    borderRadius: '50%', animation: 'raysSpin 6s linear infinite', zIndex: 1,
  },
  openingLabel: { position: 'absolute', bottom: 0, color: '#ffe070', fontSize: 16, letterSpacing: 2 },
  reveal: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  burstChest: { fontSize: 48, marginBottom: 8, animation: 'burstPop 0.5s ease-out' },
  goldLine: { color: '#ffe878', fontSize: 18, fontWeight: 'bold', marginBottom: 16, animation: 'cardRise 0.4s ease-out 0.1s both' },
  card: {
    background: 'rgba(40,34,12,0.9)', border: '1.5px solid rgba(202,160,48,0.5)', borderRadius: 12,
    padding: '18px 24px', width: 220, marginBottom: 20, animation: 'cardRise 0.4s ease-out 0.2s both',
  },
  cardIcon: { fontSize: 40, marginBottom: 8 },
  cardName: { color: '#ffe8a0', fontWeight: 'bold', fontSize: 16, marginBottom: 6 },
  cardDesc: { color: '#c8b888', fontSize: 13, lineHeight: 1.5 },
  claimBtn: {
    padding: '12px 40px', background: 'linear-gradient(135deg, #caa030, #ffe070)',
    border: '2px solid #fff3c0', borderRadius: 10, color: '#3d2a10',
    fontSize: 18, fontWeight: 'bold', fontFamily: '"Courier New", monospace', cursor: 'pointer',
    animation: 'cardRise 0.4s ease-out 0.3s both',
  },
};
