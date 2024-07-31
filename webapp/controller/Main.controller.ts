import Button, { Button$PressEvent } from "sap/m/Button";
import DatePicker from "sap/m/DatePicker";
import Dialog from "sap/m/Dialog";
import Input from "sap/m/Input";
import Label from "sap/m/Label";
import MessageBox from "sap/m/MessageBox";
import MultiComboBox from "sap/m/MultiComboBox";
import SearchField from "sap/m/SearchField";
import Select from "sap/m/Select";
import VBox from "sap/m/VBox";
import { ButtonType, DialogType } from "sap/m/library";
import FilterBar, {
  FilterBar$FilterChangeEventParameters,
} from "sap/ui/comp/filterbar/FilterBar";
import FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import PersonalizableInfo from "sap/ui/comp/smartvariants/PersonalizableInfo";
import SmartVariantManagement from "sap/ui/comp/smartvariants/SmartVariantManagement";
import DateFormat from "sap/ui/core/format/DateFormat";
import { ValueState } from "sap/ui/core/library";
import JSONModel from "sap/ui/model/json/JSONModel";
import Table from "sap/ui/table/Table";
import { Button$ClickEvent } from "sap/ui/webc/main/Button";
import { Data, DataFilter, DataTable, Fiter } from "spm/types/filterType";
import Base from "./Base.controller";
import SimpleForm from "sap/ui/layout/form/SimpleForm";

/**
 * @namespace spm.controller
 */

export default class Main extends Base {
  private filterBar: FilterBar;
  private table: Table;
  private smartVariantManagement: SmartVariantManagement;
  private expandedLabel: Label;
  private snappedLabel: Label;
  private dialog: Dialog;
  private dialogAddRow: Dialog;

  public onInit(): void {
    this.setModel(this.getData());
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

  //Table
  //get data
  private getData() {
    const model = new JSONModel();
    const dateFormat = DateFormat.getDateInstance({ pattern: "dd.MM.yyyy" });
    fetch(sap.ui.require.toUrl("spm/mockData/tableData.json"))
      .then((response) => response.json())
      .then((data: Data) => {
        const table = data.tableData;

        table.forEach((item: DataTable) => {
          const parsedDate = new Date(item.NgayCapNhat);
          if (!isNaN(parsedDate.getTime())) {
            item.NgayCapNhat = dateFormat.format(parsedDate);
          }
        });
        model.setData({ tableData: data.tableData, deleteID: data.deleteID });
      })
      .catch((error) => {
        // Handle any errors
        console.error(`Error fetching the products: ${error}`);
      });
    return model;
  }

  //add row
  public async onAddNewRow(): Promise<void> {
    this.dialogAddRow ??= await (<Promise<Dialog>>this.loadFragment({
      name: "spm.view.AddRow",
    }));
    this.dialogAddRow.open();
  }

  public onSave(): void {
    const table = (<DataTable[]>(
      this.getModel().getProperty("/tableData")
    )).slice();

    const maPR = (<Input>this.byId("inputPR")).getValue();
    const soluong = (<Input>this.byId("inputSl")).getValue();
    const DeleteID = (<Select>this.byId("DeleteID"))
      .getSelectedItem()
      ?.getText();
    const nhaMay = (<Input>this.byId("inputnhaMay")).getValue();
    const maPO = (<Input>this.byId("inputMaPO")).getValue();
    const ngayCapNhat = (<DatePicker>this.byId("ngayCapNhat")).getDateValue();

    if (!maPR || !DeleteID || !soluong || !nhaMay || !maPO || !ngayCapNhat) {
      MessageBox.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    table.push({
      maPR: maPR,
      DeleteID: DeleteID,
      soLuong: soluong,
      nhaMay: nhaMay,
      maPO: maPO,
      NgayCapNhat: ngayCapNhat.toISOString().split("T")[0],
    });

    this.getModel().setProperty("/tableData", table);
    this.onCloseDialog();
  }

  public onCloseDialog(): void {
    (<Dialog>this.byId("addRow"))?.close();
  }

  //Detalis action
  public handleDetailsPress(event: Button$ClickEvent) {
    const path = <string>event.getSource().getBindingContext()?.getPath();
    const rowData = <DataTable>(
      event.getSource()?.getBindingContext()?.getObject()
    );
    if (!this.dialog) {
      this.dialog = new Dialog({
        type: DialogType.Message,
        title: "",
        state: ValueState.Information,
        draggable: true,
        content: new SimpleForm({
          id: "dialogContent",
          width: '500px',
          content: [],
        }),
        beginButton: new Button({
          type: ButtonType.Emphasized,
          text: "close",
          press: () => {
            this.dialog.close();
          },
        }),
      });
    }
    this.dialog.setTitle(`Chi tiết PR: ${rowData.maPR}`);
    const simpleForm = <SimpleForm>this.dialog.getContent()[0];
    simpleForm.destroyContent();
    simpleForm.addContent(new Label({ text: "Mã PR" }));
    simpleForm.addContent(
      new Input({
        value: rowData.maPR,
      })
    );

    simpleForm.addContent(new Label({ text: "DeleteID" }));
    simpleForm.addContent(
      new Input({
        value: rowData.DeleteID,
      })
    );

    simpleForm.addContent(new Label({ text: "Số lượng" }));
    simpleForm.addContent(
      new Input({
        value: rowData.soLuong,
      })
    );

    simpleForm.addContent(new Label({ text: "Nhà máy" }));
    simpleForm.addContent(
      new Input({
        value: rowData.nhaMay,
      })
    );

    simpleForm.addContent(new Label({ text: "Mã PO" }));
    simpleForm.addContent(
      new Input({
        value: rowData.maPO,
      })
    );

    simpleForm.addContent(new Label({ text: "Ngày cập nhật" }));
    simpleForm.addContent(
      new DatePicker({
        value: rowData.NgayCapNhat,
      })
    );
    this.getView()?.addDependent(this.dialog);
    this.dialog.bindElement(path);
    this.dialog.open();
  }

  //select row
  // private onRowSelectionChange() {
  //   const table = this.byId("table") as Table;
  //   const index = table.getSelectedIndices();
  // }

  //Delete Row
  public onDeleteRow(event: Button$PressEvent) {
    const model = this.getModel();
    const rowDelete = <string>(
      event.getSource()?.getBindingContext()?.getProperty("maPR")
    );
    MessageBox.information("Are you sure you want to delete?", {
      actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
      emphasizedAction: MessageBox.Action.OK,
      onClose: (action: unknown) => {
        const dataTable = (<DataTable[]>(
          model.getProperty("/tableData")
        )).slice();
        if (action === MessageBox.Action.OK) {
          if (rowDelete) {
            this.getModel()?.setProperty(
              "/tableData",
              dataTable.filter((item) => item.maPR !== rowDelete)
            );
          }
        }
      },
    });
  }

  //Delete Rows
  public onDeleteRows() {
    const indexRowSelect = (<Table>this.byId("table")).getSelectedIndices();
    const model = this.getModel();
    MessageBox.information("Are you sure you want to delete?", {
      actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
      emphasizedAction: MessageBox.Action.OK,
      onClose: (action: unknown) => {
        const dataTable = (<DataTable[]>(
          model.getProperty("/tableData")
        )).slice();
        if (action === MessageBox.Action.OK) {
          const newTable = dataTable.filter(
            (acc, indexRox) => !indexRowSelect.includes(indexRox)
          );

          this.getModel()?.setProperty("/tableData", newTable);
        }
      },
    });
  }

  //Filter
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
    // console.log(inputValues);
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
