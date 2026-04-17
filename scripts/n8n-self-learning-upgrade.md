# Обновление воркфлоу AI-targetolog: Самообучающийся цикл

## Инструкция по применению
Для каждой ноды ниже:
1. Откройте воркфлоу в n8n: https://n8n.zapoinov.com/workflow/gWCLC3k70FXfOABK
2. Найдите указанную ноду (или создайте новую)
3. Замените/вставьте код
4. Сохраните воркфлоу

---

## НОДА 1: Ensure Tables (обновление SQL)

**Действие**: Заменить SQL-запрос в ноде `Ensure Tables`

```sql
-- Ensure scoring_rules has all needed columns
ALTER TABLE scoring_rules
ADD COLUMN IF NOT EXISTS field text DEFAULT 'utm_source',
ADD COLUMN IF NOT EXISTS operator text DEFAULT 'equals',
ADD COLUMN IF NOT EXISTS value text DEFAULT '',
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Ensure scoring_insights has all needed columns
ALTER TABLE scoring_insights
ADD COLUMN IF NOT EXISTS suggested_field text,
ADD COLUMN IF NOT EXISTS suggested_operator text,
ADD COLUMN IF NOT EXISTS suggested_value text,
ADD COLUMN IF NOT EXISTS recommended_points integer,
ADD COLUMN IF NOT EXISTS impact_percent integer,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- ═══ НОВОЕ: Ensure campaign_learnings exists ═══
CREATE TABLE IF NOT EXISTS campaign_learnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  client_config_id UUID,
  fb_campaign_id TEXT,
  fb_adset_id TEXT,
  fb_ad_id TEXT,
  campaign_name TEXT,
  adset_name TEXT,
  ad_name TEXT,
  ad_text TEXT,
  headline TEXT,
  targeting_json JSONB DEFAULT '{}',
  ice_breakers JSONB DEFAULT '[]',
  welcome_message TEXT,
  media_type TEXT,
  total_spend NUMERIC DEFAULT 0,
  total_leads INT DEFAULT 0,
  avg_cpl NUMERIC DEFAULT 0,
  quality_score INT DEFAULT 0,
  score_label TEXT DEFAULT 'NEW',
  depth_3_rate NUMERIC DEFAULT 0,
  depth_2_rate NUMERIC DEFAULT 0,
  reply_rate NUMERIC DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpm NUMERIC DEFAULT 0,
  impressions INT DEFAULT 0,
  days_active INT DEFAULT 0,
  is_winner BOOLEAN DEFAULT false,
  is_paused BOOLEAN DEFAULT false,
  pause_reason TEXT,
  lesson_learned TEXT,
  score_trend TEXT DEFAULT 'stable',
  cpl_trend TEXT DEFAULT 'stable',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cl_project ON campaign_learnings(project_id);
CREATE INDEX IF NOT EXISTS idx_cl_winner ON campaign_learnings(is_winner) WHERE is_winner = true;
CREATE INDEX IF NOT EXISTS idx_cl_score ON campaign_learnings(quality_score DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cl_unique_ad ON campaign_learnings(fb_ad_id) WHERE fb_ad_id IS NOT NULL;

-- Insert default scoring rules for WhatsApp depth
INSERT INTO scoring_rules (project_id, criteria_name, field, operator, value, points, is_active)
SELECT 'fc323674-bde1-41f9-836b-43043ab10924', criteria_name, field, operator, value, points, true
FROM (VALUES
  ('Источник Facebook Ads', 'utm_source', 'equals', 'facebook_ads', 10),
  ('Глубокая переписка (score > 70)', 'lead_score', 'greater_than', '70', 30),
  ('Средняя вовлечённость (score > 50)', 'lead_score', 'greater_than', '50', 20),
  ('Низкое качество (score < 30)', 'lead_score', 'less_than', '30', -20),
  ('Телефон заполнен', 'phone', 'is_not_empty', '', 15),
  ('Крупная сделка (> 50000 тг)', 'deal_amount', 'greater_than', '50000', 25)
) AS t(criteria_name, field, operator, value, points)
WHERE NOT EXISTS (
  SELECT 1 FROM scoring_rules WHERE project_id = 'fc323674-bde1-41f9-836b-43043ab10924'
  AND criteria_name = t.criteria_name
);

-- Return a row so n8n continues the chain
SELECT 1 as ok;
```

---

## НОДА 2: Fetch Lead Quality (обновление JavaScript)

**Действие**: Заменить весь код в ноде `Fetch Lead Quality`
**Что изменено**: Добавлен UPSERT в `campaign_learnings` + тренд-анализ за 7 дней

