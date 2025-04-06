# CV Page Enhancement Recommendations

## Introduction

This document outlines comprehensive improvements for the CV component in your Astro-based photography site. All suggestions maintain compatibility with your current tech stack (Astro v5.6.1, Tailwind CSS v4.0.8) and deployment targets (Docker, Deno Deploy, Cloudflare Pages).

## 1. UI and Styling Improvements

### 1.1 Icon System Consistency

**Current Issue**: Your project uses `astro-icon` in components like `Footer.astro` and `cv.astro`, but `CVContact.astro` uses hardcoded SVG paths.

**Recommendation**: Standardize on `astro-icon` throughout the CV components.

```astro
<!-- Replace in CVContact.astro -->
<!-- BEFORE: -->
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  class="h-5 w-5 text-blue-600 mr-2" 
  viewBox={iconPaths[contact.icon]?.viewBox || "0 0 20 20"} 
  fill="currentColor"
>
  {iconPaths[contact.icon]?.path.map(pathData => (
    <path d={pathData} fill-rule={contact.icon === 'website' ? 'evenodd' : undefined} clip-rule={contact.icon === 'website' ? 'evenodd' : undefined} />
  ))}
</svg>

<!-- AFTER: -->
<Icon 
  name={`mdi:${contact.icon}`} 
  class="h-5 w-5 text-blue-600 mr-2" 
/>
```

**Benefits**: Improved maintainability, reduced code duplication, and easier icon updates.

### 1.2 Print Style Centralization

**Current Issue**: Print styles are spread across multiple components (`Prose_cv.astro`, `CVContact.astro`, and inline in `cv.astro`).

**Recommendation**: Create a dedicated `cv-print.css` file in the `src/styles/` directory.

```css
/* src/styles/cv-print.css */
@media print {
  @page {
    margin: 1cm;
    size: A4;
  }
  
  body {
    font-size: 12pt;
    color: #000;
    background-color: #fff;
    font-family: 'Inconsolata', monospace !important;
  }
  
  /* Header sections */
  h1, h2, h3, h4 {
    page-break-after: avoid;
    break-after: avoid;
  }
  
  /* Major section headings */
  h2#skills, h2#languages, h2#education {
    page-break-before: always;
    break-before: page;
  }
  
  /* Hide UI elements */
  header, footer, nav, button, .cv-nav {
    display: none !important;
  }
  
  /* Contact information */
  .contact-item a, .contact-item svg {
    color: #000 !important;
    text-decoration: none !important;
  }
  
  /* Company sections */
  .company-section, .job-section, .education-section {
    margin-top: 1rem;
    margin-bottom: 1rem;
    page-break-inside: avoid;
  }
  
  /* Text colors */
  .company-name, .school-name, .job-title, .degree, .date-range {
    color: #000 !important;
  }
  
  /* Lists */
  ul, li {
    page-break-inside: auto;
    break-inside: auto;
    orphans: 3;
    widows: 3;
  }
  
  /* Hide visual elements */
  .job-section::before, .job-section::after,
  .job-content::before, .education-section::before,
  .education-section::after, .company-section::before {
    display: none !important;
  }
}
```

```astro
<!-- Import in cv.astro -->
---
import "../styles/cv-print.css";
---
```

**Benefits**: Easier maintenance, consistent print styling, and better separation of concerns.

### 1.3 Responsive Design Enhancements

**Current Issue**: The CV layout doesn't adapt optimally to very small screens.

**Recommendation**: Enhance responsive behavior for the CV's header and sections.

```astro
<!-- In cv.astro, enhance the header section -->
<div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
  <div class="space-y-2">
    <h1 class="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 font-inconsolata uppercase tracking-wide">
      ERFI ANUGRAH
    </h1>
    <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-inconsolata">
      {entry.data.description}
    </p>
    
    <!-- Social links with better mobile spacing -->
    <div class="mt-3 flex flex-wrap gap-x-3 gap-y-2 font-inconsolata text-sm">
      {entry.data.contacts && entry.data.contacts.map((contact) => (
        <a 
          href={contact.url} 
          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition font-medium flex items-center"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name={`mdi:${contact.icon}`} class="w-4 h-4 mr-1" />
          <span class="hidden sm:inline">{contact.value}</span>
          <span class="sm:hidden">{getShortLabel(contact)}</span>
        </a>
      ))}
    </div>
  </div>
  <div class="mt-2 md:mt-0 self-start">
    <button id="print-cv" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition print:hidden flex items-center text-sm sm:text-base">
      <Icon name="mdi:printer" class="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
      Save as PDF
    </button>
  </div>
</div>

<!-- Helper function in the frontmatter -->
const getShortLabel = (contact) => {
  switch(contact.icon) {
    case 'email': return 'Email';
    case 'linkedin': return 'LinkedIn';
    case 'github': return 'GitHub';
    case 'website': return 'Web';
    default: return contact.value;
  }
};
```

