type Theme = typeof Light

const Light = {
  border: '#E5E5E5',
  mutedForeground: '#737373',
  background: '#FFFFFF',
}

const Dark = {
  border: '#FFFFFF',
  mutedForeground: '#A1A1A1',
  background: '#0A0A0A',
} satisfies Theme

export function getTheme(mode: 'dark' | 'light') {
  return mode === 'dark' ? Dark : Light
}
