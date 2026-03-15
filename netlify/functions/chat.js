exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') {
          return {
                  statusCode: 200,
                  headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Content-Type',
                            'Access-Control-Allow-Methods': 'POST, OPTIONS',
                  },
                  body: '',
          };
    }

    try {
          const { message } = JSON.parse(event.body);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.ANTHROPIC_API_KEY,
                        'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                        model: 'claude-3-5-haiku-20241022',
                        max_tokens: 1024,
                        system:
                                    "You are Eby's personal Life OS coach. Eby is a 34-year-old entrepreneur from Kochi, India. He runs Adivinar (AI automation agency), is building Club Catalyst resort, and is on a 500-day transformation. Goals: Rs100Cr net worth, 1M+ followers (Malayalam-first content), Greek god physique, 50-partner pool, clearing Rs50L debt. Current: Rs4L/month revenue, 157 followers, Day 1 of 500. Be direct, sharp, no fluff. Speak like a high-performance coach who knows his whole life context.",
                        messages: [{ role: 'user', content: message }],
              }),
      });

      const data = await response.json();

      if (!response.ok) {
              // Return full error details for debugging
            const errType = data.error?.type || 'unknown';
              const errMsg = data.error?.message || JSON.stringify(data);
              return {
                        statusCode: 500,
                        headers: { 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify({ error: errType + ': ' + errMsg }),
              };
      }

      const reply = data.content[0].text;

      return {
              statusCode: 200,
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ reply }),
      };
    } catch (err) {
          return {
                  statusCode: 500,
                  headers: { 'Access-Control-Allow-Origin': '*' },
                  body: JSON.stringify({ error: 'catch: ' + err.message }),
          };
    }
};
