declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

let scriptLoaded = false

export function useRecaptcha() {
  const { public: { recaptchaSiteKey } } = useRuntimeConfig()

  function loadScript(): Promise<void> {
    if (scriptLoaded || !recaptchaSiteKey) return Promise.resolve()
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`
      script.onload = () => { scriptLoaded = true; resolve() }
      document.head.appendChild(script)
    })
  }

  async function getToken(action: string): Promise<string | null> {
    if (!recaptchaSiteKey) return null
    await loadScript()
    return new Promise((resolve) => {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(recaptchaSiteKey, { action })
          resolve(token)
        } catch {
          resolve(null)
        }
      })
    })
  }

  return { getToken }
}
