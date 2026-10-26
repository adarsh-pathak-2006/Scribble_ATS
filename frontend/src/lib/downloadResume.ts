/**
 * Browser-side resume downloader supporting PDF Print, Word (.doc), Markdown (.md), and Plain Text (.txt)
 * Handles both raw markdown/text and structured JSON resume formats seamlessly.
 */

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
}

/**
 * Converts structured JSON resume into clean standard ATS Markdown
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resumeJsonToMarkdown(data: any): string {
  const parts: string[] = [];

  // Personal Info
  if (data.personal_info) {
    const p = data.personal_info;
    parts.push(`# ${p.name || 'Candidate'}`);
    const contacts: string[] = [];
    if (p.email) contacts.push(p.email);
    if (p.phone) contacts.push(p.phone);
    if (p.location) contacts.push(p.location);
    if (p.linkedin) {
      const lk = p.linkedin.startsWith('http') ? p.linkedin : `https://${p.linkedin}`;
      contacts.push(`[LinkedIn](${lk})`);
    }
    if (p.github) {
      const gh = p.github.startsWith('http') ? p.github : `https://${p.github}`;
      contacts.push(`[GitHub](${gh})`);
    }
    if (contacts.length > 0) {
      parts.push(contacts.join(' | '));
    }
    parts.push('');
  }

  // Professional Summary
  if (data.summary) {
    parts.push('## Professional Summary');
    parts.push(data.summary);
    parts.push('');
  }

  // Technical Skills
  if (data.skills) {
    parts.push('## Technical & Core Skills');
    const s = data.skills;
    if (Array.isArray(s.programming) && s.programming.length) parts.push(`- **Programming Languages:** ${s.programming.join(', ')}`);
    if (Array.isArray(s.backend) && s.backend.length) parts.push(`- **Backend & Frameworks:** ${s.backend.join(', ')}`);
    if (Array.isArray(s.databases) && s.databases.length) parts.push(`- **Databases & Caching:** ${s.databases.join(', ')}`);
    if (Array.isArray(s.tools) && s.tools.length) parts.push(`- **Tools & Cloud:** ${s.tools.join(', ')}`);
    if (Array.isArray(s.other) && s.other.length) parts.push(`- **Other Competencies:** ${s.other.join(', ')}`);
    parts.push('');
  }

  // Professional Experience
  if (Array.isArray(data.experience) && data.experience.length) {
    parts.push('## Professional Experience');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const exp of data.experience) {
      const role = exp.role || 'Role';
      const company = exp.company || '';
      parts.push(`### ${role}${company ? ` — ${company}` : ''}`);
      const dates = [exp.start_date, exp.end_date].filter(Boolean).join(' - ');
      if (dates) {
        parts.push(`*${dates}*`);
      }
      if (Array.isArray(exp.bullets)) {
        for (const b of exp.bullets) {
          if (b && b.trim()) parts.push(`- ${b.trim()}`);
        }
      }
      parts.push('');
    }
  }

  // Projects
  if (Array.isArray(data.projects) && data.projects.length) {
    parts.push('## Technical Projects');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const proj of data.projects) {
      const pName = proj.name || 'Project';
      const pUrl = proj.url && proj.url.trim() ? proj.url.trim() : null;
      if (pUrl) {
        const fullUrl = pUrl.startsWith('http') ? pUrl : `https://${pUrl}`;
        parts.push(`### [${pName}](${fullUrl})`);
      } else {
        parts.push(`### ${pName}`);
      }

      if (Array.isArray(proj.technologies) && proj.technologies.length) {
        parts.push(`*Technologies: ${proj.technologies.join(', ')}*`);
      }
      if (Array.isArray(proj.bullets)) {
        for (const b of proj.bullets) {
          if (b && b.trim()) parts.push(`- ${b.trim()}`);
        }
      }
      parts.push('');
    }
  }

  // Education
  if (Array.isArray(data.education) && data.education.length) {
    parts.push('## Education');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const edu of data.education) {
      const deg = edu.degree || 'Degree';
      const inst = edu.institution || '';
      parts.push(`### ${deg}${inst ? ` — ${inst}` : ''}`);
      const eduDates = [edu.start_date, edu.end_date].filter(Boolean).join(' - ');
      if (eduDates) {
        parts.push(`*${eduDates}*`);
      }
      if (Array.isArray(edu.details)) {
        for (const d of edu.details) {
          if (d && d.trim()) parts.push(`- ${d.trim()}`);
        }
      }
      parts.push('');
    }
  }

  // Certifications
  if (Array.isArray(data.certifications) && data.certifications.length) {
    parts.push('## Certifications & Achievements');
    for (const cert of data.certifications) {
      if (cert && cert.trim()) parts.push(`- ${cert.trim()}`);
    }
    parts.push('');
  }

  return parts.join('\n');
}

/**
 * Standardizes content: formats structured JSON to ATS Markdown if needed
 */
export function formatResumeContent(content: string | null): string {
  if (!content) return '';
  const trimmed = content.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.personal_info || parsed.skills || parsed.experience) {
        return resumeJsonToMarkdown(parsed);
      }
    } catch {
      // Fall through to raw text
    }
  }
  return content;
}

/**
 * Downloads a string as a file using a browser Blob
 */
