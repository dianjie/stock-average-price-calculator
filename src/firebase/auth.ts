import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from 'firebase/auth'
import { auth } from './index'

export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(userCredential.user, {
    displayName,
  })
  return userCredential.user
}

export const loginUser = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export const logoutUser = (): Promise<void> => {
  return signOut(auth)
}

export const getCurrentUser = (): User | null => {
  return auth.currentUser
}

export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback)
}

export const reauthenticateUser = async (password: string): Promise<void> => {
  const user = auth.currentUser
  if (!user || !user.email) {
    throw new Error('用户未登录或邮箱不存在')
  }

  const credential = EmailAuthProvider.credential(user.email!, password)

  await reauthenticateWithCredential(user, credential)
}

export const changeUserPassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = auth.currentUser
  if (!user) {
    throw new Error('用户未登录')
  }

  await reauthenticateUser(currentPassword)

  await updatePassword(user, newPassword)
}
