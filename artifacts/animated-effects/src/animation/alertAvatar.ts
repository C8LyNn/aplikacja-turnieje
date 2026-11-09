/** Only allow image hosts commonly used by supported streaming platforms.
 * Unknown / missing URLs show an initial instead of attempting network access.
 */
const TRUSTED_AVATAR_HOSTS = new Set([
  "static-cdn.jtvnw.net",
  "yt3.googleusercontent.com",
  "lh3.googleusercontent.com",
  "cdn.streamelements.com",
  "static-cdn.streamelements.com",
]);

export function safeAvatarUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 500) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !TRUSTED_AVATAR_HOSTS.has(url.hostname.toLowerCase())) return null;
    if (url.username || url.password || url.port) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function avatarFromEvent(event: unknown): string | null {
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  const outer = event as Record<string, unknown>;
  const inner = outer.data && typeof outer.data === "object" && !Array.isArray(outer.data)
    ? outer.data as Record<string, unknown> : {};
  const fields = [inner.avatar, inner.avatarUrl, inner.profileImage, outer.avatar, outer.avatarUrl, outer.profileImage];
  for (const field of fields) {
    const url = safeAvatarUrl(field);
    if (url) return url;
  }
  return null;
}

/** Rendered independently from the text node. Do not insert remote HTML or SVG. */
export function appendEventAvatar(caption: HTMLElement, rawEvent: unknown, name: string, size: number): void {
  const avatar = document.createElement("span");
  avatar.className = "ae-alert-avatar";
  avatar.style.position = "absolute";
  avatar.style.left = "0";
  avatar.style.top = "50%";
  avatar.style.transform = "translateY(-50%)";
  avatar.style.width = size + "px";
  avatar.style.height = size + "px";
  avatar.style.borderRadius = "50%";
  avatar.style.overflow = "hidden";
  avatar.style.display = "grid";
  avatar.style.placeItems = "center";
  avatar.style.fontSize = Math.round(size * 0.48) + "px";
  avatar.style.background = "rgba(25,45,78,.85)";
  avatar.style.border = "2px solid rgba(255,255,255,.7)";
  avatar.style.color = "#ffffff";
  avatar.style.boxSizing = "border-box";
  avatar.textContent = Array.from(name.trim())[0]?.toLocaleUpperCase() ?? "?";

  const source = avatarFromEvent(rawEvent);
  if (source) {
    const photo = document.createElement("img");
    photo.src = source;
    photo.alt = "";
    photo.referrerPolicy = "no-referrer";
    photo.loading = "eager";
    photo.decoding = "async";
    photo.style.position = "absolute";
    photo.style.inset = "0";
    photo.style.width = "100%";
    photo.style.height = "100%";
    photo.style.objectFit = "cover";
    avatar.appendChild(photo);
  }

  caption.style.paddingLeft = (size + 14) + "px";
  caption.style.boxSizing = "border-box";
  caption.style.minHeight = size + "px";
  caption.appendChild(avatar);
}
