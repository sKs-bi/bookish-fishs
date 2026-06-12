import { useEffect, useRef, useCallback } from 'react';

const LayoutParticles = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  const initParticles = useCallback((width, height) => {
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;

    const particleCount = isMobile ? 25 : isTablet ? 40 : 55;
    const connectionDistance = isMobile ? 100 : 140;

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const isBlue = Math.random() > 0.25;
      const size = 1.5 + Math.random() * 3;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: size,
        color: isBlue
          ? `rgba(59, 130, 246, ${0.35 + Math.random() * 0.35})`
          : `rgba(251, 146, 60, ${0.25 + Math.random() * 0.3})`,
        glowColor: isBlue
          ? `rgba(96, 165, 250, ${0.15 + Math.random() * 0.1})`
          : `rgba(251, 146, 60, ${0.1 + Math.random() * 0.08})`,
        baseRadius: size,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        pulsePhase: Math.random() * Math.PI * 2,
        isBlue,
      });
    }
    particlesRef.current = particles;

    return { connectionDistance, isMobile };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.parentElement?.offsetWidth || window.innerWidth;
    let height = canvas.parentElement?.offsetHeight || window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    let config = initParticles(width, height);

    const handleResize = () => {
      width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.parentElement?.offsetHeight || window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      config = initParticles(width, height);
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const { connectionDistance, isMobile } = config;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.vx *= 0.995;
        p.vy *= 0.995;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));

        p.pulsePhase += p.pulseSpeed;
        p.radius = p.baseRadius + Math.sin(p.pulsePhase) * 0.8;

        // 光晕
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 6);
        gradient.addColorStop(0, p.glowColor);
        gradient.addColorStop(0.5, p.isBlue ? 'rgba(96, 165, 250, 0.04)' : 'rgba(251, 146, 60, 0.03)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 6, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 核心
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // 白色高光
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(p.pulsePhase) * 0.2})`;
        ctx.fill();
      }

      // 连接线
      for (let i = 0; i < particles.length; i++) {
        const step = isMobile ? 2 : 1;
        for (let j = i + 1; j < particles.length; j += step) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);

            if (particles[i].isBlue && particles[j].isBlue) {
              ctx.strokeStyle = `rgba(59, 130, 246, ${alpha * 0.2})`;
            } else if (!particles[i].isBlue && !particles[j].isBlue) {
              ctx.strokeStyle = `rgba(251, 146, 60, ${alpha * 0.15})`;
            } else {
              ctx.strokeStyle = `rgba(139, 92, 246, ${alpha * 0.12})`;
            }
            ctx.lineWidth = alpha * 1;
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="layout-particle-canvas"
    />
  );
};

export default LayoutParticles;