```javascript
// Fetch Lead Quality v4 — с записью в campaign_learnings
const account = $('Split In Batches').first().json;
const ACCESS_TOKEN = account.fbToken;
const AD_ACCOUNT   = account.accountId;
const CLIENT_NAME  = account.name;

const SUPABASE_URL = 'https://iywmjdrghcbsicdwohmb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5d21qZHJnaGNic2ljZHdvaG1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgwOTQ3NywiZXhwIjoyMDg4Mzg1NDc3fQ.0ewZ5-bN3iPAClMH-BXjQTV8VlZoDmaxRDpCubEw57k';
const authParam = `apikey=${SUPABASE_KEY}`;
const headers = { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

// Получить project_id и client_config_id из clients_config
let PROJECT_ID = null;
let CLIENT_CONFIG_ID = null;
try {
  const cfgResp = await this.helpers.httpRequest({
    method: 'GET',
    url: `${SUPABASE_URL}/rest/v1/clients_config?ad_account_id=eq.${AD_ACCOUNT}&limit=1&${authParam}`,
    headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  if (cfgResp?.length > 0) {
    PROJECT_ID = cfgResp[0].project_id;
    CLIENT_CONFIG_ID = cfgResp[0].id;
  }
} catch(e) {}

let qualityData = [];
let leadsCreated = 0, leadsUpdated = 0;
let learningsUpserted = 0;

try {
  const mode = (() => { try { return $('Detect Mode').first().json.mode; } catch(e) { return 'midday'; } })();
  const datePr = (mode === 'morning') ? 'yesterday' : 'today';

  // 1. FB Insights (сегодня/вчера)
  const insResp = await this.helpers.httpRequest({
    method: 'GET',
    url: `https://graph.facebook.com/v22.0/${AD_ACCOUNT}/insights?` +
      `fields=campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,clicks,ctr,cpm,` +
      `actions,cost_per_action_type&date_preset=${datePr}&level=ad&limit=200&access_token=${ACCESS_TOKEN}`,
  });
  const insights = insResp?.data || [];

  // 2. 7-day trending
  const resp7d = await this.helpers.httpRequest({
    method: 'GET',
    url: `https://graph.facebook.com/v22.0/${AD_ACCOUNT}/insights?` +
      `fields=campaign_id,ad_id,ad_name,spend,impressions,clicks,ctr,cpm,actions,cost_per_action_type&date_preset=last_7d&level=ad&limit=200&access_token=${ACCESS_TOKEN}`,
  });
  const weeklyMap = {};
  for (const r of (resp7d?.data || [])) weeklyMap[r.ad_id] = r;

  // 3. Загрузить существующие campaign_learnings для тренд-анализа
  let existingLearnings = {};
  try {
    const clResp = await this.helpers.httpRequest({
      method: 'GET',
      url: `${SUPABASE_URL}/rest/v1/campaign_learnings?project_id=eq.${PROJECT_ID}&select=fb_ad_id,quality_score,avg_cpl,days_active,total_spend,total_leads&${authParam}`,
      headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` },
    });
    for (const cl of (clResp || [])) {
      if (cl.fb_ad_id) existingLearnings[cl.fb_ad_id] = cl;
    }
  } catch(e) {}

  for (const row of insights) {
    const fullName = (row.campaign_name || '') + ' ' + (row.ad_name || '');
    if (!fullName.includes('AI')) continue;

    const actions = row.actions || [];
    let convStarted = 0, firstReply = 0, depth2 = 0, depth3 = 0, totalConnect = 0;
    for (const a of actions) {
      if      (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') convStarted  = +a.value;
      else if (a.action_type === 'onsite_conversion.messaging_first_reply')             firstReply   = +a.value;
      else if (a.action_type === 'onsite_conversion.messaging_user_depth_2_message_send') depth2     = +a.value;
      else if (a.action_type === 'onsite_conversion.messaging_user_depth_3_message_send') depth3     = +a.value;
      else if (a.action_type === 'onsite_conversion.total_messaging_connection')         totalConnect = +a.value;
    }

    // Недельные данные
    const week = weeklyMap[row.ad_id];
    let w_conv = 0, w_d2 = 0, w_d3 = 0, w_spend = 0, w_leads = 0;
    if (week?.actions) {
      for (const a of week.actions) {
        if      (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') w_conv = +a.value;
        else if (a.action_type === 'onsite_conversion.messaging_user_depth_2_message_send') w_d2 = +a.value;
        else if (a.action_type === 'onsite_conversion.messaging_user_depth_3_message_send') w_d3 = +a.value;
      }
      w_spend = parseFloat(week.spend || 0);
      w_leads = w_conv;
    }

    let costPerConv = 0;
    for (const ca of (row.cost_per_action_type || []))
      if (ca.action_type === 'onsite_conversion.messaging_conversation_started_7d')
        costPerConv = parseFloat(ca.value || 0);

    const leads = convStarted || totalConnect;
    if (leads === 0) continue;

    const spend        = parseFloat(row.spend || 0);
    const replyRate    = leads > 0 ? firstReply / leads : 0;
    const depth2Rate   = leads > 0 ? depth2    / leads : 0;
    const depth3Rate   = leads > 0 ? depth3    / leads : 0;

    // ═══ SCORING 0-100 ═══
    let score = 0;
    score += Math.round(replyRate  * 25);
    score += Math.round(depth2Rate * 25);
    score += Math.round(depth3Rate * 30);
    if      (costPerConv > 0 && costPerConv < 1.5) score += 10;
    else if (costPerConv > 0 && costPerConv < 3)   score += 7;
    else if (costPerConv > 0 && costPerConv < 5)   score += 3;
    if      (leads >= 10) score += 10;
    else if (leads >= 5)  score += 6;
    else if (leads >= 3)  score += 3;
    score = Math.min(100, Math.max(0, score));

    const spamFlag   = (depth3 === 0 && leads >= 3 && replyRate < 0.2);
    const scoreLabel = spamFlag ? 'spam' : (score >= 80 ? 'hot' : (score >= 50 ? 'warm' : 'new'));

    // ═══ ТРЕНД-АНАЛИЗ ═══
    const prev = existingLearnings[row.ad_id];
    let scoreTrend = 'stable';
    let cplTrend = 'stable';
    if (prev) {
      if (score > prev.quality_score + 5) scoreTrend = 'improving';
      else if (score < prev.quality_score - 10) scoreTrend = 'degrading';

      const prevCpl = parseFloat(prev.avg_cpl || 0);
      if (costPerConv > 0 && prevCpl > 0) {
        if (costPerConv < prevCpl * 0.8) cplTrend = 'improving';
        else if (costPerConv > prevCpl * 1.3) cplTrend = 'degrading';
      }
    }

    qualityData.push({
      campaign_id: row.campaign_id, campaign_name: row.campaign_name,
      adset_id: row.adset_id, adset_name: row.adset_name,
      ad_id: row.ad_id, ad_name: row.ad_name,
      spend, leads, first_reply: firstReply,
      depth_2: depth2, depth_3: depth3,
      reply_rate_pct:   Math.round(replyRate  * 100),
      depth_2_rate_pct: Math.round(depth2Rate * 100),
      depth_3_rate_pct: Math.round(depth3Rate * 100),
      cost_per_conv: costPerConv,
      score, score_label: scoreLabel,
      score_trend: scoreTrend, cpl_trend: cplTrend,
      w_depth_2_rate_pct: w_conv > 0 ? Math.round(w_d2 / w_conv * 100) : 0,
      w_depth_3_rate_pct: w_conv > 0 ? Math.round(w_d3 / w_conv * 100) : 0,
      w_conversations: w_conv,
      w_spend, w_leads,
    });

    // ═══ UPSERT в leads_crm ═══
    const today      = new Date().toISOString().slice(0, 10);
    const externalId = `fb_${row.ad_id}_${today}`;
    const leadData   = {
      project_id: PROJECT_ID, client_config_id: CLIENT_CONFIG_ID,
      name:   `${row.ad_name} (${leads} лидов за ${today})`,
      phone:  '', status: scoreLabel === 'hot' ? 'Горячий лид' : 'Новый',
      source: 'facebook_ads', utm_campaign: row.campaign_name,
      ai_score: score,
      ai_summary: `Лидов: ${leads} | Ответы: ${Math.round(replyRate*100)}% | Диалог 3+: ${Math.round(depth3Rate*100)}% | CPL: ${costPerConv.toFixed(2)}$`,
      service_category: 'facebook_ai_ad',
      external_lead_id: externalId,
      fb_campaign_id:   row.campaign_id, fb_adset_id: row.adset_id,
      fb_ad_id:         row.ad_id,       fb_ad_account_id: AD_ACCOUNT,
      score_label:      scoreLabel,      lead_score: String(score),
      extra_data: {
        conversations_started: leads, first_reply: firstReply,
        depth_2: depth2, depth_3: depth3,
        reply_rate_pct:   Math.round(replyRate  * 100),
        depth_2_rate_pct: Math.round(depth2Rate * 100),
        depth_3_rate_pct: Math.round(depth3Rate * 100),
        cost_per_conversation: costPerConv,
        impressions: parseInt(row.impressions || 0),
        ctr: parseFloat(row.ctr || 0), cpm: parseFloat(row.cpm || 0),
        spend, clinic_name: CLIENT_NAME,
        w_depth_2_rate_pct: w_conv > 0 ? Math.round(w_d2 / w_conv * 100) : 0,
        w_depth_3_rate_pct: w_conv > 0 ? Math.round(w_d3 / w_conv * 100) : 0,
      },
      updated_at: new Date().toISOString(),
    };

    try {
      const existing = await this.helpers.httpRequest({
        method: 'GET',
        url: `${SUPABASE_URL}/rest/v1/leads_crm?external_lead_id=eq.${externalId}&select=id&limit=1&${authParam}`,
        headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` },
      });
      if (existing?.length > 0) {
        await this.helpers.httpRequest({
          method: 'PATCH',
          url: `${SUPABASE_URL}/rest/v1/leads_crm?id=eq.${existing[0].id}&${authParam}`,
          headers, body: leadData, json: true,
        });
        leadsUpdated++;
      } else {
        leadData.created_at = new Date().toISOString();
        await this.helpers.httpRequest({
          method: 'POST',
          url: `${SUPABASE_URL}/rest/v1/leads_crm?${authParam}`,
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: leadData, json: true,
        });
        leadsCreated++;
      }
    } catch(e) {}

    // ═══ НОВОЕ: UPSERT в campaign_learnings ═══
    const isWinner = score >= 75 && costPerConv > 0 && costPerConv < 3;
    const daysActive = prev ? (prev.days_active || 0) + 1 : 1;
    const totalSpend = prev ? parseFloat(prev.total_spend || 0) + spend : (w_spend || spend);
    const totalLeads = prev ? parseInt(prev.total_leads || 0) + leads : (w_leads || leads);

    const learningData = {
      project_id: PROJECT_ID,
      client_config_id: CLIENT_CONFIG_ID,
      fb_campaign_id: row.campaign_id,
      fb_adset_id: row.adset_id,
      fb_ad_id: row.ad_id,
      campaign_name: row.campaign_name,
      adset_name: row.adset_name || '',
      ad_name: row.ad_name,
      media_type: row.ad_name?.includes('VIDEO') ? 'VIDEO' :
                  row.ad_name?.includes('CAROUSEL') ? 'CAROUSEL' : 'PHOTO',
      total_spend: totalSpend,
      total_leads: totalLeads,
      avg_cpl: totalLeads > 0 ? parseFloat((totalSpend / totalLeads).toFixed(2)) : 0,
      quality_score: score,
      score_label: scoreLabel,
      depth_3_rate: Math.round(depth3Rate * 100),
      depth_2_rate: Math.round(depth2Rate * 100),
      reply_rate: Math.round(replyRate * 100),
      ctr: parseFloat(row.ctr || 0),
      cpm: parseFloat(row.cpm || 0),
      impressions: parseInt(row.impressions || 0),
      days_active: daysActive,
      is_winner: isWinner,
      is_paused: false,
      score_trend: scoreTrend,
      cpl_trend: cplTrend,
      updated_at: new Date().toISOString(),
    };

    try {
      const existCl = await this.helpers.httpRequest({
        method: 'GET',
        url: `${SUPABASE_URL}/rest/v1/campaign_learnings?fb_ad_id=eq.${row.ad_id}&select=id&limit=1&${authParam}`,
        headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` },
      });
      if (existCl?.length > 0) {
        await this.helpers.httpRequest({
          method: 'PATCH',
          url: `${SUPABASE_URL}/rest/v1/campaign_learnings?id=eq.${existCl[0].id}&${authParam}`,
          headers, body: learningData, json: true,
        });
      } else {
        learningData.created_at = new Date().toISOString();
        await this.helpers.httpRequest({
          method: 'POST',
          url: `${SUPABASE_URL}/rest/v1/campaign_learnings?${authParam}`,
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: learningData, json: true,
        });
      }
      learningsUpserted++;
    } catch(e) {}
  }

  // ═══ SCORING INSIGHTS ═══
  const avgScore = qualityData.length > 0 ? Math.round(qualityData.reduce((s,q)=>s+q.score,0)/qualityData.length) : 0;
  const hotAds   = qualityData.filter(q => q.score >= 80);
  const spamAds  = qualityData.filter(q => q.score_label === 'spam');
  const trendDn  = qualityData.filter(q => q.w_depth_3_rate_pct > 0 && q.depth_3_rate_pct < q.w_depth_3_rate_pct * 0.5);
  const degrading = qualityData.filter(q => q.score_trend === 'degrading');

  const toSave = [];
  if (avgScore < 50 && qualityData.length > 0)
    toSave.push({ project_id: PROJECT_ID, insight_text: `Среднее качество НИЗКОЕ (${avgScore}/100). Пересмотрите таргетинг или креатив.`, recommendation_type: 'targeting', impact_percent: 70, status: 'pending' });
  if (hotAds.length > 0) {
    const best = hotAds.sort((a,b)=>b.score-a.score)[0];
    toSave.push({ project_id: PROJECT_ID, insight_text: `"${best.ad_name}" — ОТЛИЧНОЕ качество (${best.score}/100): ${best.depth_3_rate_pct}% ведут глубокий диалог. Увеличьте бюджет.`, recommendation_type: 'budget', impact_percent: 85, status: 'pending', suggested_field: 'fb_ad_id', suggested_value: best.ad_id });
  }
  if (spamAds.length > 0)
    toSave.push({ project_id: PROJECT_ID, insight_text: `${spamAds.length} объявлений со спам-трафиком: нет диалога. Рекомендуется пауза.`, recommendation_type: 'creative', impact_percent: 60, status: 'pending' });
  if (trendDn.length > 0)
    toSave.push({ project_id: PROJECT_ID, insight_text: `${trendDn.length} объявлений теряют качество (падение глубины диалога >50%). Возможно выгорание аудитории.`, recommendation_type: 'audience', impact_percent: 65, status: 'pending' });
  // НОВОЕ: инсайт по деградации тренда
  if (degrading.length > 0)
    toSave.push({ project_id: PROJECT_ID, insight_text: `${degrading.length} объявлений с ухудшающимся трендом качества. Нужна ротация креативов.`, recommendation_type: 'creative', impact_percent: 75, status: 'pending' });

  for (const ins of toSave) {
    try {
      await this.helpers.httpRequest({
        method: 'POST', url: `${SUPABASE_URL}/rest/v1/scoring_insights?${authParam}`,
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: ins, json: true,
      });
    } catch(e) {}
  }

} catch(e) {}

const total = qualityData.length;
const hot   = qualityData.filter(q => q.score >= 80).length;
const warm  = qualityData.filter(q => q.score >= 50 && q.score < 80).length;
const spam  = qualityData.filter(q => q.score_label === 'spam').length;
const totalConvs = qualityData.reduce((s,q) => s+q.leads, 0);
const avgScoreFinal = total > 0 ? Math.round(qualityData.reduce((s,q)=>s+q.score,0)/total) : 0;
const improving = qualityData.filter(q => q.score_trend === 'improving').length;
const degradingCount = qualityData.filter(q => q.score_trend === 'degrading').length;

return [{ json: {
  qualityData,
  qualityStats: {
    total_ads: total, hot, warm, spam, cold: total-hot-warm-spam,
    avg_score: avgScoreFinal,
    total_conversations: totalConvs,
    total_depth_2: qualityData.reduce((s,q)=>s+q.depth_2, 0),
    total_depth_3: qualityData.reduce((s,q)=>s+q.depth_3, 0),
    total_replies: qualityData.reduce((s,q)=>s+q.first_reply, 0),
    reply_rate_pct:   totalConvs>0 ? Math.round(qualityData.reduce((s,q)=>s+q.first_reply,0)/totalConvs*100) : 0,
    depth_2_rate_pct: totalConvs>0 ? Math.round(qualityData.reduce((s,q)=>s+q.depth_2,0)/totalConvs*100) : 0,
    depth_3_rate_pct: totalConvs>0 ? Math.round(qualityData.reduce((s,q)=>s+q.depth_3,0)/totalConvs*100) : 0,
    leads_created: leadsCreated, leads_updated: leadsUpdated,
    learnings_upserted: learningsUpserted,
    trends: { improving, degrading: degradingCount, stable: total - improving - degradingCount },
  }
}}];
```

---

## НОДА 3: Auto-Pause (обновление JavaScript)

**Действие**: Заменить весь код в ноде `Auto-Pause`
**Что изменено**: Добавлена запись причины паузы в campaign_learnings + lesson extraction

```javascript
const item = $input.first().json;
const { campaigns = [], fbToken, accountId, mode } = item;

const SUPABASE_URL = 'https://iywmjdrghcbsicdwohmb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5d21qZHJnaGNic2ljZHdvaG1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgwOTQ3NywiZXhwIjoyMDg4Mzg1NDc3fQ.0ewZ5-bN3iPAClMH-BXjQTV8VlZoDmaxRDpCubEw57k';
const authParam = `apikey=${SUPABASE_KEY}`;
const headers = { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

// Утро: без оптимизации
if (mode === 'morning') {
  return { json: { ...item, autoActions: [], autoActionsText: '', regeneration: '', lessonLearned: '' } };
}

// ═══ ПОРОГИ ═══
const MAX_CPL = 3;
const MAX_SPEND_NO_LEAD = 4;
const MIN_QUALITY_SCORE = 50;
const QUALITY_SHIELD = 70;

// ═══ TODAY DATA ═══
let todayMap = {};
try {
  const todayResp = await this.helpers.httpRequest({
    method: 'GET',
    url: `https://graph.facebook.com/v22.0/${accountId}/insights`,
    qs: {
      fields: 'campaign_name,campaign_id,spend,actions,clicks',
      date_preset: 'today',
      level: 'campaign',
      limit: 200,
      access_token: fbToken,
    },
    json: true,
  });
  if (todayResp?.data) {
    for (const row of todayResp.data) {
      const cid = row.campaign_id;
      const spend = parseFloat(row.spend || '0');
      let leads = 0;
      if (row.actions) {
        for (const a of row.actions) {
          if (['onsite_conversion.lead_grouped','onsite_conversion.messaging_conversation_started_7d'].includes(a.action_type)) {
            leads += parseInt(a.value || '0', 10);
          }
        }
      }
      todayMap[cid] = { spend, leads, cpl: leads > 0 ? spend / leads : 0 };
    }
  }
} catch(e) {}

