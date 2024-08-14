import { Button$PressEvent } from "sap/m/Button";
import ComboBox from "sap/m/ComboBox";
import DatePicker from "sap/m/DatePicker";
import Dialog, { Dialog$AfterCloseEvent } from "sap/m/Dialog";
import Input from "sap/m/Input";
import InputBase, { InputBase$ChangeEvent } from "sap/m/InputBase";
import Label from "sap/m/Label";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import MultiComboBox from "sap/m/MultiComboBox";
import { ObjectIdentifier$TitlePressEvent } from "sap/m/ObjectIdentifier";
import SearchField from "sap/m/SearchField";
import Select from "sap/m/Select";
import FilterBar, {
  FilterBar$FilterChangeEventParameters,
} from "sap/ui/comp/filterbar/FilterBar";
import FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import PersonalizableInfo from "sap/ui/comp/smartvariants/PersonalizableInfo";
import SmartVariantManagement from "sap/ui/comp/smartvariants/SmartVariantManagement";
import Control from "sap/ui/core/Control";
import { ValueState } from "sap/ui/core/library";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import { RowActionItem$PressEvent } from "sap/ui/table/RowActionItem";
import Table from "sap/ui/table/Table";
import Component from "spm/Component";
import { MODEL_DATA } from "spm/constant/model";
import {
  DataFilter,
  DataTable,
  Employee,
  Fiter,
  ODataSuccessResponse,
} from "spm/types/filterType";
import Base from "./Base.controller";
import file from "sap/ui/unified/FileUploader";
import FileUploader from "sap/ui/unified/FileUploader";

/**
 * @namespace spm.controller
 */

export default class Main extends Base {
  private filterBar: FilterBar;
  private table: Table;
  private smartVariantManagement: SmartVariantManagement;
  private expandedLabel: Label;
  private snappedLabel: Label;
  private dialogAddPR: Dialog;
  private dialogEditPR: Dialog;
  private dialogDetailPR: Dialog;
  private component: Component;

  public onInit(): void {
    this.setModel(new JSONModel({ DeleteID: MODEL_DATA.DeleteID }), "selectID");
    this.setModel(new JSONModel({ PR: [] }), "DataPR");
    this.setModel(new JSONModel({}), "form");

    this.smartVariantManagement = <SmartVariantManagement>(
      this.getView()?.byId("svm")
    );
    this.filterBar = this.getControlById("filterbar");
    this.table = this.getControlById("table");
    this.expandedLabel = this.getControlById("expandedLabel");
    this.snappedLabel = this.getControlById("snappedLabel");

    this.component = <Component>this.getOwnerComponent();
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
    this.API();
  }

  //get data api
  private API() {
    const model = this.getModel("DataPR");
    const DataModel = <ODataModel>this.component.getModel();
    this.table.setBusy(true);
    DataModel.read("/EmployeeSet", {
      success: (oData: ODataSuccessResponse<Employee>) => {
        model.setProperty("/PR", oData.results);
        this.table.setBusy(false);
      },
      error: (oError: Error) => {
        this.table.setBusy(false);
        console.error("Error fetching data:", oError);
      },
    });
  }

  //filter
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

  private updateLabelsAndTable() {
    const expandedText =
      this.filterBar.retrieveFiltersWithValuesAsTextExpanded();
    const snappedText = this.filterBar.retrieveFiltersWithValuesAsText();

    this.expandedLabel.setText(expandedText);
    this.snappedLabel.setText(snappedText);
    this.table.setShowOverlay(true);
  }

  //table
  //Add row
  public async onOpenAddPR(): Promise<void> {
    this.dialogAddPR ??= await (<Promise<Dialog>>this.loadFragment({
      name: "spm.view.fragments.AddRow",
    }));
    this.dialogAddPR.bindElement("form>/");
    this.dialogAddPR.open();
  }

