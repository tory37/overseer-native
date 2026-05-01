import {
  bottts,
  pixelArt,
  funEmoji,
  avataaars,
  micah,
  personas,
} from '@dicebear/collection'

export type OptionDef =
  | { type: 'enum';  key: string; label: string; values: string[] }
  | { type: 'color'; key: string; label: string; values: string[] }

export interface StyleDef {
  id: string
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collection: any
  options: OptionDef[]
}

export const CURATED_STYLES: StyleDef[] = [
  {
    id: 'bottts',
    label: 'Bottts',
    collection: bottts,
    options: [
      { type: 'enum',  key: 'eyes',      label: 'Eyes',    values: ['bulging','dizzy','eva','frame01','frame02','glow','happy','hearts','round','roundFrame01','roundFrame02','sensor','shade01'] },
      { type: 'enum',  key: 'face',      label: 'Face',    values: ['round01','round02','square01','square02','square03','square04'] },
      { type: 'enum',  key: 'mouth',     label: 'Mouth',   values: ['diagram','grill01','grill02','grill03','smile01','smile02','square01','square02'] },
      { type: 'enum',  key: 'top',       label: 'Top',     values: ['antenna','antennaCrooked','bulb01','glowingBulb01','glowingBulb02','horns','lights','pyramid','radar'] },
      { type: 'enum',  key: 'sides',     label: 'Sides',   values: ['antenna01','antenna02','cables01','cables02','round','square','squareAssymetric'] },
      { type: 'enum',  key: 'texture',   label: 'Texture', values: ['camo01','camo02','circuits','dirty01','dirty02','dots','grunge01','grunge02'] },
      { type: 'color', key: 'baseColor', label: 'Color',   values: ['ffb300','1e88e5','546e7a','6d4c41','00acc1','f4511e','5e35b1','43a047','757575','3949ab','039be5','7cb342','c0ca33','fb8c00','d81b60','8e24aa','e53935','00897b','fdd835'] },
    ],
  },
  {
    id: 'pixel-art',
    label: 'Pixel Art',
    collection: pixelArt,
    options: [
      { type: 'enum',  key: 'eyes',          label: 'Eyes',         values: ['variant01','variant02','variant03','variant04','variant05','variant06','variant07','variant08','variant09','variant10','variant11'] },
      { type: 'enum',  key: 'mouth',         label: 'Mouth',        values: ['happy01','happy02','happy03','happy04','happy05','happy06','happy07','happy08','happy09','happy10','happy11','happy12','sad01','sad02','sad03','sad04','sad05','sad06','sad07','sad08','sad09','sad10'] },
      { type: 'enum',  key: 'hair',          label: 'Hair',         values: ['short01','short02','short03','short04','short05','short06','short07','short08','short09','short10','short11','short12','short13','short14','short15','short16','short17','short18','short19','short20','short21','short22','short23','short24','long01','long02','long03','long04','long05','long06','long07','long08','long09','long10','long11','long12','long13','long14','long15','long16','long17','long18','long19','long20','long21'] },
      { type: 'enum',  key: 'clothing',      label: 'Clothing',     values: ['variant01','variant02','variant03','variant04','variant05','variant06','variant07','variant08','variant09','variant10','variant11','variant12','variant13','variant14','variant15','variant16','variant17','variant18','variant19','variant20','variant21','variant22','variant23'] },
      { type: 'color', key: 'skinColor',     label: 'Skin',         values: ['ffdbac','f5cfa0','eac393','e0b687','cb9e6e','b68655','a26d3d','8d5524'] },
      { type: 'color', key: 'hairColor',     label: 'Hair Color',   values: ['cab188','603a14','83623b','a78961','611c17','603015','612616','28150a','009bbd','bd1700','91cb15'] },
      { type: 'color', key: 'clothingColor', label: 'Outfit Color', values: ['5bc0de','428bca','03396c','88d8b0','44c585','00b159','ff6f69','d11141','ae0001','ffeead','ffd969','ffc425'] },
    ],
  },
  {
    id: 'fun-emoji',
    label: 'Fun Emoji',
    collection: funEmoji,
    options: [
      { type: 'enum', key: 'eyes',  label: 'Eyes',  values: ['closed','closed2','crying','cute','glasses','love','pissed','plain','sad','shades','stars','tearDrop','wink','wink2'] },
      { type: 'enum', key: 'mouth', label: 'Mouth', values: ['plain','lilSmile','sad','shy','cute','wideSmile','smileTeeth','smileLol','pissed','drip','tongueOut','kissHeart','sick','faceMask'] },
    ],
  },
  {
    id: 'avataaars',
    label: 'Avataaars',
    collection: avataaars,
    options: [
      { type: 'enum',  key: 'eyes',      label: 'Eyes',       values: ['closed','cry','default','happy','hearts','side','squint','surprised','wink','winkWacky','xDizzy'] },
      { type: 'enum',  key: 'mouth',     label: 'Mouth',      values: ['concerned','default','disbelief','eating','grimace','sad','serious','smile','tongue','twinkle','vomit'] },
      { type: 'enum',  key: 'eyebrows',  label: 'Eyebrows',   values: ['angry','angryNatural','default','defaultNatural','flatNatural','frownNatural','raisedExcited','raisedExcitedNatural','sadConcerned','sadConcernedNatural','unibrowNatural','upDown','upDownNatural'] },
      { type: 'enum',  key: 'top',       label: 'Hair',       values: ['bigHair','bob','bun','curly','curvy','dreads','dreads01','dreads02','frida','fro','froBand','frizzle','hat','hijab','longButNotTooLong','miaWallace','shaggy','shaggyMullet','shavedSides','shortCurly','shortFlat','shortRound','shortWaved','sides','straight01','straight02','straightAndStrand','theCaesar','theCaesarAndSidePart','turban','winterHat01','winterHat02','winterHat03','winterHat04'] },
      { type: 'enum',  key: 'clothing',  label: 'Clothing',   values: ['blazerAndShirt','blazerAndSweater','collarAndSweater','graphicShirt','hoodie','overall','shirtCrewNeck','shirtScoopNeck','shirtVNeck'] },
      { type: 'color', key: 'skinColor', label: 'Skin',       values: ['614335','d08b5b','ae5d29','edb98a','ffdbb4','fd9841','f8d25c'] },
      { type: 'color', key: 'hairColor', label: 'Hair Color', values: ['2c1b18','4a312c','724133','a55728','b58143','c93305','d6b370','e8e1e1','ecdcbf','f59797'] },
    ],
  },
  {
    id: 'micah',
    label: 'Micah',
    collection: micah,
    options: [
      { type: 'enum',  key: 'eyes',      label: 'Eyes',       values: ['eyes','eyesShadow','round','smiling','smilingShadow'] },
      { type: 'enum',  key: 'mouth',     label: 'Mouth',      values: ['frown','nervous','pucker','sad','smile','smirk','surprised'] },
      { type: 'enum',  key: 'hair',      label: 'Hair',       values: ['dannyPhantom','dougFunny','fonze','full','mrClean','mrT','pixie','turban'] },
      { type: 'enum',  key: 'eyebrows',  label: 'Eyebrows',   values: ['down','eyelashesDown','eyelashesUp'] },
      { type: 'enum',  key: 'nose',      label: 'Nose',       values: ['curve','pointed','tound'] },
      { type: 'enum',  key: 'ears',      label: 'Ears',       values: ['attached','detached'] },
      { type: 'color', key: 'baseColor', label: 'Skin',       values: ['77311d','ac6651','f9c9b6'] },
      { type: 'color', key: 'hairColor', label: 'Hair Color', values: ['000000','6bd9e9','77311d','9287ff','ac6651','d2eff3','e0ddff','f4d150','f9c9b6','fc909f','ffeba4','ffffff'] },
    ],
  },
  {
    id: 'personas',
    label: 'Personas',
    collection: personas,
    options: [
      { type: 'enum',  key: 'eyes',      label: 'Eyes',       values: ['glasses','happy','open','sunglasses','wink'] },
      { type: 'enum',  key: 'mouth',     label: 'Mouth',      values: ['bigSmile','frown','lips','pacifier','smile','smirk'] },
      { type: 'enum',  key: 'hair',      label: 'Hair',       values: ['bald','balding','beanie','bobBangs','bobCut','bunUndercut','buzzcut','cap','curly','curlyBun','curlyHighTop','extraLong','fade','long','mohawk','pigtails','shortCombover','shortComboverChops','sideShave','straightBun'] },
      { type: 'enum',  key: 'body',      label: 'Body',       values: ['checkered','rounded','small','squared'] },
      { type: 'enum',  key: 'nose',      label: 'Nose',       values: ['mediumRound','smallRound','wrinkles'] },
      { type: 'color', key: 'skinColor', label: 'Skin',       values: ['623d36','92594b','b16a5b','d78774','e5a07e','e7a391','eeb4a4'] },
      { type: 'color', key: 'hairColor', label: 'Hair Color', values: ['362c47','6c4545','dee1f5','e15c66','e16381','f27d65','f29c65'] },
    ],
  },
]

export const ANIMATION_OVERRIDES: Record<string, {
  thinking: Record<string, string>,
  speaking: Record<string, string>
}> = {
  'bottts': {
    thinking: { eyes: 'robocop' },
    speaking: { mouth: 'bite' }
  },
  'pixel-art': {
    thinking: { eyes: 'variant12' },
    speaking: { mouth: 'happy13' }
  },
  'fun-emoji': {
    thinking: { eyes: 'sleepClose' },
    speaking: { mouth: 'shout' }
  },
  'avataaars': {
    thinking: { eyes: 'eyeRoll' },
    speaking: { mouth: 'screamOpen' }
  },
  'micah': {
    thinking: { eyebrows: 'up' },
    speaking: { mouth: 'laughing' }
  },
  'personas': {
    thinking: { eyes: 'sleep' },
    speaking: { mouth: 'surprise' }
  }
}
