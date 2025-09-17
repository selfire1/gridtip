export function getConstructorCssVariable(teamId: string, opacity = 1) {
  const variableName = `--clr-team-${teamId}`
  return `rgba(var(${variableName}), ${opacity})`
}
