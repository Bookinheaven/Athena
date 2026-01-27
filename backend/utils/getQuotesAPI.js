const apis = [
  {
    url: "https://motivational-spark-api.vercel.app/api/quotes/random",
    transform: (data) => ({
      text: data.quote,
      author: data.author,
    }),
  },
  {
    url: "https://api.api-ninjas.com/v2/randomquotes?categories=motivational",
    headers: {
      "X-Api-Key": process.env.API_NINJAS,
    },
    transform: (data) => ({
      text: data[0]?.quote,
      author: data[0]?.author,
    }),
  },
];


async function getQuotesAPI() {
  for (const api of apis) {
    try {
      const response = await fetch(api.url, {
        headers: api.headers || {},
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const quote = api.transform(data);

      if (quote?.text) {
        return quote;
      }
    } catch (error) {
      console.warn(`API failed: ${api.url}`, error.message);
      continue; 
    }
  }

  return {
    text: "Focus on progress, not perfection.",
    author: "Unknown",
  };
}

export default getQuotesAPI;
