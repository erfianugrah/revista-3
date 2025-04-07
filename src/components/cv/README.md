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

## Key Features

- **Single Source of Truth** - All content comes from `/src/content/cv/resume.mdx`
- **Timeline visualization** - Color-coded timeline based on duration
- **Responsive design** - Optimized for all screen sizes
- **Print friendly** - Special styling for PDF export
- **Dark mode support** - All components work seamlessly in dark mode
- **Accessibility** - Semantic HTML and proper ARIA attributes

## Content Structure in resume.mdx

The resume content is structured in `/src/content/cv/resume.mdx` with the following schema:

```yaml
---
title: "Erfi Anugrah"
description: "Photographer | Writer | Customer Solutions Engineer"
pubDate: 2023-11-29
updatedDate: 2024-10-06
tags: ['cv']
author: "Erfi Anugrah"
slug: resume
fullName: "ERFI ANUGRAH"
sections:
  - id: "experience"
    label: "Experience"
  - id: "skills"
    label: "Skills"
  - id: "languages"
    label: "Languages"
  - id: "education"
    label: "Education"
contacts:
  - type: email
    value: erfi@erfianugrah.com
    url: mailto:erfi@erfianugrah.com
    icon: mail
  - type: linkedin
    value: linkedin.com/in/erfianugrah
    url: https://linkedin.com/in/erfianugrah
    icon: linkedin
skills:
  - name: "HTML/CSS"
    level: "expert"
    category: "frontend"
languages:
  - language: "English"
    proficiency: "Native speaker"
    level: "expert"
education:
  - institution: "Nanyang Technological University"
    degree: "Bachelor of Business (Marketing)"
    dateRange: { start: "2015-08", end: "2019-07" }
companies:
  - name: "Cloudflare"
    positions:
      - title: "Senior Customer Solutions Engineer"
        dateRange: { start: "2024-10", end: "Present" }
        responsibilities:
          - "Designing and implementing enterprise-grade solutions"
        achievements:
          - "Award example"
---
```

## Usage

The resume.mdx file uses these components to render the CV content:

```jsx
import { Section, Company, Timeline, SkillBar, EducationTimeline, ColorLegend } from '../../components/cv';

<ColorLegend className="mb-4" />

<Section id="experience" title="Work Experience">
  <div class="company-wrapper">
    {frontmatter.companies.map(company => (
      <Company name={company.name}>
        {company.positions.map(position => (
          <Timeline title={position.title} dateRange={position.dateRange}>
            <ul>
              {position.responsibilities.map(responsibility => (
                <li>{responsibility}</li>
              ))}
              {position.achievements && (
                <li><strong>Awards</strong>:
                  <ul>
                    {position.achievements.map(achievement => (
                      <li>{achievement}</li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          </Timeline>
        ))}
      </Company>
    ))}
  </div>
</Section>

<Section id="skills" title="Skills">
  <div class="skills-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
    {frontmatter.skills.map(skill => (
      <SkillBar name={skill.name} level={skill.level} category={skill.category} />
    ))}
  </div>
</Section>

<Section id="education" title="Education">
  <EducationTimeline education={frontmatter.education} />
</Section>
```

## Benefits of This Approach

1. **Content/Presentation Separation**: Content structure is separate from visual presentation
2. **Maintainability**: Update your CV by modifying the resume.mdx file only
3. **Reusability**: Components can be reused in other contexts
4. **Consistency**: Visual styling is consistent across the entire CV

## Organization Notes

Components in this directory have concise names (e.g., `Section` instead of `CVSection`) since they're already in the cv namespace. Import them using the index.ts barrel export for cleaner code.