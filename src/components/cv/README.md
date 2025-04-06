# CV Components

This directory contains components specifically designed for the CV/Resume page. The components work together to create a visually appealing, responsive, and print-friendly CV.

## Components

- **Section** - Base container for CV sections with consistent styling
- **Company** - Represents a company in the work experience section
- **Timeline** - Shows a position with duration visualization and timeline
- **Contact** - Displays contact information with icons
- **SkillBar** - Visual representation of skill/language proficiency
- **EducationTimeline** - Timeline visualization for education history
- **ColorLegend** - Legend for timeline duration colors

## Features

- **Data-driven** - All components consume data from the frontmatter in resume.mdx
- **Timeline visualization** - Color-coded timeline based on duration
- **Responsive design** - Optimized for all screen sizes
- **Print friendly** - Special styling for PDF export
- **Dark mode support** - All components work seamlessly in dark mode
- **Accessibility** - Semantic HTML and proper ARIA attributes

## Usage

Import components from the cv directory:

```astro
import { Section, Company, Timeline, SkillBar } from '../../components/cv';
```

Example structure in an MDX file:

```astro
<Section id="experience" title="Work Experience">
  <Company name="Example Corp">
    <Timeline title="Senior Developer" dateRange="Jan 2022 - Present">
      <ul>
        <li>Responsibility one</li>
        <li>Responsibility two</li>
      </ul>
    </Timeline>
  </Company>
</Section>
```

For skills and languages:

```astro
<Section id="skills" title="Skills">
  <div class="skills-grid">
    <SkillBar name="JavaScript" level="expert" category="frontend" />
    <SkillBar name="Python" level="intermediate" category="backend" />
  </div>
</Section>
```

## Organization Notes

Components in this directory have concise names (e.g., `Section` instead of `CVSection`) since they're already in the cv namespace. Import them using the index.ts barrel export for cleaner code.