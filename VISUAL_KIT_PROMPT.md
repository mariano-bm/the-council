# PROMPT — Kit de animaciones y backgrounds (portable / adaptable)

> Pegá TODO lo que está debajo de la línea en el chat del otro proyecto (con Claude Code o el agente que uses).
> Está pensado para adaptarse: el agente primero detecta tu paleta/tema y después implementa los efectos con ESOS colores.

---

Quiero que sumes a este proyecto un sistema de **animaciones y fondos premium** (partículas flotantes, glassmorphism, glows, shimmer, reveals épicos con confetti, toasts animados y micro-interacciones). Vengo de otro proyecto donde quedó hermoso y lo quiero replicar acá, pero **adaptado a la estética de ESTE proyecto** — no copiar los colores, sino el sistema.

## PASO 0 — Adaptá antes de codear (IMPORTANTE)
Antes de escribir nada:
1. Detectá el stack: ¿React + Vite? ¿Next? ¿Tailwind sí/no? ¿Hay `framer-motion`? Si falta, instalá `framer-motion` y `canvas-confetti`.
2. Detectá la **paleta y tipografía** del proyecto (mirá el tailwind.config / CSS / componentes existentes). Definí 3 tokens que vas a usar en TODO el kit:
   - `ACCENT` = color de acento principal (el dorado del original era `#d4a847` — acá usá el del proyecto).
   - `ACCENT_2` = color secundario para gradientes.
   - `BG_DARK` = fondo casi-negro del proyecto.
   Si el proyecto es claro (no dark), adaptá las opacidades y el background de partículas para que se vean sobre claro.
3. Reemplazá CADA `rgba(212,168,71,...)` (el dorado original) por tu `ACCENT`. No dejes ningún color hardcodeado del proyecto viejo.

## PASO 1 — Config de animaciones (Tailwind)
Si usás Tailwind, sumá al `theme.extend`:
```js
boxShadow: {
  'glow-accent': '0 0 20px rgba(ACCENT_RGB, 0.4)',
  'glass': '0 8px 32px rgba(0,0,0,0.5)',
},
animation: {
  'shimmer': 'shimmer 2s infinite',
  'float': 'float 3s ease-in-out infinite',
  'fire-glow': 'fire-glow 2s ease-in-out infinite alternate',
  'count-up': 'count-up 1s ease-out',
},
keyframes: {
  shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
  float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
  'fire-glow': { '0%': { boxShadow: '0 0 10px rgba(ACCENT_RGB,0.2)' }, '100%': { boxShadow: '0 0 25px rgba(ACCENT_RGB,0.45)' } },
  'count-up': { '0%': { transform:'scale(0.5)', opacity:'0' }, '50%': { transform:'scale(1.2)' }, '100%': { transform:'scale(1)', opacity:'1' } },
},
```

## PASO 2 — CSS base (utilidades reutilizables)
En tu CSS global. **Si usás `@import` de fuentes de Google, va ANTES de `@tailwind` (sino el build de Vercel falla).**
```css
/* Glassmorphism */
.glass-card {
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(ACCENT_RGB, 0.08);
  border-radius: 1rem;
  transition: all .3s cubic-bezier(.4,0,.2,1);
}
.glass-card:hover {
  background: rgba(255,255,255,0.05);
  border-color: rgba(ACCENT_RGB, 0.18);
  transform: translateY(-2px) scale(1.005);
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
}
.glass-panel { background: rgba(255,255,255,.02); backdrop-filter: blur(4px); border: 1px solid rgba(ACCENT_RGB,.06); border-radius:.75rem; }

/* Texto con gradiente de acento */
.accent-text {
  background: linear-gradient(135deg, ACCENT_LIGHT, ACCENT, ACCENT_DARK);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 8px rgba(ACCENT_RGB,.3));
}

/* Shimmer (barrido de luz). Poné <div class="shimmer"> dentro de un contenedor relative+overflow-hidden */
.shimmer { position:relative; overflow:hidden; }
.shimmer::after {
  content:''; position:absolute; inset:0 auto 0 -100%; width:100%; height:100%;
  background: linear-gradient(90deg, transparent, rgba(ACCENT_RGB,.2), transparent);
  animation: shimmer 2.5s infinite;
}
@keyframes shimmer { 0%{left:-100%} 100%{left:200%} }

/* Borde con glow al hover (gradiente animado) */
.glow-border { position:relative; }
.glow-border::before {
  content:''; position:absolute; inset:-1px; border-radius:inherit; padding:1px;
  background: linear-gradient(135deg, ACCENT, ACCENT_2);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; opacity:0; transition:opacity .3s;
}
.glow-border:hover::before { opacity:1; }

@keyframes torch-flicker { 0%,100%{opacity:.7} 25%{opacity:.9} 50%{opacity:.5} 75%{opacity:1} }
```

