export interface CardProps {
  title?: string
  children: string | HTMLElement | HTMLElement[]
  className?: string
  onClick?: () => void
  hover?: boolean
}

export class Card {
  private element: HTMLDivElement

  constructor(props: CardProps) {
    this.element = this.create(props)
  }

  private create(props: CardProps): HTMLDivElement {
    const card = document.createElement("div")

    // Base classes
    const baseClasses =
      "bg-42-dark rounded-lg border border-gray-800 p-6 transition-all duration-200"

    // Hover effect
    const hoverClasses = props.hover
      ? "hover:border-42-accent hover:shadow-lg cursor-pointer"
      : ""

    card.className = `${baseClasses} ${hoverClasses} ${props.className || ""}`

    // Title
    if (props.title) {
      const title = document.createElement("h3")
      title.className = "text-xl font-bold mb-4 text-white"
      title.textContent = props.title
      card.appendChild(title)
    }

    // Content
    const content = document.createElement("div")
    content.className = "text-gray-300"

    if (typeof props.children === "string") {
      content.innerHTML = props.children
    } else if (Array.isArray(props.children)) {
      props.children.forEach((child) => content.appendChild(child))
    } else {
      content.appendChild(props.children)
    }

    card.appendChild(content)

    // Click handler
    if (props.onClick) {
      card.addEventListener("click", props.onClick)
    }

    return card
  }

  getElement(): HTMLDivElement {
    return this.element
  }

  setContent(content: string | HTMLElement | HTMLElement[]): void {
    const contentDiv = this.element.querySelector("div")
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
