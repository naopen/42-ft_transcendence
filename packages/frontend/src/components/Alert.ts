export type AlertType = "success" | "error" | "warning" | "info"

export interface AlertProps {
  message: string
  type: AlertType
  duration?: number
  onClose?: () => void
}

export class Alert {
  private static container: HTMLDivElement | null = null

  static show(props: AlertProps): void {
    // Create container if it doesn't exist
    if (!Alert.container) {
      Alert.container = document.createElement("div")
      Alert.container.className =
        "fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md"
      document.body.appendChild(Alert.container)
    }

    // Create alert element
    const alert = Alert.createAlert(props)
    Alert.container.appendChild(alert)

    // Auto dismiss
    const duration = props.duration || 5000
    setTimeout(() => {
      Alert.dismiss(alert, props.onClose)
    }, duration)
  }

  private static createAlert(props: AlertProps): HTMLDivElement {
    const alert = document.createElement("div")

    // Type-specific styles
    const typeStyles = {
      success: "bg-green-900 border-green-500 text-green-100",
      error: "bg-red-900 border-red-500 text-red-100",
      warning: "bg-yellow-900 border-yellow-500 text-yellow-100",
      info: "bg-blue-900 border-blue-500 text-blue-100",
    }

    alert.className = `${typeStyles[props.type]} border-l-4 p-4 rounded-lg shadow-lg animate-slide-in flex items-start justify-between gap-3`

    // Icon
    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    }

    // Content
    alert.innerHTML = `
      <div class="flex items-start gap-3 flex-1">
        <span class="text-2xl">${icons[props.type]}</span>
        <p class="flex-1">${props.message}</p>
      </div>
      <button class="text-xl hover:opacity-75 transition-opacity">&times;</button>
    `

    // Close button
    const closeButton = alert.querySelector("button")
    if (closeButton) {
      closeButton.addEventListener("click", () =>
        Alert.dismiss(alert, props.onClose),
      )
    }

    return alert
  }

  private static dismiss(alert: HTMLDivElement, onClose?: () => void): void {
    alert.classList.remove("animate-slide-in")
    alert.classList.add("animate-slide-out")

    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert)
      }

      // Remove container if empty
      if (Alert.container && Alert.container.children.length === 0) {
        Alert.container.remove()
        Alert.container = null
      }

      if (onClose) {
        onClose()
      }
    }, 300)
  }

  static success(message: string, duration?: number): void {
    Alert.show({ message, type: "success", duration })
  }

  static error(message: string, duration?: number): void {
    Alert.show({ message, type: "error", duration })
  }

  static warning(message: string, duration?: number): void {
    Alert.show({ message, type: "warning", duration })
  }

  static info(message: string, duration?: number): void {
    Alert.show({ message, type: "info", duration })
  }
}
