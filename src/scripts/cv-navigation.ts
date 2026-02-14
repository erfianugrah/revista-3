interface CvNavElements {
  navToggle: HTMLElement;
  navLinks: HTMLElement;
  navIcon: HTMLElement;
  sectionLinks: NodeListOf<Element>;
  sections: NodeListOf<Element>;
}

function setLinkActive(link: Element, active: boolean): void {
  link.classList.toggle("active", active);
  link.classList.toggle("text-blue-600", active);
  link.classList.toggle("dark:text-blue-400", active);
  link.classList.toggle("font-semibold", active);
  link.classList.toggle("text-slate-600", !active);
  link.classList.toggle("dark:text-slate-300", !active);
  link.setAttribute("aria-current", active ? "true" : "false");
}

function closeMobileNav(els: CvNavElements): void {
  els.navToggle.setAttribute("aria-expanded", "false");
  els.navLinks.classList.remove("expanded");
  els.navLinks.classList.add("hidden");
  els.navLinks.style.maxHeight = "0";
  els.navIcon.classList.remove("rotate-180");
}

/**
 * Mobile navigation toggle (expand/collapse section links).
 */
export function initMobileNav(els: CvNavElements): void {
  els.navToggle.addEventListener("click", () => {
    const expanded = els.navToggle.getAttribute("aria-expanded") === "true";
    els.navToggle.setAttribute("aria-expanded", (!expanded).toString());

    if (expanded) {
      els.navLinks.classList.remove("expanded");
      els.navLinks.classList.add("hidden");
      els.navLinks.style.maxHeight = "0";
      els.navIcon.classList.remove("rotate-180");
    } else {
      els.navLinks.classList.add("expanded");
      els.navLinks.classList.remove("hidden");
      els.navLinks.style.maxHeight = els.navLinks.scrollHeight + "px";
      els.navIcon.classList.add("rotate-180");
    }
  });

  els.navLinks.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape" && window.innerWidth < 768) {
      closeMobileNav(els);
      els.navToggle.focus();
    }
  });
}

/**
 * Section navigation: smooth-scroll on link click, active-state
 * management, and URL hash updates.
 */
export function initSectionNav(els: CvNavElements): void {
  els.sectionLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href")?.substring(1);
      if (!targetId) return;

      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;

      // Highlight effect
      targetElement.classList.add("highlight-section");
      setTimeout(
        () => targetElement.classList.remove("highlight-section"),
        2000,
      );

      // Scroll with sticky-header offset
      const headerHeight =
        (document.querySelector(".cv-nav") as HTMLElement | null)
          ?.offsetHeight ?? 0;
      const targetPosition =
        targetElement.getBoundingClientRect().top +
        window.scrollY -
        headerHeight -
        20;

      window.scrollTo({ top: targetPosition, behavior: "smooth" });

      // Update active states
      els.sectionLinks.forEach((lnk) => setLinkActive(lnk, false));
      setLinkActive(link, true);

      // Close mobile nav if open
      if (
        window.innerWidth < 768 &&
        els.navLinks.classList.contains("expanded")
      ) {
        closeMobileNav(els);
      }

      history.replaceState(null, "", `#${targetId}`);
    });
  });
}

/**
 * Scroll-spy via IntersectionObserver: highlights the nav link
 * corresponding to the currently visible section heading.
 */
export function initScrollSpy(els: CvNavElements): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          if (!id) return;

          history.replaceState(null, "", `#${id}`);

          els.sectionLinks.forEach((link) => {
            const href = link.getAttribute("href");
            setLinkActive(link, href === `#${id}`);
          });
        }
      });
    },
    { root: null, rootMargin: "-80px 0px -40% 0px", threshold: 0 },
  );

  els.sections.forEach((section) => observer.observe(section));

  // Initial hash check
  if (location.hash) {
    const id = location.hash.substring(1);
    const link = document.querySelector(`.section-link[href="#${id}"]`);
    if (link) setLinkActive(link, true);
  }
}
