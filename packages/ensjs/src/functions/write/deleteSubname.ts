import {
  Account,
  Hash,
  SendTransactionParameters,
  Transport,
  encodeFunctionData,
} from 'viem'
import { ChainWithEns, WalletWithEns } from '../../contracts/addContracts'
import { getChainContractAddress } from '../../contracts/getChainContractAddress'
import {
  setSubnodeRecordSnippet as nameWrapperSetSubnodeRecordSnippet,
  setRecordSnippet,
} from '../../contracts/nameWrapper'
import { setSubnodeRecordSnippet as registrySetSubnodeRecordSnippet } from '../../contracts/registry'
import {
  AdditionalParameterSpecifiedError,
  InvalidContractTypeError,
  UnsupportedNameTypeError,
} from '../../errors/general'
import {
  Prettify,
  SimpleTransactionRequest,
  WriteTransactionParameters,
} from '../../types'
import { EMPTY_ADDRESS } from '../../utils/consts'
import { getNameType } from '../../utils/getNameType'
import { makeLabelNodeAndParent } from '../../utils/makeLabelNodeAndParent'
import { namehash } from '../../utils/normalise'

type BaseDeleteSubnameDataParameters = {
  name: string
  contract: 'registry' | 'nameWrapper'
  asOwner?: boolean
}

type RegistryDeleteSubnameDataParameters = {
  contract: 'registry'
  asOwner?: never
}

type NameWrapperDeleteSubnameDataParameters = {
  contract: 'nameWrapper'
  asOwner?: boolean
}

export type DeleteSubnameDataParameters = BaseDeleteSubnameDataParameters &
  (RegistryDeleteSubnameDataParameters | NameWrapperDeleteSubnameDataParameters)

export type DeleteSubnameDataReturnType = SimpleTransactionRequest

export type DeleteSubnameParameters<
  TChain extends ChainWithEns,
  TAccount extends Account | undefined,
  TChainOverride extends ChainWithEns | undefined,
> = Prettify<
  DeleteSubnameDataParameters &
    WriteTransactionParameters<TChain, TAccount, TChainOverride>
>

export type DeleteSubnameReturnType = Hash

export const makeFunctionData = <
  TChain extends ChainWithEns,
  TAccount extends Account | undefined,
>(
  wallet: WalletWithEns<Transport, TChain, TAccount>,
  { name, contract, asOwner }: DeleteSubnameDataParameters,
): DeleteSubnameDataReturnType => {
  const nameType = getNameType(name)
  if (nameType !== 'eth-subname' && nameType !== 'other-subname')
    throw new UnsupportedNameTypeError({
      nameType,
      supportedNameTypes: ['eth-subname', 'other-subname'],
      details: 'Cannot delete a name that is not a subname',
    })

  switch (contract) {
    case 'registry': {
      if (asOwner)
        throw new AdditionalParameterSpecifiedError({
          parameter: 'asOwner',
          allowedParameters: ['name', 'contract'],
          details:
            'Deleting a suname as the name owner is not currently supported for the registry contract.',
        })

      const { labelhash, parentNode } = makeLabelNodeAndParent(name)
      return {
        to: getChainContractAddress({
          client: wallet,
          contract: 'ensRegistry',
        }),
        data: encodeFunctionData({
          abi: registrySetSubnodeRecordSnippet,
          functionName: 'setSubnodeRecord',
          args: [
            parentNode,
            labelhash,
            EMPTY_ADDRESS,
            EMPTY_ADDRESS,
            BigInt(0),
          ],
        }),
      }
    }
    case 'nameWrapper': {
      const nameWrapperAddress = getChainContractAddress({
        client: wallet,
        contract: 'ensNameWrapper',
      })
      if (asOwner) {
        const node = namehash(name)
        return {
          to: nameWrapperAddress,
          data: encodeFunctionData({
            abi: setRecordSnippet,
            functionName: 'setRecord',
            args: [node, EMPTY_ADDRESS, EMPTY_ADDRESS, BigInt(0)],
          }),
        }
      }

      const { label, parentNode } = makeLabelNodeAndParent(name)
      return {
        to: nameWrapperAddress,
        data: encodeFunctionData({
          abi: nameWrapperSetSubnodeRecordSnippet,
          functionName: 'setSubnodeRecord',
          args: [
            parentNode,
            label,
            EMPTY_ADDRESS,
            EMPTY_ADDRESS,
            BigInt(0),
            0,
            BigInt(0),
          ],
        }),
      }
    }
    default:
      throw new InvalidContractTypeError({
        contractType: contract,
        supportedContractTypes: ['registry', 'nameWrapper'],
      })
  }
}

async function deleteSubname<
  TChain extends ChainWithEns,
  TAccount extends Account | undefined,
  TChainOverride extends ChainWithEns | undefined = ChainWithEns,
>(
  wallet: WalletWithEns<Transport, TChain, TAccount>,
  {
    name,
    contract,
    asOwner,
    ...txArgs
  }: DeleteSubnameParameters<TChain, TAccount, TChainOverride>,
): Promise<DeleteSubnameReturnType> {
  const data = makeFunctionData(wallet, {
    name,
    contract,
    asOwner,
  } as DeleteSubnameDataParameters)
  const writeArgs = {
    ...data,
    ...txArgs,
  } as SendTransactionParameters<TChain, TAccount, TChainOverride>
  return wallet.sendTransaction(writeArgs)
}

deleteSubname.makeFunctionData = makeFunctionData

export default deleteSubname
