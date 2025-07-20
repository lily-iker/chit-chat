export interface PageResponse<T> {
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  content: T[]
}
