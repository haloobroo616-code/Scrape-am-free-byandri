export interface VerificationState {
  step: 1 | 2 | 3;
  email: string;
  verifyLink: string;
  isSendingEmail: boolean;
  isVerifying: boolean;
  sendSuccess: boolean;
  sendErrorMessage?: string;
  verifySuccess: boolean;
  verifyErrorMessage?: string;
  sendCooldownRemaining: number;
  verifCooldownRemaining: number;
}
