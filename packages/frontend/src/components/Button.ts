export interface ButtonProps {
  text: string
  onClick?: () => void
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  type?: "button" | "submit"
  className?: string
  icon?: string
}

export class Button {
  private element: HTMLButtonElement
  private originalText: string
  private originalHTML: string

  constructor(props: ButtonProps) {
    this.originalText = props.text
    this.originalHTML = ""
    this.element = this.create(props)
    // Save original HTML after creation
    this.originalHTML = this.element.innerHTML
  }

  private create(props: ButtonProps): HTMLButtonElement {
    const button = document.createElement("button")
    button.type = props.type || "button"
    button.disabled = props.disabled || false

    // Base classes
    const baseClasses =
      "font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"

    // Variant classes
    const variantClasses = {
      primary:
        "bg-42-accent hover:bg-42-accent-dark text-white focus:ring-42-accent",
      secondary: "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500",
      danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
      ghost:
        "bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700",
    }

    // Size classes
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    }

    // Disabled classes
    const disabledClasses = "opacity-50 cursor-not-allowed"

    const variant = props.variant || "primary"
    const size = props.size || "md"

    button.className = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${props.disabled ? disabledClasses : ""} ${props.className || ""}`

    // Icon and text
    if (props.icon) {
      button.innerHTML = `
        <span class="flex items-center gap-2">
          <span>${props.icon}</span>
          <span>${props.text}</span>
        </span>
      `
    } else {
      button.textContent = props.text
    }

    // Event listener
    if (props.onClick && !props.disabled) {
      button.addEventListener("click", props.onClick)
    }

    return button
  }

  getElement(): HTMLButtonElement {
    return this.element
  }

  updateText(text: string): void {
    if (this.element.querySelector("span span:last-child")) {
      const textSpan = this.element.querySelector("span span:last-child")
      if (textSpan) {
        textSpan.textContent = text
      }
    } else {
      this.element.textContent = text
    }
  }

  setDisabled(disabled: boolean): void {
    this.element.disabled = disabled
    if (disabled) {
      this.element.classList.add("opacity-50", "cursor-not-allowed")
    } else {
      this.element.classList.remove("opacity-50", "cursor-not-allowed")
    }
  }

  setLoading(loading: boolean): void {
    if (loading) {
      this.element.disabled = true
      this.element.innerHTML = `
        <span class="flex items-center gap-2">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </span>
      `
    } else {
      // Restore original state
      this.element.disabled = false
      this.element.innerHTML = this.originalHTML
    }
  }
}
