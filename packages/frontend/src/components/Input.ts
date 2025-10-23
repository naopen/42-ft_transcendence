export interface InputProps {
  type?: "text" | "email" | "password" | "number"
  placeholder?: string
  value?: string
  label?: string
  error?: string
  required?: boolean
  disabled?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  onChange?: (value: string) => void
  onEnter?: () => void
  className?: string
}

export class Input {
  private container: HTMLDivElement
  private input: HTMLInputElement
  private errorElement?: HTMLParagraphElement

  constructor(props: InputProps) {
    this.container = document.createElement("div")
    this.container.className = `mb-4 ${props.className || ""}`

    // Label
    if (props.label) {
      const label = document.createElement("label")
      label.className = "block text-sm font-medium text-gray-300 mb-2"
      label.textContent = props.label
      if (props.required) {
        const required = document.createElement("span")
        required.className = "text-red-500 ml-1"
        required.textContent = "*"
        label.appendChild(required)
      }
      this.container.appendChild(label)
    }

    // Input
    this.input = document.createElement("input")
    this.input.type = props.type || "text"
    this.input.placeholder = props.placeholder || ""
    this.input.value = props.value || ""
    this.input.required = props.required || false
    this.input.disabled = props.disabled || false

    if (props.minLength) {
      this.input.minLength = props.minLength
    }
    if (props.maxLength) {
      this.input.maxLength = props.maxLength
    }
    if (props.min !== undefined) {
      this.input.min = props.min.toString()
    }
    if (props.max !== undefined) {
      this.input.max = props.max.toString()
    }

    this.input.className =
      "w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-42-accent focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"

    // Event listeners
    if (props.onChange) {
      this.input.addEventListener("input", (e) => {
        props.onChange!((e.target as HTMLInputElement).value)
      })
    }

    if (props.onEnter) {
      this.input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          props.onEnter!()
        }
      })
    }

    this.container.appendChild(this.input)

    // Error message
    if (props.error) {
      this.showError(props.error)
    }
  }

  getElement(): HTMLDivElement {
    return this.container
  }

  getValue(): string {
    return this.input.value
  }

  setValue(value: string): void {
    this.input.value = value
  }

  focus(): void {
    this.input.focus()
  }

  clear(): void {
    this.input.value = ""
  }

  showError(message: string): void {
    // Remove existing error
    if (this.errorElement) {
      this.errorElement.remove()
    }

    // Add red border
    this.input.classList.add("border-red-500")

    // Create error message
    this.errorElement = document.createElement("p")
    this.errorElement.className = "text-red-500 text-sm mt-1"
    this.errorElement.textContent = message

    this.container.appendChild(this.errorElement)
  }

  clearError(): void {
    if (this.errorElement) {
      this.errorElement.remove()
      this.errorElement = undefined
    }
    this.input.classList.remove("border-red-500")
  }

  setDisabled(disabled: boolean): void {
    this.input.disabled = disabled
  }
}