## PASO 3 — Fondo de partículas flotantes (el efecto estrella)
Componente `ParticleField` (en el original eran "brasas/luciérnagas" doradas). Partículas que suben + otras que parpadean en su lugar. `position: fixed`, cubre toda la pantalla detrás del contenido. Montalo UNA vez en el layout raíz. Reemplazá `ACCENT_RGB` por tu acento.
```jsx
import { motion } from 'framer-motion';
import { useMemo } from 'react';

const ACCENT = 'ACCENT_RGB'; // ej '212,168,71'

function Rising({ x, size, delay, duration, drift, brightness }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ width:size, height:size, left:`${x}%`, bottom:'-3%',
        background:`radial-gradient(circle, rgba(${ACCENT},${brightness}) 0%, rgba(${ACCENT},${brightness*0.3}) 50%, transparent 70%)`,
        boxShadow:`0 0 ${size*2}px rgba(${ACCENT},${brightness*0.5})` }}
      animate={{ y:[0, -(700+Math.random()*600)], x:[0, drift], opacity:[0,1,0.8,0], scale:[0.4,1.2,0.3] }}
      transition={{ duration, delay, repeat:Infinity, ease:'easeOut' }} />
  );
}
function Twinkle({ x, y, size, delay }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ width:size, height:size, left:`${x}%`, top:`${y}%`,
        background:`radial-gradient(circle, rgba(${ACCENT},0.6) 0%, transparent 70%)`,
        boxShadow:`0 0 ${size*3}px rgba(${ACCENT},0.3)` }}
      animate={{ opacity:[0,0.9,0.3,0.8,0], scale:[0.5,1.3,0.8,1.1,0.5] }}
      transition={{ duration:4+Math.random()*4, delay, repeat:Infinity, ease:'easeInOut' }} />
  );
}
export default function ParticleField({ count = 30 }) {
  const rising = useMemo(() => Array.from({length:count}).map((_,i)=>({
    id:'r'+i, x:Math.random()*100, size:3+Math.random()*6, delay:Math.random()*10,
    duration:6+Math.random()*7, drift:(Math.random()-0.5)*180, brightness:0.4+Math.random()*0.5 })), [count]);
  const twinkle = useMemo(() => Array.from({length:Math.floor(count*0.6)}).map((_,i)=>({
    id:'t'+i, x:5+Math.random()*90, y:5+Math.random()*90, size:2+Math.random()*5, delay:Math.random()*8 })), [count]);
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {rising.map(p => <Rising key={p.id} {...p} />)}
      {twinkle.map(p => <Twinkle key={p.id} {...p} />)}
    </div>
  );
}
```
> Importante: el contenedor es `z-0` fixed; asegurate de que tu contenido tenga `position:relative` y `z-10` para quedar por encima.

