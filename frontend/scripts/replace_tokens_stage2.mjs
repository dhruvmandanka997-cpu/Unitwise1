import fs from 'fs';
import path from 'path';

const compDir = 'c:/Users/LOQ/Desktop/New project/frontend/src/components';

const rules = [
  // Remaining specific classes in components
  { from: /text-\[#DFE1F0\]/g, to: 'text-[var(--border)]' },
  { from: /border-\[#DFE1F0\]/g, to: 'border-[var(--border)]' },
  { from: /bg-\[#DFE1F0\]/g, to: 'bg-[var(--border)]' },
  { from: /bg-\[#FFFFFF\]/g, to: 'bg-[var(--surface)]' },
  { from: /ring-\[#4938C8\]/g, to: 'ring-[var(--primary)]' },
  { from: /text-\[#4938C8\]/g, to: 'text-[var(--primary)]' },
  { from: /bg-\[#4938C8\]/g, to: 'bg-[var(--primary)]' },
  { from: /text-\[#5B46E8\]/g, to: 'text-[var(--accent)]' },
  { from: /bg-\[#5B46E8\]/g, to: 'bg-[var(--accent)]' },
  { from: /bg-\[#A3AAD2\]/g, to: 'bg-[var(--border)]' },
  { from: /bg-\[#CBD0E4\]/g, to: 'bg-[var(--lavender-soft)]' },
  { from: /dark:bg-\[#1B1B33\]/g, to: 'dark:bg-[var(--surface)]' },
  { from: /dark:border-\[#2F2F52\]/g, to: 'dark:border-[var(--border)]' },
  { from: /dark:text-\[#F4F4FD\]/g, to: 'dark:text-[var(--text)]' },
  { from: /dark:text-\[#A6A9C4\]/g, to: 'dark:text-[var(--text-muted)]' },
  { from: /dark:bg-\[#2B2A56\]/g, to: 'dark:bg-[var(--lavender-soft)]' },
  { from: /dark:text-\[#7A6BF0\]/g, to: 'dark:text-[var(--accent)]' },
  { from: /dark:bg-\[#232342\]/g, to: 'dark:bg-[var(--surface)]' },
  { from: /bg-\[#EFF6FF\]/g, to: 'bg-[var(--lavender-soft)]' },
  { from: /text-\[#2563EB\]/g, to: 'text-[var(--primary)]' },
  { from: /bg-\[#2563EB\]/g, to: 'bg-[var(--primary)]' },
  { from: /border-\[#2563EB\]/g, to: 'border-[var(--primary)]' },
  { from: /hover:bg-\[#1D4ED8\]/g, to: 'hover:bg-[var(--primary-hover)]' },
  { from: /text-\[#0F172A\]/g, to: 'text-[var(--text)]' },
  { from: /text-\[#475569\]/g, to: 'text-[var(--text-muted)]' },
  { from: /border-\[#E2E8F0\]/g, to: 'border-[var(--border)]' },
  { from: /before:bg-\[#E2E8F0\]/g, to: 'before:bg-[var(--border)]' },
  { from: /dark:before:bg-\[#2F2F52\]/g, to: 'dark:before:bg-[var(--border)]' },
  { from: /dark:border-\[#7A6BF0\]/g, to: 'dark:border-[var(--accent)]' },
  { from: /bg-\[#7C6AF0\]/g, to: 'bg-[var(--accent)]' },
  { from: /text-\[#7C6AF0\]/g, to: 'text-[var(--accent)]' },
  { from: /bg-\[#9889F4\]/g, to: 'bg-[var(--accent)]' },
  { from: /text-\[#9889F4\]/g, to: 'text-[var(--accent)]' },
  { from: /bg-\[#B4A9F8\]/g, to: 'bg-[var(--lavender-soft)]' },
  { from: /text-\[#B4A9F8\]/g, to: 'text-[var(--lavender-soft)]' },
  { from: /bg-\[#666A83\]/g, to: 'bg-[var(--text-muted)]' },
];

function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      walk(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { from, to } of rules) {
        if (from.test(content)) {
          content = content.replace(from, to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated Stage 2: ${fullPath}`);
      }
    }
  }
}

walk(compDir);
console.log('Stage 2 complete.');