// ═══ ЧТЕНИЕ PENDING INSIGHTS (Фаза 4) ═══
let pendingInsights = [];
try {
  const insResp = await this.helpers.httpRequest({
    method: 'GET',
    url: `${SUPABASE_URL}/rest/v1/scoring_insights?status=eq.pending&order=created_at.desc&limit=10&${authParam}`,
    headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  pendingInsights = insResp || [];
} catch(e) {}

const actions = [];
const scenarios = { ok: 0, degradation: 0, vampires: 0, junk: 0 };
const pausedCampaigns = [];
const activeCampaigns = [];

for (const camp of campaigns) {
  const name = camp.campaign_name || '';
  if (!name.toLowerCase().includes('ai')) continue;

  const { campaign_id, spend = 0, leads = 0, cpl = 0, score = 0 } = camp;
  const today = todayMap[campaign_id] || { spend: 0, leads: 0, cpl: 0 };

  let pauseReason = '';
  let scenario = '';

  if (leads > 0 && score > 0 && score < MIN_QUALITY_SCORE) {
    pauseReason = `Низкое качество лидов (${score}/100)`;
    scenario = 'junk';
  }
  else if (spend > MAX_SPEND_NO_LEAD && leads === 0) {
    pauseReason = `${spend.toFixed(2)}$ за 2 дня, 0 лидов`;
    scenario = 'vampires';
  }
  else if (today.spend > 5 && today.leads === 0) {
    pauseReason = `Сегодня ${today.spend.toFixed(2)}$ и 0 лидов`;
    scenario = 'vampires';
  }
  else if (leads > 0 && cpl > MAX_CPL && score < QUALITY_SHIELD) {
    pauseReason = `CPL ${cpl.toFixed(2)}$ за 2 дня (лимит ${MAX_CPL}$)`;
    scenario = 'degradation';
  }
  else if (today.leads > 0 && today.cpl > 4 && !(cpl < 2 && score >= QUALITY_SHIELD)) {
    pauseReason = `Сегодня CPL ${today.cpl.toFixed(2)}$`;
    scenario = 'degradation';
  }
  else {
    scenarios.ok++;
    activeCampaigns.push(camp);
    continue;
  }

  if (pauseReason && scenario) {
    scenarios[scenario] = (scenarios[scenario] || 0) + 1;
    try {
      const resp = await this.helpers.httpRequest({
        method: 'POST',
        url: `https://graph.facebook.com/v22.0/${campaign_id}`,
        qs: { access_token: fbToken },
        body: { status: 'PAUSED' },
        json: true,
      });
      if (resp?.success === true) {
        actions.push(`СТОП "${name}" — ${pauseReason}`);
        pausedCampaigns.push({ name, reason: pauseReason, scenario, score, cpl, leads });

        // ═══ НОВОЕ: Обновить campaign_learnings — пометить как paused ═══
        try {
          await this.helpers.httpRequest({
            method: 'PATCH',
            url: `${SUPABASE_URL}/rest/v1/campaign_learnings?fb_campaign_id=eq.${campaign_id}&${authParam}`,
            headers,
            body: { is_paused: true, pause_reason: pauseReason, updated_at: new Date().toISOString() },
            json: true,
          });
        } catch(e) {}
      } else {
        actions.push(`Ошибка: "${name}" — ${JSON.stringify(resp).substring(0, 100)}`);
      }
    } catch(e) {
      actions.push(`Ошибка: "${name}" — ${e.message?.substring(0, 120)}`);
    }
  }
}

// ═══ РЕГЕНЕРАЦИЯ ═══
const aiCamps = campaigns.filter(c => (c.campaign_name || '').toLowerCase().includes('ai'));
const bestCamps = aiCamps
  .filter(c => c.leads > 0 && c.cpl > 0 && c.cpl <= MAX_CPL)
  .sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    return a.cpl - b.cpl;
  })
  .slice(0, 3);