**Benefits**: Better usability on mobile devices, improved information hierarchy, and professional appearance at all screen sizes.

## 2. User Experience Enhancements

### 2.1 Mobile-Optimized Navigation

**Current Issue**: CV section navigation is not optimized for mobile screens.

**Recommendation**: Create a collapsible section navigation for small screens.

```astro
<!-- In cv.astro -->
<div class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-8 py-3 sticky top-0 z-10 print:hidden">
  <nav class="cv-nav">
    <button class="md:hidden w-full text-left flex items-center justify-between py-1 font-inconsolata" id="mobile-nav-toggle">
      <span class="font-medium text-slate-700 dark:text-slate-300">Navigate Sections</span>
      <Icon name="mdi:chevron-down" class="w-5 h-5 transition-transform text-slate-500" id="nav-toggle-icon" />
    </button>
    <ul class="hidden md:flex md:flex-wrap gap-x-6 gap-y-2 font-inconsolata transition-all max-h-0 md:max-h-none overflow-hidden" id="section-links">
      {sections.map(section => (
        <li>
          <a 
            href={`#${section.id}`} 
            class="text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-medium text-sm transition section-link"
          >
            {section.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
</div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Mobile navigation toggle
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const sectionLinks = document.getElementById('section-links');
    const navToggleIcon = document.getElementById('nav-toggle-icon');
    
    if (mobileNavToggle && sectionLinks && navToggleIcon) {
      mobileNavToggle.addEventListener('click', () => {
        const isExpanded = sectionLinks.classList.contains('expanded');
        
        if (isExpanded) {
          sectionLinks.classList.remove('expanded');
          sectionLinks.classList.add('hidden');
          sectionLinks.style.maxHeight = '0';
          navToggleIcon.classList.remove('rotate-180');
        } else {
          sectionLinks.classList.add('expanded');
          sectionLinks.classList.remove('hidden');
          sectionLinks.style.maxHeight = sectionLinks.scrollHeight + 'px';
          navToggleIcon.classList.add('rotate-180');
        }
      });
      
      // Close menu when a link is clicked
      document.querySelectorAll('.section-link').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth < 768) { // MD breakpoint
            sectionLinks.classList.remove('expanded');
            sectionLinks.classList.add('hidden');
            sectionLinks.style.maxHeight = '0';
            navToggleIcon.classList.remove('rotate-180');
          }
        });
      });
    }
  });
</script>

<style>
  @media (max-width: 768px) {
    #section-links.expanded {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.75rem 0;
      max-height: 200px;
      transition: max-height 0.3s ease-in-out;
    }
  }
</style>
```

**Benefits**: Improved navigation on mobile devices, better user experience, and maintains clean appearance.

### 2.2 Enhanced PDF Generation Guidance

**Current Issue**: The "Save as PDF" button might not be intuitive for all users.

**Recommendation**: Add a tooltip/helper text and enhance feedback.

```astro
<!-- In cv.astro, enhance the print button with guidance -->
<div class="relative group">
  <button id="print-cv" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition print:hidden flex items-center">
    <Icon name="mdi:printer" class="h-5 w-5 mr-2" />
    Save as PDF
  </button>
  <div class="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-700 shadow-md rounded p-3 text-xs text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
    This will open your browser's print dialog. Select "Save as PDF" option in the print dialog to save your CV as a PDF file.
  </div>
</div>

<script>
  // Add visual feedback after clicking print button
  document.getElementById('print-cv')?.addEventListener('click', () => {
    const button = document.getElementById('print-cv');
    const originalText = button.innerHTML;
    
    button.innerHTML = `<svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Preparing PDF...`;
    
    setTimeout(() => {
      button.innerHTML = originalText;
      window.print();
    }, 500);
  });
