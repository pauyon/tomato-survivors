import { useState } from 'react';
import { CHARACTERS, type CharacterDef } from '../game/characters/CharacterRegistry';
import { WEAPON_META } from '../game/weapons/WeaponRegistry';
import { useMetaStore } from '../meta/MetaStore';

interface CharacterSelectScreenProps {
  onConfirm: (characterId: string) => void;
  onBack: () => void;
}

export function CharacterSelectScreen({ onConfirm, onBack }: CharacterSelectScreenProps) {
  const { selectedCharacterId, selectCharacter, isCharacterUnlocked, unlockCharacter, gold } = useMetaStore();
  const [hovered, setHovered] = useState<string | null>(null);

  const activeId = hovered ?? selectedCharacterId;
  const activeChar = CHARACTERS.find(c => c.id === activeId) ?? CHARACTERS[0];

  const handleSelect = (char: CharacterDef) => {
    if (!isCharacterUnlocked(char.id)) return;
    selectCharacter(char.id);
  };

  const handleUnlock = (char: CharacterDef) => {
    if (unlockCharacter(char.id)) selectCharacter(char.id);
  };

  const handleConfirm = () => {
    if (isCharacterUnlocked(selectedCharacterId)) {
      onConfirm(selectedCharacterId);
    }
  };

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <div style={s.title}>Choose Your Hero</div>
        <div style={s.titleRight}>💰 {gold}</div>
      </div>

      <div style={s.body}>
        {/* Character grid (left) */}
        <div style={s.grid}>
          {CHARACTERS.filter(char => !char.hidden).map(char => {
            const unlocked = isCharacterUnlocked(char.id);
            const selected = selectedCharacterId === char.id;
            return (
              <div
                key={char.id}
                style={{
                  ...s.card,
                  borderColor: selected ? char.color : unlocked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                  boxShadow: selected ? `0 0 20px ${char.color}55` : 'none',
                  opacity: unlocked ? 1 : 0.55,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                }}
                onClick={() => handleSelect(char)}
                onMouseEnter={() => setHovered(char.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Portrait */}
                <div style={{ ...s.portrait, background: unlocked ? `${char.color}22` : 'rgba(0,0,0,0.3)' }}>
                  {unlocked ? <Portrait char={char} size={48} /> : <div style={s.emoji}>🔒</div>}
                  {selected && <div style={{ ...s.selectedBadge, borderColor: char.color, color: char.color }}>✓</div>}
                  {!unlocked && (
                    <button
                      style={{
                        ...s.portraitUnlockBtn,
                        opacity: gold >= char.unlockCost ? 1 : 0.55,
                        cursor: gold >= char.unlockCost ? 'pointer' : 'not-allowed',
                      }}
                      onClick={(e) => { e.stopPropagation(); handleUnlock(char); }}
                      disabled={gold < char.unlockCost}
                    >
                      🔓 {char.unlockCost}💰
                    </button>
                  )}
                </div>

                <div style={s.cardName}>{char.name}</div>
                <div style={s.cardTagline}>{unlocked ? char.tagline : `🔒 ${char.unlockCost} gold`}</div>

                {/* Starting weapon badge (only when unlocked) */}
                {unlocked && (
                  <div style={s.weaponBadge}>
                    <span>{WEAPON_META[char.startingWeapon]?.icon}</span>
                    <span style={s.weaponBadgeName}>{WEAPON_META[char.startingWeapon]?.name}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail panel (right) */}
        <div style={s.detail}>
          <div style={s.detailEmoji}><Portrait char={activeChar} size={72} /></div>
          <div style={{ ...s.detailName, color: activeChar.color }}>{activeChar.name}</div>
          <div style={s.detailTagline}>{activeChar.tagline}</div>
          <div style={s.detailDesc}>{activeChar.description}</div>

          <div style={s.divider} />

          <div style={s.detailSection}>Starting Weapon</div>
          <div style={s.weaponRow}>
            <span style={s.weaponRowIcon}>{WEAPON_META[activeChar.startingWeapon]?.icon}</span>
            <div>
              <div style={s.weaponRowName}>{WEAPON_META[activeChar.startingWeapon]?.name}</div>
              <div style={s.weaponRowDesc}>{WEAPON_META[activeChar.startingWeapon]?.description}</div>
            </div>
          </div>

          <div style={s.divider} />

          <div style={s.detailSection}>Signature Perk</div>
          <div style={s.perkRow}>
            <span style={s.perkName}>★ {activeChar.perk.name}</span>
            <div style={s.perkDesc}>{activeChar.perk.description}</div>
          </div>

          <div style={s.divider} />

          <div style={s.detailSection}>Stats</div>
          <div style={s.statGrid}>
            {activeChar.statTags.map(tag => (
              <div key={tag} style={s.statTag}>{tag}</div>
            ))}
          </div>

          {!isCharacterUnlocked(activeChar.id) && (
            <button
              style={{
                ...s.unlockBtn,
                opacity: gold >= activeChar.unlockCost ? 1 : 0.5,
                cursor: gold >= activeChar.unlockCost ? 'pointer' : 'not-allowed',
              }}
              onClick={() => handleUnlock(activeChar)}
              disabled={gold < activeChar.unlockCost}
            >
              🔒 Unlock — {activeChar.unlockCost} gold
            </button>
          )}

          <div style={s.divider} />

          <button
            style={{
              ...s.startBtn,
              opacity: isCharacterUnlocked(selectedCharacterId) ? 1 : 0.4,
              cursor: isCharacterUnlocked(selectedCharacterId) ? 'pointer' : 'not-allowed',
              background: `linear-gradient(135deg, ${CHARACTERS.find(c => c.id === selectedCharacterId)?.color ?? '#e63333'}, #ff6633)`,
            }}
            onClick={handleConfirm}
            disabled={!isCharacterUnlocked(selectedCharacterId)}
          >
            ▶ Begin Harvest!
          </button>
        </div>
      </div>
    </div>
  );
}

/** Character portrait: frame 0 of the sprite sheet if present, else the emoji. */
function Portrait({ char, size }: { char: CharacterDef; size: number }) {
  if (char.portraitSheet) {
    return (
      <div
        style={{
          width: size, height: size, margin: '0 auto',
          backgroundImage: `url(${char.portraitSheet})`,
          backgroundSize: `${size * 4}px ${size}px`, // 4-frame sheet → show frame 0
          backgroundPosition: '0 0',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
        }}
      />
    );
  }
  return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{char.emoji}</span>;
}

const s: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg, #080e04 0%, #0d1a08 100%)',
    fontFamily: '"Courier New", monospace',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  backBtn: { padding: '8px 16px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#aaa', cursor: 'pointer', fontFamily: '"Courier New", monospace', fontSize: 14 },
  title: { flex: 1, textAlign: 'center', color: '#e0f0c0', fontSize: 26, fontWeight: 'bold', letterSpacing: 2 },
  titleRight: { width: 90, textAlign: 'right', color: '#ffe878', fontSize: 16, fontWeight: 'bold' },
  body: { display: 'flex', flex: 1, overflow: 'hidden', padding: '24px 24px 16px' },

  // Grid
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignContent: 'start', width: 340, flexShrink: 0 },
  card: {
    background: 'rgba(20,35,10,0.9)', border: '2px solid', borderRadius: 12,
    padding: 14, cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
  },
  portrait: { borderRadius: 8, padding: '10px 0', textAlign: 'center', marginBottom: 8, position: 'relative' },
  emoji: { fontSize: 48, lineHeight: 1 },
  selectedBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: '50%', border: '2px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold',
  },
  portraitUnlockBtn: {
    position: 'absolute', left: '50%', bottom: 6, transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
    background: 'linear-gradient(135deg, #6a4a1a, #b8862e)',
    border: '1.5px solid #d8a850', borderRadius: 7,
    color: '#fff5d8', fontSize: 12, fontWeight: 'bold', padding: '4px 8px',
    fontFamily: '"Courier New", monospace',
  },
  cardName: { color: '#e0f0c0', fontWeight: 'bold', fontSize: 14, marginBottom: 2, textAlign: 'center' },
  cardTagline: { color: '#708860', fontSize: 11, textAlign: 'center', marginBottom: 6 },
  weaponBadge: { display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 6px', justifyContent: 'center' },
  weaponBadgeName: { color: '#90b870', fontSize: 11 },

  // Detail panel
  detail: {
    flex: 1, marginLeft: 28, display: 'flex', flexDirection: 'column',
    overflowY: 'auto', paddingRight: 4,
  },
  detailEmoji: { fontSize: 64, textAlign: 'center', marginBottom: 6 },
  detailName: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
  detailTagline: { color: '#90a880', fontSize: 14, textAlign: 'center', marginBottom: 10, fontStyle: 'italic' },
  detailDesc: { color: '#8a9878', fontSize: 13, lineHeight: 1.6, marginBottom: 4 },
  divider: { height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0' },
  detailSection: { color: '#60a040', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },

  weaponRow: { display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px' },
  weaponRowIcon: { fontSize: 28, flexShrink: 0 },
  weaponRowName: { color: '#c8e8a0', fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  weaponRowDesc: { color: '#708860', fontSize: 12 },

  statGrid: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  statTag: { background: 'rgba(80,160,40,0.18)', border: '1px solid rgba(80,160,40,0.3)', borderRadius: 6, padding: '4px 10px', color: '#a0d080', fontSize: 12 },

  perkRow: { background: 'rgba(120,80,200,0.12)', border: '1px solid rgba(150,110,230,0.3)', borderRadius: 8, padding: '10px 12px' },
  perkName: { color: '#cbb0ff', fontWeight: 'bold', fontSize: 14 },
  perkDesc: { color: '#9a90b8', fontSize: 12, marginTop: 4, lineHeight: 1.5 },
  unlockBtn: {
    marginTop: 12, padding: '12px 0', width: '100%',
    background: 'linear-gradient(135deg, #6a4a1a, #b8862e)',
    border: '2px solid #d8a850', borderRadius: 10,
    color: '#fff5d8', fontSize: 15, fontWeight: 'bold',
    fontFamily: '"Courier New", monospace',
  },

  startBtn: {
    marginTop: 'auto', padding: '14px 0',
    border: '2px solid rgba(255,255,255,0.3)', borderRadius: 10,
    color: '#fff', fontSize: 18, fontWeight: 'bold',
    fontFamily: '"Courier New", monospace',
    transition: 'transform 0.1s',
  },
};
