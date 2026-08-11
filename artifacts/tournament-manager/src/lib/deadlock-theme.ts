import { useEffect } from "react";

/**
 * Mirrors data-theme="deadlock" onto <html> so that Radix UI portals
 * (Dialog, Dropdown, Select, Tooltip, Popover, Sheet, Context Menu, etc.)
 * rendered outside the page root div also inherit the Emerald Occult theme.
 *
 * Cleanup removes the attribute when the component unmounts or deadlock
 * becomes inactive, so navigating away resets the global theme.
 */
export function useDeadlockHtmlTheme(active: boolean): void {
  useEffect(() => {
    const html = document.documentElement;
    if (active) {
      html.setAttribute("data-theme", "deadlock");
    } else {
      html.removeAttribute("data-theme");
    }
    return () => {
      html.removeAttribute("data-theme");
    };
  }, [active]);
}
