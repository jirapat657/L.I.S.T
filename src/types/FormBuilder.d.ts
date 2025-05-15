import { Control, RegisterOptions } from 'react-hook-form'

export type FieldProps = {
  inputType: string
  label: string
  name: string
  required?: boolean
  labelPosition?: string
  rules?: RegisterOptions
}

export type FormBuilderProps = {
  control: Control
  fields: FieldsInputProps[]
  onChange?: (value: unknown) => void
  spanText?: number
  spanInput?: number
  filter?: boolean
  errors?: Record<string, unknown>
  onSuspend?: () => void
  onDelete?: () => void
  onActive?: () => void
  colSpan?: number
}

export type FormOptionProps = {
  value: string
  label: string
}

export type FormUserSettingProps = {
  fields: FieldProps[]
  control: Control
  onChange?: (value: unknown) => void
  edit?: boolean
  openedChangePassword?: boolean
  openChangePassword?: () => void
  closeChangePassword?: () => void
}

export type FieldsInputProps = {
  inputType: string
  name: string
  disabled?: boolean
  loading?: boolean
  clearable?: boolean
  options?: { value: string; label: string }[]
  labelPosition?: string
  label?: string
  rules?: RegisterOptions
  textRight?: boolean
  max?: number
  placeholder?: string
  defaultValue?: unknown
  required?: boolean
  disabledDate?: Date | ((date: Date) => boolean)
  condition?: Record<string, unknown>
  showSearch?: boolean
}
