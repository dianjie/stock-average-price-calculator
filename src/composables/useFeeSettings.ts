import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { saveUserFeeSettings, getUserFeeSettings } from '../firebase/db'
import { DEFAULT_FEE_SETTINGS, type FeeSettings } from '@/config/feeSettings'

export function useFeeSettings() {
  const feeSettings = ref<FeeSettings>({ ...DEFAULT_FEE_SETTINGS })

  async function loadFeeSettings(currentUser: { uid: string } | null) {
    if (currentUser) {
      const data = await getUserFeeSettings(currentUser.uid)
      if (data && typeof data.commission === 'number') {
        feeSettings.value = data as unknown as FeeSettings
      }
    } else {
      const raw = localStorage.getItem('feeSettings')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed.commission === 'number') {
          feeSettings.value = parsed
        }
      }
    }
  }

  async function saveFeeSettings(settings: FeeSettings, currentUser: { uid: string } | null) {
    const clean: FeeSettings = {
      commission: Number(settings.commission),
      minCommission: Number(settings.minCommission),
      stampTax: Number(settings.stampTax),
      transferFee: Number(settings.transferFee),
      etfCommission: Number(settings.etfCommission),
      goldSellFeeRate: Number(settings.goldSellFeeRate),
    }

    if (currentUser) {
      await saveUserFeeSettings(currentUser.uid, clean)
    } else {
      localStorage.setItem('feeSettings', JSON.stringify(clean))
    }

    feeSettings.value = clean
    toast.success('费率设置保存成功')
  }

  function resetToDefaults() {
    feeSettings.value = { ...DEFAULT_FEE_SETTINGS }
  }

  return { feeSettings, loadFeeSettings, saveFeeSettings, resetToDefaults }
}
