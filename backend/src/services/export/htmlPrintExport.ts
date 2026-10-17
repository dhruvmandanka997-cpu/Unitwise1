import { LessonPlan } from '../../models/plan';
import { BRAND } from '../../config/brand';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generatePrintHtml(plan: LessonPlan): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${plan.title} - ${BRAND.name} Print View</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      line-height: 1.5;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    
    @media print {
      body { padding: 0; max-width: 100%; }
      .no-print { display: none !important; }
      .page-break { page-break-after: always; }
      h1, h2, h3 { break-after: avoid; }
      table { break-inside: avoid; }
    }

    .header-bar {
      border-bottom: 3px solid #0d9488;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 9999px;
      background-color: #f0fdfa;
      color: #0f766e;
      border: 1px solid #99f6e4;
      margin-right: 6px;
      margin-bottom: 6px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      background-color: #F8F9FD;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 14px;
    }
    h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-top: 0; }
    h2 { font-size: 18px; font-weight: 700; color: #0f766e; border-bottom: 1px solid #DFE1F0; padding-bottom: 8px; margin-top: 30px; }
    h3 { font-size: 15px; font-weight: 600; color: #1e293b; margin-top: 20px; margin-bottom: 8px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #F4F4FD;
      font-weight: 600;
    }
    .session-card {
      border: 1px solid #DFE1F0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      background-color: #fafaf9;
    }
    .btn-print {
      background-color: #0d9488;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-print:hover { background-color: #0f766e; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; background: #f0fdfa; padding: 15px 20px; border-radius: 8px; border: 1px solid #ccfbf1;">
    <div>
      <strong style="color: #0f766e;">Print-Friendly View</strong>
      <p style="margin: 0; font-size: 13px; color: #334155;">Ready for printing or browser "Save to PDF" (margins and page breaks optimized).</p>
    </div>
    <button class="btn-print" onclick="window.print()">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <div class="header-bar">
    <div style="color: #0d9488; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px;">${BRAND.name} &bull; Instructional Curriculum Plan</div>
    <h1>${plan.title}</h1>
    <div>
      <span class="badge">${plan.subject}</span>
      <span class="badge">${plan.gradeLevel}</span>
      <span class="badge">${plan.durationWeeks} Weeks (${plan.durationWeeks * plan.sessionsPerWeek} Total Sessions)</span>
      <span class="badge">${plan.classDurationMinutes} min / session</span>
      <span class="badge">${plan.isDemo ? 'Generated in Demo Mode' : 'AI-Verified'}</span>
    </div>
  </div>

  <div class="meta-grid">
    <div><strong>Curriculum Framework:</strong> ${plan.curriculumFramework}</div>
    <div><strong>Standards:</strong> ${plan.standardsFramework || 'General Standards Alignment'}</div>
    <div><strong>Schedule Format:</strong> ${plan.format === 'calendar' ? 'Weekly Calendar Sequence' : 'Linear Teaching Sessions'}</div>
    <div><strong>Teaching Methods:</strong> ${plan.teachingMethods.join(', ') || 'Mixed Instructional Models'}</div>
  </div>

  <h2>1. Unit Overview & Learning Goals</h2>
  <p>${plan.unitOverview}</p>

  <h3>Target Learning Objectives</h3>
  <ul>
    ${plan.unitObjectives.map(obj => `<li>${obj}</li>`).join('')}
  </ul>

  <div class="page-break"></div>

  <h2>2. Weekly Breakdown & Daily Sessions</h2>
  ${plan.weeklyPlans.map(w => `
    <div style="margin-top: 25px;">
      <h3 style="background: #DFE1F0; padding: 10px; border-radius: 6px; font-size: 16px;">
        Week ${w.weekNumber}: ${w.theme}
      </h3>
      <p><strong>Weekly Focus:</strong> ${w.learningGoals.join('; ')}</p>
      <p><strong>Key Vocabulary:</strong> ${w.vocabulary.join(', ')}</p>
      <p><strong>Weekly Assessment:</strong> ${w.weeklyAssessment.type} &mdash; ${w.weeklyAssessment.description}</p>
      
      ${w.sessions.map(s => `
        <div class="session-card">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <strong style="font-size: 15px; color: #0d9488;">Session ${s.sessionNumber} (Day ${s.dayNumber}): ${s.title}</strong>
            <span style="font-size: 12px; color: #64748b;">${s.durationMinutes} min</span>
          </div>
          <p style="margin: 6px 0; font-size: 13px;"><strong>Topic:</strong> ${s.topic}</p>
          
          <div style="font-size: 13px; margin: 8px 0;">
            <strong>Learning Objectives:</strong>
            <ul>
              ${s.objectives.map(o => `<li>[<em>${o.bloomLevel}</em>] ${o.description} &mdash; <small>Success: ${o.successCriterion}</small></li>`).join('')}
            </ul>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Phase</th>
                <th style="width: 10%;">Time</th>
                <th style="width: 45%;">Instructional Activity</th>
                <th style="width: 30%;">Teacher / Student Actions</th>
              </tr>
            </thead>
            <tbody>
              ${s.lessonSequence.map(seq => `
                <tr>
                  <td><strong>${seq.title}</strong></td>
                  <td>${seq.durationMinutes}m</td>
                  <td>${seq.description}<br><small style="color: #64748b;">Materials: ${seq.materials.join(', ') || 'Standard'}</small></td>
                  <td>
                    <small><strong>T:</strong> ${seq.teacherAction}</small><br>
                    <small><strong>S:</strong> ${seq.studentAction}</small>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="font-size: 12.5px; background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #DFE1F0; margin-top: 10px;">
            <p style="margin: 4px 0;"><strong>Formative Assessment:</strong> ${s.formativeAssessment.type} &mdash; Prompt: "${s.formativeAssessment.promptOrQuestion}"</p>
            <p style="margin: 4px 0;"><strong>Differentiation:</strong> Support: ${s.differentiation.support} | Extension: ${s.differentiation.advanced}</p>
            ${s.homework.enabled ? `<p style="margin: 4px 0;"><strong>Homework:</strong> ${s.homework.task} (~${s.homework.estimatedMinutes} min)</p>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `).join('')}

  <div class="page-break"></div>

  <h2>3. Final Summative Assessment & Rubric</h2>
  <h3>${plan.finalAssessment.title} (${plan.finalAssessment.type})</h3>
  <p>${plan.finalAssessment.description}</p>

  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Criterion (Weight)</th>
        <th style="width: 20%;">Exemplary (4)</th>
        <th style="width: 20%;">Proficient (3)</th>
        <th style="width: 20%;">Developing (2)</th>
        <th style="width: 20%;">Beginning (1)</th>
      </tr>
    </thead>
    <tbody>
      ${plan.finalAssessment.rubric.map(r => `
        <tr>
          <td><strong>${r.criterion}</strong><br><small>(${r.weightPercentage}%)</small></td>
          <td>${r.exemplary}</td>
          <td>${r.proficient}</td>
          <td>${r.developing}</td>
          <td>${r.beginning}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>4. Core Resources & Teacher Notes</h2>
  <ul>
    ${plan.resourceList.map(res => `<li><strong>[${escapeHtml(res.category)}]</strong> ${escapeHtml(res.title)}: ${escapeHtml(res.description)}</li>`).join('')}
  </ul>
  <p><strong>Teacher Notes:</strong> ${escapeHtml(plan.teacherNotes || 'None')}</p>

  ${plan.references && plan.references.length > 0 ? `
  <div class="page-break"></div>
  <h2>5. Curriculum Reference Materials & Verified Resources</h2>
  <p style="font-size: 13px; color: #64748b; margin-top: -4px;">Curated and verified instructional reference materials attached to this curriculum plan.</p>
  
  ${(['standards', 'textbooks', 'articles', 'videos', 'worksheets', 'teacher-guides'] as const).map(cat => {
    const items = (plan.references || []).filter(r => r.category === cat);
    if (items.length === 0) return '';
    const catTitles: Record<string, string> = {
      'standards': 'Curriculum Standards & Syllabus',
      'textbooks': 'Textbooks & Reading Materials',
      'articles': 'Articles & Research',
      'videos': 'Videos & Interactive Learning',
      'worksheets': 'Worksheets & Assessments',
      'teacher-guides': 'Teacher Guides & Additional Resources',
    };
    return `
      <h3 style="color: #0f766e; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 18px;">${catTitles[cat] || cat}</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${items.map(r => `
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; background: #fafaf9;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <strong style="font-size: 14px; color: #0f172a;">${escapeHtml(r.title)}</strong>
              <span class="badge" style="background: ${r.verified === 'verified' ? '#ecfdf5' : '#f1f5f9'}; color: ${r.verified === 'verified' ? '#065f46' : '#475569'}; border-color: ${r.verified === 'verified' ? '#a7f3d0' : '#cbd5e1'}; font-size: 11px;">
                ${r.verified === 'verified' ? '✓ Verified' : 'Unverified'}
              </span>
            </div>
            <p style="margin: 3px 0 6px 0; font-size: 12.5px; color: #475569;">${escapeHtml(r.description)}</p>
            <div style="font-size: 11.5px; color: #64748b; display: flex; gap: 12px; align-items: center;">
              <span>Source: <strong>${escapeHtml(r.sourceName)}</strong></span>
              <span>Type: <em>${escapeHtml(r.resourceType)}</em></span>
              ${r.relatedWeek ? `<span>Week: ${r.relatedWeek}</span>` : ''}
              <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" style="color: #0d9488; text-decoration: underline; margin-left: auto;">
                ${escapeHtml(r.url)} ↗
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }).join('')}
  ` : ''}

  <footer style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #cbd5e1; font-size: 12px; color: #64748b; text-align: center;">
    Generated by ${BRAND.name} &bull; ${BRAND.tagline}
  </footer>
</body>
</html>`;
}
