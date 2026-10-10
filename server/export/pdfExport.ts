import { jsPDF } from 'jspdf';
import autoTableImport from 'jspdf-autotable';
import { LessonPlan } from '../../src/types/plan';

function callAutoTable(doc: jsPDF, options: any) {
  const fn = typeof autoTableImport === 'function'
    ? autoTableImport
    : (autoTableImport as any).default?.default || (autoTableImport as any).default || (doc as any).autoTable;
  if (typeof fn === 'function') {
    fn(doc, options);
  } else if (typeof (doc as any).autoTable === 'function') {
    (doc as any).autoTable(options);
  }
}

export function generatePdfBuffer(plan: LessonPlan): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header banner
  doc.setFillColor(13, 148, 136); // Teal #0D9488
  doc.rect(0, 0, pageWidth, 24, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LessonCraft AI - Instructional Curriculum Plan', 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Pedagogical Backward-Design & Instructional Alignment', 14, 18);

  y = 32;
  doc.setTextColor(15, 23, 42); // Navy 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(plan.title, 14, y);
  y += 7;

  // Metadata pills / key-value
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subject: ${plan.subject}   |   Grade: ${plan.gradeLevel}   |   Duration: ${plan.durationWeeks} Weeks (${plan.durationWeeks * plan.sessionsPerWeek} Sessions)   |   Class: ${plan.classDurationMinutes} min`, 14, y);
  y += 6;
  doc.text(`Curriculum: ${plan.curriculumFramework}`, 14, y);
  y += 6;
  doc.text(`Standards Alignment: ${plan.standardsFramework || 'General Educational Standards'}`, 14, y);
  y += 10;

  // Unit Overview
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Unit Overview & Goals', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const overviewLines = doc.splitTextToSize(plan.unitOverview, pageWidth - 28);
  doc.text(overviewLines, 14, y);
  y += overviewLines.length * 4.5 + 4;

  // Unit Objectives
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Target Learning Outcomes:', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  for (const obj of plan.unitObjectives) {
    const objLines = doc.splitTextToSize(`• ${obj}`, pageWidth - 32);
    doc.text(objLines, 18, y);
    y += objLines.length * 4.5;
  }
  y += 8;

  // Weekly Overview Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Weekly Instructional Scope & Sequence', 14, y);
  y += 4;

  const weeklyTableData = plan.weeklyPlans.map(w => [
    `Week ${w.weekNumber}`,
    w.theme,
    w.learningGoals.join('\n• '),
    `${w.weeklyAssessment.type}\n(${w.weeklyAssessment.description.substring(0, 90)}...)`
  ]);

  callAutoTable(doc, {
    startY: y,
    head: [['Week', 'Theme / Focus', 'Learning Goals', 'Assessment Checkpoint']],
    body: weeklyTableData,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 8, cellPadding: 3 },
    margin: { left: 14, right: 14 },
    theme: 'striped',
  });

  // Daily Lessons
  doc.addPage();
  y = 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('3. Detailed Daily Instructional Sessions', 14, y);
  y += 8;

  for (const week of plan.weeklyPlans) {
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 4, pageWidth - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(13, 148, 136);
    doc.text(`WEEK ${week.weekNumber}: ${week.theme.toUpperCase()}`, 16, y + 1);
    y += 10;
    doc.setTextColor(15, 23, 42);

    for (const session of week.sessions) {
      if (y > 250) {
        doc.addPage();
        y = 18;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Session ${session.sessionNumber} (Day ${session.dayNumber}): ${session.title}`, 14, y);
      y += 5;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.text(`Duration: ${session.durationMinutes} min   |   Focus: ${session.topic}`, 14, y);
      y += 5;

      // Objectives & Standards
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const objText = session.objectives.map(o => `[${o.bloomLevel}] ${o.description}`).join('; ');
      const objLines = doc.splitTextToSize(`Objectives: ${objText}`, pageWidth - 28);
      doc.text(objLines, 14, y);
      y += objLines.length * 4 + 2;

      // Formative assessment
      const faText = `Formative Assessment: ${session.formativeAssessment.type} — ${session.formativeAssessment.promptOrQuestion}`;
      const faLines = doc.splitTextToSize(faText, pageWidth - 28);
      doc.text(faLines, 14, y);
      y += faLines.length * 4 + 2;

      // Sequence summary table for this session
      const seqData = session.lessonSequence.map(seq => [
        seq.title,
        `${seq.durationMinutes}m`,
        seq.description.substring(0, 110) + (seq.description.length > 110 ? '...' : ''),
        `T: ${seq.teacherAction.substring(0, 50)}...\nS: ${seq.studentAction.substring(0, 50)}...`
      ]);

      callAutoTable(doc, {
        startY: y,
        head: [['Phase', 'Time', 'Activity', 'Roles']],
        body: seqData,
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 7.5, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });

      y = ((doc as any).lastAutoTable?.finalY ?? y + 25) + 8;
    }
  }

  // Final Assessment & Rubric Page
  doc.addPage();
  y = 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('4. Final Culminating Evaluation & Rubric', 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(`${plan.finalAssessment.title} (${plan.finalAssessment.type})`, 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const descLines = doc.splitTextToSize(plan.finalAssessment.description, pageWidth - 28);
  doc.text(descLines, 14, y);
  y += descLines.length * 4 + 6;

  const rubricData = plan.finalAssessment.rubric.map(r => [
    `${r.criterion}\n(${r.weightPercentage}%)`,
    r.exemplary,
    r.proficient,
    r.developing,
    r.beginning
  ]);

  callAutoTable(doc, {
    startY: y,
    head: [['Criterion', 'Exemplary (4)', 'Proficient (3)', 'Developing (2)', 'Beginning (1)']],
    body: rubricData,
    headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 7, cellPadding: 2.5 },
    margin: { left: 14, right: 14 },
  });

  // Footer / Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`LessonCraft AI  •  ${plan.title}  •  Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
