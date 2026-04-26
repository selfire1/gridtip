export function getConstructorColor(constructorId: string) {
  const colors = {
    alpine: { default: 'rgb( 0, 161, 232)', accessible: 'rgb(0, 80, 129)' },

    aston_martin: { default: 'rgb( 34, 153, 113)', accessible: 'rgb(0, 72, 44)' },

    audi: { default: 'rgb( 245, 5, 55)', accessible: 'rgb(107, 0, 21)' },

    cadillac: { default: 'rgb( 144, 144, 144)', accessible: 'rgb(68, 68, 68)' },

    ferrari: { default: 'rgb( 237, 17, 49)', accessible: 'rgb(113, 0, 6)' },

    haas: { default: 'rgb( 156, 159, 162)', accessible: 'rgb(77, 80, 82)' },

    mclaren: { default: 'rgb( 244, 118, 0)', accessible: 'rgb(134, 52, 0)' },

    mercedes: { default: 'rgb( 0, 215, 182)', accessible: 'rgb(0, 117, 96)' },

    rb: { default: 'rgb( 108, 152, 255)', accessible: 'rgb(35, 69, 171)' },

    red_bull: { default: 'rgb( 71, 129, 215)', accessible: 'rgb(0, 50, 130)' },

    williams: { default: 'rgb( 24, 104, 219)', accessible: 'rgb(0, 6, 129;)' },
  }

  return colors[constructorId as keyof typeof colors]
}