</script>
```

**Benefits**: Better user guidance, reduced confusion, and improved user experience.

### 2.3 Active Section Highlighting

**Current Issue**: CV sections don't visually indicate which section the user is currently viewing.

**Recommendation**: Implement a robust scroll tracking and active section highlighting.

```astro
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('h2[id]');
    const navLinks = document.querySelectorAll('.section-link');
    
    // Create IntersectionObserver
    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -40% 0px', // Adjust based on your header height
      threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Update URL hash without scrolling
          const id = entry.target.getAttribute('id');
          if (id) {
            history.replaceState(null, null, `#${id}`);
            updateActiveNavLink(id);
          }
        }
      });
    }, observerOptions);
    
    // Track all section headings
    sections.forEach(section => observer.observe(section));
    
    // Update active nav link based on current section
    function updateActiveNavLink(currentId) {
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `#${currentId}`) {
          link.classList.add('active');
          link.classList.add('text-blue-600', 'dark:text-blue-400', 'font-semibold');
          link.classList.remove('text-slate-600', 'dark:text-slate-300');
        } else {
          link.classList.remove('active');
          link.classList.remove('text-blue-600', 'dark:text-blue-400', 'font-semibold');
          link.classList.add('text-slate-600', 'dark:text-slate-300');
        }
      });
    }
    
    // Initial check for hash in URL
    if (location.hash) {
      const id = location.hash.substring(1);
      updateActiveNavLink(id);
    }
    
    // Smooth scroll behavior for nav links
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href')?.substring(1);
        if (targetId) {
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            // Add highlight effect
            targetElement.classList.add('highlight-section');
            setTimeout(() => targetElement.classList.remove('highlight-section'), 2000);
            
            // Calculate offset based on sticky header
            const headerHeight = document.querySelector('.cv-nav')?.offsetHeight || 0;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
            
            // Smooth scroll
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
            
            // Update active state
            updateActiveNavLink(targetId);
          }
        }
      });
    });
  });
</script>

<style>
  .highlight-section {
    animation: highlight-pulse 2s ease-out;
  }
  
  @keyframes highlight-pulse {
    0% { background-color: rgba(59, 130, 246, 0.1); }
    100% { background-color: transparent; }
  }
</style>
```

**Benefits**: Improved navigation context, better user experience, and visual feedback on current position.

## 3. Structure and Data Management

### 3.1 Dynamic Section Generation

**Current Issue**: CV sections are hardcoded in the `cv.astro` component rather than being generated from the content.

**Recommendation**: Generate sections dynamically from content headings.

```astro
---
// In cv.astro
import { getEntry, render } from "astro:content";
const entry = await getEntry("cv", "resume");
const { Content, headings } = await render(entry);

// Generate sections automatically from content headings
const sections = headings
  .filter(heading => heading.depth === 2)
  .map(heading => ({
    id: heading.slug,
    label: heading.text.replace(/^Work\s+/i, '')  // Clean up section names if needed
  }));
---
```

**Benefits**: Content-driven navigation, automatic updates when content changes, and reduced maintenance.

### 3.2 Enhanced Skills Visualization

**Current Issue**: Skills are presented as a simple list without visual indication of proficiency levels.

**Recommendation**: Create a more engaging skills presentation with visualization components.

```astro
<!-- Create a new component: src/components/SkillBar.astro -->
---
interface Props {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
}

const { name, level, category } = Astro.props;

// Map level to percentage and color
const levelMap = {
  beginner: { width: '25%', color: 'bg-slate-400' },
  intermediate: { width: '50%', color: 'bg-blue-400' },
  advanced: { width: '75%', color: 'bg-blue-500' },
  expert: { width: '95%', color: 'bg-blue-600' }
};

const { width, color } = levelMap[level];
---

<div class={`skill-item ${category ? `skill-${category}` : ''} p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 hover:shadow-md transition`}>
  <div class="flex justify-between mb-1">
    <span class="font-medium text-slate-800 dark:text-slate-200">{name}</span>
    <span class="text-xs text-slate-500 dark:text-slate-400 capitalize">{level}</span>
  </div>
  <div class="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
    <div class={`h-full ${color} rounded-full`} style={`width: ${width}`}></div>
  </div>
</div>

<style>
  @media print {
    .skill-item {
      border: 1px solid #ddd !important;
      background-color: #fff !important;
    }
    
    .skill-item .h-2 {
      background-color: #eee !important;
    }
    
    .skill-item .h-2 div {
      background-color: #333 !important;
    }
  }
