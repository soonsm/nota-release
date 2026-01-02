export const onRequest = ({ request }: { request: Request }): Response => {
  return new Response(null, {
    status: 302,
    headers: {
      location: new URL('/ko/', request.url).toString(),
      'set-cookie': 'notaly_lang=ko; Path=/; Max-Age=31536000; SameSite=Lax'
    }
  });
};
