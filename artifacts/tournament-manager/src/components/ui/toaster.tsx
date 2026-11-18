import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

/** V5.7: same roots as dialogs and menus (lib/experimental-portal), looked up when a toast appears. */
const EXPERIMENTAL_ROOTS = ".experimental-tournament-shell, .experimental-tournament-public, .experimental-tournament-create, .experimental-tournament-entry, .experimental-tournament-stage-view"

/** Meaning is carried by an icon and a spoken label too, never by colour alone. */
const KIND = {
  success: { icon: CheckCircle2, label: "Gotowe" },
  warning: { icon: AlertTriangle, label: "Uwaga" },
  destructive: { icon: XCircle, label: "Błąd" },
  default: { icon: Info, label: "Informacja" },
} as const

export function Toaster() {
  const { toasts } = useToast()
  const [container, setContainer] = useState<HTMLElement | null>(null)
  useEffect(() => {
    // Toasts mount inside the Experimental root of the current page (themed like dialogs); Stable keeps body.
    setContainer(typeof document === "undefined" ? null : document.querySelector<HTMLElement>(EXPERIMENTAL_ROOTS))
  }, [toasts.length])
  const viewport = <ToastViewport />

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const kind = KIND[(variant ?? "default") as keyof typeof KIND] ?? KIND.default
        const Icon = kind.icon
        return (
          <Toast key={id} variant={variant} data-toast-kind={variant ?? "default"} className="experimental-toast" {...props}>
            <Icon className="experimental-toast-icon h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="grid flex-1 gap-1">
              {title && <ToastTitle><span className="sr-only">{kind.label}: </span>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose aria-label="Zamknij powiadomienie" />
          </Toast>
        )
      })}
      {container ? createPortal(viewport, container) : viewport}
    </ToastProvider>
  )
}
