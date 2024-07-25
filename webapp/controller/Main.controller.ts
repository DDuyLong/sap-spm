import Label from "sap/m/Label";
import Table from "sap/m/Table";
import PersonalizableInfo from "sap/ui/comp/smartvariants/PersonalizableInfo";
import SmartVariantManagement from "sap/ui/comp/smartvariants/SmartVariantManagement";
import Base from "./Base.controller";
import { DataFilter, Fiter } from "spm/types/filterType";
import FilterBar, {
  FilterBar$FilterChangeEventParameters,
} from "sap/ui/comp/filterbar/FilterBar";
import DatePicker from "sap/m/DatePicker";
import SearchField from "sap/m/SearchField";
import MultiComboBox from "sap/m/MultiComboBox";
import FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";

/**
 * @namespace spm.controller
 */
export default class Main extends Base {
  private filterBar: FilterBar;
  private table: Table;
  private smartVariantManagement: SmartVariantManagement;
  private expandedLabel: Label;
  private snappedLabel: Label;

  /*eslint-disable @typescript-eslint/no-empty-function*/
  public onInit(): void {
    this.smartVariantManagement = <SmartVariantManagement>(
      this.getView()?.byId("svm")
    );
    this.filterBar = this.getControlById("filterbar");
    this.table = this.getControlById("table");
    this.expandedLabel = this.getControlById("expandedLabel");
    this.snappedLabel = this.getControlById("snappedLabel");

    this.filterBar.registerFetchData(this.fetchData);
    this.filterBar.registerApplyData(this.applyData);
    this.filterBar.registerGetFiltersWithValues(this.getFiltersWithValues);

    let persInfo = new PersonalizableInfo({
      type: "filterBar",
      keyName: "persistencyKey",
      dataSource: "",
      control: this.filterBar,
    });
    this.smartVariantManagement.addPersonalizableControl(persInfo);
    this.smartVariantManagement.initialise(() => {}, this.filterBar);
  }

  public fetchData = (): DataFilter[] => {
    return this.filterBar
      .getAllFilterItems(false)
      .reduce<DataFilter[]>((acc, item: FilterGroupItem) => {
        const control = item.getControl();

        if (!control) {
          return acc;
        }

        const fieldName = item.getName();
        const groupName = item.getGroupName();

        let fieldData: string | string[] = "";

        if (control.isA<MultiComboBox>("sap.m.MultiComboBox")) {
          fieldData = control.getSelectedKeys();
        } else if (control.isA<DatePicker>("sap.m.DatePicker")) {
          fieldData = control.getValue();
        } else if (control.isA<SearchField>("sap.m.SearchField")) {
          fieldData = control.getValue();
        }

        acc.push({
          groupName,
          fieldName,
          fieldData,
        });

        return acc;
      }, []);
  };

  private applyData = (data: unknown) => {
    (<DataFilter[]>data).forEach((item) => {
      const { groupName, fieldName, fieldData } = item;

      const control = this.filterBar.determineControlByName(
        fieldName,
        groupName
      );

      if (control.isA<MultiComboBox>("sap.m.MultiComboBox")) {
        control.setSelectedKeys(<string[]>fieldData);
      } else if (control.isA<DatePicker>("sap.m.DatePicker")) {
        control.setValue(<string>fieldData);
      } else if (control.isA<SearchField>("sap.m.SearchField")) {
        control.setValue(<string>fieldData);
      }
    });
  };

  public getFiltersWithValues = (): FilterGroupItem[] => {
    return this.filterBar
      .getFilterGroupItems()
      .reduce<FilterGroupItem[]>((acc, item) => {
        const control = item.getControl();

        if (!control) {
          return acc;
        }

        if (
          control.isA<MultiComboBox>("sap.m.MultiComboBox") &&
          control.getSelectedKeys().length
        ) {
          acc.push(item);
        } else if (
          control.isA<DatePicker>("sap.m.DatePicker") &&
          control.getValue()
        ) {
          acc.push(item);
        } else if (
          control?.isA<SearchField>("sap.m.SearchField") &&
          control.getValue()
        ) {
          acc.push(item);
        }

        return acc;
      }, []);
  };

  // kiểm tra thay đổi
  public onChangeSelect(event: FilterBar$FilterChangeEventParameters) {
    this.smartVariantManagement.currentVariantSetModified(true);
    this.filterBar.fireFilterChange(event);
  }

  //nút go
  public onSearch(): void {
    const { filters, inputValues } = this.filterBar
      .getFilterGroupItems()
      .reduce<Fiter>(
        (acc, filterGroupItem) => {
          const control = filterGroupItem.getControl();
          const name = filterGroupItem.getName();
          if (control?.isA<DatePicker>("sap.m.DatePicker")) {
            const valueDate = control.getDateValue();
            acc.inputValues[name] = valueDate;
          } else if (control?.isA<SearchField>("sap.m.SearchField")) {
            const valueSearch = control.getValue();
            acc.inputValues[name] = valueSearch;
          } else if (control?.isA<MultiComboBox>("sap.m.MultiComboBox")) {
            const aSelectedKeys = control.getSelectedKeys();
            acc.inputValues[name] = aSelectedKeys;
          }
          return acc;
        },
        {
          filters: [],
          inputValues: {},
        }
      );
    console.log(inputValues);
  }

  //set text
  // thay đổi bộ lọc
  public onFilterChange(): void {
    this.updateLabelsAndTable();
  }

  public onAfterVariantLoad() {
    this.updateLabelsAndTable();
  }

  public getFormattedSummaryText() {
    let filtersWithValues = this.filterBar.retrieveFiltersWithValues();

    if (filtersWithValues.length === 0) {
      return "No filters active";
    }

    if (filtersWithValues.length === 1) {
      return `${
        filtersWithValues.length
      } filter active ${filtersWithValues.join(", ")}`;
    }

    return `${filtersWithValues.length} filters active ${filtersWithValues.join(
      ", "
    )}`;
  }

  public getFormattedSummaryTextExpanded() {
    let filtersWithValues = this.filterBar.retrieveFiltersWithValues();
    if (filtersWithValues.length === 0) {
      return "No filters active";
    }

    let text = `${filtersWithValues.length}  "filters active"`;
    let aNonVisibleFiltersWithValues =
      //@ts-ignore
      this.filterBar.retrieveNonVisibleFiltersWithValues();

    if (filtersWithValues.length === 1) {
      text = `${filtersWithValues.length}  "filter active"`;
    }

    if (
      aNonVisibleFiltersWithValues &&
      aNonVisibleFiltersWithValues.length > 0
    ) {
      text = `{test} (${aNonVisibleFiltersWithValues.length} hidden)`;
    }

    return text;
  }

  private updateLabelsAndTable(): void {
    this.expandedLabel.setText(this.getFormattedSummaryTextExpanded());
    this.snappedLabel.setText(this.getFormattedSummaryText());
    this.table.setShowOverlay(true);
  }
}
