"use strict";
const logModel = require("../models/log.model");
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
      const userId = req.user.userId || req.user._id;
      console.log("check userId: ", userId);
      
      const oldBill = await BillService.getBillById({ billId });

      const updatedBill = await BillService.updateBillStatus({
        billId,
        status,
      });

      await logModel.create({
        target_type: "Bill",
        target_id: billId,
        action: "status_change",
        before: { status: oldBill.status },
        after: { status },
        changed_by: userId,
        note: `Cập nhật trạng thái đơn hàng từ "${oldBill.status}" sang "${status}"`
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

  static async getBillLogs(req, res, next) {
    try {
      const { billId } = req.params;

      const logs = await logModel.find({
        target_type: "Bill",
        target_id: billId
      }).populate("changed_by", "name email")
        .sort({ created_at: -1 });

      return res.status(200).json({
        message: "Fetched bill logs successfully",
        statusCode: 200,
        metadata: logs
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

  static async getAllBills_Admin({ search, status, payment_method, start_date, end_date, page = 1, limit = 5 }) {
    const filter = {};
    console.log("check limit", limit);

    if (search) {
      filter.order_code = { $regex: search, $options: "i" };
    }

    if (status) {
      filter.status = status;
    }

    if (payment_method) {
      filter.payment_method = payment_method;
    }

    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) filter.createdAt.$gte = new Date(start_date);
      if (end_date) filter.createdAt.$lte = new Date(end_date);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const result = await BillService.getAllBillForAdmin(filter, skip, parseInt(limit));
    return result;
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