let regeneration = '';
if (bestCamps.length > 0) {
  const lines = bestCamps.map(c => {
    const scoreText = c.score > 0 ? `, quality ${c.score}/100` : '';
    return `- "${c.campaign_name}" (CPL ${c.cpl.toFixed(2)}$, ${c.leads} лид${scoreText})`;
  });
  regeneration = [
    'Рекомендации по новым креативам:',
    'Лучшие кампании за 2 дня:',
    ...lines,
    '',
    'Создайте новые объявления в похожем стиле и тематике.',
  ].join('\n');
}

// ═══ НОВОЕ: AI LESSON EXTRACTION (Фаза 6) ═══
let lessonLearned = '';
if (pausedCampaigns.length > 0 || bestCamps.length > 0) {
  const pausedSummary = pausedCampaigns.map(p =>
    `"${p.name}": ${p.reason} (score=${p.score}, CPL=${p.cpl}$)`
  ).join('; ');

  const winnerSummary = bestCamps.map(c =>
    `"${c.campaign_name}": score=${c.score || 'N/A'}, CPL=${c.cpl?.toFixed(2)}$, leads=${c.leads}`
  ).join('; ');

  const patterns = [];

  // Анализ паттернов паузы
  const junkCount = pausedCampaigns.filter(p => p.scenario === 'junk').length;
  const vampCount = pausedCampaigns.filter(p => p.scenario === 'vampires').length;
  if (junkCount > 0) patterns.push(`${junkCount} кампаний дали спам-лиды (score <50) — нужен более жёсткий фильтр в тексте`);
  if (vampCount > 0) patterns.push(`${vampCount} кампаний слили бюджет без единого лида — проверить таргетинг и релевантность оффера`);

  // Анализ паттернов успеха
  if (bestCamps.length > 0) {
    const avgAge = bestCamps.filter(c => c.targeting?.age_min).map(c => c.targeting.age_min);
    const avgScore = Math.round(bestCamps.reduce((s,c) => s + (c.score || 0), 0) / bestCamps.length);
    patterns.push(`Лучшие кампании: средний score ${avgScore}/100`);
  }

  // Insights feedback
  if (pendingInsights.length > 0) {
    patterns.push(`Неприменённых рекомендаций: ${pendingInsights.length}`);
  }

  lessonLearned = [
    `УРОК ${new Date().toISOString().slice(0,10)}:`,
    pausedSummary ? `Остановлено: ${pausedSummary}` : '',
    winnerSummary ? `Лидеры: ${winnerSummary}` : '',
    patterns.length > 0 ? `Выводы: ${patterns.join('. ')}` : '',
  ].filter(Boolean).join('\n');

  // Записать урок в campaign_learnings для winners
  for (const best of bestCamps) {
    try {
      await this.helpers.httpRequest({
        method: 'PATCH',
        url: `${SUPABASE_URL}/rest/v1/campaign_learnings?fb_campaign_id=eq.${best.campaign_id}&${authParam}`,
        headers,
        body: { lesson_learned: lessonLearned, updated_at: new Date().toISOString() },
        json: true,
      });
    } catch(e) {}
  }

  // Пометить insights как applied
  for (const ins of pendingInsights) {
    try {
      await this.helpers.httpRequest({
        method: 'PATCH',
        url: `${SUPABASE_URL}/rest/v1/scoring_insights?id=eq.${ins.id}&${authParam}`,
        headers,
        body: { status: 'applied' },
        json: true,
      });
    } catch(e) {}
  }
}