</style>
```

```astro
<!-- In cv.astro, add a script to transform skills sections -->
<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Transform skills section
    const skillsSection = document.getElementById('skills');
    if (skillsSection) {
      const skillsList = skillsSection.nextElementSibling;
      if (skillsList && skillsList.tagName === 'UL') {
        // Create a grid container
        const skillsGrid = document.createElement('div');
        skillsGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4';
        
        // Get all skills and create skill bars
        const skillItems = skillsList.querySelectorAll('li');
        skillItems.forEach(item => {
          const skillName = item.textContent?.trim() || '';
          const level = determineSkillLevel(skillName);
          const category = determineSkillCategory(skillName);
          
          const skillBar = document.createElement('div');
          skillBar.className = `skill-item ${category ? `skill-${category}` : ''} p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 hover:shadow-md transition`;
          skillBar.innerHTML = `
            <div class="flex justify-between mb-1">
              <span class="font-medium text-slate-800 dark:text-slate-200">${skillName}</span>
              <span class="text-xs text-slate-500 dark:text-slate-400 capitalize">${level}</span>
            </div>
            <div class="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full ${getLevelColor(level)} rounded-full" style="width: ${getLevelWidth(level)}"></div>
            </div>
          `;
          
          skillsGrid.appendChild(skillBar);
        });
        
        // Replace the original list with our grid
        skillsList.parentNode?.insertBefore(skillsGrid, skillsList);
        skillsList.style.display = 'none';
      }
    }
    
    // Helper functions for skill visualization
    function determineSkillLevel(skill) {
      // Map skills to levels based on your expertise
      const expertSkills = ['JavaScript', 'HTML', 'CSS', 'Cloudflare'];
      const advancedSkills = ['React', 'Node.js', 'Astro', 'Tailwind'];
      const intermediateSkills = ['Docker', 'TypeScript', 'GraphQL'];
      
      if (expertSkills.some(s => skill.includes(s))) return 'expert';
      if (advancedSkills.some(s => skill.includes(s))) return 'advanced';
      if (intermediateSkills.some(s => skill.includes(s))) return 'intermediate';
      return 'beginner';
    }
    
    function determineSkillCategory(skill) {
      // Map skills to categories
      const frontendSkills = ['HTML', 'CSS', 'JavaScript', 'React', 'Astro'];
      const backendSkills = ['Node.js', 'Express', 'Django', 'PHP'];
      const devopsSkills = ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Cloudflare'];
      
      if (frontendSkills.some(s => skill.includes(s))) return 'frontend';
      if (backendSkills.some(s => skill.includes(s))) return 'backend';
      if (devopsSkills.some(s => skill.includes(s))) return 'devops';
      return '';
    }
    
    function getLevelWidth(level) {
      switch(level) {
        case 'expert': return '95%';
        case 'advanced': return '75%';
        case 'intermediate': return '50%';
        default: return '25%';
      }
    }
    
    function getLevelColor(level) {
      switch(level) {
        case 'expert': return 'bg-blue-600';
        case 'advanced': return 'bg-blue-500';
        case 'intermediate': return 'bg-blue-400';
        default: return 'bg-slate-400';
      }
    }
  });
</script>
```

**Benefits**: Visually engaging skills presentation, better information hierarchy, and more professional appearance.

### 3.3 Timeline Visualization

**Current Issue**: Work experience sections lack visual cues for chronology and relationship.

**Recommendation**: Add a timeline visualization to work experience.

```astro
<!-- In Prose_cv.astro, add timeline styling -->
<style>
  /* Timeline styling */
  :global(.company-section) {
    position: relative;
    padding-left: 24px;
    margin-bottom: 2rem;
  }
  
  :global(.company-section::before) {
    content: "";
    position: absolute;
    left: 0;
    top: 8px;
    bottom: -8px;
    width: 2px;
    background-color: var(--color-slate-200);
    z-index: 1;
  }
  
  :global(.dark .company-section::before) {
    background-color: var(--color-slate-700);
  }
  
  :global(.job-section) {
    position: relative;
    padding-left: 20px;
    margin-bottom: 1.5rem;
  }
  
  :global(.job-section::before) {
    content: "";
    position: absolute;
    left: -24px;
    top: 6px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: var(--color-blue-500);
    z-index: 2;
    border: 3px solid var(--color-white);
    box-shadow: 0 0 0 2px var(--color-blue-200);
  }
  
  :global(.dark .job-section::before) {
    background-color: var(--color-blue-400);
    border-color: var(--color-slate-800);
    box-shadow: 0 0 0 2px var(--color-blue-800);
  }
  
  /* Hide timeline in print mode */
  @media print {
    :global(.company-section), 
    :global(.job-section) {
      padding-left: 0;
    }
    
    :global(.company-section::before),
    :global(.job-section::before) {
      display: none;
    }
  }
