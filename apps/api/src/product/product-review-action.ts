export const ProductReviewActions = {
  SaveDraft: 'save_draft',
  SubmitReview: 'submit_review',
  Approve: 'approve',
  Reject: 'reject',
  Archive: 'archive'
} as const;

export type ProductReviewAction = (typeof ProductReviewActions)[keyof typeof ProductReviewActions];

export const ProductReviewActionCatalog: Array<{
  code: ProductReviewAction;
  name: string;
  actor: 'merchant' | 'admin';
}> = [
  { code: ProductReviewActions.SaveDraft, name: '保存草稿', actor: 'merchant' },
  { code: ProductReviewActions.SubmitReview, name: '提交审核', actor: 'merchant' },
  { code: ProductReviewActions.Approve, name: '审核通过', actor: 'admin' },
  { code: ProductReviewActions.Reject, name: '审核驳回', actor: 'admin' },
  { code: ProductReviewActions.Archive, name: '归档', actor: 'admin' }
];
