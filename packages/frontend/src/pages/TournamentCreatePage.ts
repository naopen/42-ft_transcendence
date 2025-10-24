import { Alert } from "../components/Alert"
import { Button } from "../components/Button"
import { Input } from "../components/Input"
import { i18n } from "../i18n"
import { tournamentStore } from "../stores/tournament.store"

export class TournamentCreatePage {
  private container: HTMLDivElement
  private tournamentNameInput: Input
  private playerInputs: Input[] = []
  private addPlayerButton: Button
  private createButton: Button
  private playersContainer: HTMLDivElement

  constructor() {
    this.container = document.createElement("div")
    this.container.className = "max-w-3xl mx-auto"

    // Tournament Name Input
    this.tournamentNameInput = new Input({
      type: "text",
      label: i18n.t("tournament.create.tournamentName"),
      placeholder: i18n.t("tournament.create.tournamentNamePlaceholder"),
      required: true,
      maxLength: 50,
    })

    // Players Container
    this.playersContainer = document.createElement("div")
    this.playersContainer.className = "space-y-3 mb-6"

    // Add Player Button
    this.addPlayerButton = new Button({
      text: i18n.t("tournament.create.addPlayer"),
      variant: "secondary",
      onClick: () => this.addPlayerInput(),
    })

    // Create Tournament Button
    this.createButton = new Button({
      text: i18n.t("tournament.create.createButton"),
      variant: "primary",
      size: "lg",
      onClick: () => this.handleCreate(),
    })

    // Add initial 3 players
    for (let i = 0; i < 3; i++) {
      this.addPlayerInput()
    }

    this.render()
  }

  private addPlayerInput(): void {
    if (this.playerInputs.length >= 16) {
      Alert.warning(i18n.t("tournament.create.maxPlayers"))
      return
    }

    const index = this.playerInputs.length + 1
    const playerInput = new Input({
      type: "text",
      label: `${i18n.t("tournament.create.playerLabel")} ${index}`,
      placeholder: i18n.t("tournament.create.playerPlaceholder"),
      required: true,
      minLength: 2,
      maxLength: 20,
    })

    this.playerInputs.push(playerInput)
    this.updatePlayersContainer()

    // Focus on new input
    setTimeout(() => playerInput.focus(), 100)
  }

  private removePlayerInput(index: number): void {
    if (this.playerInputs.length <= 3) {
      Alert.warning(i18n.t("tournament.create.minPlayers"))
      return
    }

    this.playerInputs.splice(index, 1)
    this.updatePlayersContainer()
  }

  private updatePlayersContainer(): void {
    this.playersContainer.innerHTML = ""

    this.playerInputs.forEach((input, index) => {
      // Update the label to reflect the current sequential position
      input.updateLabel(`${i18n.t("tournament.create.playerLabel")} ${index + 1}`)

      const wrapper = document.createElement("div")
      wrapper.className = "flex gap-3 items-end"

      wrapper.appendChild(input.getElement())

      // Remove button (only if more than 3 players)
      if (this.playerInputs.length > 3) {
        const removeButton = new Button({
          text: "✕",
          variant: "danger",
          size: "sm",
          onClick: () => this.removePlayerInput(index),
        })
        wrapper.appendChild(removeButton.getElement())
      }

      this.playersContainer.appendChild(wrapper)
    })
  }

  private render(): void {
    this.container.innerHTML = ""

    // Header
    const header = document.createElement("div")
    header.className = "text-center mb-8"
    header.innerHTML = `
      <h1 class="text-4xl font-bold mb-4 text-42-accent">
        ${i18n.t("tournament.create.title")}
      </h1>
      <p class="text-gray-300">
        ${i18n.t("tournament.create.description")}
      </p>
    `
    this.container.appendChild(header)

    // Form Card
    const card = document.createElement("div")
    card.className = "bg-42-dark p-8 rounded-lg border border-gray-800"

    // Tournament Name
    const nameSection = document.createElement("div")
    nameSection.className = "mb-8"
    nameSection.appendChild(this.tournamentNameInput.getElement())
    card.appendChild(nameSection)

    // Players Section
    const playersSection = document.createElement("div")
    playersSection.className = "mb-6"

    const playersTitle = document.createElement("h2")
    playersTitle.className = "text-xl font-bold mb-4 text-white"
    playersTitle.textContent = i18n.t("tournament.create.playersTitle")
    playersSection.appendChild(playersTitle)

    playersSection.appendChild(this.playersContainer)
    playersSection.appendChild(this.addPlayerButton.getElement())

    card.appendChild(playersSection)

    // Info Box
    const infoBox = document.createElement("div")
    infoBox.className =
      "bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-4 mb-6"
    infoBox.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="text-2xl">ℹ️</span>
        <div class="text-sm text-blue-100">
          <p class="font-bold mb-2">${i18n.t("tournament.create.info.title")}</p>
          <ul class="list-disc list-inside space-y-1">
            <li>${i18n.t("tournament.create.info.minPlayers")}</li>
            <li>${i18n.t("tournament.create.info.maxPlayers")}</li>
            <li>${i18n.t("tournament.create.info.uniqueNames")}</li>
            <li>${i18n.t("tournament.create.info.sameKeyboard")}</li>
          </ul>
        </div>
      </div>
    `
    card.appendChild(infoBox)

    // Create Button
    const buttonContainer = document.createElement("div")
    buttonContainer.className = "flex justify-center"
    buttonContainer.appendChild(this.createButton.getElement())
    card.appendChild(buttonContainer)

    this.container.appendChild(card)
  }

  private async handleCreate(): Promise<void> {
    // Validate tournament name
    const tournamentName = this.tournamentNameInput.getValue().trim()
    if (!tournamentName) {
      this.tournamentNameInput.showError(
        i18n.t("tournament.create.errors.nameRequired"),
      )
      return
    }
    this.tournamentNameInput.clearError()

    // Collect and validate player aliases
    const aliases: string[] = []
    let hasError = false

    for (const input of this.playerInputs) {
      const alias = input.getValue().trim()

      if (!alias) {
        input.showError(i18n.t("tournament.create.errors.aliasRequired"))
        hasError = true
        continue
      }

      if (alias.length < 2) {
        input.showError(i18n.t("tournament.create.errors.aliasTooShort"))
        hasError = true
        continue
      }

      if (aliases.includes(alias)) {
        input.showError(i18n.t("tournament.create.errors.aliasDuplicate"))
        hasError = true
        continue
      }

      input.clearError()
      aliases.push(alias)
    }

    if (hasError) {
      return
    }

    if (aliases.length < 3) {
      Alert.error(i18n.t("tournament.create.errors.notEnoughPlayers"))
      return
    }

    // Create tournament
    this.createButton.setLoading(true)

    try {
      const tournament = await tournamentStore.createTournament(
        tournamentName,
        aliases,
      )

      Alert.success(i18n.t("tournament.create.success"))

      // Navigate to tournament play page
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("navigate", {
            detail: `/tournament/${tournament.id}/play`,
          }),
        )
      }, 500)
    } catch (error: any) {
      Alert.error(
        error.message || i18n.t("tournament.create.errors.createFailed"),
      )
      this.createButton.setDisabled(false)
      this.createButton.updateText(i18n.t("tournament.create.createButton"))
    }
  }

  getElement(): HTMLDivElement {
    return this.container
  }

  destroy(): void {
    // Cleanup if needed
  }
}
