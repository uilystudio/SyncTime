export function invitationToken(value: string): string | null {
  const text = value.trim();
  if (/^[a-f0-9]{64}$/i.test(text)) return text.toLowerCase();
  try {
    const url = new URL(text, "https://synctime.invalid");
    if (!text.startsWith("/e/") && !/^https?:\/\//i.test(text)) return null;
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.pathname.match(/^\/e\/([a-f0-9]{64})\/?$/i)?.[1].toLowerCase() ?? null;
  } catch { return null; }
}