const actionsText = actions.length ? 'Оптимизация:\n' + actions.join('\n') : '';
const summaryParts = [];
if (scenarios.vampires > 0) summaryParts.push(`${scenarios.vampires} без лидов`);
if (scenarios.degradation > 0) summaryParts.push(`${scenarios.degradation} дорогие`);
if (scenarios.junk > 0) summaryParts.push(`${scenarios.junk} низкое качество`);
const summary = summaryParts.length > 0
  ? `Отключено: ${actions.length} кампаний (${summaryParts.join(', ')})`
  : '';

return { json: { ...item, autoActions: actions, autoActionsText: actionsText, regeneration, summary, scenariosOk: scenarios.ok, lessonLearned, pendingInsightsCount: pendingInsights.length } };
```

---

## НОДА 4: НОВАЯ — Get Campaign Learnings (Code node)

**Действие**: Создать новую ноду `Code` с именем `Get Campaign Learnings`
**Подключение**: Вход от `Supabase — Get Client Config` -> `Get Campaign Learnings`
**Выход**: К merge-ноде перед AI Agent Креатор и AI Agent Таргетолог

```javascript
// Get Campaign Learnings — загрузка истории для AI агентов
const SUPABASE_URL = 'https://iywmjdrghcbsicdwohmb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5d21qZHJnaGNic2ljZHdvaG1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgwOTQ3NywiZXhwIjoyMDg4Mzg1NDc3fQ.0ewZ5-bN3iPAClMH-BXjQTV8VlZoDmaxRDpCubEw57k';
const authParam = `apikey=${SUPABASE_KEY}`;
const authHeaders = { 'Authorization': `Bearer ${SUPABASE_KEY}` };

