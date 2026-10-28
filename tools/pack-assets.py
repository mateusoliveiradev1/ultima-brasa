#!/usr/bin/env python3
"""Empacota assets CC0 da Kenney (kenney.nl) em src/assets/kenney.js (data URLs).
Uso: python3 tools/pack-assets.py <pasta-do-espelho-kenney>"""
import sys, io, base64, json, subprocess, os
from PIL import Image
root = sys.argv[1]
out = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'kenney.js')

# nome no jogo -> arquivo do Particle Pack 1.1 (Transparent)
TEX = {
  'k_flame1': 'flame_02', 'k_flame2': 'flame_05', 'k_fire': 'fire_01', 'k_magic': 'magic_02', 'k_muzzle': 'muzzle_01',
  'k_slash': 'slash_02', 'k_slash2': 'slash_03', 'k_smoke': 'smoke_03', 'k_spark': 'spark_03', 'k_spark2': 'spark_05',
  'k_star': 'star_04', 'k_scorch': 'scorch_02', 'k_trace': 'trace_02', 'k_twirl': 'twirl_02', 'k_ring': 'circle_03',
  'k_light': 'light_02', 'k_rune': 'symbol_01', 'k_flare': 'flare_01',
}
tex = {}
for name, f in TEX.items():
    im = Image.open(f'{root}/particlePack_1.1/PNG (Transparent)/{f}.png').convert('RGBA').resize((128, 128), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
    tex[name] = 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

SFX = {
  'hit1': 'kenney_impactsounds/Audio/impactMetal_light_000.ogg', 'hit2': 'kenney_impactsounds/Audio/impactMetal_light_002.ogg',
  'hit3': 'kenney_impactsounds/Audio/impactPlate_light_001.ogg', 'hitHeavy': 'kenney_impactsounds/Audio/impactMetal_heavy_001.ogg',
  'punch': 'kenney_impactsounds/Audio/impactPunch_medium_001.ogg', 'thud': 'kenney_impactsounds/Audio/impactSoft_heavy_000.ogg',
  'glass': 'kenney_impactsounds/Audio/impactGlass_light_001.ogg', 'bell': 'kenney_impactsounds/Audio/impactBell_heavy_001.ogg',
  'slash1': 'kenney_rpgaudio/Audio/knifeSlice.ogg', 'slash2': 'kenney_rpgaudio/Audio/knifeSlice2.ogg', 'draw': 'kenney_rpgaudio/Audio/drawKnife2.ogg',
  'coin': 'kenney_rpgaudio/Audio/handleCoins.ogg', 'coin2': 'kenney_rpgaudio/Audio/handleCoins2.ogg', 'latch': 'kenney_rpgaudio/Audio/metalLatch.ogg',
  'step': 'kenney_impactsounds/Audio/footstep_concrete_001.ogg', 'creak': 'kenney_rpgaudio/Audio/creak2.ogg', 'pot': 'kenney_rpgaudio/Audio/metalPot2.ogg',
  'click': 'kenney_uiaudio/Audio/click3.ogg', 'over': 'kenney_uiaudio/Audio/rollover2.ogg', 'switch': 'kenney_uiaudio/Audio/switch1.ogg', 'release': 'kenney_uiaudio/Audio/mouserelease1.ogg',
}
sfx = {}
for name, f in SFX.items():
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{root}/{f}', '-t', '1.6', '-ac', '1', '-ar', '32000', '-c:a', 'libmp3lame', '-b:a', '48k', '-f', 'mp3', '-'], capture_output=True, check=True)
    sfx[name] = 'data:audio/mpeg;base64,' + base64.b64encode(p.stdout).decode()

with open(out, 'w') as fh:
    fh.write('// GERADO por tools/pack-assets.py — Kenney.nl (CC0). Não editar à mão.\n')
    fh.write('export const KENNEY_TEX = ' + json.dumps(tex) + ';\n')
    fh.write('export const KENNEY_SFX = ' + json.dumps(sfx) + ';\n')
print('ok', os.path.getsize(out) // 1024, 'KB', len(tex), 'texturas', len(sfx), 'sons')
