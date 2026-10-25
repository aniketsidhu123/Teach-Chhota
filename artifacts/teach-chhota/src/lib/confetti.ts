import confetti from "canvas-confetti";

export function fireCelebration() {
  // Dual burst of vibrant Indian festival colors
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ["#285d5c", "#f3bd62", "#ef9b55", "#e47451", "#5caaa0", "#f7d66c"],
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

export function fireCoinSparkle() {
  confetti({
    particleCount: 40,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    colors: ["#f7d66c", "#f3bd62", "#e47451"],
  });
  confetti({
    particleCount: 40,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    colors: ["#f7d66c", "#f3bd62", "#e47451"],
  });
}
