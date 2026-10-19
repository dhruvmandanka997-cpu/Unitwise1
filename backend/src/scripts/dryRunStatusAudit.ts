import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config';
import { normalizePlanStatus } from '../models/plan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DryRunReport {
  timestamp: string;
  totalPlans: number;
  totalUsers: number;
  maxActiveLimit: number;
  usersOverLimitCount: number;
  totalAffectedActivePlansOverLimit: number;
  userSummaries: Array<{
    userId: string;
    totalPlans: number;
    activeCount: number;
    draftCount: number;
    completedCount: number;
    cancelledCount: number;
    isOverLimit: boolean;
    excessCount: number;
    activePlanTitles: string[];
  }>;
}

export function generateDryRunReport(): DryRunReport {
  const plansFile = path.join(config.dataDir, 'plans.json');
  if (!fs.existsSync(plansFile)) {
    return {
      timestamp: new Date().toISOString(),
      totalPlans: 0,
      totalUsers: 0,
      maxActiveLimit: config.maxActivePlans || 3,
      usersOverLimitCount: 0,
      totalAffectedActivePlansOverLimit: 0,
      userSummaries: [],
    };
  }

  const raw = fs.readFileSync(plansFile, 'utf-8');
  const plans = JSON.parse(raw);

  const usersMap = new Map<string, any[]>();
  for (const p of plans) {
    const user = p.userId || 'teacher_default';
    if (!usersMap.has(user)) {
      usersMap.set(user, []);
    }
    usersMap.get(user)!.push(p);
  }

  const limit = config.maxActivePlans || 3;
  let usersOverLimitCount = 0;
  let totalAffectedActivePlansOverLimit = 0;

  const summaries: DryRunReport['userSummaries'] = [];

  for (const [userId, userPlans] of usersMap.entries()) {
    let activeCount = 0;
    let draftCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    const activePlanTitles: string[] = [];

    for (const p of userPlans) {
      const norm = normalizePlanStatus(p.status);
      if (norm === 'active') {
        activeCount++;
        activePlanTitles.push(p.title);
      } else if (norm === 'completed') {
        completedCount++;
      } else if (norm === 'cancelled') {
        cancelledCount++;
      } else {
        draftCount++;
      }
    }

    const isOverLimit = activeCount > limit;
    const excess = isOverLimit ? activeCount - limit : 0;
    if (isOverLimit) {
      usersOverLimitCount++;
      totalAffectedActivePlansOverLimit += activeCount;
    }

    summaries.push({
      userId,
      totalPlans: userPlans.length,
      activeCount,
      draftCount,
      completedCount,
      cancelledCount,
      isOverLimit,
      excessCount: excess,
      activePlanTitles,
    });
  }

  return {
    timestamp: new Date().toISOString(),
    totalPlans: plans.length,
    totalUsers: usersMap.size,
    maxActiveLimit: limit,
    usersOverLimitCount,
    totalAffectedActivePlansOverLimit,
    userSummaries: summaries,
  };
}

if (process.argv[1] && process.argv[1].endsWith('dryRunStatusAudit.ts')) {
  const report = generateDryRunReport();
  console.log('=== ACTIVE-PLAN MIGRATION DRY-RUN REPORT ===');
  console.log(`Generated At: ${report.timestamp}`);
  console.log(`Total Saved Plans: ${report.totalPlans}`);
  console.log(`Total Distinct Accounts: ${report.totalUsers}`);
  console.log(`Active Plan Limit: ${report.maxActiveLimit}`);
  console.log(`Accounts Over Limit: ${report.usersOverLimitCount}`);
  console.log(`Total Active Plans Affected by Over-Limit: ${report.totalAffectedActivePlansOverLimit}`);
  console.log('\nPer-User Breakdown:');
  for (const u of report.userSummaries) {
    console.log(`- User [${u.userId}]: Total=${u.totalPlans}, Active=${u.activeCount}, Draft=${u.draftCount}, Completed=${u.completedCount}, Cancelled=${u.cancelledCount}, OverLimit=${u.isOverLimit} (Excess=${u.excessCount})`);
  }
}
