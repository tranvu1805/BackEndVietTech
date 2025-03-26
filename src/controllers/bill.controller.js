"use strict";

const BillService = require("../services/bill.service");
const ExcelJS = require("exceljs");

class BillController {
  static async getBillById(req, res, next) {
    try {
      const { billId } = req.params;
      const bill = await BillService.getBillById({ billId });
      return res.status(200).json(bill);
    } catch (error) {
      next(error);
    }
  }

  static async updateBillStatus(req, res, next) {
    try {
      const { billId } = req.params;
      const { status } = req.body;

      const updatedBill = await BillService.updateBillStatus({
        billId,
        status,
      });

      return res.status(200).json({
        message: "Bill status updated successfully",
        statusCode: 200,
        metadata: updatedBill,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTotalRevenue(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const result = await BillService.getTotalRevenue({ startDate, endDate });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }

  static async getAllBills(req, res, next) {
    try {
      const bills = await BillService.getAllBills();
      return res.status(200).json({
        message: "Fetch all bills successfully",
        statusCode: 200,
        metadata: bills,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllBills_Admin(req, res) {
    const bills = await BillService.getAllBills();
    return bills;
  }

  static async exportBillsToExcel(req, res, next) {
    try {
      // Lấy danh sách hóa đơn từ service
      const bills = await BillService.getAllBills();

      // Tạo workbook và worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Bills");

      // Đặt tiêu đề cho các cột
      worksheet.columns = [
        { header: "Mã Đơn Hàng", key: "order_code", width: 15 },
        { header: "Tên Khách Hàng", key: "receiver_name", width: 30 },
        { header: "Địa Chỉ", key: "address", width: 30 },
        { header: "Số Điện Thoại", key: "phone_number", width: 20 },
        {
          header: "Tổng Tiền",
          key: "total",
          width: 20,
          style: { numFmt: "#,##0" },
        },
        {
          header: "Phí Vận Chuyển",
          key: "shipping_fee",
          width: 20,
          style: { numFmt: "#,##0" },
        },
        { header: "Phương Thức Thanh Toán", key: "payment_method", width: 20 },
        { header: "Trạng Thái", key: "status", width: 15 },
        {
          header: "Ngày Tạo",
          key: "createdAt",
          width: 20,
          style: { numFmt: "mm/dd/yyyy" },
        },
        {
          header: "Ngày Cập Nhật",
          key: "updatedAt",
          width: 20,
          style: { numFmt: "mm/dd/yyyy" },
        },
      ];

      // Thêm dữ liệu hóa đơn vào worksheet
      bills.forEach((bill) => {
        worksheet.addRow({
          order_code: bill.order_code,
          receiver_name: bill.receiver_name,
          address: bill.address,
          phone_number: bill.phone_number,
          total: bill.total,
          shipping_fee: bill.shipping_fee,
          payment_method: bill.payment_method,
          status: bill.status,
          createdAt: new Date(bill.createdAt).toLocaleDateString("en-US"),
          updatedAt: new Date(bill.updatedAt).toLocaleDateString("en-US"),
        });
      });

      // Thiết lập header để trình duyệt tải file Excel

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=all_bills.xlsx"
      );

      // Ghi file ra response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }

  static async getBillsByStatus(req, res, next) {
    try {
      const { status } = req.params; // Lấy trạng thái từ URL
      const result = await BillService.getBillsByStatus({ status });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
  static async getTotalRevenue(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const result = await BillService.getTotalRevenue({ startDate, endDate });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error });
    }
  }
}

module.exports = BillController;
