// Accept-Language에서 특정 언어가 얼마나 선호되는지 계산하기 위한 구조
// q 값이 높을수록 선호도가 높고, 동일 q에서는 헤더에 먼저 나온 값이 우선
type LangPreference = {
  q: number;
  index: number;
};

// Accept-Language 헤더를 간단히 파싱해 target 언어의 최적 선호도를 계산
// 예: "ko-KR,ko;q=0.9,en;q=0.8" -> ko의 q=1, index=0
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

  // 해당 언어가 없을 때는 q=-1로 처리
  let best: LangPreference = { q: -1, index: Number.POSITIVE_INFINITY };

  for (const entry of parts) {
    // ko-KR 같은 지역 태그는 기본 언어 ko만 비교
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
  // 사용자가 선택한 언어가 쿠키에 있으면 최우선으로 사용
  const cookie = request.headers.get('cookie') ?? '';
  const cookieMatch = cookie.match(/(?:^|;)\s*notaly_lang=(ko|en)\b/i);
  const cookieLang = cookieMatch?.[1]?.toLowerCase();

  if (cookieLang === 'ko') {
    return Response.redirect(new URL('/ko/', request.url), 302);
  }

  if (cookieLang === 'en') {
    return Response.redirect(new URL('/en/', request.url), 302);
  }

  // 쿠키가 없으면 Accept-Language를 기반으로 선호 언어를 판단
  const acceptLanguage = request.headers.get('accept-language') ?? '';
  const ko = parseLanguageHeader(acceptLanguage, 'ko');
  const en = parseLanguageHeader(acceptLanguage, 'en');

  // ko가 en보다 우선이면 한국어로, 아니면 영어로 이동
  // q 값이 같을 때는 헤더에 먼저 나온 언어가 우선
  const prefersKo =
    ko.q >= 0 &&
    (en.q < 0 || ko.q > en.q || (ko.q === en.q && ko.index < en.index));

  const destination = prefersKo ? '/ko/' : '/en/';
  return Response.redirect(new URL(destination, request.url), 302);
};
