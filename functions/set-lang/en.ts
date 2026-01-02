export const onRequest = ({ request }: { request: Request }): Response => {
  return new Response(null, {
    status: 302,
    headers: {
      location: new URL('/en/', request.url).toString(),
      'set-cookie': 'notaly_lang=en; Path=/; Max-Age=31536000; SameSite=Lax'
    }
  });
};
