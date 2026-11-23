/* ==========================================================================
   PORTFOLIO — ISAAC NGINYA
   Script principal (JavaScript vanilla, sans librairie)
   --------------------------------------------------------------------------
   Sommaire :
   01. Utilitaires & détection des préférences
   02. Découpage du nom en lettres
   03. Preloader
   04. Header (glassmorphism) & barre de progression
   05. Menu burger mobile
   06. Lien actif selon la section visible
   07. Apparitions au scroll (IntersectionObserver)
   08. Compteurs animés
   09. Progression de la timeline
   10. Effet machine à écrire
   11. Curseur personnalisé
   12. Boutons magnétiques & remplissage
   13. Effet tilt 3D des projets
   14. Images de remplacement des projets
   15. Formulaire de contact
   16. Initialisation
   ========================================================================== */

(function () {
  "use strict";

  /* ==========================================================================
     01. UTILITAIRES & PRÉFÉRENCES
     ========================================================================== */
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  // L'utilisateur préfère-t-il réduire les animations ?
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Souris précise (desktop) ? → curseur personnalisé, effets magnétiques et tilt
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const body = document.body;


  /* ==========================================================================
     02. DÉCOUPAGE DU NOM EN LETTRES
     Chaque lettre devient un <span class="char"> avec un index (--i)
     utilisé par le CSS pour décaler l'animation.
     ========================================================================== */
  function splitText() {
    let index = 0;

    $$("[data-split]").forEach((element) => {
      const text = element.textContent.trim();
      element.textContent = "";
      element.setAttribute("aria-hidden", "true"); // le h1 porte déjà un aria-label

      [...text].forEach((letter) => {
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = letter === " " ? " " : letter;
        span.style.setProperty("--i", index++);
        element.appendChild(span);
      });
    });
  }


  /* ==========================================================================
     03. PRELOADER
     Reste affiché au minimum le temps de l'animation des initiales,
     puis disparaît dès que la page est chargée (avec un délai maximum).
     ========================================================================== */
  function initPreloader(onDone) {
    const preloader = $("#preloader");
    const MIN_TIME = reducedMotion ? 0 : 1900;
    const MAX_TIME = 4500;
    const start = performance.now();
    let finished = false;

    function hide() {
      if (finished) return;
      finished = true;

      const elapsed = performance.now() - start;
      const wait = Math.max(0, MIN_TIME - elapsed);

      setTimeout(() => {
        if (preloader) preloader.classList.add("is-hidden");
        body.classList.remove("is-loading");
        body.classList.add("is-loaded");
        onDone();
      }, wait);
    }

    if (document.readyState === "complete") {
      hide();
    } else {
      window.addEventListener("load", hide, { once: true });
      setTimeout(hide, MAX_TIME); // sécurité si une image tarde à charger
    }
  }


  /* ==========================================================================
     04. HEADER & BARRE DE PROGRESSION
     ========================================================================== */
  function initScrollEffects() {
    const header = $("#header");
    const progress = $("#scrollProgress");
    const timeline = $("#timeline");
    let ticking = false;

    function update() {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = maxScroll > 0 ? scrollTop / maxScroll : 0;

      // Barre de progression de lecture
      if (progress) progress.style.transform = `scaleX(${ratio})`;

      // Menu en mode « verre dépoli » après 40px de scroll
      if (header) header.classList.toggle("is-scrolled", scrollTop > 40);

      // Remplissage de la ligne de la timeline
      if (timeline) updateTimeline(timeline);

      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener("resize", update);
    update();
  }


  /* ==========================================================================
     05. MENU BURGER MOBILE
     ========================================================================== */
  function initMobileMenu() {
    const burger = $("#burger");
    const menu = $("#navMenu");
    if (!burger || !menu) return;

    function setMenu(open) {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      menu.classList.toggle("is-open", open);
      body.classList.toggle("menu-open", open);
    }

    burger.addEventListener("click", () => {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });

    // Fermeture au clic sur un lien
    $$("a", menu).forEach((link) => link.addEventListener("click", () => setMenu(false)));

    // Fermeture avec la touche Échap
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("is-open")) {
        setMenu(false);
        burger.focus();
      }
    });

    // Si on repasse en desktop, on referme le menu
    window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => {
      if (event.matches) setMenu(false);
    });
  }


  /* ==========================================================================
     06. LIEN ACTIF SELON LA SECTION VISIBLE
     ========================================================================== */
  function initActiveLinks() {
    const links = $$(".nav__link");
    const sections = $$("main section[id]");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
        });
      });
    }, {
      // La section est « active » quand elle traverse le milieu de l'écran
      rootMargin: "-45% 0px -50% 0px",
      threshold: 0
    });

    sections.forEach((section) => observer.observe(section));
  }


  /* ==========================================================================
     07. APPARITIONS AU SCROLL
     Les éléments [data-reveal] reçoivent .is-visible quand ils entrent à l'écran.
     ========================================================================== */
  function initReveal() {
    const elements = $$("[data-reveal]");

    // Délai personnalisé via data-delay (en ms)
    elements.forEach((element) => {
      const delay = parseInt(element.dataset.delay || "0", 10);
      element.style.setProperty("--delay", `${delay}ms`);
    });

    function reveal(element) {
      element.classList.add("is-visible");

      // Lancement des compteurs contenus dans l'élément
      $$(".counter", element).forEach(animateCounter);

      // Une fois l'animation terminée, on retire l'attribut pour rendre
      // aux éléments leurs propres transitions de survol (sans délai).
      const delay = parseInt(element.dataset.delay || "0", 10);
      setTimeout(() => {
        element.removeAttribute("data-reveal");
        element.style.removeProperty("--delay");
      }, delay + 1200);
    }

    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          obs.unobserve(entry.target); // animation jouée une seule fois
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: "0px 0px -60px 0px"
    });

    elements.forEach((element) => observer.observe(element));
  }


  /* ==========================================================================
     08. COMPTEURS ANIMÉS
     ========================================================================== */
  function animateCounter(counter) {
    if (counter.dataset.done) return;
    counter.dataset.done = "true";

    const target = parseInt(counter.dataset.target, 10) || 0;

    if (reducedMotion) {
      counter.textContent = target;
      return;
    }

    const duration = 1800;
    const start = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      counter.textContent = Math.round(easeOutCubic(progress) * target);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }


  /* ==========================================================================
     09. PROGRESSION DE LA TIMELINE
     La ligne verticale se remplit au fur et à mesure du défilement.
     ========================================================================== */
  function updateTimeline(timeline) {
    const rect = timeline.getBoundingClientRect();
    const viewportMiddle = window.innerHeight * 0.6;
    const progress = (viewportMiddle - rect.top) / rect.height;
    const clamped = Math.min(Math.max(progress, 0), 1);
    timeline.style.setProperty("--progress", clamped.toFixed(3));
  }


  /* ==========================================================================
     10. EFFET MACHINE À ÉCRIRE
     ========================================================================== */
  function initTypewriter() {
    const element = $("#typewriter");
    if (!element) return;

    let words;
    try {
      words = JSON.parse(element.dataset.words);
    } catch (error) {
      return;
    }
    if (!words || !words.length) return;

    // Mouvements réduits : on garde le premier mot, sans animation
    if (reducedMotion) {
      element.textContent = words[0];
      return;
    }

    const TYPE_SPEED = 85;
    const DELETE_SPEED = 45;
    const HOLD_TIME = 1900;

    let wordIndex = 0;
    let charIndex = words[0].length; // le premier mot est déjà affiché
    let deleting = true;

    function loop() {
      const word = words[wordIndex];

      if (deleting) {
        charIndex--;
        element.textContent = word.slice(0, charIndex);

        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          setTimeout(loop, 350);
          return;
        }
        setTimeout(loop, DELETE_SPEED);
      } else {
        const next = words[wordIndex];
        charIndex++;
        element.textContent = next.slice(0, charIndex);

        if (charIndex === next.length) {
          deleting = true;
          setTimeout(loop, HOLD_TIME);
          return;
        }
        setTimeout(loop, TYPE_SPEED);
      }
    }

    setTimeout(loop, HOLD_TIME + 800);
  }


  /* ==========================================================================
     11. CURSEUR PERSONNALISÉ (desktop uniquement)
     ========================================================================== */
  function initCursor() {
    const cursor = $("#cursor");
    if (!cursor || !finePointer || reducedMotion) return;

    const dot = $(".cursor__dot", cursor);
    const ring = $(".cursor__ring", cursor);

    body.classList.add("has-cursor");

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;

    window.addEventListener("mousemove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      cursor.classList.remove("is-hidden");
    }, { passive: true });

    // Le cercle suit la souris avec un léger retard (interpolation)
    function follow() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(follow);
    }
    follow();

    // Changement d'état selon l'élément survolé
    const hoverTargets = "a, button, .chip, .socials__link, .magnetic";

    document.addEventListener("mouseover", (event) => {
      const target = event.target;
      cursor.classList.toggle("is-view", !!target.closest("[data-tilt]") && !target.closest("a, button"));
      cursor.classList.toggle("is-hover", !!target.closest(hoverTargets));
      cursor.classList.toggle("is-text", !!target.closest("input, textarea"));
    });

    document.documentElement.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
    document.documentElement.addEventListener("mouseenter", () => cursor.classList.remove("is-hidden"));
  }


  /* ==========================================================================
     12. BOUTONS MAGNÉTIQUES & REMPLISSAGE
     - Le bouton est légèrement attiré par la souris.
     - Le cercle de remplissage part de la position du curseur (--x / --y).
     ========================================================================== */
  function initMagnetic() {
    const elements = $$(".magnetic");

    elements.forEach((element) => {
      // Point de départ du remplissage (fonctionne aussi au tactile)
      function setOrigin(event) {
        const rect = element.getBoundingClientRect();
        element.style.setProperty("--x", `${event.clientX - rect.left}px`);
        element.style.setProperty("--y", `${event.clientY - rect.top}px`);
      }

      element.addEventListener("mouseenter", setOrigin);
      element.addEventListener("mouseleave", setOrigin);

      if (!finePointer || reducedMotion) return;

      const strength = 0.3;
      const label = $(".btn__label", element);

      element.addEventListener("mousemove", (event) => {
        const rect = element.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);

        element.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
        if (label) label.style.transform = `translate(${dx * 0.12}px, ${dy * 0.12}px)`;
        setOrigin(event);
      });

      element.addEventListener("mouseleave", () => {
        element.style.transform = "";
        if (label) label.style.transform = "";
      });
    });
  }


  /* ==========================================================================
     13. EFFET TILT 3D DES PROJETS
     ========================================================================== */
  function initTilt() {
    if (!finePointer || reducedMotion) return;

    const MAX_ROTATION = 9; // en degrés

    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("mouseenter", () => card.classList.add("is-tilting"));

      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;   // 0 → 1
        const y = (event.clientY - rect.top) / rect.height;   // 0 → 1

        const rotateY = (x - 0.5) * 2 * MAX_ROTATION;
        const rotateX = (0.5 - y) * 2 * MAX_ROTATION;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
      });

      card.addEventListener("mouseleave", () => {
        card.classList.remove("is-tilting");
        card.style.transform = "";
      });
    });
  }


  /* ==========================================================================
     14. IMAGES DE REMPLACEMENT DES PROJETS
     Si images/projet-X.jpg n'existe pas encore, on affiche un visuel stylé
     (initiales + motif pagne) à la place d'une image cassée.
     ========================================================================== */
  function initProjectFallbacks() {
    $$(".project-card__media img").forEach((img) => {
      const media = img.closest(".project-card__media");
      const showFallback = () => media.classList.add("no-img");

      // L'erreur a peut-être déjà eu lieu avant l'exécution du script
      if (img.complete && img.naturalWidth === 0) {
        showFallback();
      } else {
        img.addEventListener("error", showFallback, { once: true });
      }
    });
  }


  /* ==========================================================================
     15. FORMULAIRE DE CONTACT
     Sans serveur : le message est préparé dans le logiciel de messagerie
     du visiteur (mailto). Remplaçable plus tard par Formspree, Netlify Forms…
     ========================================================================== */
  function initContactForm() {
    const form = $("#contactForm");
    const status = $("#formStatus");
    if (!form) return;

    const EMAIL = "isaacnginya08@gmail.com";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setError(field, message) {
      const wrapper = field.closest(".field");
      wrapper.classList.toggle("has-error", !!message);
      $(".field__error", wrapper).textContent = message || "";
    }

    function validate() {
      const name = form.elements.name;
      const email = form.elements.email;
      const message = form.elements.message;
      let valid = true;

      if (name.value.trim().length < 2) {
        setError(name, "Merci d'indiquer votre nom.");
        valid = false;
      } else {
        setError(name, "");
      }

      if (!emailPattern.test(email.value.trim())) {
        setError(email, "Merci d'indiquer une adresse e-mail valide.");
        valid = false;
      } else {
        setError(email, "");
      }

      if (message.value.trim().length < 10) {
        setError(message, "Votre message doit contenir au moins 10 caractères.");
        valid = false;
      } else {
        setError(message, "");
      }

      return valid;
    }

    // Effacement de l'erreur dès que l'utilisateur corrige
    $$("input, textarea", form).forEach((field) => {
      field.addEventListener("input", () => {
        if (field.closest(".field").classList.contains("has-error")) validate();
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      status.textContent = "";

      if (!validate()) {
        const firstError = $(".has-error input, .has-error textarea", form);
        if (firstError) firstError.focus();
        return;
      }

      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const message = form.elements.message.value.trim();

      const subject = encodeURIComponent(`Nouveau message de ${name} (portfolio)`);
      const bodyText = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);

      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${bodyText}`;

      status.textContent = "Merci ! Votre messagerie s'ouvre pour finaliser l'envoi.";
      form.reset();
    });
  }


  /* ==========================================================================
     16. INITIALISATION
     ========================================================================== */
  splitText();
  initProjectFallbacks();
  initScrollEffects();
  initMobileMenu();
  initActiveLinks();
  initCursor();
  initMagnetic();
  initTilt();
  initContactForm();

  // Les animations d'entrée démarrent une fois le preloader terminé
  initPreloader(() => {
    initReveal();
    initTypewriter();
  });
})();
