import fs from 'fs';
import path from 'path';

const srcDir = 'c:/Users/LOQ/Desktop/New project/frontend/src';

const replacements = [
  // Text
  { from: /text-\[#17172D\]/g, to: 'text-[var(--text)]' },
  { from: /text-\[#666A83\]/g, to: 'text-[var(--text-muted)]' },
  { from: /text-\[#4938C8\]/g, to: 'text-[var(--primary)]' },
  { from: /text-\[#5B46E8\]/g, to: 'text-[var(--accent)]' },
  { from: /placeholder-\[#666A83\]/g, to: 'placeholder-[var(--text-muted)]' },
  
  // Background
  { from: /bg-\[#F8F9FD\]/g, to: 'bg-[var(--bg)]' },
  { from: /bg-\[#EEEEFF\]/g, to: 'bg-[var(--lavender-soft)]' },
  { from: /bg-\[#4938C8\]/g, to: 'bg-[var(--primary)]' },
  { from: /bg-\[#5B46E8\]/g, to: 'bg-[var(--accent)]' },
  
  // Border & Divide
  { from: /border-\[#DFE1F0\]/g, to: 'border-[var(--border)]' },
  { from: /border-\[#4938C8\]/g, to: 'border-[var(--primary)]' },
  { from: /border-\[#5B46E8\]/g, to: 'border-[var(--accent)]' },
  { from: /divide-\[#DFE1F0\]/g, to: 'divide-[var(--border)]' },
  
  // Ring
  { from: /ring-\[#5B46E8\]/g, to: 'ring-[var(--accent)]' },
  { from: /ring-\[#DFE1F0\]/g, to: 'ring-[var(--border)]' },
  { from: /ring-\[#EEEEFF\]/g, to: 'ring-[var(--lavender-soft)]' },
  
  // Shadows
  { from: /shadow-\[8px_8px_20px_rgba\(163,170,210,0\.35\),-8px_-8px_20px_#FFFFFF\]/g, to: 'shadow-[var(--shadow-raised)]' },
  { from: /shadow-\[4px_4px_10px_rgba\(163,170,210,0\.30\),-4px_-4px_10px_#FFFFFF\]/g, to: 'shadow-[var(--shadow-raised-sm)]' },
  { from: /shadow-\[12px_12px_28px_rgba\(163,170,210,0\.42\),-10px_-10px_24px_#FFFFFF\]/g, to: 'shadow-[var(--shadow-hover)]' },
  { from: /shadow-\[12px_12px_28px_rgba\(163,170,210,0\.42\)\]/g, to: 'shadow-[var(--shadow-hover)]' },
  { from: /shadow-\[inset_4px_4px_10px_rgba\(163,170,210,0\.35\),inset_-4px_-4px_10px_#FFFFFF\]/g, to: 'shadow-[var(--shadow-inset)]' },
  { from: /shadow-\[6px_6px_16px_rgba\(73,56,200,0\.30\),-4px_-4px_12px_rgba\(255,255,255,0\.9\)\]/g, to: 'shadow-[var(--shadow-primary)]' },
  { from: /shadow-\[inset_2px_2px_5px_rgba\(163,170,210,0\.35\)\]/g, to: 'shadow-[var(--shadow-inset)]' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      processDir(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { from, to } of replacements) {
        if (from.test(content)) {
          content = content.replace(from, to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDir(srcDir);
console.log('Token replacement complete.');
