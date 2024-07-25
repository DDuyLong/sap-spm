import UI5Element from "sap/ui/core/Element";
import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import Model from "sap/ui/model/Model";

/**
 * @namespace spm.controller
 */
export default class Base extends Controller {
  public getModel<T = JSONModel>(name?: string) {
    return this.getView()?.getModel(name) as T;
  }

  public setModel(model: Model, name?: string) {
    return this.getView()?.setModel(model, name);
  }

  public getControlById<T = UI5Element>(id: string) {
    return this.getView()?.byId(id) as T;
  }
}