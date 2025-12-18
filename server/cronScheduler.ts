import { runCronJob } from './adsTransparencyScraper';
import { sendEmail } from './emailService';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

let cronInterval: ReturnType<typeof setInterval> | null = null;
let dailyReportInterval: ReturnType<typeof setInterval> | null = null;

export function startCronScheduler(): void {
  console.log('[Cron] Starting schedulers...');
  
  runCronJob().catch(err => {
    console.error('[Cron] Initial ads scraper job error:', err);
  });
  
  cronInterval = setInterval(() => {
    console.log('[Cron] Running hourly ads scraper job...');
    runCronJob().catch(err => {
      console.error('[Cron] Scheduled ads scraper job error:', err);
    });
  }, HOUR_IN_MS);
  
  const now = new Date();
  const nextMorning = new Date(now);
  nextMorning.setHours(9, 0, 0, 0);
  if (nextMorning <= now) {
    nextMorning.setDate(nextMorning.getDate() + 1);
  }
  const msUntilMorning = nextMorning.getTime() - now.getTime();
  
  setTimeout(() => {
    sendDailyReports().catch(err => {
      console.error('[Cron] Daily report error:', err);
    });
    
    dailyReportInterval = setInterval(() => {
      console.log('[Cron] Running daily report job...');
      sendDailyReports().catch(err => {
        console.error('[Cron] Daily report job error:', err);
      });
    }, DAY_IN_MS);
  }, msUntilMorning);
  
  console.log(`[Cron] Schedulers started - ads scraper: hourly, daily reports: 9 AM (in ${Math.round(msUntilMorning / 1000 / 60)} minutes)`);
}

export function stopCronScheduler(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
  if (dailyReportInterval) {
    clearInterval(dailyReportInterval);
    dailyReportInterval = null;
  }
  console.log('[Cron] All schedulers stopped');
}

export async function triggerManualRun(): Promise<void> {
  console.log('[Cron] Manual trigger requested');
  await runCronJob();
}

export async function triggerDailyReports(): Promise<void> {
  console.log('[Cron] Manual daily reports trigger requested');
  await sendDailyReports();
}

async function sendDailyReports(): Promise<void> {
  console.log('[Cron] Sending daily reports...');
  
  try {
    const usersResult = await pool.query(`
      SELECT id, email, full_name, subscription_plan 
      FROM users 
      WHERE email IS NOT NULL 
      AND subscription_plan IN ('basic', 'pro', 'lifetime')
    `);
    
    const users = usersResult.rows;
    console.log(`[Cron] Found ${users.length} users to send reports to`);
    
    for (const user of users) {
      try {
        let campaignCount = 0;
        let keywordsGenerated = 0;
        
        try {
          const statsResult = await pool.query(`
            SELECT 
              COUNT(*) as campaign_count,
              COALESCE(SUM(keywords_count), 0) as keywords_generated
            FROM campaign_history 
            WHERE user_id = $1 
            AND created_at >= NOW() - INTERVAL '7 days'
          `, [user.id]);
          
          if (statsResult.rows.length > 0) {
            campaignCount = parseInt(statsResult.rows[0].campaign_count) || 0;
            keywordsGenerated = parseInt(statsResult.rows[0].keywords_generated) || 0;
          }
        } catch (statsErr) {
          console.log(`[Cron] Stats query failed for user ${user.email}, using defaults`);
        }
        
        await sendEmail({
          to: user.email,
          subject: 'Your Weekly Adiology Activity Summary',
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #7c3aed;">Weekly Activity Summary</h1>
              <p>Hi ${user.full_name || 'there'},</p>
              <p>Here's your activity summary for the past week:</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Campaigns Created:</strong> ${campaignCount}</p>
                <p style="margin: 10px 0 0;"><strong>Keywords Generated:</strong> ${keywordsGenerated.toLocaleString()}</p>
                <p style="margin: 10px 0 0;"><strong>Plan:</strong> ${user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1)}</p>
              </div>
              <p>Keep building great campaigns!</p>
              <p>Best regards,<br>The Adiology Team</p>
            </div>
          `,
          tag: 'weekly-report'
        });
        
        console.log(`[Cron] Sent weekly report to ${user.email}`);
      } catch (userErr) {
        console.error(`[Cron] Failed to send report to ${user.email}:`, userErr);
      }
    }
    
    console.log('[Cron] Daily reports completed');
  } catch (err) {
    console.error('[Cron] Daily reports error:', err);
    throw err;
  }
}