</style>
```

**Benefits**: Better visual representation of career progression, improved readability, and professional appearance.

## 4. Code Organization and Performance

### 4.1 Create Reusable CV Components

**Current Issue**: CV-specific UI patterns are mixed directly in the layout, making maintenance harder.

**Recommendation**: Extract CV-specific elements into reusable components.

```astro
<!-- Create src/components/CVSection.astro -->
---
interface Props {
  id: string;
  title: string;
}

const { id, title } = Astro.props;
---

<section id={id} class="mb-12 cv-section">
  <h2 class="text-2xl font-semibold text-blue-800 dark:text-blue-400 pb-2 border-b border-slate-200 dark:border-slate-700 mb-6">
    {title}
  </h2>
  <div class="cv-section-content">
    <slot />
  </div>
</section>

<!-- Create src/components/CVTimeline.astro -->
---
interface Props {
  title: string;
  company?: string;
  dateRange: string;
}

const { title, company, dateRange } = Astro.props;
---

<div class="job-section">
  <h3 class="text-xl font-medium text-blue-700 dark:text-blue-300 mb-1">
    <span class="job-title">{title}</span>
  </h3>
  <p class="text-slate-600 dark:text-slate-400 italic mb-3">
    <span class="date-range">{dateRange}</span>
  </p>
  <div class="job-content ml-1">
    <slot />
  </div>
</div>

<!-- Create src/components/CVCompany.astro -->
---
interface Props {
  name: string;
}

const { name } = Astro.props;
---

<div class="company-section">
  <h3 class="text-2xl font-bold text-blue-900 dark:text-blue-300 mb-4">
    <span class="company-name">{name}</span>
  </h3>
  <slot />
</div>
```

**Usage in MDX content:**

```mdx
<!-- Example usage in resume.mdx -->
<CVSection id="experience" title="Work Experience">
  <CVCompany name="Cloudflare">
    <CVTimeline title="Senior Customer Solutions Engineer" dateRange="Oct 2024 - Present">
      - Designing and implementing enterprise-grade solutions
      - Leading strategic technical discussions
    </CVTimeline>
    
    <CVTimeline title="Customer Solutions Engineer" dateRange="Jan 2021 - Oct 2024">
      - Elevate product adoption and address new use cases
      - Handle customer escalations and complex onboardings
    </CVTimeline>
  </CVCompany>
