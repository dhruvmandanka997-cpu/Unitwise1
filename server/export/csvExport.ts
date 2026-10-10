import { LessonPlan } from '../../src/types/plan';

export function generateCsv(plan: LessonPlan): string {
  const headers = [
    'Week Number',
    'Session Number',
    'Day of Week',
    'Lesson Title',
    'Topic / Focus',
    'Duration (Minutes)',
    'Learning Objectives',
    'Standards & Verification Status',
    'Lesson Phases & Activities',
    'Formative Assessment Type',
    'Formative Prompt / Question',
    'Next Instructional Step',
    'Support Differentiation',
    'Extension Differentiation',
    'ELL Differentiation',
    'Homework Task',
    'Required Materials'
  ];

  function escapeCsv(val: string | number | undefined): string {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  const rows: string[] = [];
  rows.push(headers.map(escapeCsv).join(','));

  for (const week of plan.weeklyPlans) {
    for (const session of week.sessions) {
      const objectivesStr = session.objectives
        .map(o => `[${o.bloomLevel}] ${o.description}`)
        .join(' | ');

      const standardsStr = session.standards
        .map(s => `${s.code} (${s.verificationStatus}): ${s.description}`)
        .join(' | ');

      const phasesStr = session.lessonSequence
        .map(p => `${p.title} (${p.durationMinutes}m): ${p.description}`)
        .join(' | ');

      const row = [
        escapeCsv(week.weekNumber),
        escapeCsv(session.sessionNumber),
        escapeCsv(session.dayNumber),
        escapeCsv(session.title),
        escapeCsv(session.topic),
        escapeCsv(session.durationMinutes),
        escapeCsv(objectivesStr),
        escapeCsv(standardsStr),
        escapeCsv(phasesStr),
        escapeCsv(session.formativeAssessment.type),
        escapeCsv(session.formativeAssessment.promptOrQuestion),
        escapeCsv(session.formativeAssessment.nextInstructionalStep),
        escapeCsv(session.differentiation.support),
        escapeCsv(session.differentiation.advanced),
        escapeCsv(session.differentiation.ell),
        escapeCsv(session.homework.enabled ? session.homework.task : 'None'),
        escapeCsv(session.materials.join(', '))
      ];

      rows.push(row.join(','));
    }
  }

  return rows.join('\r\n');
}
