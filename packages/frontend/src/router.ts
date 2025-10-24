import { DashboardPage } from "./pages/DashboardPage"
import { HomePage } from "./pages/HomePage"
import { MatchHistoryPage } from "./pages/MatchHistoryPage"
import { OnlineGamePage } from "./pages/OnlineGamePage"
import { OnlinePlayPage } from "./pages/OnlinePlayPage"
import { ProfilePage } from "./pages/ProfilePage"
import { TournamentCreatePage } from "./pages/TournamentCreatePage"
import { TournamentPlayPage } from "./pages/TournamentPlayPage"

interface PageInstance {
  getElement(): HTMLElement
  destroy?: () => void
}

export class Router {
  private routes: Map<string, (params?: any) => PageInstance>
  private currentPage: PageInstance | null = null

  constructor() {
    this.routes = new Map()
    this.setupRoutes()
  }

  private setupRoutes() {
    // Static routes
    this.routes.set("/", () => new HomePage())
    this.routes.set("/tournament/create", () => new TournamentCreatePage())
    this.routes.set("/online-play", () => new OnlinePlayPage())

    // Dynamic routes are handled in navigateTo
  }

  public init() {
    // Handle link clicks
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement
      // Find the closest ancestor with data-link attribute
      const link = target.closest("[data-link]") as HTMLAnchorElement
      if (link) {
        e.preventDefault()
        const href = link.getAttribute("href")
        if (href) {
          this.navigateTo(href)
        }
      }
    })

    // Handle custom navigate events
    window.addEventListener("navigate", ((e: CustomEvent) => {
      this.navigateTo(e.detail)
    }) as EventListener)

    // CRITICAL: Handle browser back/forward buttons for SPA
    window.addEventListener("popstate", (e) => {
      // Use stored state if available, otherwise use current pathname
      const path = (e.state?.path as string) || window.location.pathname
      this.navigateTo(path, false)
    })

    // Initial route
    this.navigateTo(window.location.pathname, false)
  }

  public navigateTo(path: string, pushState = true) {
    // CRITICAL: Update browser history for SPA navigation
    if (pushState && window.location.pathname !== path) {
      window.history.pushState({ path }, "", path)
    }

    // Destroy current page
    if (this.currentPage?.destroy) {
      try {
        this.currentPage.destroy()
      } catch (error) {
        console.error("[Router] Error destroying page:", error)
      }
    }

    // Parse dynamic routes
    let page: PageInstance | null = null

    // Tournament play page: /tournament/:id/play
    const tournamentPlayMatch = path.match(/^\/tournament\/(\d+)\/play$/)
    if (tournamentPlayMatch) {
      const tournamentId = parseInt(tournamentPlayMatch[1], 10)
      page = new TournamentPlayPage(tournamentId)
    }

    // Profile page: /profile/:id
    const profileMatch = path.match(/^\/profile\/(\d+)$/)
    if (profileMatch) {
      const userId = parseInt(profileMatch[1], 10)
      page = new ProfilePage(userId)
    }

    // Dashboard page: /dashboard/:id
    const dashboardMatch = path.match(/^\/dashboard\/(\d+)$/)
    if (dashboardMatch) {
      const userId = parseInt(dashboardMatch[1], 10)
      page = new DashboardPage(userId)
    }

    // Match History page: /match-history/:id
    const matchHistoryMatch = path.match(/^\/match-history\/(\d+)$/)
    if (matchHistoryMatch) {
      const userId = parseInt(matchHistoryMatch[1], 10)
      page = new MatchHistoryPage(userId)
    }

    // Online Game page: /game/online/:roomId
    const onlineGameMatch = path.match(/^\/game\/online\/(.+)$/)
    if (onlineGameMatch) {
      const roomId = onlineGameMatch[1]
      page = new OnlineGamePage(roomId)
    }

    // Static routes
    if (!page) {
      const route = this.routes.get(path)
      if (route) {
        page = route()
      }
    }

    // 404 if no route found
    if (!page) {
      page = this.create404Page()
    }

    this.currentPage = page

    // Render page
    const content = document.getElementById("main-content")
    if (content) {
      content.innerHTML = ""
      content.appendChild(page.getElement())
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  private create404Page(): PageInstance {
    const container = document.createElement("div")
    container.className = "max-w-4xl mx-auto text-center py-20"
    container.innerHTML = `
      <h1 class="text-6xl font-bold mb-8 text-red-500">404</h1>
      <p class="text-xl mb-8 text-gray-300">Page not found</p>
      <a href="/" data-link class="inline-block bg-42-accent hover:bg-42-accent-dark text-white px-6 py-3 rounded-lg transition-colors">
        Go Home
      </a>
    `

    return {
      getElement: () => container,
    }
  }
}
