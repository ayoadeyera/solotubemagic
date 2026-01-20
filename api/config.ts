
export const config = {
  runtime: 'edge',
};

export default async function handler() {
  const apiKey = process.env.API_KEY;
  return new Response(
    JSON.stringify({ apiKey }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    }
  );
}
