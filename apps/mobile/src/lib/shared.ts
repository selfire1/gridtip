import type { Constructor } from '@/types'
import { getWebUrl } from './url'
import { getConstructorImage as getAbsoluteConstructorImage } from '@gridtip/shared/get-constructor-image'

export function getConstructorImage(id: Constructor['id']) {
  return getWebUrl(getAbsoluteConstructorImage(id))
}
