import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function valueUpdater<T extends object>(
  updaterOrValue: T | ((prev: T) => T),
  ref: { value: T },
): void {
  if (typeof updaterOrValue === 'function') {
    ref.value = (updaterOrValue as (prev: T) => T)(ref.value)
  } else {
    ref.value = updaterOrValue
  }
}
