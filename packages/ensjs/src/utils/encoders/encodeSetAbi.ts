import { encodeFunctionData, type Hex } from 'viem'
import { publicResolverSetAbiSnippet } from '../../contracts/publicResolver.js'
import type { EncodedAbi } from './encodeAbi.js'

export type EncodeSetAbiParameters = {
  namehash: Hex
} & (EncodedAbi | { contentType: 0; encodedData: null })

export type EncodeSetAbiReturnType = Hex

export const encodeSetAbi = ({
  namehash,
  contentType,
  encodedData,
}: EncodeSetAbiParameters): EncodeSetAbiReturnType => {
  return encodeFunctionData({
    abi: publicResolverSetAbiSnippet,
    functionName: 'setABI',
    args: [namehash, BigInt(contentType), encodedData ?? '0x'],
  })
}
