import { useEffect, useRef, useCallback } from 'react';

const LoginParticles = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef([]);
  const shootingStarsRef = useRef([]);
  const pulseNodesRef = useRef([]);
  const waveRef = useRef(0);

  const initParticles = useCallback((width, height) => {
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;

    const particleCount = isMobile ? 80 : isTablet ? 120 : 180;
    const connectionDistance = isMobile ? 120 : isTablet ? 150 : 180;
    const pulseCount = isMobile ? 5 : isTablet ? 8 : 12;
    const shootingStarInterval = isMobile ? 3000 : 1800;

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const isBlue = Math.random() > 0.25;
      const size = 1.5 + Math.random() * 4;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: size,
        color: isBlue
          ? `rgba(59, 130, 246, ${0.6 + Math.random() * 0.4})`
          : `rgba(251, 146, 60, ${0.5 + Math.random() * 0.4})`,
        glowColor: isBlue
          ? `rgba(96, 165, 250, ${0.25 + Math.random() * 0.2})`
          : `rgba(251, 146, 60, ${0.2 + Math.random() * 0.15})`,
        baseRadius: size,
        pulseSpeed: 0.015 + Math.random() * 0.03,
        pulsePhase: Math.random() * Math.PI * 2,
        isBlue,
      });
    }
    particlesRef.current = particles;

    const pulseNodes = [];
    for (let i = 0; i < pulseCount; i++) {
      pulseNodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 6 + Math.random() * 8,
        isBlue: Math.random() > 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.012 + Math.random() * 0.02,
      });
    }
    pulseNodesRef.current = pulseNodes;

    return { connectionDistance, shootingStarInterval, isMobile };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    let config = initParticles(width, height);

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchend', handleMouseLeave);

    let lastShootingStar = 0;

    const createShootingStar = () => {
      const fromLeft = Math.random() > 0.5;
      shootingStarsRef.current.push({
        x: fromLeft ? -80 : width + 80,
        y: Math.random() * height * 0.4,
        vx: fromLeft ? (6 + Math.random() * 6) : -(6 + Math.random() * 6),
        vy: 3 + Math.random() * 4,
        length: 100 + Math.random() * 150,
        life: 1,
        decay: 0.006 + Math.random() * 0.006,
        isBlue: Math.random() > 0.35,
      });
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      config = initParticles(width, height);
    };

    window.addEventListener('resize', handleResize);

    const animate = (timestamp) => {
      ctx.clearRect(0, 0, width, height);
      waveRef.current += 0.005;

      const particles = particlesRef.current;
      const pulseNodes = pulseNodesRef.current;
      const shootingStars = shootingStarsRef.current;
      const mouse = mouseRef.current;
      const { connectionDistance, shootingStarInterval, isMobile } = config;

      // 创建流星
      if (timestamp - lastShootingStar > shootingStarInterval) {
        createShootingStar();
        lastShootingStar = timestamp;
      }

      // 绘制波纹背景效果
      const waveAlpha = 0.03;
      for (let i = 0; i < 3; i++) {
        const waveX = width * 0.5 + Math.sin(waveRef.current + i * 2) * width * 0.3;
        const waveY = height * 0.5 + Math.cos(waveRef.current * 0.7 + i * 1.5) * height * 0.3;
        const waveR = 200 + Math.sin(waveRef.current + i) * 80;
        const waveGrad = ctx.createRadialGradient(waveX, waveY, 0, waveX, waveY, waveR);
        waveGrad.addColorStop(0, `rgba(96, 165, 250, ${waveAlpha})`);
        waveGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(waveX, waveY, waveR, 0, Math.PI * 2);
        ctx.fillStyle = waveGrad;
        ctx.fill();
      }

      // 更新和绘制粒子
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 鼠标交互
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const force = (200 - dist) / 200 * 0.4;
          p.vx += dx / dist * force;
          p.vy += dy / dist * force;
        }

        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));

        p.pulsePhase += p.pulseSpeed;
        p.radius = p.baseRadius + Math.sin(p.pulsePhase) * 1.2;

        // 大光晕
        const glowRadius = p.radius * 8;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        gradient.addColorStop(0, p.glowColor);
        gradient.addColorStop(0.4, p.isBlue ? 'rgba(96, 165, 250, 0.08)' : 'rgba(251, 146, 60, 0.06)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 粒子核心
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // 白色高光中心
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(p.pulsePhase) * 0.3})`;
        ctx.fill();
      }

      // 绘制粒子连接线
      if (!isMobile) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectionDistance) {
              const alpha = (1 - dist / connectionDistance);
              const lineOpacity = alpha * 0.35;
              const lineWidth = alpha * 1.8;

              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);

              if (particles[i].isBlue && particles[j].isBlue) {
                ctx.strokeStyle = `rgba(59, 130, 246, ${lineOpacity})`;
              } else if (!particles[i].isBlue && !particles[j].isBlue) {
                ctx.strokeStyle = `rgba(251, 146, 60, ${lineOpacity * 0.8})`;
              } else {
                ctx.strokeStyle = `rgba(139, 92, 246, ${lineOpacity * 0.6})`;
              }
              ctx.lineWidth = lineWidth;
              ctx.stroke();
            }
          }
        }
      } else {
        for (let i = 0; i < particles.length; i += 2) {
          for (let j = i + 1; j < particles.length; j += 2) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectionDistance * 0.7) {
              const alpha = (1 - dist / (connectionDistance * 0.7));
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(59, 130, 246, ${alpha * 0.25})`;
              ctx.lineWidth = alpha * 1.2;
              ctx.stroke();
            }
          }
        }
      }

      // 脉冲节点
      for (const node of pulseNodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.pulsePhase += node.pulseSpeed;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        const pulse = Math.sin(node.pulsePhase) * 0.5 + 0.5;
        const currentRadius = node.radius * (0.7 + pulse * 0.8);

        // 超大外圈光晕
        const outerGlow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, currentRadius * 10);
        if (node.isBlue) {
          outerGlow.addColorStop(0, `rgba(59, 130, 246, ${0.12 + pulse * 0.12})`);
          outerGlow.addColorStop(0.3, `rgba(96, 165, 250, ${0.06 + pulse * 0.06})`);
          outerGlow.addColorStop(0.6, `rgba(96, 165, 250, ${0.02 + pulse * 0.02})`);
        } else {
          outerGlow.addColorStop(0, `rgba(251, 146, 60, ${0.1 + pulse * 0.1})`);
          outerGlow.addColorStop(0.3, `rgba(251, 146, 60, ${0.05 + pulse * 0.05})`);
          outerGlow.addColorStop(0.6, `rgba(251, 146, 60, ${0.02 + pulse * 0.02})`);
        }
        outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 10, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        // 核心发光
        const coreGlow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, currentRadius * 2);
        if (node.isBlue) {
          coreGlow.addColorStop(0, `rgba(191, 219, 254, ${0.9 + pulse * 0.1})`);
          coreGlow.addColorStop(0.3, `rgba(96, 165, 250, ${0.6 + pulse * 0.2})`);
          coreGlow.addColorStop(0.7, `rgba(59, 130, 246, ${0.3 + pulse * 0.1})`);
        } else {
          coreGlow.addColorStop(0, `rgba(254, 215, 170, ${0.85 + pulse * 0.15})`);
          coreGlow.addColorStop(0.3, `rgba(251, 146, 60, ${0.5 + pulse * 0.2})`);
          coreGlow.addColorStop(0.7, `rgba(234, 88, 12, ${0.25 + pulse * 0.1})`);
        }
        coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 2, 0, Math.PI * 2);
        ctx.fillStyle = coreGlow;
        ctx.fill();

        // 白色中心
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + pulse * 0.3})`;
        ctx.fill();

        // 脉冲节点与附近粒子连线
        for (const p of particles) {
          const dx = node.x - p.x;
          const dy = node.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance * 2) {
            const alpha = (1 - dist / (connectionDistance * 2));
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = node.isBlue
              ? `rgba(59, 130, 246, ${alpha * 0.2})`
              : `rgba(251, 146, 60, ${alpha * 0.15})`;
            ctx.lineWidth = alpha * 1.2;
            ctx.stroke();
          }
        }
      }

      // 流星
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.x += star.vx;
        star.y += star.vy;
        star.life -= star.decay;

        if (star.life <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        const speed = Math.sqrt(star.vx * star.vx + star.vy * star.vy);
        const tailX = star.x - (star.vx / speed) * star.length * 0.5;
        const tailY = star.y - (star.vy / speed) * star.length * 0.5;

        // 流星尾迹
        const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
        if (star.isBlue) {
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
          gradient.addColorStop(0.5, `rgba(96, 165, 250, ${star.life * 0.4})`);
          gradient.addColorStop(1, `rgba(191, 219, 254, ${star.life * 0.9})`);
        } else {
          gradient.addColorStop(0, 'rgba(251, 146, 60, 0)');
          gradient.addColorStop(0.5, `rgba(251, 146, 60, ${star.life * 0.4})`);
          gradient.addColorStop(1, `rgba(254, 215, 170, ${star.life * 0.9})`);
        }

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(star.x, star.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 流星头部大光晕
        const headGlow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, 20);
        if (star.isBlue) {
          headGlow.addColorStop(0, `rgba(191, 219, 254, ${star.life * 0.7})`);
          headGlow.addColorStop(0.4, `rgba(96, 165, 250, ${star.life * 0.3})`);
          headGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
        } else {
          headGlow.addColorStop(0, `rgba(254, 215, 170, ${star.life * 0.7})`);
          headGlow.addColorStop(0.4, `rgba(251, 146, 60, ${star.life * 0.3})`);
          headGlow.addColorStop(1, 'rgba(234, 88, 12, 0)');
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = headGlow;
        ctx.fill();

        // 流星头部白色核心
        ctx.beginPath();
        ctx.arc(star.x, star.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.life * 0.9})`;
        ctx.fill();
      }

      // 鼠标光晕
      if (mouse.x > 0 && mouse.y > 0) {
        const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
        mouseGlow.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
        mouseGlow.addColorStop(0.3, 'rgba(96, 165, 250, 0.05)');
        mouseGlow.addColorStop(0.6, 'rgba(139, 92, 246, 0.02)');
        mouseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 180, 0, Math.PI * 2);
        ctx.fillStyle = mouseGlow;
        ctx.fill();

        // 鼠标连接线
        for (const p of particles) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const alpha = (1 - dist / 200);
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha * 0.4})`;
            ctx.lineWidth = alpha * 2;
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
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchend', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="login-particle-canvas"
    />
  );
};

export default LoginParticles;