</CVSection>
```

**Benefits**: Better reusability, easier maintenance, and improved content organization.

### 4.2 Optimize JavaScript Performance

**Current Issue**: Multiple DOM queries and event handlers might impact performance.

**Recommendation**: Optimize JavaScript execution with better caching and event delegation.

```javascript
// In cv.astro script section
document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  const elements = {
    navToggle: document.getElementById('mobile-nav-toggle'),
    navLinks: document.getElementById('section-links'),
    navIcon: document.getElementById('nav-toggle-icon'),
    sectionLinks: document.querySelectorAll('.section-link'),
    sections: document.querySelectorAll('h2[id]'),
    printButton: document.getElementById('print-cv')
  };
  
  // Set up mobile navigation with event delegation
  if (elements.navToggle && elements.navLinks && elements.navIcon) {
    elements.navToggle.addEventListener('click', toggleMobileNav);
  }
  
  // Use event delegation for section links
  if (elements.navLinks) {
    elements.navLinks.addEventListener('click', (e) => {
      const link = e.target.closest('.section-link');
      if (link) {
        e.preventDefault();
        navigateToSection(link);
      }
    });
  }
  
  // Print button handler
  if (elements.printButton) {
    elements.printButton.addEventListener('click', handlePrint);
  }
  
  // IntersectionObserver for sections
  const observer = createSectionObserver();
  elements.sections.forEach(section => observer.observe(section));
  
  // Navigation functions
  function toggleMobileNav() {
    const isExpanded = elements.navLinks.classList.contains('expanded');
    
    if (isExpanded) {
      elements.navLinks.classList.remove('expanded');
      elements.navLinks.classList.add('hidden');
      elements.navIcon.classList.remove('rotate-180');
    } else {
      elements.navLinks.classList.add('expanded');
      elements.navLinks.classList.remove('hidden');
      elements.navIcon.classList.add('rotate-180');
    }
  }
  
  function navigateToSection(link) {
    const targetId = link.getAttribute('href')?.substring(1);
    if (!targetId) return;
    
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;
    
    // Add highlight effect
    targetElement.classList.add('highlight-section');
    setTimeout(() => targetElement.classList.remove('highlight-section'), 2000);
    
    // Calculate offset for scroll
    const headerHeight = document.querySelector('.cv-nav')?.offsetHeight || 0;
    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
    
    // Smooth scroll
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
    
    // Close mobile nav if needed
    if (window.innerWidth < 768 && elements.navLinks.classList.contains('expanded')) {
      toggleMobileNav();
    }
  }
  
  function handlePrint() {
    const originalText = elements.printButton.innerHTML;
    
    elements.printButton.innerHTML = `<svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Preparing PDF...`;
    
    setTimeout(() => {
      elements.printButton.innerHTML = originalText;
      window.print();
    }, 500);
  }
  
  function createSectionObserver() {
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          if (id) {
            updateActiveNavLink(id);
            // Update URL without scrolling
            history.replaceState(null, null, `#${id}`);
          }
        }
      });
    }, {
      root: null,
      rootMargin: '-80px 0px -40% 0px',
      threshold: 0
    });
  }
  
  function updateActiveNavLink(currentId) {
    elements.sectionLinks.forEach(link => {
      const href = link.getAttribute('href');
      const isActive = href === `#${currentId}`;
      
      link.classList.toggle('active', isActive);
      link.classList.toggle('text-blue-600', isActive);
      link.classList.toggle('dark:text-blue-400', isActive);
      link.classList.toggle('font-semibold', isActive);
      link.classList.toggle('text-slate-600', !isActive);
      link.classList.toggle('dark:text-slate-300', !isActive);
    });
  }
});
```

**Benefits**: Better performance, reduced DOM manipulation, and more maintainable code.

### 4.3 Lazy-Load Non-Critical Components

**Current Issue**: All CV components load immediately, potentially slowing down initial page rendering.

**Recommendation**: Implement lazy loading for non-critical CV elements.

```astro
<!-- In cv.astro -->
<script>
  // Lazy load skills visualization
  let skillsVisualizationLoaded = false;
  
  function loadSkillsVisualization() {
    if (skillsVisualizationLoaded) return;
    
    const skillsSection = document.getElementById('skills');
    if (skillsSection) {
      // Logic to enhance skills section (only runs when section becomes visible)
      // ...skills enhancement code from previous examples...
      
      skillsVisualizationLoaded = true;
    }
  }
  
  // Intersection observer for lazy loading
  const lazyLoadObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.getAttribute('id');
        
        // Load components based on which section is visible
        if (sectionId === 'skills') {
          loadSkillsVisualization();
        }
        
        // Stop observing once loaded
        lazyLoadObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '100px' });
  
  // Start observing sections
  document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => lazyLoadObserver.observe(section));
  });
</script>
```

**Benefits**: Faster initial page load, improved performance, and better user experience.

## 5. SEO and Accessibility Enhancements

### 5.1 Add Structured Data for SEO

**Current Issue**: CV page lacks structured data to enhance search engine visibility.

**Recommendation**: Add JSON-LD markup for resume/CV content.

```astro
<!-- In cv.astro -->
---
// In the frontmatter, construct the JSON-LD data
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Erfi Anugrah",
  "jobTitle": entry.data.description || "Customer Solutions Engineer",
  "url": new URL(Astro.url.pathname, Astro.site).href,
  "sameAs": entry.data.contacts?.map(contact => contact.url) || [],
  "workLocation": {
    "@type": "Place",
    "name": "Cloudflare"
  },
  "knowsAbout": ["Web Development", "Cloud Computing", "Network Security"]
};
---

