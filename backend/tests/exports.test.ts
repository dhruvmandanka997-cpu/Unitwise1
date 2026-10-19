import { describe, it, expect } from 'vitest';
import { PedagogicalFallbackGenerator } from '../src/services/ai/pedagogicalFallback';
import { generateDocx } from '../src/services/export/docxExport';
import { generatePdfBuffer } from '../src/services/export/pdfExport';
import { generateCsv } from '../src/services/export/csvExport';
import { generatePrintHtml } from '../src/services/export/htmlPrintExport';

describe('Document Export Services', () => {
  const generator = new PedagogicalFallbackGenerator();
  const samplePlan = generator.generate({
    title: 'Kinematics & Projectile Motion',
    subject: 'Physics',
    gradeLevel: 'Grade 11 (High School / Junior)',
    curriculumFramework: 'NGSS & AP Physics 1',
    standardsFramework: 'HS-PS2-1',
    durationWeeks: 3,
    sessionsPerWeek: 5,
    classDurationMinutes: 55,
    format: 'session_sequence',
    overallGoals: 'Analyze velocity, acceleration, and parabolic projectile trajectories.',
    preferredTeachingMethods: ['Hands-on Lab Experiments & Physical Models'],
    enableHomework: true,
  });

  it('generates a valid Microsoft Word DOCX buffer with non-zero length', async () => {
    const docxBuffer = await generateDocx(samplePlan);
    expect(docxBuffer).toBeInstanceOf(Buffer);
    expect(docxBuffer.length).toBeGreaterThan(1000); // realistic docx archive length
  });

  it('generates a valid PDF buffer with non-zero length', () => {
    const pdfBuffer = generatePdfBuffer(samplePlan);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // PDF magic bytes %PDF
    const header = pdfBuffer.subarray(0, 4).toString('utf-8');
    expect(header).toBe('%PDF');
  });

  it('generates a valid CSV formatted schedule with all 15 sessions and header row', () => {
    const csvContent = generateCsv(samplePlan);
    expect(typeof csvContent).toBe('string');
    const lines = csvContent.split('\r\n').filter(Boolean);
    // 1 header + 15 session rows = 16 rows
    expect(lines.length).toBe(16);
    expect(lines[0]).toContain('Week Number');
    expect(lines[0]).toContain('Lesson Title');
    expect(lines[0]).toContain('Learning Objectives');
  });

  it('generates a print-friendly HTML view containing page break and print styling', () => {
    const html = generatePrintHtml(samplePlan);
    expect(html).toContain('Kinematics & Projectile Motion');
    expect(html).toContain('window.print()');
    expect(html).toContain('@media print');
    expect(html).toContain('page-break');
  });

  it('exports plan with reference materials section and hyperlinked URLs in HTML print view', () => {
    const planWithRefs = {
      ...samplePlan,
      references: [
        {
          id: 'ref_test_export_1',
          title: 'Physics Classroom - 1-D Kinematics',
          sourceName: 'The Physics Classroom',
          url: 'https://www.physicsclassroom.com/class/1DKin',
          resourceType: 'article' as const,
          category: 'articles' as const,
          description: 'Tutorial lessons on motion and graphs.',
          verified: 'verified' as const,
          linkStatus: 'reachable' as const,
          origin: 'retrieved' as const,
          trustTier: 'reputable' as const,
        },
      ],
      referencesStatus: 'ready' as const,
    };

    const html = generatePrintHtml(planWithRefs);
    expect(html).toContain('5. Curriculum Reference Materials & Verified Resources');
    expect(html).toContain('Physics Classroom - 1-D Kinematics');
    expect(html).toContain('https://www.physicsclassroom.com/class/1DKin');
  });

  it('exports plan with reference materials section in Word DOCX successfully', async () => {
    const planWithRefs = {
      ...samplePlan,
      references: [
        {
          id: 'ref_test_docx_1',
          title: 'OpenStax College Physics',
          sourceName: 'OpenStax',
          url: 'https://openstax.org/details/books/college-physics',
          resourceType: 'textbook' as const,
          category: 'textbooks' as const,
          description: 'Peer-reviewed introductory physics textbook.',
          verified: 'verified' as const,
          linkStatus: 'reachable' as const,
          origin: 'retrieved' as const,
          trustTier: 'reputable' as const,
        },
      ],
      referencesStatus: 'ready' as const,
    };

    const docxBuffer = await generateDocx(planWithRefs);
    expect(docxBuffer).toBeInstanceOf(Buffer);
    expect(docxBuffer.length).toBeGreaterThan(1000);
  });

  it('older legacy plans without references export cleanly without throwing', async () => {
    const legacyPlan = { ...samplePlan };
    delete (legacyPlan as any).references;
    delete (legacyPlan as any).referencesStatus;

    const html = generatePrintHtml(legacyPlan);
    expect(html).not.toContain('5. Curriculum Reference Materials');
    const docxBuffer = await generateDocx(legacyPlan);
    expect(docxBuffer.length).toBeGreaterThan(1000);
  });
});
