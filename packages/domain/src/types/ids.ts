// Branded ID types (T-005)
export interface UserIdBrand {
  readonly __brand: unique symbol;
}
export type UserId = string & UserIdBrand;

export interface GroupIdBrand {
  readonly __brand: unique symbol;
}
export type GroupId = string & GroupIdBrand;

export interface AccountIdBrand {
  readonly __brand: unique symbol;
}
export type AccountId = string & AccountIdBrand;

// Helper factories (may gain runtime validation later)
export const asUserId = (v: string): UserId => v as UserId;
export const asGroupId = (v: string): GroupId => v as GroupId;
export const asAccountId = (v: string): AccountId => v as AccountId;
