/**
 * Category domain type (T-032)
 * Represents a user-defined spending category used in budget allocations.
 */
export interface CategoryIdBrand {
  readonly __brand: unique symbol;
}
export type CategoryId = string & CategoryIdBrand;

export interface Category {
  id: CategoryId;
  name: string; // display name, unique per owning group scope (validation deferred)
  groupId: string; // group scope (later could be branded)
  createdAt: string; // ISO timestamp
  archivedAt?: string; // soft archive timestamp
}