  public onSavePR(event: Button$PressEvent): void {
    const oDataModel = <ODataModel>this.getView()?.getModel();
    // const dialog = <Dialog>this.dialogAddPR;

    // const tableModel = this.getModel("DataPR");
    // const formModel = this.getModel("form");

    const controls = this.getControlsByFieldGroupId<InputBase>({
      control: this.dialogAddPR,
      groupId: "FormField",
    });

    const isValid = this.validateControls(controls);

    if (!isValid) {
      return;
    }

    const value = <DataTable>this.getModel("form").getData();
    console.log(value);
    
    // const row = (<DataTable[]>tableModel.getProperty("/PR")).slice();
    oDataModel.create("/EmployeeSet", value, {
      success: (response: Employee) => {
        console.log(response);
        MessageToast.show("Product was successfully updated");
        this.API();
      },
      error: (error: Error) => {
        console.error(error);
      },
    });

    // row.push(value);

    // tableModel.setProperty("/PR", row);

    this.onCloseDialogAddPR();
  }

  public onCloseDialogAddPR(): void {
    this.dialogAddPR?.close();
  }

  //Delete row
  public onDeletePR(event: RowActionItem$PressEvent): void {
    // const row = <Row>event.getParameter("row");
    // const rowIndex = row.getIndex();
    const ODataModel = <ODataModel>this.component.getModel();
    const row = <Employee>(
      event.getSource().getBindingContext("DataPR")?.getObject()
    );
    const file = row.File;

    MessageBox.confirm("Do you want to delete this row?", {
      actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
      emphasizedAction: MessageBox.Action.DELETE,
      onClose: (action: unknown) => {
        if (action === MessageBox.Action.DELETE) {
          // const key = ODataModel.createKey("/EmployeeSet", file);
          // ODataModel.remove(key, {
          //   success: () => {
          //     this.API();
          //     MessageToast.show("Employee was successfully deleted");
          //   },
          //   error: (error: Error) => {
          //     console.log(error);
          //   },
          // });
          // const rows = (<DataTable[]>tableModel.getProperty("/PR")).slice();
          // rows.splice(rowIndex, 1);

          // tableModel.setProperty("/PR", rows);
          ODataModel.read(`${file}`, {
            success: (oData: ODataSuccessResponse<Employee>) => {
              console.log(oData);
            },
            error: () => {},
          });
        }
      },
    });
  }

  //Delete rows
  public onDeletePRs(): void {
    const tableModel = this.getModel("DataPR");
    const indices = this.table.getSelectedIndices();

    if (!indices.length) {
      MessageToast.show("Please select row to delete");
      return;
    }

    MessageBox.confirm("Do you want to delete selected rows?", {
      actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
      emphasizedAction: MessageBox.Action.DELETE,
      onClose: (action: unknown) => {
        if (action === MessageBox.Action.DELETE) {
          const rows = (<DataTable[]>tableModel.getProperty("/PR")).slice();
          const rest = rows.filter((_, index) => !indices.includes(index));

          tableModel.setProperty("/PR", rest);

          MessageToast.show("PR have been successfully deleted");
        }
      },
    });
  }

  //select row
  public onRowSelectionChange() {
    const indices = this.table.getSelectedIndices();
    this.getModel("table").setProperty("/selectedIndices", [...indices]);
  }

  //
  private getControlsByFieldGroupId<T extends Control>(props: {
    control?: Control;
    groupId: string;
  }) {
    const { control, groupId } = props;
    if (!control) {
      return [];
    }
    const controls = control
      .getControlsByFieldGroupId(groupId)
      .filter((item) => {
        const isVisible = item.getVisible();
        const isValidInput = item.isA(["sap.m.Input", "sap.m.DatePicker"]);
        return isVisible && isValidInput;
      });

    return controls as T[];
  }

  //edit
  public async onEditPR(event: RowActionItem$PressEvent) {
    const source = event.getSource();
    const rowIndex = event.getParameter("row")?.getIndex();
    const row = <DataTable>source.getBindingContext("DataPR")?.getObject();

    this.getModel("form").setData(row);

    if (!this.dialogEditPR) {
      this.dialogEditPR = await (<Promise<Dialog>>this.loadFragment({
        name: "spm.view.fragments.EditRow",
      }));
    }
    this.dialogEditPR.bindElement("form>/");
    this.dialogEditPR.bindElement(`DataPR>/PR/${rowIndex}`);

    this.dialogEditPR.open();
  }

