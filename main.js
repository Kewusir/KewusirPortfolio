(function () {
  const body = document.body;
  const transitionScreen = document.querySelector(".transition-screen");
  const transitionLabel = document.querySelector(".transition-screen__label");
  const loader = document.querySelector(".loader");
  const loaderName = document.querySelector(".loader__name");
  const loaderParticlesCanvas = document.getElementById("loader-particles");
  const siteHeader = document.querySelector(".site-header");
  const siteBrand = document.querySelector(".site-brand");
  const menuToggle = document.querySelector(".site-menu-toggle");
  const siteNav = document.getElementById("site-nav");
  const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
  const stages = Array.from(document.querySelectorAll(".stage"));
  const homeStage = document.getElementById("home");
  const projectsHint = document.querySelector(".projects__canvas-hint");
  const skillsModeLabel = document.querySelector(".skills__mode-label");
  const panelStages = stages.filter((stage) => stage.id !== "home");
  const revealItems = Array.from(
    document.querySelectorAll(
      ".manifesto__intro, .manifesto__copy, .projects__sticky, .project-card, .research__lead, .research__cards article, .leadership__cloud, .leadership__panel, .skills__lead, .skills__constellation, .skill-row, .contact__inner"
    )
  );
  const root = document.documentElement;
  const coarsePointerQuery = window.matchMedia("(hover: none), (pointer: coarse)");
  const compactLayoutQuery = window.matchMedia("(max-width: 820px)");

  let activeStageId = "home";
  let closeMobileNav = () => {};
  const navigationEntry = performance.getEntriesByType("navigation")[0];
  const reloadToHome =
    navigationEntry?.type === "reload" ||
    performance.navigation?.type === performance.navigation.TYPE_RELOAD;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function setActiveNav(id) {
    activeStageId = id;
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
    });
  }

  function applyAdaptiveLabel(element) {
    if (!element) {
      return;
    }

    const nextLabel =
      compactLayoutQuery.matches || coarsePointerQuery.matches
        ? element.dataset.mobileLabel
        : element.dataset.desktopLabel;

    if (nextLabel) {
      element.textContent = nextLabel;
    }
  }

  function syncResponsiveMode() {
    body.classList.toggle("is-touch-mode", coarsePointerQuery.matches);
    body.classList.toggle("is-mobile-layout", compactLayoutQuery.matches);
    applyAdaptiveLabel(projectsHint);
    applyAdaptiveLabel(skillsModeLabel);
  }

  function setGlobalCursor(clientX, clientY) {
    const x = `${clamp(clientX / Math.max(window.innerWidth, 1), 0, 1) * 100}%`;
    const y = `${clamp(clientY / Math.max(window.innerHeight, 1), 0, 1) * 100}%`;
    root.style.setProperty("--cursor-x", x);
    root.style.setProperty("--cursor-y", y);
  }

  function initMobileNav() {
    if (!siteHeader || !menuToggle || !siteNav) {
      return;
    }

    function closeMenu() {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
      body.classList.remove("is-nav-open");
    }

    function openMenu() {
      menuToggle.setAttribute("aria-expanded", "true");
      siteNav.classList.add("is-open");
      body.classList.add("is-nav-open");
    }

    closeMobileNav = closeMenu;

    menuToggle.addEventListener("click", () => {
      if (!compactLayoutQuery.matches) {
        return;
      }

      if (siteNav.classList.contains("is-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    siteBrand?.addEventListener("click", closeMenu);

    document.addEventListener("click", (event) => {
      if (!compactLayoutQuery.matches || !siteNav.classList.contains("is-open")) {
        return;
      }

      if (siteHeader.contains(event.target)) {
        return;
      }

      closeMenu();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    compactLayoutQuery.addEventListener?.("change", () => {
      if (!compactLayoutQuery.matches) {
        closeMenu();
      }
    });
  }

  function resetToHomeView() {
    if (!reloadToHome) {
      return;
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    if (window.location.hash) {
      window.history.replaceState(null, "", cleanUrl);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (homeStage) {
      setActiveNav(homeStage.id);
    }
  }

  function transitionTo(section) {
    transitionLabel.textContent = section.dataset.transition || section.dataset.nav || section.id;
    body.classList.add("is-transitioning");

    window.setTimeout(() => {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setActiveNav(section.id);
    }, 180);

    window.setTimeout(() => {
      body.classList.remove("is-transitioning");
    }, 760);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) {
        return;
      }

      event.preventDefault();
      closeMobileNav();
      transitionTo(target);
    });
  });

  panelStages.forEach((stage) => stage.classList.add("stage-panel"));

  initMobileNav();
  syncResponsiveMode();
  coarsePointerQuery.addEventListener?.("change", syncResponsiveMode);
  compactLayoutQuery.addEventListener?.("change", syncResponsiveMode);
  window.addEventListener("resize", syncResponsiveMode);

  resetToHomeView();
  window.addEventListener("pageshow", () => {
    window.requestAnimationFrame(resetToHomeView);
  });

  let stageTicking = false;

  function updateActiveStageByViewport() {
    stageTicking = false;

    const activationLine = window.innerHeight * 0.36;
    let nextStage = stages[0];
    let bestDistance = Infinity;

    stages.forEach((stage) => {
      const rect = stage.getBoundingClientRect();
      const containsLine = rect.top <= activationLine && rect.bottom >= activationLine;

      if (containsLine) {
        nextStage = stage;
        bestDistance = -1;
        return;
      }

      if (bestDistance !== -1) {
        const distance = Math.abs(rect.top - activationLine);
        if (distance < bestDistance) {
          bestDistance = distance;
          nextStage = stage;
        }
      }
    });

    if (nextStage) {
      setActiveNav(nextStage.id);
    }
  }

  function queueStageUpdate() {
    if (stageTicking) {
      return;
    }

    stageTicking = true;
    window.requestAnimationFrame(updateActiveStageByViewport);
  }

  window.addEventListener("scroll", queueStageUpdate, { passive: true });
  window.addEventListener("resize", queueStageUpdate);

  const panelObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-stage-visible", entry.isIntersecting);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  panelStages.forEach((stage) => panelObserver.observe(stage));

  revealItems.forEach((item) => item.classList.add("reveal"));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  function initLoaderDissolve() {
    if (!loader || !loaderName || !loaderParticlesCanvas) {
      return null;
    }

    const ctx = loaderParticlesCanvas.getContext("2d");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let animationId = null;
    let hasPlayed = false;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      loaderParticlesCanvas.width = width * dpr;
      loaderParticlesCanvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function sampleText() {
      resize();
      particles = [];

      const rect = loaderName.getBoundingClientRect();
      const styles = window.getComputedStyle(loaderName);
      const fontSize = parseFloat(styles.fontSize);
      const sampleGap = Math.max(5, Math.round(fontSize / 11));
      const paddingX = 28;
      const paddingY = 20;
      const offscreen = document.createElement("canvas");
      const offscreenWidth = Math.ceil(rect.width + paddingX * 2);
      const offscreenHeight = Math.ceil(rect.height + paddingY * 2);
      offscreen.width = offscreenWidth;
      offscreen.height = offscreenHeight;

      const offscreenCtx = offscreen.getContext("2d");
      offscreenCtx.fillStyle = "#f2ede7";
      offscreenCtx.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
      offscreenCtx.textBaseline = "top";
      offscreenCtx.fillText(loaderName.textContent.trim(), paddingX, paddingY);

      const pixels = offscreenCtx.getImageData(0, 0, offscreenWidth, offscreenHeight).data;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      for (let y = 0; y < offscreenHeight; y += sampleGap) {
        for (let x = 0; x < offscreenWidth; x += sampleGap) {
          const alpha = pixels[(y * offscreenWidth + x) * 4 + 3];
          if (alpha < 128 || Math.random() < 0.18) {
            continue;
          }

          const originX = rect.left - paddingX + x;
          const originY = rect.top - paddingY + y;
          const dx = originX - centerX;
          const dy = originY - centerY;
          const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.7;
          const speed = 44 + Math.random() * 168 + Math.hypot(dx, dy) * 0.2;
          const colorMode = Math.random();

          particles.push({
            originX,
            originY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (16 + Math.random() * 26),
            size: 0.9 + Math.random() * 1.8,
            alpha: 0.34 + Math.random() * 0.66,
            wobble: Math.random() * Math.PI * 2,
            tone:
              colorMode > 0.82
                ? "gold"
                : colorMode > 0.64
                  ? "teal"
                  : "paper",
          });
        }
      }
    }

    function particleColor(particle, alpha) {
      if (particle.tone === "gold") {
        return `rgba(223, 177, 113, ${alpha})`;
      }
      if (particle.tone === "teal") {
        return `rgba(158, 208, 198, ${alpha})`;
      }
      return `rgba(242, 237, 231, ${alpha})`;
    }

    function finishSequence() {
      ctx.clearRect(0, 0, width, height);
      loader.classList.add("is-hidden");
      body.classList.remove("is-loading");
    }

    function play() {
      if (hasPlayed) {
        return;
      }
      hasPlayed = true;

      if (prefersReducedMotion.matches) {
        finishSequence();
        return;
      }

      sampleText();
      loader.classList.add("is-dissolving");

      const start = performance.now();
      const duration = 1240;

      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const fade = Math.pow(1 - progress, 1.15);

        ctx.clearRect(0, 0, width, height);

        particles.forEach((particle, index) => {
          const swirl = Math.sin(progress * 10 + particle.wobble + index * 0.015) * 4;
          const lift = Math.cos(progress * 8 + particle.wobble) * 2;
          const x = particle.originX + particle.vx * ease * 0.54 + swirl;
          const y =
            particle.originY +
            particle.vy * ease * 0.54 +
            96 * progress * progress +
            lift;
          const alpha = particle.alpha * fade;
          const size = particle.size * (1 - progress * 0.18);

          ctx.beginPath();
          ctx.fillStyle = particleColor(particle, alpha);
          ctx.arc(x, y, Math.max(0.4, size), 0, Math.PI * 2);
          ctx.fill();
        });

        if (progress < 1) {
          animationId = window.requestAnimationFrame(frame);
        } else {
          finishSequence();
        }
      }

      animationId = window.requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);
    resize();

    return {
      play,
      destroy() {
        if (animationId) {
          window.cancelAnimationFrame(animationId);
        }
      },
    };
  }

  const loaderDissolve = initLoaderDissolve();

  async function finishLoading() {
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // Ignore font readiness errors and continue the exit sequence.
      }
    }

    if (loaderDissolve) {
      loaderDissolve.play();
      return;
    }

    loader.classList.add("is-hidden");
    body.classList.remove("is-loading");
  }

  window.addEventListener("load", () => {
    resetToHomeView();
    window.setTimeout(() => {
      void finishLoading().then(() => {
        window.requestAnimationFrame(resetToHomeView);
      });
    }, 2450);
  });

  window.addEventListener("pointermove", (event) => {
    setGlobalCursor(event.clientX, event.clientY);
  });

  window.addEventListener("pointerdown", (event) => {
    setGlobalCursor(event.clientX, event.clientY);
  });

  function initHeroField() {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    const pointer = {
      x: window.innerWidth * 0.72,
      y: window.innerHeight * 0.32,
      active: false,
    };
    const nodes = [];
    const dust = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationId = null;
    let releaseTimer = null;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
    }

    function buildParticles() {
      nodes.length = 0;
      dust.length = 0;

      const count = Math.min(110, Math.floor(width * height / 14000));
      const dustCount = Math.min(120, Math.floor(width * height / 12000));

      for (let i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          size: 1.2 + Math.random() * 1.6,
        });
      }

      for (let i = 0; i < dustCount; i += 1) {
        dust.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          size: 0.6 + Math.random() * 1.4,
          alpha: 0.08 + Math.random() * 0.4,
        });
      }
    }

    function setPointerPosition(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
      pointer.active = true;
    }

    function schedulePointerRelease(pointerType) {
      window.clearTimeout(releaseTimer);

      if (pointerType === "touch" || coarsePointerQuery.matches) {
        releaseTimer = window.setTimeout(() => {
          pointer.active = false;
        }, 1100);
      }
    }

    const surface = canvas.closest(".hero") || canvas;

    surface.addEventListener("pointerdown", (event) => {
      setPointerPosition(event.clientX, event.clientY);
      schedulePointerRelease(event.pointerType);
    });

    surface.addEventListener("pointermove", (event) => {
      setPointerPosition(event.clientX, event.clientY);
      if (event.pointerType === "touch") {
        schedulePointerRelease(event.pointerType);
      }
    });

    surface.addEventListener("pointerleave", () => {
      window.clearTimeout(releaseTimer);
      pointer.active = false;
    });

    surface.addEventListener("pointerup", (event) => {
      schedulePointerRelease(event.pointerType);
    });

    surface.addEventListener("pointercancel", () => {
      schedulePointerRelease("touch");
    });

    function updateNode(node, speed) {
      node.x += node.vx * speed;
      node.y += node.vy * speed;

      if (node.x < -60) node.x = width + 60;
      if (node.x > width + 60) node.x = -60;
      if (node.y < -60) node.y = height + 60;
      if (node.y > height + 60) node.y = -60;

      const dx = node.x - pointer.x;
      const dy = node.y - pointer.y;
      const dist = Math.hypot(dx, dy);

      if (pointer.active && dist < 150) {
        const force = (150 - dist) / 150;
        node.x += (dx / Math.max(dist, 1)) * force * 1.8;
        node.y += (dy / Math.max(dist, 1)) * force * 1.8;
      }
    }

    function drawBackground() {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#050507");
      gradient.addColorStop(0.56, "#07151a");
      gradient.addColorStop(1, "#050507");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(
        width * 0.7,
        height * 0.28,
        0,
        width * 0.7,
        height * 0.28,
        Math.max(width, height) * 0.42
      );
      glow.addColorStop(0, "rgba(223, 177, 113, 0.16)");
      glow.addColorStop(0.32, "rgba(158, 208, 198, 0.08)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    function render() {
      drawBackground();

      dust.forEach((particle) => {
        updateNode(particle, 1);
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        updateNode(a, 1);

        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(158, 208, 198, ${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.fillStyle = "rgba(242, 237, 231, 0.9)";
        ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = window.requestAnimationFrame(render);
    }

    resize();
    render();
    window.addEventListener("resize", resize);

    return () => {
      if (animationId) {
        window.cancelAnimationFrame(animationId);
      }
    };
  }

  function initManifestoPortrait() {
    const stage = document.querySelector(".manifesto__portrait-stage");
    if (!stage) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let releaseTimer = null;

    function setPortraitDepth(pointerX, pointerY) {
      const rotateX = (0.5 - pointerY) * 7.5;
      const rotateY = (pointerX - 0.5) * 9.5;
      const shiftX = (pointerX - 0.5) * 26;
      const shiftY = (pointerY - 0.5) * 18;

      stage.style.setProperty("--portrait-rotate-x", `${rotateX.toFixed(2)}deg`);
      stage.style.setProperty("--portrait-rotate-y", `${rotateY.toFixed(2)}deg`);
      stage.style.setProperty("--portrait-shift-x", `${shiftX.toFixed(2)}px`);
      stage.style.setProperty("--portrait-shift-y", `${shiftY.toFixed(2)}px`);
    }

    function resetPortraitDepth() {
      stage.style.setProperty("--portrait-rotate-x", "0deg");
      stage.style.setProperty("--portrait-rotate-y", "0deg");
      stage.style.setProperty("--portrait-shift-x", "0px");
      stage.style.setProperty("--portrait-shift-y", "0px");
    }

    if (reducedMotion.matches) {
      resetPortraitDepth();
      return;
    }

    function updateDepthFromEvent(event) {
      const rect = stage.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
      const y = clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);
      setPortraitDepth(x, y);
    }

    stage.addEventListener("pointerdown", (event) => {
      updateDepthFromEvent(event);
      window.clearTimeout(releaseTimer);
    });

    stage.addEventListener("pointermove", (event) => {
      updateDepthFromEvent(event);
      if (event.pointerType === "touch") {
        window.clearTimeout(releaseTimer);
        releaseTimer = window.setTimeout(resetPortraitDepth, 320);
      }
    });

    stage.addEventListener("pointerleave", resetPortraitDepth);
    stage.addEventListener("pointerup", (event) => {
      if (event.pointerType === "touch" || coarsePointerQuery.matches) {
        window.clearTimeout(releaseTimer);
        releaseTimer = window.setTimeout(resetPortraitDepth, 320);
      }
    });
    resetPortraitDepth();
  }

  class ProjectParticleMorph {
    constructor(canvas, initialText = "PROJECT", initialOptions = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.offscreen = document.createElement("canvas");
      this.offCtx = this.offscreen.getContext("2d", { willReadFrequently: true });
      this.pointer = { x: 0, y: 0, active: false };
      this.particles = [];
      this.targets = [];
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.mouseInside = false;
      this.animationId = null;
      this.releaseTimer = null;
      this.theme = {
        accent: "223, 177, 113",
        secondary: "158, 208, 198",
      };
      this.currentText = initialText;
      this.currentOptions = {
        offsetY: Number(initialOptions?.offsetY || 0),
      };

      this.handlePointerDown = this.handlePointerDown.bind(this);
      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handlePointerUp = this.handlePointerUp.bind(this);
      this.handlePointerLeave = this.handlePointerLeave.bind(this);
      this.resize = this.resize.bind(this);
      this.render = this.render.bind(this);

      this.canvas.addEventListener("pointerdown", this.handlePointerDown);
      this.canvas.addEventListener("pointermove", this.handlePointerMove);
      this.canvas.addEventListener("pointerup", this.handlePointerUp);
      this.canvas.addEventListener("pointercancel", this.handlePointerUp);
      this.canvas.addEventListener("pointerleave", this.handlePointerLeave);
      window.addEventListener("resize", this.resize);
      this.resize();
      this.refreshTargets();
      this.render();
    }

    setTheme(theme) {
      this.theme = {
        accent: theme?.accent || "223, 177, 113",
        secondary: theme?.secondary || "158, 208, 198",
      };
    }

    setPointerFromClient(clientX, clientY) {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = clientX - rect.left;
      this.pointer.y = clientY - rect.top;
      this.pointer.active = true;
    }

    schedulePointerRelease(pointerType) {
      window.clearTimeout(this.releaseTimer);

      if (pointerType === "touch" || coarsePointerQuery.matches) {
        this.releaseTimer = window.setTimeout(() => {
          this.pointer.active = false;
        }, 900);
      }
    }

    handlePointerDown(event) {
      this.setPointerFromClient(event.clientX, event.clientY);
      this.schedulePointerRelease(event.pointerType);
    }

    handlePointerMove(event) {
      this.setPointerFromClient(event.clientX, event.clientY);
      if (event.pointerType === "touch") {
        this.schedulePointerRelease(event.pointerType);
      }
    }

    handlePointerUp(event) {
      this.schedulePointerRelease(event.pointerType);
    }

    handlePointerLeave() {
      window.clearTimeout(this.releaseTimer);
      this.pointer.active = false;
    }

    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = this.canvas.clientWidth;
      this.height = this.canvas.clientHeight;
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.offscreen.width = this.width;
      this.offscreen.height = this.height;
      if (this.width && this.height) {
        this.refreshTargets();
      }
    }

    refreshTargets() {
      this.targets = this.createTargets(this.currentText || "PROJECT", this.currentOptions);

      while (this.particles.length < this.targets.length) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: 0,
          vy: 0,
          alpha: 0.54 + Math.random() * 0.28,
          drawAlpha: 0,
          size: 1.55 + Math.random() * 1.45,
        });
      }
    }

    createTargets(text, options = this.currentOptions) {
      const off = this.offCtx;
      off.clearRect(0, 0, this.width, this.height);

      const lines = text.split("|");
      const offsetY = Number(options?.offsetY || 0);
      const horizontalPadding = Math.max(42, this.width * 0.1);
      const verticalPadding = Math.max(40, this.height * 0.14);
      const safeWidth = Math.max(this.width - horizontalPadding * 2, 120);
      const safeHeight = Math.max(this.height - verticalPadding * 2, 120);
      let fontSize = Math.min(this.width * 0.142, this.height * 0.235, 112);
      let lineHeight = fontSize * 0.82;

      off.textAlign = "center";
      off.textBaseline = "middle";
      off.fillStyle = "#fff";

      for (let i = 0; i < 16; i += 1) {
        off.font = `800 ${fontSize}px Syne`;
        const widestLine = lines.reduce((max, line) => {
          const metrics = off.measureText(line);
          return Math.max(max, metrics.width);
        }, 0);
        const totalHeight = fontSize + lineHeight * Math.max(lines.length - 1, 0);

        if (widestLine <= safeWidth && totalHeight <= safeHeight) {
          break;
        }

        const widthRatio = safeWidth / Math.max(widestLine, 1);
        const heightRatio = safeHeight / Math.max(totalHeight, 1);
        const ratio = Math.min(widthRatio, heightRatio, 0.94);
        fontSize *= ratio;
        lineHeight = fontSize * 0.82;
      }

      off.font = `800 ${fontSize}px Syne`;
      const blockHeight = fontSize + lineHeight * Math.max(lines.length - 1, 0);
      const startY = (this.height - blockHeight) / 2 + fontSize / 2 + offsetY;

      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        off.fillText(line, this.width / 2, y);
      });

      const image = off.getImageData(0, 0, this.width, this.height).data;
      const gap = this.width < 640 ? 7 : 6;
      const points = [];

      for (let y = 0; y < this.height; y += gap) {
        for (let x = 0; x < this.width; x += gap) {
          const alpha = image[(y * this.width + x) * 4 + 3];
          if (alpha > 30) {
            points.push({
              x,
              y,
            });
          }
        }
      }

      return points;
    }

    setText(text, options = {}) {
      this.currentText = text;
      this.currentOptions = {
        offsetY: Number(options?.offsetY || 0),
      };
      this.refreshTargets();
    }

    renderBackground() {
      const ctx = this.ctx;
      const accent = this.theme.accent;
      const secondary = this.theme.secondary;
      const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
      gradient.addColorStop(0, "rgba(8, 15, 19, 1)");
      gradient.addColorStop(0.5, "rgba(10, 21, 26, 1)");
      gradient.addColorStop(1, "rgba(8, 15, 19, 1)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);

      const glow = ctx.createRadialGradient(
        this.width * 0.5,
        this.height * 0.46,
        0,
        this.width * 0.5,
        this.height * 0.46,
        Math.max(this.width, this.height) * 0.42
      );
      glow.addColorStop(0, `rgba(${accent}, 0.16)`);
      glow.addColorStop(0.4, `rgba(${secondary}, 0.07)`);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    render() {
      const ctx = this.ctx;
      this.renderBackground();

      const activeParticles = Math.max(this.targets.length, 1);
      const total = Math.max(this.particles.length, activeParticles);

      for (let i = 0; i < total; i += 1) {
        const particle = this.particles[i];
        if (!particle) {
          continue;
        }

        const target = this.targets[i];
        const targetX = target ? target.x : this.width / 2;
        const targetY = target ? target.y : this.height * 0.5;
        const dx = targetX - particle.x;
        const dy = targetY - particle.y;

        particle.vx += dx * (target ? 0.024 : 0.012);
        particle.vy += dy * (target ? 0.024 : 0.012);

        if (this.pointer.active) {
          const mx = particle.x - this.pointer.x;
          const my = particle.y - this.pointer.y;
          const dist = Math.hypot(mx, my);
          if (dist < 82) {
            const force = (82 - dist) / 82;
            particle.vx += (mx / Math.max(dist, 1)) * force * 1.8;
            particle.vy += (my / Math.max(dist, 1)) * force * 1.8;
          }
        }

        particle.vx *= 0.8;
        particle.vy *= 0.8;
        particle.x += particle.vx;
        particle.y += particle.vy;

        const desiredAlpha = target ? particle.alpha : 0;
        particle.drawAlpha += (desiredAlpha - particle.drawAlpha) * 0.16;
      }

      const drawCount = Math.min(this.targets.length, this.particles.length);

      for (let i = 0; i < drawCount; i += 1) {
        const a = this.particles[i];
        if (a.drawAlpha < 0.2) {
          continue;
        }

        for (let j = i + 1; j < Math.min(i + 7, drawCount); j += 1) {
          const b = this.particles[j];
          if (b.drawAlpha < 0.2) {
            continue;
          }
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 18) {
            const alpha = 0.035 * (1 - dist / 18) * Math.min(a.drawAlpha, b.drawAlpha);
            ctx.strokeStyle = `rgba(${this.theme.secondary}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < this.particles.length; i += 1) {
        const particle = this.particles[i];
        if (particle.drawAlpha < 0.02) {
          continue;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(242, 237, 231, ${Math.min(particle.drawAlpha * 1.12, 0.94)})`;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      this.animationId = window.requestAnimationFrame(this.render);
    }
  }

  function initProjects() {
    const canvas = document.getElementById("project-canvas");
    const counter = document.getElementById("project-counter");
    const title = document.getElementById("project-title");
    const subtitle = document.getElementById("project-subtitle");
    const section = document.getElementById("projects");
    const cards = Array.from(document.querySelectorAll(".project-card"));

    if (!canvas || !cards.length || !section) {
      return;
    }

    const initialCard = cards.find((card) => card.classList.contains("is-active")) || cards[0];
    const morph = new ProjectParticleMorph(canvas, initialCard.dataset.particleText || "PROJECT", {
      offsetY: Number(initialCard.dataset.particleOffsetY || 0),
    });
    let activeCard = null;
    let ticking = false;

    function applyProjectTheme(card) {
      const accentValue = card.dataset.accent || "223 177 113";
      const secondaryValue = card.dataset.secondary || "158 208 198";
      section.style.setProperty("--project-accent", accentValue);
      section.style.setProperty("--project-secondary", secondaryValue);
      morph.setTheme({
        accent: accentValue.replace(/\s+/g, ", "),
        secondary: secondaryValue.replace(/\s+/g, ", "),
      });
    }

    function activate(card) {
      if (activeCard === card) {
        return;
      }
      activeCard = card;
      cards.forEach((item) => item.classList.toggle("is-active", item === card));
      counter.textContent = `Project ${card.dataset.counter}`;
      title.textContent = card.dataset.title;
      subtitle.textContent = card.dataset.subtitle;
      applyProjectTheme(card);
      morph.setText(card.dataset.particleText || "PROJECT", {
        offsetY: Number(card.dataset.particleOffsetY || 0),
      });
    }

    function updateActiveByViewport() {
      ticking = false;
      const sectionRect = section.getBoundingClientRect();
      if (sectionRect.bottom < 0 || sectionRect.top > window.innerHeight) {
        return;
      }

      const activationLine = window.innerWidth < 1100 ? window.innerHeight * 0.48 : window.innerHeight * 0.42;
      let closestCard = cards[0];
      let closestDistance = Infinity;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - activationLine);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestCard = card;
        }
      });

      activate(closestCard);
    }

    function queueUpdate() {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(updateActiveByViewport);
    }

    window.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    activate(initialCard);
    queueUpdate();
  }

  function initStatsCounter() {
    const values = Array.from(document.querySelectorAll("[data-count]"));
    if (!values.length) {
      return;
    }

    const section = document.getElementById("leadership");
    let started = false;

    function animateValue(element, duration) {
      const end = Number(element.dataset.count || 0);
      const startTime = performance.now();

      function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(end * eased).toLocaleString();
        if (progress < 1) {
          window.requestAnimationFrame(tick);
        }
      }

      window.requestAnimationFrame(tick);
    }

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;
            values.forEach((value, index) => animateValue(value, 1100 + index * 120));
          }
        });
      },
      { threshold: 0.35 }
    );

    counterObserver.observe(section);
  }

  function initSkillsConstellation() {
    const shell = document.querySelector(".skills__constellation");
    const canvas = document.getElementById("skills-canvas");
    const chips = Array.from(document.querySelectorAll(".skills__chip"));

    if (!shell || !canvas || !chips.length) {
      return;
    }

    const ctx = canvas.getContext("2d");
    const pointer = {
      x: 0,
      y: 0,
      active: false,
    };
    const nodes = [];
    const anchors = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationId = null;
    let releaseTimer = null;

    function updateCursorVariables(px, py) {
      shell.style.setProperty("--skills-cursor-x", `${(px * 100).toFixed(2)}%`);
      shell.style.setProperty("--skills-cursor-y", `${(py * 100).toFixed(2)}%`);
    }

    function buildNodes() {
      nodes.length = 0;
      const count = Math.min(120, Math.floor((width * height) / 12000));

      for (let i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          size: 0.8 + Math.random() * 1.9,
          alpha: 0.12 + Math.random() * 0.44,
        });
      }
    }

    function measureAnchors() {
      anchors.length = 0;
      chips.forEach((chip) => {
        const styles = window.getComputedStyle(chip);
        anchors.push({
          x: parseFloat(styles.getPropertyValue("--chip-x")) / 100,
          y: parseFloat(styles.getPropertyValue("--chip-y")) / 100,
        });
      });
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measureAnchors();
      buildNodes();
    }

    function getChipLayout(chip, index, time) {
      const anchor = anchors[index];
      const baseX = anchor.x * width;
      const baseY = anchor.y * height;
      const dx = pointer.x - baseX;
      const dy = pointer.y - baseY;
      const dist = Math.hypot(dx, dy);
      const influence = pointer.active ? Math.max(0, 1 - dist / 170) : 0;
      const safeDist = Math.max(dist, 1);
      const repel = influence * 18;
      const driftX = Math.sin(time * 0.00045 + index * 0.7) * 5;
      const driftY = Math.cos(time * 0.00038 + index * 0.9) * 4;
      const offsetX = influence ? (-dx / safeDist) * repel : 0;
      const offsetY = influence ? (-dy / safeDist) * repel : 0;
      const scale = 1 + influence * 0.18;
      const rawX = baseX + driftX + offsetX;
      const rawY = baseY + driftY + offsetY;
      const chipWidth = chip.offsetWidth;
      const chipHeight = chip.offsetHeight;
      const edgeX = 24;
      const edgeTop = 48;
      const edgeBottom = 34;
      const clampedX = clamp(rawX, chipWidth / 2 + edgeX, width - chipWidth / 2 - edgeX);
      const clampedY = clamp(rawY, chipHeight / 2 + edgeTop, height - chipHeight / 2 - edgeBottom);

      return {
        chip,
        baseX,
        baseY,
        x: clampedX,
        y: clampedY,
        width: chipWidth,
        height: chipHeight,
        scale,
        active: influence > 0.12,
        edgeX,
        edgeTop,
        edgeBottom,
      };
    }

    function resolveChipCollisions(layouts) {
      for (let pass = 0; pass < 6; pass += 1) {
        for (let i = 0; i < layouts.length; i += 1) {
          const a = layouts[i];

          for (let j = i + 1; j < layouts.length; j += 1) {
            const b = layouts[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const minDx = (a.width + b.width) / 2 + 10;
            const minDy = (a.height + b.height) / 2 + 8;

            if (Math.abs(dx) >= minDx || Math.abs(dy) >= minDy) {
              continue;
            }

            const overlapX = minDx - Math.abs(dx);
            const overlapY = minDy - Math.abs(dy);

            if (overlapX < overlapY) {
              const dirX = dx === 0 ? (i % 2 === 0 ? -1 : 1) : Math.sign(dx);
              const shift = overlapX * 0.52;

              a.x = clamp(
                a.x - dirX * shift,
                a.width / 2 + a.edgeX,
                width - a.width / 2 - a.edgeX
              );
              b.x = clamp(
                b.x + dirX * shift,
                b.width / 2 + b.edgeX,
                width - b.width / 2 - b.edgeX
              );
            } else {
              const dirY = dy === 0 ? (i % 2 === 0 ? -1 : 1) : Math.sign(dy);
              const shift = overlapY * 0.56;

              a.y = clamp(
                a.y - dirY * shift,
                a.height / 2 + a.edgeTop,
                height - a.height / 2 - a.edgeBottom
              );
              b.y = clamp(
                b.y + dirY * shift,
                b.height / 2 + b.edgeTop,
                height - b.height / 2 - b.edgeBottom
              );
            }
          }
        }
      }
    }

    function render(time) {
      ctx.clearRect(0, 0, width, height);

      nodes.forEach((node, index) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < -40) node.x = width + 40;
        if (node.x > width + 40) node.x = -40;
        if (node.y < -40) node.y = height + 40;
        if (node.y > height + 40) node.y = -40;

        if (pointer.active) {
          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150) {
            const force = (150 - dist) / 150;
            node.x += (dx / Math.max(dist, 1)) * force * 0.9;
            node.y += (dy / Math.max(dist, 1)) * force * 0.9;
          }
        }

        for (let j = index + 1; j < nodes.length; j += 1) {
          const next = nodes[j];
          const distance = Math.hypot(node.x - next.x, node.y - next.y);
          if (distance < 94) {
            ctx.strokeStyle = `rgba(158, 208, 198, ${0.085 * (1 - distance / 94)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.fillStyle =
          pointer.active && Math.hypot(node.x - pointer.x, node.y - pointer.y) < 140
            ? "rgba(243, 238, 231, 0.95)"
            : `rgba(223, 177, 113, ${node.alpha})`;
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();
      });

      const layouts = chips.map((chip, index) => getChipLayout(chip, index, time));
      resolveChipCollisions(layouts);

      layouts.forEach((layout) => {
        const translateX = layout.x - layout.baseX;
        const translateY = layout.y - layout.baseY;
        layout.chip.style.transform =
          `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${layout.scale})`;
        layout.chip.classList.toggle("is-active", layout.active);
      });

      animationId = window.requestAnimationFrame(render);
    }

    function setPointerFromEvent(event) {
      const rect = shell.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
      updateCursorVariables(pointer.x / Math.max(width, 1), pointer.y / Math.max(height, 1));
    }

    function schedulePointerRelease(pointerType) {
      window.clearTimeout(releaseTimer);

      if (pointerType === "touch" || coarsePointerQuery.matches) {
        releaseTimer = window.setTimeout(() => {
          pointer.active = false;
          updateCursorVariables(0.5, 0.5);
          chips.forEach((chip) => chip.classList.remove("is-active"));
        }, 1300);
      }
    }

    shell.addEventListener("pointerdown", (event) => {
      setPointerFromEvent(event);
      schedulePointerRelease(event.pointerType);
    });

    shell.addEventListener("pointermove", (event) => {
      setPointerFromEvent(event);
      if (event.pointerType === "touch") {
        schedulePointerRelease(event.pointerType);
      }
    });

    shell.addEventListener("pointerleave", () => {
      window.clearTimeout(releaseTimer);
      pointer.active = false;
      updateCursorVariables(0.5, 0.5);
      chips.forEach((chip) => chip.classList.remove("is-active"));
    });

    shell.addEventListener("pointerup", (event) => {
      schedulePointerRelease(event.pointerType);
    });

    shell.addEventListener("pointercancel", () => {
      schedulePointerRelease("touch");
    });

    window.addEventListener("resize", resize);
    updateCursorVariables(0.5, 0.5);
    resize();
    render(0);

    return () => {
      if (animationId) {
        window.cancelAnimationFrame(animationId);
      }
    };
  }

  initHeroField();
  initManifestoPortrait();
  initProjects();
  initStatsCounter();
  initSkillsConstellation();
  queueStageUpdate();
})();
