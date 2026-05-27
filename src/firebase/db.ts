import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './index'

export const saveUserStocks = async (userId: string | null, stocks: unknown[]): Promise<void> => {
  if (!userId) {
    localStorage.setItem('guest_stocks', JSON.stringify(stocks))
    return
  }
  // 深拷贝 stocks，确保不会修改原始数组
  // 同时，过滤掉 undefined 值
  const sanitized = JSON.parse(JSON.stringify({ stocks }))
  await setDoc(doc(db, 'userStocks', userId), sanitized)
}

export const getUserStocks = async (userId: string | null): Promise<unknown[]> => {
  if (!userId) {
    const stocks = localStorage.getItem('guest_stocks')
    return stocks ? JSON.parse(stocks) : []
  }

  const docRef = doc(db, 'userStocks', userId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return docSnap.data().stocks
  }
  return []
}

export const saveUserFeeSettings = async (
  userId: string | null,
  feeSettings: unknown,
): Promise<void> => {
  if (!userId) {
    localStorage.setItem('guest_feeSettings', JSON.stringify(feeSettings))
    return
  }

  await setDoc(doc(db, 'userFeeSettings', userId), { feeSettings })
}

export const getUserFeeSettings = async (
  userId: string | null,
): Promise<Record<string, unknown> | null> => {
  if (!userId) {
    const feeSettings = localStorage.getItem('guest_feeSettings')
    return feeSettings ? JSON.parse(feeSettings) : null
  }

  const docRef = doc(db, 'userFeeSettings', userId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return docSnap.data().feeSettings
  }
  return null
}