  public onSaveEditPR(event: Button$PressEvent) {
    const tableModel = this.getModel("DataPR");
    const path = event.getSource().getBindingContext("DataPR")?.getPath();
    const rowIndex = path?.split("/PR/").pop();

    const controls = this.getControlsByFieldGroupId<InputBase>({
      control: this.dialogEditPR,
      groupId: "FormField",
    });

    const isValid = this.validateControls(controls);

    if (!isValid) {
      return;
    }

    const value = <DataTable>this.getModel("form").getData();

    tableModel.setProperty(`/PR/${rowIndex}`, value);

    MessageToast.show("Product was successfully updated");

    this.onCloseDialogEditPR();
  }

  public onCloseDialogEditPR() {
    this.dialogEditPR.close();
  }

  //Detail
  public async onOpenDetail(event: ObjectIdentifier$TitlePressEvent) {
    const source = event.getSource();
    const path = <string>source.getBindingContext("DataPR")?.getPath();

    // this.getModel("form").setData(row);

    if (!this.dialogDetailPR) {
      this.dialogDetailPR = await (<Promise<Dialog>>this.loadFragment({
        name: "spm.view.fragments.RowDetail",
      }));
    }
    this.dialogDetailPR.bindElement(`DataPR>${path}`);
    this.dialogDetailPR.open();
  }

  public oncloseDetailPR() {
    this.dialogDetailPR.close();
  }

  //clear data form after close dialog
  public onAfterCloseDialog(event: Dialog$AfterCloseEvent) {
    const dialog = event.getSource();

    const controls = this.getControlsByFieldGroupId<InputBase>({
      control: dialog,
      groupId: "FormField",
    });

    this.clearControlErrorMessages(controls);

    dialog.unbindElement("form");
    dialog.unbindElement("DataPR");
    this.getModel("form").setData({});
  }

  //
  public onChangeValue(event: InputBase$ChangeEvent) {
    const source = event.getSource();
    if (source.getVisible()) {
      this.validateInput(source);
    }
  }

  //validasion
  private validateControls(controls: InputBase[]) {
    let isValid = false;
    let isError = false;

    controls.forEach((control) => {
      isError = this.validateInput(control);
      isValid = isValid || isError;
    });

    return !isValid;
  }

  private clearControlErrorMessages(controls: InputBase[]) {
    controls.forEach((control) => {
      control.setValueState(ValueState.None);
      control.setValueStateText("");
    });
  }

  private validateInput(source: InputBase) {
    let isError = false;
    let isRequiredError = false;

    if (!source.getBindingContext("form")) {
      return false;
    }

    source.setValueState(ValueState.None);
    source.setValueStateText("");

    const isRequired = source.getRequired();

    if (source.isA<MultiComboBox>("sap.m.MultiComboBox")) {
      const value = source.getSelectedKeys();
      if (!value.length && isRequired) {
        isRequiredError = true;
      }
    } else if (
      source.isA<ComboBox | Select>(["sap.m.ComboBox", "sap.m.Select"])
    ) {
      const value = source.getSelectedKey();
      if (!value && isRequired) {
        isRequiredError = true;
      }
    } else if (source.isA<DatePicker>("sap.m.DatePicker")) {
      const value = source.getValue();
      if (!value && isRequired) {
        isRequiredError = true;
      }
    } else if (source.isA<Input>("sap.m.Input")) {
      const value = source.getValue();
      if (!value && isRequired) {
        isRequiredError = true;
      }
    }

    if (isRequiredError) {
      source.setValueState(ValueState.Error);
      source.setValueStateText("Required");
      isError = true;
    }

    return isError;
  }

  public handleUploadPress = () => {
    var oFileUploader = <FileUploader>this.byId("fileUploader");
    oFileUploader
      .checkFileReadable()
      .then(
        function () {
          console.log(oFileUploader.getValue());

          oFileUploader.upload();
          MessageToast.show("The file be read. It may have changed.");
        },
        function (error) {
          MessageToast.show("The file cannot be read. It may have changed.");
        }
      )
      .then(function () {
        oFileUploader.clear();
      });
  };
}
