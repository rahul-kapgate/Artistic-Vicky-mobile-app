import { api } from "@/lib/api";

export interface RequestDeleteOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyDeleteOtpResponse {
  success: boolean;
  message: string;
  deletionScheduledAt?: string;
}

export interface ReactivateAccountResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    user_name: string;
    email: string;
    mobile?: string | null;
    is_admin?: boolean;
    avatar_id?: number;
  };
}

export interface PendingDeletionResponse {
  success: boolean;
  code: "ACCOUNT_PENDING_DELETION";
  message: string;
  deletionScheduledAt: string;
  canReactivate: boolean;
  reactivationToken: string;
}

export async function requestDeleteAccountOtp() {
  const { data } = await api.post<RequestDeleteOtpResponse>(
    "/account/delete/request-otp",
  );

  return data;
}

export async function verifyDeleteAccountOtp(otp: string) {
  const { data } = await api.post<VerifyDeleteOtpResponse>(
    "/account/delete/verify-otp",
    {
      otp,
    },
  );

  return data;
}

export async function reactivateAccount(reactivationToken: string) {
  const { data } = await api.post<ReactivateAccountResponse>(
    "/account/reactivate",
    {
      reactivationToken,
    },
  );

  return data;
}
