import en from "./en.json"
import fr from "./fr.json"
import ja from "./ja.json"

type Translations = Record<string, any>

class I18n {
  private translations: Map<string, Translations>
  public currentLanguage: string

  constructor() {
    this.translations = new Map()
    this.currentLanguage = "en"
  }

  async init() {
    this.translations.set("en", en)
    this.translations.set("ja", ja)
    this.translations.set("fr", fr)

    // Load saved language preference
    const saved = localStorage.getItem("language")
    if (saved && this.translations.has(saved)) {
      this.currentLanguage = saved
    } else {
      // Auto-detect browser language
      const browserLang = navigator.language.split("-")[0]
      if (this.translations.has(browserLang)) {
        this.currentLanguage = browserLang
      }
    }
  }

  setLanguage(lang: string) {
    if (this.translations.has(lang)) {
      this.currentLanguage = lang
      localStorage.setItem("language", lang)
    }
  }

  t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split(".")
    const translations = this.translations.get(this.currentLanguage)

    if (!translations) {
      return key
    }

    let value: any = translations
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) {
        return key
      }
    }

    let result = String(value)

    // Replace placeholders like {{number}} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(
          new RegExp(`{{${paramKey}}}`, "g"),
          String(paramValue),
        )
      })
    }

    return result
  }
}

export const i18n = new I18n()
