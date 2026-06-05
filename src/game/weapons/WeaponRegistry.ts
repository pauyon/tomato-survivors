import { SeedShot }       from './SeedShot';
import { VineWhip }       from './VineWhip';
import { CompostBomb }    from './CompostBomb';
import { PesticideSpray } from './PesticideSpray';
import { GardenAxe }      from './GardenAxe';
import { FertilizerPot }  from './FertilizerPot';
import { WateringOrb }    from './WateringOrb';
import { TomatoKnife }    from './TomatoKnife';
import { WeedWhacker }    from './WeedWhacker';
import type { Weapon }    from './Weapon';
import type { Player }    from '../entities/Player';

export type WeaponId =
  | 'seed_shot'
  | 'vine_whip'
  | 'compost_bomb'
  | 'pesticide_spray'
  | 'garden_axe'
  | 'fertilizer_pot'
  | 'watering_orb'
  | 'tomato_knife'
  | 'weed_whacker';

export function createWeapon(id: WeaponId): Weapon {
  switch (id) {
    case 'seed_shot':       return new SeedShot();
    case 'vine_whip':       return new VineWhip();
    case 'compost_bomb':    return new CompostBomb();
    case 'pesticide_spray': return new PesticideSpray();
    case 'garden_axe':      return new GardenAxe();
    case 'fertilizer_pot':  return new FertilizerPot();
    case 'watering_orb':    return new WateringOrb();
    case 'tomato_knife':    return new TomatoKnife();
    case 'weed_whacker':    return new WeedWhacker();
  }
}

/** Copy a player's character-perk weapon modifiers onto a weapon instance. */
export function applyPerkToWeapon(weapon: Weapon, player: Player): void {
  weapon.bonusCount = player.stats.bonusProjectiles;
  weapon.areaMult = player.stats.areaMult;
}

export interface WeaponMeta {
  name: string;
  description: string;
  icon: string;
}

export const WEAPON_META: Record<WeaponId, WeaponMeta> = {
  seed_shot:       { name: 'Seed Shot',       description: 'Fires seeds in all directions automatically.',          icon: '🌱' },
  vine_whip:       { name: 'Vine Whip',       description: 'Lashes thorny vines to your left and right.',          icon: '🌿' },
  compost_bomb:    { name: 'Compost Bomb',    description: 'Lobs explosive compost at the nearest enemies.',        icon: '💣' },
  pesticide_spray: { name: 'Pesticide Spray', description: 'Sprays a toxic cone forward, dealing high damage.',     icon: '🧪' },
  garden_axe:      { name: 'Garden Axe',      description: 'Hurls a spinning axe in an arcing trajectory.',        icon: '🪓' },
  fertilizer_pot:  { name: 'Fertilizer Pot',  description: 'Lobs clay pots that shatter in a large AoE blast.',   icon: '🪴' },
  watering_orb:    { name: 'Watering Orb',    description: 'A magic water orb orbits you, damaging on contact.',   icon: '💧' },
  tomato_knife:    { name: 'Tomato Knife',    description: 'Hurls sharp tomato slices at the nearest enemy.',      icon: '🔪' },
  weed_whacker:    { name: 'Weed Whacker',    description: 'Swings a wide slash in your facing direction.',        icon: '🌀' },
};
