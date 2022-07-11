import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnector } from '@web3-react/abstract-connector'
import Web3ProviderEngine from 'web3-provider-engine'
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
import CacheSubprovider from 'web3-provider-engine/subproviders/cache.js'
import { RPCSubprovider } from '@0x/subproviders/lib/src/subproviders/rpc_subprovider' // https://github.com/0xProject/0x-monorepo/issues/1400

import { injectConnectKit } from './lib/injectConnectKit'

interface LedgerConnectorArguments {
  chainId: number
  url: string
  pollingInterval?: number
  requestTimeoutMs?: number
  accountFetchingConfigs?: any
  baseDerivationPath?: string
}

export class LedgerConnector extends AbstractConnector {
  private readonly chainId: number
  private readonly url: string
  private readonly pollingInterval?: number
  private readonly requestTimeoutMs?: number
  private readonly accountFetchingConfigs?: any
  private readonly baseDerivationPath?: string

  private provider: any

  constructor({
    chainId,
    url,
    pollingInterval,
    requestTimeoutMs,
    accountFetchingConfigs,
    baseDerivationPath
  }: LedgerConnectorArguments) {
    super({ supportedChainIds: [chainId] })

    this.chainId = chainId
    this.url = url
    this.pollingInterval = pollingInterval
    this.requestTimeoutMs = requestTimeoutMs
    this.accountFetchingConfigs = accountFetchingConfigs
    this.baseDerivationPath = baseDerivationPath
  }

  public async activate(): Promise<ConnectorUpdate> {
    console.log('provider is ', this.provider)

    // if (!this.provider) {
    // //
    // const { checkConnectSupport, showModal } = await injectConnectKit()
    // const connectSupport = checkConnectSupport();
    // alert(JSON.stringify(connectSupport))

    // // show a UI modal deppending on the Connect support
    // const showModalResponse = showModal(connectSupport)
    // alert(JSON.stringify(showModalResponse))

    // if (connectSupport.isConnectSupported && !showModalResponse?.error) {
    //   this.provider = window.ethereum

    //   // Connect is supported and no error was triggered, we can access the
    //   // provider injected by Connect
    //   return {
    //     provider: this.provider,
    //     chainId: this.chainId
    //   }
    // } else if (!!showModalResponse?.error) {
    //   // if an error was triggered show it
    //   throw showModalResponse.error
    // }

    // console.log('using USB fallback')

    if (!this.provider) {
      // use USB if it is supported
      const engine = new Web3ProviderEngine({ pollingInterval: this.pollingInterval })
      engine.addProvider(
        new LedgerSubprovider({
          networkId: this.chainId,
          ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
          accountFetchingConfigs: this.accountFetchingConfigs,
          baseDerivationPath: this.baseDerivationPath
        })
      )
      engine.addProvider(new CacheSubprovider())
      engine.addProvider(new RPCSubprovider(this.url, this.requestTimeoutMs))
      this.provider = engine

      console.log('new provider is ', this.provider)
    }

    this.provider.start()

    return { provider: this.provider, chainId: this.chainId }
  }

  public async getProvider(): Promise<Web3ProviderEngine> {
    return this.provider
  }

  public async getChainId(): Promise<number> {
    return this.chainId
  }

  public async getAccount(): Promise<null> {
    return this.provider._providers[0].getAccountsAsync(1).then((accounts: string[]): string => accounts[0])
  }

  public deactivate() {
    this.provider.stop()
  }
}
