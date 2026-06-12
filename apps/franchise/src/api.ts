export type AuthenticatedUser = {
  sub?: string;
  username: string;
  displayName: string;
  subjectType: string;
  subjectId: string;
  permissions?: string[];
};

export type LoginResponse = {
  tokenType: 'Bearer';
  accessToken: string;
  expiresIn: number;
  sessionId: string;
  user: AuthenticatedUser;
};

export type IssueWelfareCardResponse = {
  idempotentReplay: boolean;
  account: {
    accountNo: string;
    franchiseId: string;
    buyerUserId: string;
    status: string;
    balanceAmount: number;
    issuedAmount: number;
  };
  ledgerEntry: {
    ledgerNo: string;
    requestId: string;
    type: string;
    amount: number;
    balanceAfter: number;
  };
};

export function apiBaseUrl() {
  return import.meta.env.VITE_FRANCHISE_API_BASE_URL ?? 'http://localhost:3000/api';
}

export async function loginFranchise(input: { username: string; password: string }): Promise<LoginResponse> {
  const response = await fetch(`${apiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: input.username.trim(), password: input.password })
  });

  if (!response.ok) {
    throw new Error(`Failed to login franchise: ${response.status}`);
  }

  const result = (await response.json()) as LoginResponse;
  if (result.user.subjectType !== 'franchise') {
    throw new Error('登录账号不是加盟商主体');
  }

  return result;
}

export async function issueWelfareCard(input: {
  token: string;
  franchiseId: string;
  requestId: string;
  buyerUserId: string;
  amount: number;
  remark?: string | null;
}): Promise<IssueWelfareCardResponse> {
  const response = await fetch(
    `${apiBaseUrl()}/franchises/${encodeURIComponent(input.franchiseId.trim())}/welfare-cards/issue`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestId: input.requestId.trim(),
        buyerUserId: input.buyerUserId.trim(),
        amount: input.amount,
        remark: input.remark?.trim() || undefined
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to issue welfare card: ${response.status}`);
  }

  return response.json() as Promise<IssueWelfareCardResponse>;
}
