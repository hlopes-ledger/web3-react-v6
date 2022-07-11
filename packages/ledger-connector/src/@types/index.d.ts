export type LedgerConnectKit = {
  checkConnectSupport: Function;
  showModal: Function;
}

export type InjectedProvider = Record<string, boolean> &
  Record<string, InjectedProvider[]>
