import { FieldErrors } from '@/components/ui/field'
import { SUPPORTED_ICON_NAMES } from '@/constants/icon-names'
import z from 'zod'

export const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(60, 'Too long'),
  icon: z.enum(SUPPORTED_ICON_NAMES, 'Invalid icon'),
  cutoff: z.coerce.number().min(0),
})

export type Schema = z.infer<typeof schema>
export function validateSchema(
  values: Schema,
  setFormErrors: React.Dispatch<
    React.SetStateAction<Record<keyof Schema, FieldErrors> | undefined>
  >,
): values is Schema {
  const result = schema.safeParse(values)
  if (!result.success) {
    const errors = z.treeifyError(result.error)
    setFormErrors({
      name: getErrors('name'),
      icon: getErrors('icon'),
      cutoff: getErrors('cutoff'),
    })

    function getErrors(key: keyof Schema) {
      return errors.properties?.[key]?.errors?.map((e) => ({ message: e }))
    }
  }
  return result.success
}