let projectId = null;
try {
  projectId = $('Supabase — Get Client Config').first().json.clientConfig?.project_id
    || $('Switch').first().json.clientConfig?.project_id;
} catch(e) {}

let topWinners = [];
let worstPerformers = [];
let targetingInsights = {};
let pendingInsights = [];

if (projectId) {
  // ═══ ТОП-5 WINNERS (score >= 75, is_winner=true) ═══
  try {
    topWinners = await this.helpers.httpRequest({
      method: 'GET',
      url: `${SUPABASE_URL}/rest/v1/campaign_learnings?project_id=eq.${projectId}&is_winner=eq.true&order=quality_score.desc&limit=5&${authParam}`,
      headers: authHeaders,
    }) || [];
  } catch(e) {}

  // ═══ ТОП-5 WORST (score < 50, is_paused=true) ═══
  try {
    worstPerformers = await this.helpers.httpRequest({
      method: 'GET',
      url: `${SUPABASE_URL}/rest/v1/campaign_learnings?project_id=eq.${projectId}&quality_score=lt.50&is_paused=eq.true&order=quality_score.asc&limit=5&${authParam}`,
      headers: authHeaders,
    }) || [];
  } catch(e) {}

  // ═══ АГРЕГАЦИЯ ТАРГЕТИНГА ═══
  try {
    const allLearnings = await this.helpers.httpRequest({
      method: 'GET',
      url: `${SUPABASE_URL}/rest/v1/campaign_learnings?project_id=eq.${projectId}&total_leads=gt.0&order=quality_score.desc&limit=50&${authParam}`,
      headers: authHeaders,
    }) || [];

    // Средний score по media_type
    const byMedia = {};
    for (const cl of allLearnings) {
      const mt = cl.media_type || 'UNKNOWN';
      if (!byMedia[mt]) byMedia[mt] = { scores: [], cpls: [], count: 0 };
      byMedia[mt].scores.push(cl.quality_score || 0);
      byMedia[mt].cpls.push(cl.avg_cpl || 0);
      byMedia[mt].count++;
    }
    const mediaStats = {};
    for (const [mt, data] of Object.entries(byMedia)) {
      mediaStats[mt] = {
        avg_score: Math.round(data.scores.reduce((a,b) => a+b, 0) / data.scores.length),
        avg_cpl: parseFloat((data.cpls.reduce((a,b) => a+b, 0) / data.cpls.length).toFixed(2)),
        count: data.count,
      };
    }

    // Лучший media_type
    const bestMedia = Object.entries(mediaStats)
      .sort(([,a], [,b]) => b.avg_score - a.avg_score)[0];

    // Общие паттерны winners
    const winners = allLearnings.filter(cl => cl.is_winner);
    const winnerTargeting = winners
      .filter(cl => cl.targeting_json && Object.keys(cl.targeting_json).length > 0)
      .map(cl => cl.targeting_json);

    targetingInsights = {
      mediaStats,
      bestMediaType: bestMedia ? bestMedia[0] : 'PHOTO',
      totalCampaignsAnalyzed: allLearnings.length,
      winnersCount: winners.length,
      avgWinnerScore: winners.length > 0
        ? Math.round(winners.reduce((s,w) => s + w.quality_score, 0) / winners.length)
        : 0,
      winnerTargetingPatterns: winnerTargeting.slice(0, 3),
    };
  } catch(e) {}

  // ═══ PENDING INSIGHTS ═══
  try {
    pendingInsights = await this.helpers.httpRequest({
      method: 'GET',
      url: `${SUPABASE_URL}/rest/v1/scoring_insights?project_id=eq.${projectId}&status=eq.pending&order=created_at.desc&limit=10&${authParam}`,
      headers: authHeaders,
    }) || [];
  } catch(e) {}
}

// ═══ ФОРМАТИРОВАНИЕ ДЛЯ ПРОМПТОВ ═══

// Для Креатора: топ тексты
const winnerTextsForCreator = topWinners.map(w => ({
  ad_text: w.ad_text || 'N/A',
  headline: w.headline || 'N/A',
  score: w.quality_score,
  cpl: w.avg_cpl,
  depth_3_rate: w.depth_3_rate,
  lesson: w.lesson_learned || '',
}));

const worstTextsForCreator = worstPerformers.map(w => ({
  ad_text: w.ad_text || 'N/A',
  headline: w.headline || 'N/A',
  score: w.quality_score,
  pause_reason: w.pause_reason || 'N/A',
}));

