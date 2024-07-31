import UI5Date from "sap/ui/core/date/UI5Date";
import Filter from "sap/ui/model/Filter";

export type Dict<T = any> = { [key: string]: T };

export interface FilterValues {
  search: string;
  endDate: Date | UI5Date;
  startDate: Date | UI5Date;
  DeleteId: string[];
}

export interface Fiter {
  filters: Filter[];
  inputValues: Dict;
}

export interface DataFilter {
  groupName: string;
  fieldName: string;
  fieldData: string | string[];
}

export interface DateFilterValue {
  acc: DataFilter;
  filterItem: Dict;
}

export interface DataTable {
  maPR: string;
  DeleteID: string | undefined;
  soLuong: string;
  nhaMay: string;
  maPO: string;
  NgayCapNhat: string;
}

export interface DeleteID {
  key: number;
  value: string;
}

export interface Data {
  tableData: DataTable[];
  deleteID: DeleteID;
}
