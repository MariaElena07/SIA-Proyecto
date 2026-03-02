import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const guardado = localStorage.getItem('tema')
    return guardado ? guardado === 'dark' : true
  })

  useEffect(() => {
    localStorage.setItem('tema', dark ? 'dark' : 'light')
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [dark])

  // Aplicar al montar
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTema = () => setDark(prev => !prev)

  return (
    <ThemeContext.Provider value={{ dark, toggleTema }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}