import { FieldErrors } from '@/components/ui/field'
import { SUPPORTED_ICON_NAMES } from '@/constants/icon-names'
import z from 'zod'

export const CreateGroupSchema = z.object({
  name: z.string().trim().min(1, 'Required').max(60, 'Too long'),
  icon: z.enum(SUPPORTED_ICON_NAMES, 'Invalid icon'),
  cutoff: z.coerce.number().min(0),
  userName: z.string(),
})

export const CreateGroupDetailsOnlySchema = CreateGroupSchema.omit({
  userName: true,
})

export type CreateGroupData = z.infer<typeof CreateGroupSchema>
export type CreateGroupDetailsOnlyData = Omit<CreateGroupData, 'userName'>

export function validateGroupDetailSchema(
  values: CreateGroupDetailsOnlyData,
  setFormErrors: React.Dispatch<
    React.SetStateAction<
      Record<keyof CreateGroupDetailsOnlyData, FieldErrors> | undefined
    >
  >,
): values is CreateGroupDetailsOnlyData {
  const result = CreateGroupDetailsOnlySchema.safeParse(values)
  if (!result.success) {
    const errors = z.treeifyError(result.error)
    setFormErrors({
      // @ts-expect-error TODO: gotta fix
      name: getErrors('name'),
      // @ts-expect-error TODO: gotta fix
      icon: getErrors('icon'),
      // @ts-expect-error TODO: gotta fix
      cutoff: getErrors('cutoff'),
    })

    function getErrors(key: keyof CreateGroupDetailsOnlyData) {
      return errors.properties?.[key]?.errors?.map((e) => ({ message: e }))
    }
  }
  return result.success
}
