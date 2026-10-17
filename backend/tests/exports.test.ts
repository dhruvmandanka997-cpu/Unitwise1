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
});
