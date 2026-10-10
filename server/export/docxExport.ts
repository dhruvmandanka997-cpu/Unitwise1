import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Packer,
  convertInchesToTwip
} from 'docx';
import { LessonPlan } from '../../src/types/plan';

export async function generateDocx(plan: LessonPlan): Promise<Buffer> {
  const sections = [];

  // Title and metadata paragraphs
  const titleParagraph = new Paragraph({
    text: plan.title,
    heading: HeadingLevel.TITLE,
    spacing: { after: 200 },
  });

  const subtitleParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Subject: ', bold: true }),
      new TextRun({ text: `${plan.subject}  |  ` }),
      new TextRun({ text: 'Grade Level: ', bold: true }),
      new TextRun({ text: `${plan.gradeLevel}  |  ` }),
      new TextRun({ text: 'Duration: ', bold: true }),
      new TextRun({ text: `${plan.durationWeeks} Weeks (${plan.durationWeeks * plan.sessionsPerWeek} Sessions)  |  ` }),
      new TextRun({ text: 'Class Length: ', bold: true }),
      new TextRun({ text: `${plan.classDurationMinutes} min\n` }),
    ],
    spacing: { after: 200 },
  });

  const curriculumParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Curriculum Framework: ', bold: true }),
      new TextRun({ text: `${plan.curriculumFramework}\n` }),
      new TextRun({ text: 'Standards Alignment: ', bold: true }),
      new TextRun({ text: `${plan.standardsFramework || 'General Standards'}\n` }),
    ],
    spacing: { after: 300 },
  });

  const overviewHeading = new Paragraph({
    text: 'Unit Overview & Enduring Understandings',
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 150 },
  });

  const overviewText = new Paragraph({
    text: plan.unitOverview,
    spacing: { after: 250 },
  });

  const goalsHeading = new Paragraph({
    text: 'Unit Learning Objectives',
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 150, after: 100 },
  });

  const goalParagraphs = plan.unitObjectives.map((obj, i) => new Paragraph({
    children: [
      new TextRun({ text: `• ${obj}` }),
    ],
    spacing: { after: 80 },
  }));

  const docChildren: (Paragraph | Table)[] = [
    titleParagraph,
    subtitleParagraph,
    curriculumParagraph,
    overviewHeading,
    overviewText,
    goalsHeading,
    ...goalParagraphs,
  ];

  // Weekly plans
  for (const week of plan.weeklyPlans) {
    docChildren.push(
      new Paragraph({
        text: `Week ${week.weekNumber}: ${week.theme}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 150 },
      })
    );

    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Weekly Goals: ', bold: true }),
          new TextRun({ text: week.learningGoals.join('; ') + '\n' }),
          new TextRun({ text: 'Vocabulary: ', bold: true }),
          new TextRun({ text: week.vocabulary.join(', ') + '\n' }),
          new TextRun({ text: 'Weekly Assessment Checkpoint: ', bold: true }),
          new TextRun({ text: `${week.weeklyAssessment.type} - ${week.weeklyAssessment.description}` }),
        ],
        spacing: { after: 200 },
      })
    );

    // Sessions for this week
    for (const session of week.sessions) {
      docChildren.push(
        new Paragraph({
          text: `Lesson ${session.sessionNumber} (Day ${session.dayNumber}): ${session.title}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );

      // Objectives
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Learning Objectives & Bloom Level:', bold: true }),
          ],
          spacing: { after: 60 },
        })
      );

      for (const obj of session.objectives) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: `  [${obj.bloomLevel}] `, bold: true, italics: true }),
              new TextRun({ text: `${obj.description} (Success: "${obj.successCriterion}")` }),
            ],
            spacing: { after: 60 },
          })
        );
      }

      // Standards
      if (session.standards.length > 0) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Standards Alignment: ', bold: true }),
              new TextRun({
                text: session.standards.map(s => `${s.code} (${s.verificationStatus === 'verified' ? 'Verified' : 'Suggested alignment'}): ${s.description}`).join('; ')
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      // Lesson Sequence Table
      const headerRow = new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Phase', bold: true })] })],
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Time', bold: true })] })],
            width: { size: 10, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Instructional Activity & Description', bold: true })] })],
            width: { size: 45, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Teacher / Student Roles', bold: true })] })],
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
        ],
      });

      const dataRows = session.lessonSequence.map(act => new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: act.title })],
          }),
          new TableCell({
            children: [new Paragraph({ text: `${act.durationMinutes} min` })],
          }),
          new TableCell({
            children: [
              new Paragraph({ text: act.description }),
              new Paragraph({ children: [new TextRun({ text: `Materials: ${act.materials.join(', ') || 'Standard classroom'}`, italics: true })] }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Teacher: ', bold: true }), new TextRun({ text: act.teacherAction })] }),
              new Paragraph({ children: [new TextRun({ text: 'Student: ', bold: true }), new TextRun({ text: act.studentAction })] }),
            ],
          }),
        ],
      }));

      const sequenceTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
      });

      docChildren.push(sequenceTable);

      // Formative assessment & differentiation notes
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: '\nFormative Assessment: ', bold: true }),
            new TextRun({ text: `${session.formativeAssessment.type} - Prompt: "${session.formativeAssessment.promptOrQuestion}" | Next step: ${session.formativeAssessment.nextInstructionalStep}\n` }),
            new TextRun({ text: 'Differentiation Strategies: ', bold: true }),
            new TextRun({ text: `Support: ${session.differentiation.support} | Extension: ${session.differentiation.advanced} | ELL: ${session.differentiation.ell}\n` }),
            session.homework.enabled ? new TextRun({ text: `Homework: ${session.homework.task} (~${session.homework.estimatedMinutes} min)\n` }) : new TextRun({ text: '' }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  }

  // Final Assessment Section
  docChildren.push(
    new Paragraph({
      text: 'Final Summative Unit Assessment',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 150 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${plan.finalAssessment.title} (${plan.finalAssessment.type})\n`, bold: true }),
        new TextRun({ text: `${plan.finalAssessment.description}\n` }),
      ],
      spacing: { after: 200 },
    })
  );

  // Rubric Table
  const rubricHeader = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Criterion (Weight)', bold: true })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Exemplary (4)', bold: true })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Proficient (3)', bold: true })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Developing (2)', bold: true })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Beginning (1)', bold: true })] })], width: { size: 20, type: WidthType.PERCENTAGE } }),
    ],
  });

  const rubricRows = plan.finalAssessment.rubric.map(r => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ text: `${r.criterion} (${r.weightPercentage}%)` })] }),
      new TableCell({ children: [new Paragraph({ text: r.exemplary })] }),
      new TableCell({ children: [new Paragraph({ text: r.proficient })] }),
      new TableCell({ children: [new Paragraph({ text: r.developing })] }),
      new TableCell({ children: [new Paragraph({ text: r.beginning })] }),
    ],
  }));

  docChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [rubricHeader, ...rubricRows],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
