exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  try {
    const { message, context, maxTokens, history } = JSON.parse(event.body);
    if (!message) return { statusCode: 400, body: JSON.stringify({ error: 'Message required' }) };

    const systemPrompt = buildSystemPrompt(context || {});

    // Build messages array: conversation history + current message
    const messages = [
      ...(Array.isArray(history) ? history.slice(-10) : []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens || 2000,
        system: systemPrompt,
        messages
      })
    });

    const data = await response.json();
    if (data.error) return { statusCode: 400, body: JSON.stringify({ error: data.error.message }) };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ reply: data.content?.[0]?.text || 'No response.' })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed: ' + err.message }) };
  }
};

function buildSystemPrompt(ctx) {
  const {
    dayNum = 1,
    mood = 'normal',
    goals = [],
    metrics = {},
    streak = 0,
    recentWins = [],
    recentLogs = [],
    situation = '',
    coachMemory = []
  } = ctx;

  const goalsText = goals.length > 0
    ? goals.map(g => `${g.name} (${g.progress}%): ${g.target}`).join('\n')
    : `1. \u20b9100 Crore Wealth (target: \u20b9100Cr personal net worth)
2. Empire (target: Master connector + ecosystem builder)
3. Body & Attraction (target: Greek god physique + 50-partner pool)
4. Influence (target: 1M+ followers \u2014 Malayalam first)
5. Life & Clarity (target: Extraordinary life + relationship truth)`;

  const winsText = recentWins.slice(0, 5).map(w => `- ${w.text}`).join('\n') || 'None yet';
  const logsText = recentLogs.slice(0, 7).map(l =>
    `Day ${l.day_number}: ${l.score}/${l.total_tasks} tasks, mood: ${l.mood || 'unknown'}`
  ).join('\n') || 'No history yet';

  const rev = metrics.rev || 400000;
  const fol = metrics.fol || 157;
  const debt = metrics.debt || 5000000;

  return `You are Eby's personal Life OS AI coach. You have full context of his life and 500-day system.

WHO IS EBY:
34-year-old entrepreneur from Kochi, Kerala, India. Unmarried. Building his life across 5 goals simultaneously over 500 days starting March 2026.
Businesses: Adivinar Catalyst IT Solutions (digital marketing, IT, AI automation, ~31 people, 50% owner) + Club Catalyst (resort management).
BNI Warriors Kochi chapter \u2014 positioned as personal branding expert.

CURRENT STATUS \u2014 Day ${dayNum} of 500:
- Revenue: \u20b9${(rev/100000).toFixed(1)}L/month (target: \u20b915L)
- Followers: ${fol} (target: 1M+)
- Debt: \u20b9${(debt/100000).toFixed(0)}L (URGENT \u2014 clear by Day 300, 60% of every rupee above \u20b94L goes to debt)
- Streak: ${streak} consecutive days
- Today's mood: ${mood}
- Today's situation: ${situation || 'not specified'}

500-DAY GOALS:
${goalsText}

RECENT PROGRESS (last 7 days):
${logsText}

RECENT WINS:
${winsText}

THE 22 DAILY HABITS:
Mind (Goal 5): Guided visualisation 10min | EFT 10min | Gratitude 3 things | Affirmations 5min | Read 5 pages
Skills (Goal 4): English training 15min | Etiquette + world knowledge 1 thing | Style/fashion monthly
Body (Goal 3): Workout any duration | Fight training (recreational, weekly) | Kaggle exercises (pelvic floor \u2014 code name, daily) | Supplements + diet | Skincare morning | Face exercise 5min
Network (Goal 2): 10 reach-out messages | 1 genuine conversation | 1 BNI action
Business (Goal 1): 1 Higgsfield content (Malayalam visual storytelling) | Club Catalyst 10 daily actions | 1 Adivinar process improved | 1 finance concept | Weekly review

KEY CONTEXT:
- Kaggle = pelvic floor exercise (private code name \u2014 never explain unless asked)
- EFT = Emotional Freedom Technique for clearing limiting beliefs
- Higgsfield = AI video tool for Malayalam content creation
- Content strategy: Malayalam (Day 0-180) \u2192 Bilingual (Day 180-300) \u2192 English-led (Day 300+)
- Travel: \u226415K budget until debt cleared, every trip must feed 2+ goals
- Partner pool: 50 people, grows from lifestyle naturally, no apps, no chasing
- Identity: "I am the man people cannot categorise. I build empires quietly, live loudly."

${coachMemory.length ? `RECENT ACTIVITY NOTES (what Eby actually did \u2014 calibrate accordingly):
${coachMemory.slice(0,7).map(n => `\u2022 Day ${n.day} \u2014 "${n.task}": ${n.note}`).join('\n')}

` : ''}COACHING RULES (CRITICAL):
- Be direct and short. Max 150 words unless deep review is explicitly requested.
- Zero filler. No "great question!" No excessive praise. No "certainly!".
- Any effort = a win. Visiting the gym counts. 2 pages counts. Always celebrate genuinely.
- Never shame. Always redirect forward.
- Low energy / rough day = minimum viable 3 actions only.
- New goal mentioned = analyse against existing 5 goals, debt situation, Day ${dayNum} timing.
- Celebrate wins by connecting to the specific 500-day goal.
- Use live data (streak, revenue, followers) to personalise every response.
- Everything connects back to the 500-day goals.`;
}
