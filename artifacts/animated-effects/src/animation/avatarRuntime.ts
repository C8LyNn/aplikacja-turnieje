/** This small standalone script is included in the StreamElements widget. */
export const AVATAR_WIDGET_RUNTIME = String.raw`
const aeAvatarAllowedHosts = new Set([
  "static-cdn.jtvnw.net", "yt3.googleusercontent.com",
  "lh3.googleusercontent.com", "cdn.streamelements.com",
  "static-cdn.streamelements.com"
]);
function aeAvatarUrl(raw) {
  if (typeof raw !== "string" || raw.length > 500) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !aeAvatarAllowedHosts.has(url.hostname.toLowerCase())) return null;
    if (url.username || url.password || url.port) return null;
    return url.href;
  } catch {
    return null;
  }
}
function aeAvatarEventUrl(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  const nested = event.data && typeof event.data === "object" && !Array.isArray(event.data) ? event.data : {};
  const fields = [nested.avatar, nested.avatarUrl, nested.profileImage, event.avatar, event.avatarUrl, event.profileImage];
  for (const field of fields) {
    const url = aeAvatarUrl(field);
    if (url) return url;
  }
  return null;
}
function aeAttachAvatar(caption, event, name, size) {
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
  const source = aeAvatarEventUrl(event);
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
`;
