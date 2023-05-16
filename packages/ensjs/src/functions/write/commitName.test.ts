import { Address, Hex } from 'viem'
import { commitmentsSnippet } from '../../contracts/ethRegistrarController'
import { getChainContractAddress } from '../../contracts/getChainContractAddress'
import {
  publicClient,
  testClient,
  waitForTransaction,
  walletClient,
} from '../../tests/addTestContracts'
import {
  RegistrationParameters,
  makeCommitment,
} from '../../utils/registerHelpers'
import commitName from './commitName'

let snapshot: Hex
let accounts: Address[]

beforeAll(async () => {
  accounts = await walletClient.getAddresses()
})

beforeEach(async () => {
  snapshot = await testClient.snapshot()
})

afterEach(async () => {
  await testClient.revert({ id: snapshot })
})

const secret = `0x${'a'.repeat(64)}` as Hex

it('should return a commit transaction and succeed', async () => {
  const params: RegistrationParameters = {
    name: 'wrapped-with-subnames.eth',
    duration: 31536000,
    owner: accounts[1],
    secret,
  }
  const tx = await commitName(walletClient, {
    ...params,
    account: accounts[1],
  })
  expect(tx).toBeTruthy()
  const receipt = await waitForTransaction(tx)
  expect(receipt.status).toBe('success')

  const commitment = await publicClient.readContract({
    abi: commitmentsSnippet,
    functionName: 'commitments',
    address: getChainContractAddress({
      client: publicClient,
      contract: 'ensEthRegistrarController',
    }),
    args: [makeCommitment(params)],
  })
  expect(commitment).toBeTruthy()
})