export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Download as Markdown (.md)
 */
export function downloadAsMarkdown(rawContent: string, baseName: string) {
  const content = formatResumeContent(rawContent);
  const filename = `${sanitizeFilename(baseName)}_ats_resume.md`;
  downloadBlob(content, filename, 'text/markdown');
}

/**
 * Download as Plain Text (.txt)
 */
export function downloadAsText(rawContent: string, baseName: string) {
  const content = formatResumeContent(rawContent);
  const plainText = content
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

  const filename = `${sanitizeFilename(baseName)}_ats_resume.txt`;
  downloadBlob(plainText, filename, 'text/plain');
}

/**
 * Download as Microsoft Word compatible (.doc) document
 */
export function downloadAsWordDoc(rawContent: string, baseName: string) {
  const content = formatResumeContent(rawContent);
  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${baseName}</title>
  <style>
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #111827;
      margin: 1in;
    }
    h1 { font-size: 18pt; margin-bottom: 4pt; color: #1e3a8a; border-bottom: 2pt solid #1e3a8a; padding-bottom: 2pt; }
    h2 { font-size: 13pt; margin-top: 12pt; margin-bottom: 4pt; color: #1e3a8a; border-bottom: 1pt solid #cbd5e1; padding-bottom: 2pt; text-transform: uppercase; }
    h3 { font-size: 11pt; font-weight: bold; margin-top: 6pt; margin-bottom: 2pt; }
    p { margin-bottom: 4pt; }
    ul { margin-top: 2pt; margin-bottom: 6pt; padding-left: 20pt; }
    li { margin-bottom: 2pt; }
  </style>
</head>
<body>
  <div>${markdownToBasicHtml(content)}</div>
</body>
</html>
`;

  const filename = `${sanitizeFilename(baseName)}_ats_resume.doc`;
  downloadBlob(htmlContent, filename, 'application/msword');
}

/**
 * Trigger clean browser-side print to PDF dialog
 */
export function printResume(rawContent: string, title: string) {
  const content = formatResumeContent(rawContent);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the print dialog.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - ATS Resume</title>
  <style>
    @page {
      margin: 0.75in;
      size: letter;
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.4;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 18pt;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4pt 0;
      text-align: center;
      letter-spacing: -0.01em;
    }
    .header-info {
      text-align: center;
      font-size: 9.5pt;
      color: #475569;
      margin-bottom: 14pt;
    }
    h2 {
      font-size: 12pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1e293b;
      border-bottom: 1.5pt solid #0f172a;
      padding-bottom: 2pt;
      margin-top: 12pt;
      margin-bottom: 6pt;
    }
    h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 6pt;
      margin-bottom: 2pt;
    }
    p {
      margin: 0 0 4pt 0;
    }
    ul {
      margin: 2pt 0 8pt 0;
      padding-left: 18pt;
    }
    li {
      margin-bottom: 2.5pt;
    }
    strong {
      font-weight: 600;
      color: #0f172a;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${markdownToBasicHtml(content)}
  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Basic markdown to HTML converter for ATS layout rendering
 */
export function markdownToBasicHtml(rawMd: string): string {
  const md = formatResumeContent(rawMd);
  if (!md) return '';

  const lines = md.split('\n');
  const result: string[] = [];
  let inList = false;
  let isFirstLine = true;

  for (let line of lines) {
    line = line.trim();

    if (!line) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      continue;
    }

    // Convert bullet artifacts from pdf/text to standard markdown bullet
    line = line.replace(/^[•●▪\u25aa\ufffd\u25cf\u2022]\s*/, '- ');

    // Links: [text](url)
    line = line.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
    );

    // Bold & italic formatting
    line = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings from Markdown
    if (line.startsWith('# ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h1>${line.substring(2)}</h1>`);
      isFirstLine = false;
      continue;
    } else if (line.startsWith('## ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h2>${line.substring(3)}</h2>`);
      isFirstLine = false;
      continue;
    } else if (line.startsWith('### ')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h3>${line.substring(4)}</h3>`);
      isFirstLine = false;
      continue;
    }

    // Detect uppercase section headings in raw text resumes
    const rawHeadingMatch = line.match(/^(PROFESSIONAL\s+SUMMARY|TECHNICAL\s+(&\s+CORE\s+)?SKILLS|EXPERIENCE|WORK\s+EXPERIENCE|PROJECTS|TECHNICAL\s+PROJECTS|EDUCATION|CERTIFICATIONS(\s*&\s*ACHIEVEMENTS)?)$/i);
    if (rawHeadingMatch) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h2>${line}</h2>`);
      isFirstLine = false;
      continue;
    }

    // Detect first line candidate name if raw text (all caps or name format)
    if (isFirstLine && line.length < 50 && !line.includes('|') && !line.includes('@')) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h1>${line}</h1>`);
      isFirstLine = false;
      continue;
    }
    isFirstLine = false;

    // Contact info row (e.g., email | phone | github)
    if (line.includes('|') && (line.includes('@') || line.includes('github') || line.includes('+') || line.includes('LinkedIn'))) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<p class="resume-contact-row">${line}</p>`);
      continue;
    }

    // Lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${line.substring(2)}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(`<p>${line}</p>`);
    }
  }

  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
}

