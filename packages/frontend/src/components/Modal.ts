export interface ModalProps {
  title: string
  content: string | HTMLElement | HTMLElement[]
  onClose?: () => void
  closeOnOverlay?: boolean
  footer?: HTMLElement[]
}

export class Modal {
  private overlay: HTMLDivElement
  private modal: HTMLDivElement
  private isOpen = false

  constructor(props: ModalProps) {
    // Create overlay
    this.overlay = document.createElement("div")
    this.overlay.className =
      "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 hidden"

    // Create modal
    this.modal = document.createElement("div")
    this.modal.className =
      "bg-42-dark rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800"

    // Header
    const header = document.createElement("div")
    header.className =
      "flex items-center justify-between p-6 border-b border-gray-800"

    const title = document.createElement("h2")
    title.className = "text-2xl font-bold text-white"
    title.textContent = props.title

    const closeButton = document.createElement("button")
    closeButton.className =
      "text-gray-400 hover:text-white transition-colors text-2xl"
    closeButton.innerHTML = "&times;"
    closeButton.addEventListener("click", () => this.close())

    header.appendChild(title)
    header.appendChild(closeButton)
    this.modal.appendChild(header)

    // Content
    const content = document.createElement("div")
    content.className = "p-6 text-gray-300"

    if (typeof props.content === "string") {
      content.innerHTML = props.content
    } else if (Array.isArray(props.content)) {
      props.content.forEach((child) => content.appendChild(child))
    } else {
      content.appendChild(props.content)
    }

    this.modal.appendChild(content)

    // Footer
    if (props.footer && props.footer.length > 0) {
      const footer = document.createElement("div")
      footer.className =
        "flex items-center justify-end gap-3 p-6 border-t border-gray-800"
      props.footer.forEach((element) => footer.appendChild(element))
      this.modal.appendChild(footer)
    }

    this.overlay.appendChild(this.modal)

    // Close on overlay click
    if (props.closeOnOverlay !== false) {
      this.overlay.addEventListener("click", (e) => {
        if (e.target === this.overlay) {
          this.close()
        }
      })
    }

    // Close on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close()
      }
    })

    // Store onClose callback
    if (props.onClose) {
      this.onCloseCallback = props.onClose
    }
  }

  private onCloseCallback?: () => void

  open(): void {
    if (this.isOpen) {
      return
    }

    document.body.appendChild(this.overlay)
    this.overlay.classList.remove("hidden")
    this.isOpen = true

    // Prevent body scroll
    document.body.style.overflow = "hidden"

    // Fade in animation
    setTimeout(() => {
      this.overlay.classList.add("animate-fade-in")
    }, 10)
  }

  close(): void {
    if (!this.isOpen) {
      return
    }

    this.overlay.classList.remove("animate-fade-in")
    this.overlay.classList.add("hidden")
    this.isOpen = false

    // Restore body scroll
    document.body.style.overflow = ""

    // Remove from DOM
    setTimeout(() => {
      if (this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay)
      }
    }, 200)

    // Call onClose callback
    if (this.onCloseCallback) {
      this.onCloseCallback()
    }
  }

  getElement(): HTMLDivElement {
    return this.overlay
  }

  updateContent(content: string | HTMLElement | HTMLElement[]): void {
    const contentDiv = this.modal.querySelector("div:nth-child(2)")
    if (!contentDiv) {
      return
    }

    contentDiv.innerHTML = ""

    if (typeof content === "string") {
      contentDiv.innerHTML = content
    } else if (Array.isArray(content)) {
      content.forEach((child) => contentDiv.appendChild(child))
    } else {
      contentDiv.appendChild(content)
    }
  }
}