## PASO 4 — Reveal épico con countdown + confetti
Patrón para "momentos ganadores" (resultado de algo importante). Countdown 3·2·1 → confetti → card con shimmer.
**Regla DURA**: el countdown va con **timestamp + requestAnimationFrame**, NUNCA `setInterval` con dependencia de estado (React StrictMode en dev lo monta dos veces y lo deja trabado en "3").
```jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const COLORS = ['ACCENT_HEX', 'ACCENT_2_HEX', '#f5e6c8']; // tu paleta

function fireConfetti() {
  confetti({ particleCount:130, spread:100, startVelocity:45, origin:{y:0.4}, colors:COLORS, scalar:1.2 });
  setTimeout(()=>confetti({ particleCount:60, angle:60, spread:70, origin:{x:0}, colors:COLORS }), 200);
  setTimeout(()=>confetti({ particleCount:60, angle:120, spread:70, origin:{x:1}, colors:COLORS }), 200);
}
export default function Reveal({ title, image, onClose }) {
  const [phase, setPhase] = useState('countdown');
  const [count, setCount] = useState(3);
  const start = useRef(null), fired = useRef(false);
  useEffect(() => {            // countdown por tiempo absoluto (inmune a StrictMode)
    if (start.current === null) start.current = Date.now();
    let raf;
    const tick = () => {
      const remaining = 3 - Math.floor((Date.now() - start.current) / 850);
      if (remaining <= 0) { setCount(0); setPhase('reveal'); return; }
      setCount(remaining); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => { if (phase==='reveal' && !fired.current) { fired.current = true; fireConfetti(); } }, [phase]);
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      onClick={phase==='reveal'?onClose:undefined}
      className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-md"
      style={{ background:'rgba(6,5,10,0.85)' }}>
      <AnimatePresence mode="wait">
        {phase==='countdown' ? (
          <motion.span key={count} initial={{scale:0.3,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:2,opacity:0}}
            className="text-[12rem] font-black accent-text">{count>0?count:'★'}</motion.span>
        ) : (
          <motion.div key="r" initial={{scale:0.6,opacity:0,y:40}} animate={{scale:1,opacity:1,y:0}}
            transition={{type:'spring',stiffness:140,damping:18}} onClick={e=>e.stopPropagation()}
            className="relative max-w-md mx-6 rounded-2xl overflow-hidden border-2 shimmer animate-fire-glow"
            style={{ borderColor:'rgba(ACCENT_RGB,0.4)' }}>
            {image && <img src={image} alt="" className="w-full h-40 object-cover" />}
            <div className="p-8 text-center"><h2 className="text-3xl font-black accent-text">{title}</h2></div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

## PASO 5 — Toast animado (reemplaza alert())
Context con toasts que entran con spring desde la derecha + shimmer. Variantes success/error/warning/info con color por borde. Reemplazá TODOS los `alert()`/`window.confirm()` por este sistema.
(Estructura: `ToastProvider` que envuelve la app + hook `useToast()` → `toast.success(msg, {title})`. Cada toast: `glass-card` + borde por variante + ícono + auto-dismiss 4s + click para cerrar. Animación `initial={{opacity:0,x:60,scale:0.9}} animate={{opacity:1,x:0,scale:1}}` con `type:'spring'`.)

## PASO 6 — Micro-interacciones (aplicar en todo)
- Cards/listas que aparecen: `initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}` con `transition={{delay: i*0.05, type:'spring', stiffness:120}}` (stagger por índice).
- Botones: `whileHover={{scale:1.03}} whileTap={{scale:0.97}}`.
- Botón primario: gradiente de acento + `hover:shadow-glow-accent` + `active:scale-95`.
- Números importantes: `font-mono tabular-nums` + animación `count-up`.
- Modales/overlays: `<AnimatePresence>` + backdrop `backdrop-blur-md`.

## REGLAS DURAS (las aprendí rompiendo cosas)
1. **Countdown/animación temporizada → timestamp + requestAnimationFrame, NO setInterval con deps** (StrictMode lo traba en dev).
2. **`@import` de fuentes ANTES de `@tailwind`** en el CSS (sino el build falla).
3. **conic-gradient para rayos de luz → contenido (ej 700px + mask radial + `willChange:transform`), NUNCA full-screen** (160vmax laguea hasta en buenas máquinas).
4. **Partículas: `position:fixed z-0 pointer-events-none`** + contenido en `z-10 relative`.
5. **Reducí cantidad de partículas si el target es mobile** (count 15-20 en vez de 30+).
6. Respetá `prefers-reduced-motion` si querés ser prolijo (desactivá las partículas ahí).

## RESULTADO ESPERADO
Un sistema cohesivo: fondo de partículas vivo en toda la app, cards de vidrio con glow al hover, botones con feedback táctil, toasts elegantes, y un reveal con confetti para los momentos importantes — todo en LA PALETA DE ESTE PROYECTO, no en la del original. Mostrame el resultado y ajustamos intensidad/colores.
```
```
