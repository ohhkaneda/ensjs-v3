import { stringToBytes } from 'viem'
import { WrappedLabelTooLargeError } from '../errors/utils'
import { AnyDate } from '../types'

export const MAX_EXPIRY = 2n ** 64n - 1n

export const expiryToBigInt = (expiry?: AnyDate, defaultValue = 0n): bigint => {
  if (!expiry) return defaultValue
  if (typeof expiry === 'bigint') return expiry
  if (typeof expiry === 'string' || typeof expiry === 'number')
    return BigInt(expiry)
  throw new TypeError('Expiry must be a bigint, string, number or Date')
}

export const wrappedLabelLengthCheck = (label: string) => {
  const bytes = stringToBytes(label)
  if (bytes.byteLength > 255)
    throw new WrappedLabelTooLargeError({ label, byteLength: bytes.byteLength })
}
