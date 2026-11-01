import { meetingUrl } from "./meeting-place";


export function commentParts(body: string): { text: string; href?: string }[] {
  return body.split(/(https?:\/\/[^\s<>]+)/gi).filter(Boolean).flatMap(text => {
    if (!/^https?:\/\//i.test(text)) return [{ text }];
    const url = text.replace(/[.,;:!?)}\]]+$/, "");
    const href = meetingUrl(url);
    if (!href) return [{ text }];
    return [{ text: url, href }, ...(url.length < text.length ? [{ text: text.slice(url.length) }] : [])];
  });
}
