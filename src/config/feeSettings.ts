export interface FeeSettings {
  commission: number
  minCommission: number
  stampTax: number
  transferFee: number
  etfCommission: number
  goldSellFeeRate: number
}

export const DEFAULT_FEE_SETTINGS: FeeSettings = {
  commission: 0.00025,
  minCommission: 5,
  stampTax: 0.0005,
  transferFee: 0.00001,
  etfCommission: 0.00025,
  goldSellFeeRate: 0.004,
}
