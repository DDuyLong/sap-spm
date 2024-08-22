import UIComponent from "sap/ui/core/UIComponent";
import Router from "sap/ui/core/routing/Router";
import JSONModel from "sap/ui/model/json/JSONModel";
import Base from "./Base.controller";

/**
 * @namespace spm.controller
 */
export default class Main extends Base {
  private Router: Router;
 

  public onInit(): void {
    this.Router = (<UIComponent>this.getOwnerComponent()).getRouter();
    this.setModel(
      new JSONModel({
        rows: [
          {
            thongTin: {
              id: "1110111111",
              trangThai: "vô hiệu hóa",
              luotCungUng: "15 lượt",
              NgayCapNhatDangKy: "15.09.2024",
            },

            congTy: "Jologa",
            capNhatDangKy: "Error",
            danhGiaDonHang: "2",
            diemNangLuc: "10",
            diaChi: "77792 W Broadway Street",
          },
          {
            thongTin: {
              id: "1110111111",
              trangThai: "vô hiệu hóa",
              luotCungUng: "15 lượt",
              NgayCapNhatDangKy: "15.09.2024",
            },
            congTy: "Jologa",
            capNhatDangKy: "Success",
            danhGiaDonHang: "3",
            diemNangLuc: "10",
            diaChi: "77792 W Broadway Street",
          },
          {
            thongTin: {
              id: "1110111111",
              trangThai: "vô hiệu hóa",
              luotCungUng: "15 lượt",
              NgayCapNhatDangKy: "15.09.2024",
            },
            congTy: "Jologa",
            capNhatDangKy: "Warning",
            danhGiaDonHang: "1",
            diemNangLuc: "10",
            diaChi: "77792 W Broadway Street",
          },
        ],
      }),
      "table"
    );
  }

  public onListItemPress() {
    if (this.Router) {
      this.Router.navTo("PRDetail");
  }
  }
}
