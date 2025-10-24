import "./styles/main.css"
import { Button } from "./components/Button"
import { i18n } from "./i18n"
import { Router } from "./router"
import { authStore } from "./stores/auth.store"

class App {
  private router: Router
  private unsubscribeAuth?: () => void
  private mobileMenuOpen = false

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
              <a href="/" data-link class="flex items-center gap-2 md:gap-3 group">
                <div class="text-2xl md:text-3xl">🎮</div>
                <h1 class="text-lg md:text-2xl font-bold text-42-accent group-hover:text-white transition-colors">
                  ft_transcendence
                </h1>
              </a>

              <!-- Desktop Navigation (hidden on mobile) -->
              <div id="nav-links" class="hidden md:flex items-center gap-6">
                <!-- Navigation will be inserted here -->
              </div>

              <!-- Mobile Hamburger Button (visible only on mobile) -->
              <button id="mobile-menu-btn" class="md:hidden hamburger" aria-label="Toggle menu">
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </nav>

          <!-- Mobile Navigation Menu -->
          <div id="mobile-nav" class="mobile-nav hidden">
            <div class="container mx-auto px-4 py-4">
              <div id="mobile-nav-links" class="flex flex-col gap-4">
                <!-- Mobile navigation will be inserted here -->
              </div>
            </div>
          </div>
        </header>
        
        <main id="main-content" class="flex-1 container mx-auto px-4 py-8">
          <!-- Page content will be inserted here -->
        </main>
        
        <footer class="bg-42-dark border-t border-gray-800 py-6 mt-auto">
          <div class="container mx-auto px-4">
            <div class="flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
              <p class="text-gray-500 text-xs md:text-sm text-center md:text-left">
                ft_transcendence &copy; 2025
              </p>
              <div id="lang-selector" class="flex items-center gap-2 flex-wrap justify-center"></div>
            </div>
          </div>
        </footer>
      </div>
    `

    this.updateNavigation()
    this.renderLanguageSelector()
    this.setupMobileMenu()
  }

  private setupMobileMenu() {
    const menuBtn = document.getElementById("mobile-menu-btn")
    const mobileNav = document.getElementById("mobile-nav")

    if (!menuBtn || !mobileNav) {
      return
    }

    menuBtn.addEventListener("click", () => {
      this.mobileMenuOpen = !this.mobileMenuOpen

      if (this.mobileMenuOpen) {
        menuBtn.classList.add("open")
        mobileNav.classList.remove("hidden")
        mobileNav.classList.add("mobile-menu-enter")
      } else {
        menuBtn.classList.remove("open")
        mobileNav.classList.remove("mobile-menu-enter")
        mobileNav.classList.add("mobile-menu-exit")

        // Wait for animation to complete before hiding
        setTimeout(() => {
          mobileNav.classList.add("hidden")
          mobileNav.classList.remove("mobile-menu-exit")
        }, 300)
      }
    })

    // Close mobile menu when clicking on a link
    const closeMobileMenu = () => {
      if (this.mobileMenuOpen) {
        this.mobileMenuOpen = false
        menuBtn.classList.remove("open")
        mobileNav.classList.remove("mobile-menu-enter")
        mobileNav.classList.add("mobile-menu-exit")

        setTimeout(() => {
          mobileNav.classList.add("hidden")
          mobileNav.classList.remove("mobile-menu-exit")
        }, 300)
      }
    }

    // Add event listeners to mobile nav links
    mobileNav.addEventListener("click", (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === "A" || target.tagName === "BUTTON") {
        closeMobileMenu()
      }
    })
  }

  private updateNavigation() {
    const navLinks = document.getElementById("nav-links")
    const mobileNavLinks = document.getElementById("mobile-nav-links")

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

    // Clear both desktop and mobile navigation
    navLinks.innerHTML = ""
    if (mobileNavLinks) {
      mobileNavLinks.innerHTML = ""
    }

    // Render desktop links
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

    // Render mobile links
    if (mobileNavLinks) {
      links
        .filter((link) => link.show)
        .forEach((link) => {
          const a = document.createElement("a")
          a.href = link.href
          a.className =
            "block py-3 px-4 text-gray-300 hover:text-42-accent hover:bg-gray-800 rounded-lg transition-colors font-medium text-lg"
          a.setAttribute("data-link", "")
          a.textContent = link.label
          mobileNavLinks.appendChild(a)
        })
    }

    // Auth button for desktop
    if (authState.isLoading) {
      const loading = document.createElement("span")
      loading.className = "text-gray-400"
      loading.textContent = "..."
      navLinks.appendChild(loading)
    } else if (authState.isAuthenticated && authState.user) {
      // Desktop user menu
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

      // Mobile user info and logout
      if (mobileNavLinks) {
        const mobileUserDiv = document.createElement("div")
        mobileUserDiv.className = "border-t border-gray-700 pt-4 mt-4"

        const mobileUserInfo = document.createElement("div")
        mobileUserInfo.className = "flex items-center gap-3 mb-4 px-4"

        const mobileAvatar = document.createElement("div")
        mobileAvatar.className =
          "w-10 h-10 rounded-full bg-42-accent flex items-center justify-center text-base font-bold"
        if (authState.user.avatarUrl) {
          mobileAvatar.innerHTML = `<img src="${authState.user.avatarUrl}" alt="${authState.user.displayName}" class="w-full h-full rounded-full object-cover" />`
        } else {
          mobileAvatar.textContent = authState.user.displayName
            .charAt(0)
            .toUpperCase()
        }
        mobileUserInfo.appendChild(mobileAvatar)

        const mobileUsername = document.createElement("span")
        mobileUsername.className = "text-gray-300 font-medium text-lg"
        mobileUsername.textContent = authState.user.displayName
        mobileUserInfo.appendChild(mobileUsername)

        mobileUserDiv.appendChild(mobileUserInfo)

        const mobileLogoutBtn = new Button({
          text: i18n.t("nav.logout"),
          variant: "ghost",
          size: "md",
          onClick: () => authStore.logout(),
        })
        mobileLogoutBtn.getElement().className = "w-full"
        mobileUserDiv.appendChild(mobileLogoutBtn.getElement())

        mobileNavLinks.appendChild(mobileUserDiv)
      }
    } else {
      // Desktop login button
      const loginBtn = new Button({
        text: i18n.t("nav.login"),
        variant: "primary",
        size: "sm",
        onClick: () => authStore.login(),
      })
      navLinks.appendChild(loginBtn.getElement())

      // Mobile login button
      if (mobileNavLinks) {
        const mobileLoginBtn = new Button({
          text: i18n.t("nav.login"),
          variant: "primary",
          size: "md",
          onClick: () => authStore.login(),
        })
        mobileLoginBtn.getElement().className = "w-full mt-4"
        mobileNavLinks.appendChild(mobileLoginBtn.getElement())
      }
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
      button.className = `px-2 md:px-3 py-1 rounded transition-colors text-sm md:text-base ${
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

      // Add separator (hidden on very small screens)
      if (index < languages.length - 1) {
        const separator = document.createElement("span")
        separator.className = "text-gray-600 mx-1"
        separator.textContent = "|"
        selector.appendChild(separator)
      }
    })
  }
}

// Start the application
new App()