<!-- Add the structured data to the page -->
<script type="application/ld+json" set:html={JSON.stringify(personSchema)} />
```

**Benefits**: Improved SEO, better search result presentation, and potential for enhanced job search visibility.

### 5.2 Keyboard Navigation Improvements

**Current Issue**: CV navigation relies primarily on mouse interaction.

**Recommendation**: Enhance keyboard navigation and accessibility.

```astro
<!-- In cv.astro -->
<div class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-8 py-3 sticky top-0 z-10 print:hidden">
  <nav class="cv-nav" aria-label="CV Sections">
    <button 
      id="mobile-nav-toggle"
      class="md:hidden w-full text-left flex items-center justify-between" 
      aria-expanded="false"
      aria-controls="section-links"
    >
      <span>Navigate Sections</span>
      <Icon name="mdi:chevron-down" class="w-5 h-5 transition-transform" />
    </button>
    <ul 
      id="section-links"
      class="hidden md:flex md:flex-wrap gap-x-6 gap-y-2 font-inconsolata"
      role="list"
      aria-label="CV Sections Navigation"
    >
      {sections.map(section => (
        <li>
          <a 
            href={`#${section.id}`} 
            class="text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-medium text-sm transition section-link focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:rounded-sm"
            aria-current={location.hash === `#${section.id}` ? "true" : "false"}
          >
            {section.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
</div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Toggle menu with keyboard support
    const navToggle = document.getElementById('mobile-nav-toggle');
    const navLinks = document.getElementById('section-links');
    
    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', (!expanded).toString());
        navLinks.classList.toggle('hidden', expanded);
      });
      
      // Close menu on Escape key
      navLinks.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && window.innerWidth < 768) {
          navToggle.setAttribute('aria-expanded', 'false');
          navLinks.classList.add('hidden');
          navToggle.focus();
        }
      });
      
      // Update aria-current when navigating
      document.querySelectorAll('.section-link').forEach(link => {
        link.addEventListener('click', () => {
          document.querySelectorAll('.section-link').forEach(l => {
            l.setAttribute('aria-current', 'false');
          });
          link.setAttribute('aria-current', 'true');
        });
      });
    }
  });
</script>
```

**Benefits**: Improved accessibility, better keyboard navigation, and compliance with WCAG guidelines.

### 5.3 Enhanced Meta Tags

**Current Issue**: CV page could use more specific meta tags for better SEO.

**Recommendation**: Add CV-specific meta tags.

```astro
<!-- In cv.astro -->
---
// Add to the frontmatter
const pageTitle = "Erfi Anugrah - CV | Customer Solutions Engineer";
const description = "Professional CV for Erfi Anugrah - Customer Solutions Engineer at Cloudflare with expertise in solution design, technical onboarding, and customer success.";
---

<BaseLayout
  title={pageTitle}
  description={description}
  site_name={site_name}
  is404Page={false}
>
  <!-- Page head content can include additional meta tags -->
  <Fragment slot="head">
    <meta name="keywords" content="Erfi Anugrah, CV, Resume, Customer Solutions Engineer, Cloudflare, Technical Solutions" />
    <meta name="author" content="Erfi Anugrah" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href={new URL("/cv", Astro.site).href} />
  </Fragment>
  
  <!-- Rest of page content -->
</BaseLayout>
```

**Benefits**: Improved search engine visibility, better social sharing, and enhanced discoverability.

## 6. Implementation Steps

### Phase 1: Basic Improvements
1. Extract CV components for better modularity
2. Centralize print styles in a dedicated CSS file
3. Implement responsive design improvements for mobile
4. Add dynamic section generation from content headings

### Phase 2: Enhanced User Experience
1. Create interactive skill visualization
2. Implement timeline visualization for experience
3. Add mobile-optimized navigation
4. Implement active section highlighting

### Phase 3: Performance and SEO
1. Optimize JavaScript with caching and delegation
2. Implement lazy loading for non-critical elements
3. Add structured data for SEO
4. Enhance keyboard navigation and accessibility

## 7. Compatibility Notes

All recommendations maintain compatibility with:

- **Astro v5.6.1**: Utilizing components, collections, and rendering capabilities
- **Tailwind CSS v4.0.8**: Using utility classes for styling
- **Docker deployment**: No additional dependencies that would impact container size
- **Deno Deploy & Cloudflare Pages**: All client-side JavaScript is compatible with these platforms
- **Small bundle size**: Optimizations focus on reusing existing dependencies

These improvements will enhance the CV page's functionality, maintainability, and user experience while staying within the boundaries of your current technical stack and deployment targets.
