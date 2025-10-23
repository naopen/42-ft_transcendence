import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { i18n } from "../i18n"
import { authStore } from "../stores/auth.store"

export class HomePage {
  private container: HTMLDivElement
  private unsubscribe?: () => void

  constructor() {
    this.container = document.createElement("div")
    this.container.className = "max-w-6xl mx-auto"
    this.render()

    // Subscribe to auth state changes
    this.unsubscribe = authStore.subscribe(() => {
      this.render()
    })
  }

  private render(): void {
    const authState = authStore.getState()

    this.container.innerHTML = ""

    // Hero Section
    const hero = document.createElement("div")
    hero.className = "text-center mb-16 animate-slide-up"
    hero.innerHTML = `
      <h1 class="text-6xl font-bold mb-6 text-42-accent">ft_transcendence</h1>
      <p class="text-xl text-gray-300 mb-8">
        ${i18n.t("home.subtitle")}
      </p>
    `
    this.container.appendChild(hero)

    // Auth Status
    if (authState.isAuthenticated && authState.user) {
      const welcomeDiv = document.createElement("div")
      welcomeDiv.className = "text-center mb-8"
      welcomeDiv.innerHTML = `
        <p class="text-lg text-gray-300">
          ${i18n.t("home.welcome")}, <span class="text-42-accent font-bold">${authState.user.displayName}</span>!
        </p>
      `
      this.container.appendChild(welcomeDiv)
    }

    // Game Modes Grid
    const grid = document.createElement("div")
    grid.className = "grid md:grid-cols-2 gap-8 mb-16"

    // Local Tournament Card
    const localCard = new Card({
      title: i18n.t("home.localTournament.title"),
      hover: true,
      children: this.createLocalTournamentContent(),
    })
    grid.appendChild(localCard.getElement())

    // Online Play Card
    const onlineCard = new Card({
      title: i18n.t("home.onlinePlay.title"),
      hover: authState.isAuthenticated,
      className: authState.isAuthenticated ? "" : "opacity-50",
      children: this.createOnlinePlayContent(authState.isAuthenticated),
    })
    grid.appendChild(onlineCard.getElement())

    this.container.appendChild(grid)

    // Features Section
    const features = this.createFeaturesSection()
    this.container.appendChild(features)

    // Auth Section
    if (!authState.isAuthenticated && !authState.isLoading) {
      const authSection = this.createAuthSection()
      this.container.appendChild(authSection)
    }
  }

  private createLocalTournamentContent(): HTMLElement {
    const content = document.createElement("div")
    content.className = "space-y-4"

    const description = document.createElement("p")
    description.className = "text-gray-400"
    description.textContent = i18n.t("home.localTournament.description")
    content.appendChild(description)

    const button = new Button({
      text: i18n.t("home.localTournament.button"),
      variant: "primary",
      onClick: () => {
        window.dispatchEvent(
          new CustomEvent("navigate", { detail: "/tournament/create" }),
        )
      },
    })
    content.appendChild(button.getElement())

    return content
  }

  private createOnlinePlayContent(isAuthenticated: boolean): HTMLElement {
    const content = document.createElement("div")
    content.className = "space-y-4"

    const description = document.createElement("p")
    description.className = "text-gray-400"
    description.textContent = i18n.t("home.onlinePlay.description")
    content.appendChild(description)

    if (isAuthenticated) {
      const button = new Button({
        text: i18n.t("home.onlinePlay.button"),
        variant: "primary",
        onClick: () => {
          window.dispatchEvent(
            new CustomEvent("navigate", { detail: "/online-play" }),
          )
        },
      })
      content.appendChild(button.getElement())
    } else {
      const button = new Button({
        text: i18n.t("home.onlinePlay.signInRequired"),
        variant: "secondary",
        disabled: true,
      })
      content.appendChild(button.getElement())
    }

    return content
  }

  private createFeaturesSection(): HTMLElement {
    const section = document.createElement("div")
    section.className = "mb-16"

    const title = document.createElement("h2")
    title.className = "text-3xl font-bold text-center mb-8 text-white"
    title.textContent = i18n.t("home.features.title")
    section.appendChild(title)

    const featuresGrid = document.createElement("div")
    featuresGrid.className = "grid md:grid-cols-3 gap-6"

    const features = [
      {
        icon: "🎮",
        title: i18n.t("home.features.3dPong.title"),
        description: i18n.t("home.features.3dPong.description"),
      },
      {
        icon: "🏆",
        title: i18n.t("home.features.tournaments.title"),
        description: i18n.t("home.features.tournaments.description"),
      },
      {
        icon: "🌐",
        title: i18n.t("home.features.online.title"),
        description: i18n.t("home.features.online.description"),
      },
      {
        icon: "📊",
        title: i18n.t("home.features.stats.title"),
        description: i18n.t("home.features.stats.description"),
      },
      {
        icon: "🌍",
        title: i18n.t("home.features.i18n.title"),
        description: i18n.t("home.features.i18n.description"),
      },
      {
        icon: "⚡",
        title: i18n.t("home.features.realtime.title"),
        description: i18n.t("home.features.realtime.description"),
      },
    ]

    features.forEach((feature) => {
      const card = document.createElement("div")
      card.className =
        "bg-42-dark p-6 rounded-lg border border-gray-800 text-center hover:border-42-accent transition-all"
      card.innerHTML = `
        <div class="text-4xl mb-3">${feature.icon}</div>
        <h3 class="text-lg font-bold mb-2 text-white">${feature.title}</h3>
        <p class="text-gray-400 text-sm">${feature.description}</p>
      `
      featuresGrid.appendChild(card)
    })

    section.appendChild(featuresGrid)
    return section
  }

  private createAuthSection(): HTMLElement {
    const section = document.createElement("div")
    section.className =
      "text-center bg-42-dark p-8 rounded-lg border border-gray-800"

    section.innerHTML = `
      <h2 class="text-2xl font-bold mb-4 text-white">${i18n.t("home.auth.title")}</h2>
      <p class="text-gray-400 mb-6">${i18n.t("home.auth.description")}</p>
    `

    const button = new Button({
      text: i18n.t("home.auth.button"),
      variant: "primary",
      size: "lg",
      onClick: () => authStore.login(),
    })

    section.appendChild(button.getElement())

    return section
  }

  getElement(): HTMLDivElement {
    return this.container
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }
}
