import type { FeeSettings } from '@/config/feeSettings'

export type StockType = 'A股' | 'ETF' | '积存金'
export type TransactionType = '买入' | '卖出'

export function resolveFeeSettings(
  globalSettings: FeeSettings,
  customSettings?: FeeSettings,
): FeeSettings {
  if (!customSettings) return globalSettings
  return customSettings
}

export function getMarketType(code: string): string {
  if (/^(600|601|603|605)/.test(code)) return '沪市主板'
  if (/^000/.test(code)) return '深市主板'
  if (/^002/.test(code)) return '深市中小板'
  if (/^300/.test(code)) return '深市创业板'
  return '其他'
}

function calcFeeInternal(
  type: TransactionType,
  amount: number,
  stockType: StockType,
  isShanghai: boolean,
  feeSettings: FeeSettings,
) {
  if (amount <= 0) return 0
  if (stockType === '积存金') return type === '卖出' ? amount * feeSettings.goldSellFeeRate : 0
  if (stockType === 'ETF') return amount * feeSettings.etfCommission

  let fee = Math.max(amount * feeSettings.commission, feeSettings.minCommission)
  if (type === '卖出') fee += amount * feeSettings.stampTax
  if (isShanghai) fee += amount * feeSettings.transferFee
  return fee
}

export function calculateTransactionFee(
  type: TransactionType,
  price: number,
  quantity: number,
  stockType: StockType,
  marketType: string,
  feeSettings: FeeSettings,
) {
  return calcFeeInternal(
    type,
    price * quantity,
    stockType,
    marketType.startsWith('沪市'),
    feeSettings,
  )
}

export function calculateSellingFee(
  quantity: number,
  price: number,
  stockType: StockType,
  code: string,
  feeSettings: FeeSettings,
) {
  return calcFeeInternal(
    '卖出',
    quantity * price,
    stockType,
    getMarketType(code).startsWith('沪市'),
    feeSettings,
  )
}