// Для Таргетолога: таргетинг insights
const insightsForTargetolog = pendingInsights.map(i => i.insight_text).join('\n- ');

return [{ json: {
  learnings: {
    topWinners: winnerTextsForCreator,
    worstPerformers: worstTextsForCreator,
    targetingInsights,
    pendingInsights: insightsForTargetolog,
    pendingInsightsRaw: pendingInsights,
    summary: {
      totalWinners: topWinners.length,
      totalPaused: worstPerformers.length,
      bestMediaType: targetingInsights.bestMediaType || 'PHOTO',
      avgWinnerScore: targetingInsights.avgWinnerScore || 0,
    }
  }
}}];
```

---

## НОДА 5: AI Agent Креатор — обновление system prompt

**Действие**: В ноде `AI Agent Креатор` добавить в КОНЕЦ системного промпта следующий блок.
**Также**: Обновить User Prompt для передачи learnings.

### Добавить в конец system prompt:

```
───────────────────────────────
ОБУЧЕНИЕ НА ПРОШЛЫХ КАМПАНИЯХ (SELF-LEARNING):

Ты ОБЯЗАН учитывать данные из прошлых кампаний при написании нового текста.

ПРАВИЛА ОБУЧЕНИЯ:
1. Если есть winning ads (score >= 75) — вдохновляйся их структурой, стилем хука и офферов. НЕ копируй текст, создавай новые вариации победных формул.
2. Если есть worst ads (score < 50) — анализируй их ошибки и ИЗБЕГАЙ похожих паттернов (слишком общие обещания, слабый хук, отсутствие фильтра).
3. Если нет данных — пиши как обычно, это первый запуск.
4. Учитывай уроки (lesson_learned) — они содержат выводы из прошлых оптимизаций.

Чем выше depth_3_rate у winning ads — тем лучше их текст вовлекает в диалог. Стремись к такому же эффекту.
```

### Обновить User Prompt (заменить полностью):

```
={{ (() => {
  const caption = $json.message?.caption || $json.message?.text || $json.text || "Проанализируй прикрепленный файл";

  let learningsBlock = '';
  try {
    const l = $('Get Campaign Learnings').first()?.json?.learnings;
    if (l && l.topWinners?.length > 0) {
      learningsBlock += '\n\n───── ДАННЫЕ ОБУЧЕНИЯ ─────\n';
      learningsBlock += 'ТОП WINNING ADS (score >= 75, лучший CPL):\n';
      for (const w of l.topWinners.slice(0, 3)) {
        learningsBlock += `- Score: ${w.score}/100, CPL: ${w.cpl}$, Depth3: ${w.depth_3_rate}%\n`;
        learningsBlock += `  Текст: "${(w.ad_text || '').substring(0, 200)}"\n`;
        if (w.lesson) learningsBlock += `  Урок: ${w.lesson.substring(0, 150)}\n`;
      }
    }
    if (l && l.worstPerformers?.length > 0) {
      learningsBlock += '\nWORST ADS (score < 50, остановлены):\n';
      for (const w of l.worstPerformers.slice(0, 3)) {
        learningsBlock += `- Score: ${w.score}/100, Причина: ${w.pause_reason}\n`;
        learningsBlock += `  Текст: "${(w.ad_text || '').substring(0, 200)}"\n`;
      }
    }
    if (l?.summary?.bestMediaType) {
      learningsBlock += `\nЛучший формат по качеству: ${l.summary.bestMediaType}\n`;
    }
  } catch(e) {}

  return caption + learningsBlock;
})() }}
```

---

## НОДА 6: AI Agent Таргетолог — обновление user prompt

**Действие**: В ноде `AI Agent Таргетолог` заменить секцию `ИСТОРИЧЕСКАЯ АНАЛИТИКА И КАЧЕСТВО ЛИДОВ` в User Prompt.

### Заменить секцию (найти и заменить от `📊 ИСТОРИЧЕСКАЯ АНАЛИТИКА` до следующего `───────`):

```
📊 ИСТОРИЧЕСКАЯ АНАЛИТИКА И SELF-LEARNING:

Цель: quality score минимум 70/100.

═══ ДАННЫЕ ОБУЧЕНИЯ ИЗ campaign_learnings: ═══
{{ (() => {
  try {
    const l = $('Get Campaign Learnings').first()?.json?.learnings;
    if (!l) return 'Нет данных по обучению — это первый запуск.';

    let result = '';

    // Текущие лучшие кампании из clientConfig
    const cfg = $json.clientConfig || {};
    const topCampaigns = cfg.top_quality_campaigns || [];
    if (topCampaigns.length > 0) {
      result += 'Текущие лучшие кампании:\n';
      result += topCampaigns.map(c =>
        '- "' + c.name + '": score ' + c.score + '/100, CPL ' + c.cpl + '$, лидов ' + c.leads
      ).join('\n') + '\n\n';
    }

    // Targeting insights
    const ti = l.targetingInsights;
    if (ti && ti.mediaStats) {
      result += 'Статистика по типу медиа:\n';
      for (const [mt, stats] of Object.entries(ti.mediaStats)) {
        result += `- ${mt}: avg score=${stats.avg_score}, avg CPL=${stats.avg_cpl}$, кампаний=${stats.count}\n`;
      }
      result += `Лучший формат: ${ti.bestMediaType}\n`;
      result += `Всего проанализировано: ${ti.totalCampaignsAnalyzed} кампаний, из них winners: ${ti.winnersCount}\n\n`;
    }

    // Winners info
    if (l.topWinners?.length > 0) {
      result += 'Паттерны победителей (score >= 75):\n';
      for (const w of l.topWinners.slice(0, 3)) {
        result += `- Score ${w.score}/100, CPL ${w.cpl}$, depth3 ${w.depth_3_rate}%\n`;
        if (w.lesson) result += `  Урок: ${w.lesson.substring(0, 200)}\n`;
      }
      result += '\n';
    }

    // Pending insights
    if (l.pendingInsights) {
      result += 'Нерешённые рекомендации:\n- ' + l.pendingInsights + '\n\n';
    }

    // Worst performers (для избежания)
    if (l.worstPerformers?.length > 0) {
      result += 'Худшие кампании (ИЗБЕГАЙ похожих настроек):\n';
      for (const w of l.worstPerformers.slice(0, 3)) {
        result += `- Score ${w.score}/100: ${w.pause_reason}\n`;
      }
    }

    return result || 'Нет данных — это первый запуск.';
  } catch(e) { return 'Нет данных по скорингу.'; }
})() }}

