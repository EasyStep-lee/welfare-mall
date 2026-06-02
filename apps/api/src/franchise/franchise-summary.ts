import { FranchiseStatus } from './franchise-status';

export type FranchiseSummaryInput = {
  id: string;
  code: string;
  name: string;
  regionCode: string;
  status: FranchiseStatus;
};

export type FranchiseSummary = FranchiseSummaryInput;

export function buildFranchiseSummary(input: FranchiseSummaryInput): FranchiseSummary {
  return {
    id: input.id,
    code: input.code,
    name: input.name,
    regionCode: input.regionCode,
    status: input.status
  };
}
