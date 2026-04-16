import { motion } from 'framer-motion';

// Silueta de cultista/monje encapuchado medieval — SVG inline
function CultistSVG({ flip }) {
  return (
    <svg
      viewBox="0 0 200 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
    >
      {/* Capucha */}
      <path
        d="M100 30 C60 30, 40 70, 42 110 L42 140 C42 140, 70 160, 100 155 C130 160, 158 140, 158 140 L158 110 C160 70, 140 30, 100 30Z"
        fill="rgba(20,18,25,0.95)"
        stroke="rgba(212,168,71,0.08)"
        strokeWidth="1"
      />
      {/* Sombra interior capucha */}
      <ellipse cx="100" cy="115" rx="35" ry="25" fill="rgba(10,8,14,0.9)" />
      {/* Ojos sutiles brillando */}
      <ellipse cx="85" cy="112" rx="3" ry="2" fill="rgba(212,168,71,0.15)" />
      <ellipse cx="115" cy="112" rx="3" ry="2" fill="rgba(212,168,71,0.15)" />

      {/* Cuello / hombros */}
      <path
        d="M42 140 C42 140, 30 160, 20 200 L20 220 C20 220, 55 190, 100 185 C145 190, 180 220, 180 220 L180 200 C170 160, 158 140, 158 140Z"
        fill="rgba(18,16,22,0.95)"
        stroke="rgba(212,168,71,0.05)"
        strokeWidth="0.5"
      />

      {/* Torso / tunica */}
      <path
        d="M20 220 C20 220, 15 280, 18 350 L18 500 C18 520, 25 550, 35 580 L55 600 L145 600 L165 580 C175 550, 182 520, 182 500 L182 350 C185 280, 180 220, 180 220Z"
        fill="rgba(15,13,20,0.95)"
        stroke="rgba(212,168,71,0.05)"
        strokeWidth="0.5"
      />

      {/* Pliegues de la tunica */}
      <path d="M60 220 C58 300, 55 400, 58 580" stroke="rgba(212,168,71,0.04)" strokeWidth="1" fill="none" />
      <path d="M100 185 C100 300, 98 450, 100 600" stroke="rgba(212,168,71,0.03)" strokeWidth="1" fill="none" />
      <path d="M140 220 C142 300, 145 400, 142 580" stroke="rgba(212,168,71,0.04)" strokeWidth="1" fill="none" />

      {/* Manos juntas sosteniendo algo (un orbe/llama) */}
      <path
        d="M70 310 C70 290, 80 280, 90 278 L110 278 C120 280, 130 290, 130 310 C130 320, 120 330, 100 330 C80 330, 70 320, 70 310Z"
        fill="rgba(18,16,22,0.9)"
        stroke="rgba(212,168,71,0.06)"
        strokeWidth="0.5"
      />

      {/* Orbe/llama dorada en las manos */}
      <circle cx="100" cy="300" r="12" fill="rgba(212,168,71,0.08)" />
      <circle cx="100" cy="300" r="7" fill="rgba(212,168,71,0.15)" />
      <circle cx="100" cy="300" r="3" fill="rgba(212,168,71,0.3)" />

      {/* Cadena/amuleto en el pecho */}
      <path
        d="M85 170 C85 185, 90 200, 100 210 C110 200, 115 185, 115 170"
        stroke="rgba(212,168,71,0.1)"
        strokeWidth="1"
        fill="none"
      />
      <circle cx="100" cy="215" r="5" fill="rgba(212,168,71,0.08)" stroke="rgba(212,168,71,0.12)" strokeWidth="0.5" />

      {/* Runas en la tunica */}
      <text x="90" y="400" fill="rgba(212,168,71,0.04)" fontSize="14" fontFamily="serif">I</text>
      <text x="95" y="430" fill="rgba(212,168,71,0.03)" fontSize="12" fontFamily="serif">V</text>
      <text x="100" y="460" fill="rgba(212,168,71,0.04)" fontSize="14" fontFamily="serif">X</text>
    </svg>
  );
}

export default function CultistStatue({ side = 'left' }) {
  const isLeft = side === 'left';

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 2, delay: 0.5, ease: 'easeOut' }}
      className={`absolute top-[45%] -translate-y-1/2 ${isLeft ? 'left-4 lg:left-12 xl:left-24' : 'right-4 lg:right-12 xl:right-24'} w-[140px] lg:w-[170px] xl:w-[200px] h-[550px] lg:h-[650px] xl:h-[720px] pointer-events-none`}
    >
      {/* Glow sutil detras de la estatua */}
      <motion.div
        className="absolute inset-0 blur-2xl"
        style={{
          background: `radial-gradient(ellipse at ${isLeft ? '70%' : '30%'} 50%, rgba(212,168,71,0.06) 0%, transparent 70%)`,
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Glow del orbe en las manos */}
      <motion.div
        className="absolute w-8 h-8 rounded-full left-1/2 -translate-x-1/2"
        style={{
          top: '48%',
          background: 'radial-gradient(circle, rgba(212,168,71,0.2) 0%, transparent 70%)',
          boxShadow: '0 0 20px rgba(212,168,71,0.15)',
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: isLeft ? 0 : 1.5 }}
      />

      {/* La estatua SVG */}
      <CultistSVG flip={!isLeft} />

      {/* Particulas subiendo desde el orbe */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{
            top: '47%',
            background: 'rgba(212,168,71,0.4)',
            boxShadow: '0 0 4px rgba(212,168,71,0.3)',
          }}
          animate={{
            y: [0, -60 - i * 20],
            x: [(i - 1) * 3, (i - 1) * 8],
            opacity: [0, 0.7, 0],
            scale: [0.5, 1, 0],
          }}
          transition={{
            duration: 2 + i * 0.5,
            delay: i * 0.8 + (isLeft ? 0 : 0.4),
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  );
}