═══ ПРАВИЛА SELF-LEARNING ОПТИМИЗАЦИИ: ═══
- Если avg score winners > 75 → используй похожие возрастные диапазоны
- Если VIDEO показывает score > PHOTO на 15+ → предпочитай VIDEO формат
- Если есть winner с depth_3_rate > 40% → используй похожую структуру iceBreakers
- Если score < 50 или CPL высокий → сузь возраст (min 28-30), усиль фильтрующие фразы
- Если видишь тренд "degrading" → нужна ротация: другой хук, другой оффер
- Стратегия META: широкий интерес, фильтрация через СМЫСЛ ТЕКСТА и возраст
```

---

## НОДА 7: НОВАЯ — Save Ad Creative to Learnings (Code node)

**Действие**: Создать новую ноду `Code` с именем `Save Ad Creative`
**Подключение**: После `Create Ad` (когда кампания создана) — сохраняем текст и таргетинг в campaign_learnings для будущего обучения

```javascript
// Save Ad Creative to campaign_learnings — записываем текст и таргетинг при создании
const SUPABASE_URL = 'https://iywmjdrghcbsicdwohmb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5d21qZHJnaGNic2ljZHdvaG1iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgwOTQ3NywiZXhwIjoyMDg4Mzg1NDc3fQ.0ewZ5-bN3iPAClMH-BXjQTV8VlZoDmaxRDpCubEw57k';
const authParam = `apikey=${SUPABASE_KEY}`;
const headers = { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };

// Получить данные AI-ответа (из Таргетолога)
let aiResponse = {};
try {
  const raw = $('AI Agent Таргетолог').first()?.json?.output;
  if (typeof raw === 'string') {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    aiResponse = JSON.parse(cleaned);
  } else if (typeof raw === 'object') {
    aiResponse = raw;
  }
} catch(e) {}

// Получить ID кампании из предыдущих нод
let campaignId = '';
let adsetId = '';
let adId = '';
try { campaignId = $('Extract Campaign ID').first()?.json?.campaignId || ''; } catch(e) {}
try { adsetId = $('Extract AdSet ID').first()?.json?.adsetId || $('Extract AdSet ID1').first()?.json?.adsetId || ''; } catch(e) {}

let projectId = null;
let clientConfigId = null;
try {
  const cfg = $('Switch').first().json.clientConfig || {};
  projectId = cfg.project_id;
  clientConfigId = cfg.id;
} catch(e) {}

if (aiResponse.adText && campaignId) {
  const learningData = {
    project_id: projectId,
    client_config_id: clientConfigId,
    fb_campaign_id: campaignId,
    fb_adset_id: adsetId,
    campaign_name: aiResponse.campaignName || '',
    adset_name: aiResponse.adSetName || '',
    ad_name: aiResponse.adName || '',
    ad_text: aiResponse.adText || '',
    headline: aiResponse.headline || '',
    targeting_json: aiResponse.targeting || {},
    ice_breakers: aiResponse.iceBreakers || [],
    welcome_message: aiResponse.welcomeMessage || '',
    media_type: aiResponse.mediaType || 'PHOTO',
    quality_score: 0,
    score_label: 'NEW',
    is_winner: false,
    is_paused: false,
    days_active: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    // Проверяем, есть ли уже запись
    if (campaignId) {
      const existing = await this.helpers.httpRequest({
        method: 'GET',
        url: `${SUPABASE_URL}/rest/v1/campaign_learnings?fb_campaign_id=eq.${campaignId}&select=id&limit=1&${authParam}`,
        headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` },
      });
      if (existing?.length > 0) {
        // Update — добавить текст/таргетинг к существующей записи
        await this.helpers.httpRequest({
          method: 'PATCH',
          url: `${SUPABASE_URL}/rest/v1/campaign_learnings?id=eq.${existing[0].id}&${authParam}`,
          headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: {
            ad_text: learningData.ad_text,
            headline: learningData.headline,
            targeting_json: learningData.targeting_json,
            ice_breakers: learningData.ice_breakers,
            welcome_message: learningData.welcome_message,
            updated_at: learningData.updated_at,
          },
          json: true,
        });
      } else {
        await this.helpers.httpRequest({
          method: 'POST',
          url: `${SUPABASE_URL}/rest/v1/campaign_learnings?${authParam}`,
          headers,
          body: learningData,
          json: true,
        });
      }
    }
  } catch(e) {}
}

return [$input.first()];
```

---

## Схема подключения новых нод

```
СУЩЕСТВУЮЩИЙ FLOW (оптимизация):
Schedule Trigger → Detect Mode → Ensure Tables → ...
                                                    ↓
                          Split In Batches → Yesterday report → Get budget
                                                                    ↓
                          Fetch Lead Quality (v4, пишет в campaign_learnings)
                                                                    ↓
                          Translate → Auto-Pause (v2, читает insights, пишет уроки)
                                        ↓
                          Format Report → Telegram

СУЩЕСТВУЮЩИЙ FLOW (создание рекламы):
Telegram Trigger → Switch → ... → AI Agent Креатор → AI Agent Таргетолог → Create Campaign → ...
                      ↓                    ↑                    ↑
            Get Campaign Learnings ────────┘────────────────────┘
            (НОВАЯ НОДА — подключить к обоим AI агентам через merge или expression)

ПОСЛЕ создания рекламы:
Create Ad → Save Ad Creative (НОВАЯ НОДА) → send telegram
```

### Как подключить Get Campaign Learnings:
1. Создайте ноду `Code` → назовите `Get Campaign Learnings`
2. Подключите вход от `If Config Found` (true выход)
3. AI Agent Креатор и Таргетолог обращаются к ней через expression: `$('Get Campaign Learnings').first().json.learnings`

### Как подключить Save Ad Creative:
1. Создайте ноду `Code` → назовите `Save Ad Creative`
2. Подключите между `Create Ad` и `send telegram`
3. Она автоматически сохраняет текст/таргетинг новой рекламы в `campaign_learnings`
