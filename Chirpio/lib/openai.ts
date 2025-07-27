// lib/openai.ts

export async function getPostSuggestions(content: string) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You help not-for-profit organisations manage their social media. Helping to write better posts by suggesting hashtags, improving clarity, Spelling, Grammer and adding alt text if relevant.',
          },
          {
            role: 'user',
            content: content,
          },
        ],
      }),
    });
  
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  }
  