const AUTH_ERROR_MAP: Record<string, string> = {
  'auth/email-already-in-use': '该邮箱已被注册',
  'auth/invalid-email': '邮箱格式不正确',
  'auth/user-not-found': '邮箱或密码错误',
  'auth/wrong-password': '邮箱或密码错误',
  'auth/weak-password': '密码强度太弱',
  'auth/too-many-requests': '操作过于频繁，请稍后再试',
  'auth/invalid-credential': '密码不正确',
}

export function mapAuthError(error: { code?: string }): string {
  return AUTH_ERROR_MAP[error.code ?? ''] ?? '操作失败，请重试'
}
