import defu from 'defu'

export function getConstructorCssVariable(
  teamId: string,
  options?: {
    opacity?: number
    accessible?: boolean
  },
) {
  const config = defu(options, {
    opacity: 1,
    accessible: false,
  })
  const variableName = `--clr-team-${teamId}${config.accessible ? '--accessible' : ''}`
  return `rgba(var(${variableName}), ${config.opacity})`
}
