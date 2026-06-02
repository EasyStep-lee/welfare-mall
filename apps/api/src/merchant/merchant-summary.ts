import { MerchantStatus } from './merchant-status';

export type MerchantBusinessScopeInput = {
  code: string;
  label: string;
};

export type MerchantSummaryInput = {
  id: string;
  code: string;
  name: string;
  franchiseId: string;
  businessScopes: MerchantBusinessScopeInput[];
  status: MerchantStatus;
};

export type MerchantSummary = {
  id: string;
  code: string;
  name: string;
  franchiseId: string;
  businessScopeLabels: string[];
  status: MerchantStatus;
};

export function buildMerchantSummary(input: MerchantSummaryInput): MerchantSummary {
  return {
    id: input.id,
    code: input.code,
    name: input.name,
    franchiseId: input.franchiseId,
    businessScopeLabels: input.businessScopes.map((scope) => scope.label),
    status: input.status
  };
}
