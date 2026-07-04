"use client";

import { useEffect } from "react";

/**
 * Ports the design's imperative animation JS (scroll-reveal, 3D hover-tilt,
 * hero phone parallax, scroll parallax orbs, magnetic buttons) to a single
 * client effect. Renders nothing.
 */
export default function LandingEffects() {
  useEffect(() => {
    const cleanup: Array<() => void> = [];
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── scroll-reveal ────────────────────────────────────────────
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!reduce && revealEls.length) {
      const show = (el: HTMLElement) => {
        el.style.opacity = "1";
        el.style.transform = "perspective(900px) translateY(0) rotateX(0deg)";
      };
      const pending = new Set<HTMLElement>();
      revealEls.forEach((el, i) => {
        el.style.transition = "opacity 0.7s ease, transform 0.8s cubic-bezier(0.22,1,0.36,1)";
        el.style.transitionDelay = (i % 3) * 90 + "ms";
        el.style.opacity = "0";
        el.style.transform = "perspective(900px) translateY(30px) rotateX(7deg)";
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.95 && r.bottom > 0) {
          const st = setTimeout(() => show(el), 40 + (i % 3) * 90);
          cleanup.push(() => clearTimeout(st));
        } else {
          pending.add(el);
        }
      });
      let ioFired = false;
      if ("IntersectionObserver" in window && pending.size) {
        const io = new IntersectionObserver(
          (entries) => {
            ioFired = true;
            entries.forEach((en) => {
              if (en.isIntersecting) {
                show(en.target as HTMLElement);
                pending.delete(en.target as HTMLElement);
                io.unobserve(en.target);
              }
            });
          },
          { threshold: 0.12 },
        );
        pending.forEach((el) => io.observe(el));
        cleanup.push(() => io.disconnect());
      }
      const check = () => {
        pending.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < window.innerHeight * 0.95 && r.bottom > 0) {
            show(el);
            pending.delete(el);
          }
        });
      };
      window.addEventListener("scroll", check, { passive: true });
      window.addEventListener("resize", check, { passive: true });
      cleanup.push(() => {
        window.removeEventListener("scroll", check);
        window.removeEventListener("resize", check);
      });
      const safety = setTimeout(() => {
        revealEls.forEach((el) => {
          if (getComputedStyle(el).opacity === "0") show(el);
        });
        if (!ioFired) pending.clear();
      }, 1600);
      cleanup.push(() => clearTimeout(safety));
    }

    // ── 3D hover-tilt + cursor glare on cards ────────────────────
    document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = "transform 0.12s ease-out";
        el.style.transform =
          "perspective(800px) rotateX(" +
          (-y * 9).toFixed(2) +
          "deg) rotateY(" +
          (x * 11).toFixed(2) +
          "deg) translateZ(10px)";
        el.style.zIndex = "2";
        el.style.backgroundImage =
          "radial-gradient(circle at " +
          ((x + 0.5) * 100).toFixed(1) +
          "% " +
          ((y + 0.5) * 100).toFixed(1) +
          "%, rgba(253,79,97,0.10), rgba(255,255,255,0) 55%)";
      };
      const leave = () => {
        el.style.transition = "transform 0.6s cubic-bezier(0.22,1,0.36,1)";
        el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)";
        el.style.zIndex = "";
        el.style.backgroundImage = "none";
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      cleanup.push(() => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      });
    });

    // ── hero phone 3D tilt + parallax hearts ─────────────────────
    const area = document.querySelector<HTMLElement>("[data-hero-area]");
    const phone = document.querySelector<HTMLElement>("[data-hero-tilt]");
    if (area && phone && !reduce) {
      const hearts = Array.from(area.querySelectorAll<HTMLElement>("[data-depth]"));
      const move = (e: MouseEvent) => {
        const r = area.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        phone.style.animation = "none";
        phone.style.transition = "transform 0.15s ease-out";
        phone.style.transform =
          "rotateX(" + (-y * 10).toFixed(2) + "deg) rotateY(" + (x * 14).toFixed(2) + "deg)";
        hearts.forEach((h) => {
          const d = parseFloat(h.getAttribute("data-depth") || "12") || 12;
          h.style.transition = "transform 0.2s ease-out";
          h.style.transform =
            "translate3d(" + (x * d).toFixed(1) + "px," + (y * d).toFixed(1) + "px,0)";
        });
      };
      const leave = () => {
        phone.style.transition = "transform 0.8s cubic-bezier(0.22,1,0.36,1)";
        phone.style.transform = "rotateX(0deg) rotateY(0deg)";
        hearts.forEach((h) => {
          h.style.transition = "transform 0.8s ease";
          h.style.transform = "translate3d(0,0,0)";
        });
      };
      area.addEventListener("mousemove", move);
      area.addEventListener("mouseleave", leave);
      cleanup.push(() => {
        area.removeEventListener("mousemove", move);
        area.removeEventListener("mouseleave", leave);
      });
    }

    // ── scroll parallax on orbs ──────────────────────────────────
    const orbs = Array.from(document.querySelectorAll<HTMLElement>("[data-orb]"));
    if (orbs.length && !reduce) {
      const onScrollPar = () => {
        const sy = window.scrollY || 0;
        orbs.forEach((o) => {
          const f = parseFloat(o.getAttribute("data-orb") || "0.05") || 0.05;
          o.style.marginTop = (sy * f).toFixed(1) + "px";
        });
      };
      window.addEventListener("scroll", onScrollPar, { passive: true });
      cleanup.push(() => window.removeEventListener("scroll", onScrollPar));
    }

    // ── magnetic CTA buttons ─────────────────────────────────────
    document.querySelectorAll<HTMLElement>("[data-magnet]").forEach((el) => {
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transition = "transform 0.15s ease-out";
        el.style.transform =
          "translate(" + (x * 0.16).toFixed(1) + "px," + (y * 0.22).toFixed(1) + "px)";
      };
      const leave = () => {
        el.style.transition = "transform 0.5s cubic-bezier(0.22,1,0.36,1)";
        el.style.transform = "translate(0,0)";
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      cleanup.push(() => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      });
    });

    return () => cleanup.forEach((fn) => fn());
  }, []);

  return null;
}
