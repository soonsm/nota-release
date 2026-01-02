type LangPreference = {
  q: number;
  index: number;
};

const parseLanguageHeader = (header: string, target: string): LangPreference => {
  const parts = header
    .split(',')
    .map((part, index) => {
      const [tagPart, ...params] = part.trim().split(';');
      let q = 1;

      for (const param of params) {
        const trimmed = param.trim();
        if (trimmed.startsWith('q=')) {
          const value = Number(trimmed.slice(2));
          if (!Number.isNaN(value)) {
            q = value;
          }
        }
      }

      return {
        tag: tagPart.toLowerCase(),
        q,
        index
      };
    })
    .filter((entry) => entry.tag.length > 0);

  let best: LangPreference = { q: -1, index: Number.POSITIVE_INFINITY };

  for (const entry of parts) {
    const baseTag = entry.tag.split('-')[0];
    if (baseTag !== target) {
      continue;
    }

    if (entry.q > best.q || (entry.q === best.q && entry.index < best.index)) {
      best = { q: entry.q, index: entry.index };
    }
  }

  return best;
};

export const onRequest = ({ request }: { request: Request }): Response => {
  const acceptLanguage = request.headers.get('accept-language') ?? '';
  const ko = parseLanguageHeader(acceptLanguage, 'ko');
  const en = parseLanguageHeader(acceptLanguage, 'en');

  const prefersKo =
    ko.q >= 0 &&
    (en.q < 0 || ko.q > en.q || (ko.q === en.q && ko.index < en.index));

  const destination = prefersKo ? '/ko/' : '/en/';
  return Response.redirect(new URL(destination, request.url), 302);
};
