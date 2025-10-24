import "./styles/main.css"
import { Button } from "./components/Button"
import { i18n } from "./i18n"
import { Router } from "./router"
import { authStore } from "./stores/auth.store"

class App {
  private router: Router
  private unsubscribeAuth?: () => void

  constructor() {
    this.router = new Router()
    this.init()
  }

  private async init() {
    // Initialize i18n
    await i18n.init()

    // Render initial layout first, before router initialization
    this.renderLayout()

    // Initialize router after layout is rendered
    this.router.init()

    // Subscribe to auth changes
    this.unsubscribeAuth = authStore.subscribe(() => {
      this.updateNavigation()
    })

    console.log("🎮 ft_transcendence initialized")
  }

  private renderLayout() {
    const app = document.getElementById("app")
    if (!app) {
      return
    }

    app.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
        <header class="bg-42-dark border-b border-42-accent shadow-lg sticky top-0 z-40">
          <nav class="container mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
              <a href="/" data-link class="flex items-center gap-3 group">
                <div class="text-3xl">🎮</div>
                <h1 class="text-2xl font-bold text-42-accent group-hover:text-white transition-colors">
                  ft_transcendence
                </h1>
              </a>
              <div id="nav-links" class="flex items-center gap-6">
                <!-- Navigation will be inserted here -->
              </div>
            </div>
          </nav>
        </header>
        
        <main id="main-content" class="flex-1 container mx-auto px-4 py-8">
          <!-- Page content will be inserted here -->
        </main>
        
        <footer class="bg-42-dark border-t border-gray-800 py-6">
          <div class="container mx-auto px-4">
            <div class="flex flex-col md:flex-row items-center justify-between gap-4">
              <p class="text-gray-500 text-sm">
                ft_transcendence &copy; 2025
              </p>
              <div id="lang-selector" class="flex items-center gap-2"></div>
            </div>
          </div>
        </footer>
      </div>
    `

    this.updateNavigation()
    this.renderLanguageSelector()
  }

  private updateNavigation() {
    const navLinks = document.getElementById("nav-links")
    if (!navLinks) {
      return
    }

    const authState = authStore.getState()

    // Base links
    const links = [
      { href: "/", label: i18n.t("nav.home"), show: true },
      {
        href: "/tournament/create",
        label: i18n.t("nav.tournament"),
        show: true,
      },
    ]

    // Auth-dependent links
    if (authState.isAuthenticated && authState.user) {
      links.push(
        {
          href: `/profile/${authState.user.id}`,
          label: i18n.t("nav.profile"),
          show: true,
        },
        {
          href: `/dashboard/${authState.user.id}`,
          label: i18n.t("nav.dashboard"),
          show: true,
        },
      )
    }

    navLinks.innerHTML = ""

    // Render links
    links
      .filter((link) => link.show)
      .forEach((link) => {
        const a = document.createElement("a")
        a.href = link.href
        a.className =
          "text-gray-300 hover:text-42-accent transition-colors font-medium"
        a.setAttribute("data-link", "")
        a.textContent = link.label
        navLinks.appendChild(a)
      })

    // Auth button
    if (authState.isLoading) {
      const loading = document.createElement("span")
      loading.className = "text-gray-400"
      loading.textContent = "..."
      navLinks.appendChild(loading)
    } else if (authState.isAuthenticated && authState.user) {
      // User menu
      const userMenu = document.createElement("div")
      userMenu.className = "flex items-center gap-3"

      // Avatar
      const avatar = document.createElement("div")
      avatar.className =
        "w-8 h-8 rounded-full bg-42-accent flex items-center justify-center text-sm font-bold"
      if (authState.user.avatarUrl) {
        avatar.innerHTML = `<img src="${authState.user.avatarUrl}" alt="${authState.user.displayName}" class="w-full h-full rounded-full object-cover" />`
      } else {
        avatar.textContent = authState.user.displayName.charAt(0).toUpperCase()
      }
      userMenu.appendChild(avatar)

      // Username
      const username = document.createElement("span")
      username.className = "text-gray-300 hidden md:inline"
      username.textContent = authState.user.displayName
      userMenu.appendChild(username)

      // Logout button
      const logoutBtn = new Button({
        text: i18n.t("nav.logout"),
        variant: "ghost",
        size: "sm",
        onClick: () => authStore.logout(),
      })
      userMenu.appendChild(logoutBtn.getElement())

      navLinks.appendChild(userMenu)
    } else {
      // Login button
      const loginBtn = new Button({
        text: i18n.t("nav.login"),
        variant: "primary",
        size: "sm",
        onClick: () => authStore.login(),
      })
      navLinks.appendChild(loginBtn.getElement())
    }
  }

  private renderLanguageSelector() {
    const selector = document.getElementById("lang-selector")
    if (!selector) {
      return
    }

    const languages = [
      { code: "en", label: "🇬🇧 EN" },
      { code: "ja", label: "🇯🇵 JA" },
      { code: "fr", label: "🇫🇷 FR" },
    ]

    selector.innerHTML = ""

    languages.forEach((lang, index) => {
      const button = document.createElement("button")
      button.className = `px-3 py-1 rounded transition-colors ${
        i18n.currentLanguage === lang.code
          ? "bg-42-accent text-white"
          : "text-gray-400 hover:text-white hover:bg-gray-800"
      }`
      button.textContent = lang.label
      button.addEventListener("click", () => {
        i18n.setLanguage(lang.code)
        this.renderLayout()
        this.router.navigateTo(window.location.pathname, false)
      })

      selector.appendChild(button)

      // Add separator
      if (index < languages.length - 1) {
        const separator = document.createElement("span")
        separator.className = "text-gray-600"
        separator.textContent = "|"
        selector.appendChild(separator)
      }
    })
  }
}

// Start the application
new App()
