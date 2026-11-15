import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Keep the hook aligned with the same CSS media query used by the layout.
    // Older embedded browsers may expose only addListener/removeListener.
    if (typeof window.matchMedia !== "function") {
      const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      window.addEventListener("resize", onResize)
      onResize()
      return () => window.removeEventListener("resize", onResize)
    }
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    setIsMobile(mql.matches)
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  return !!isMobile
}
