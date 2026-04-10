import { RequestStatus } from "@/types/inventory";

export interface RequestFilters {
  statuses: RequestStatus[];
  requestor: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_REQUEST_FILTERS: RequestFilters = {
  statuses: [],
  requestor: "",
  dateFrom: "",
  dateTo: "",
};
