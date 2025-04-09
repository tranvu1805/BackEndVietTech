"use strict";
const { readVietnameseNumber } = require("../auth/middlewares/vnNumber");
const logModel = require("../models/log.model");
const BillService = require("../services/bill.service");
const ExcelJS = require("exceljs");
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');
const { VNPay } = require('vnpay');
const { billRepo } = require('../models/bill.model');




const logoPath = path.join(__dirname, '../../uploads/logo_viettech.png'); // đường dẫn thật
const logoData = fs.readFileSync(logoPath);
const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;

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
      console.log("check req", req.user);

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
      const numericSearch = search.replace(/[^0-9]/g, "");
      if (!isNaN(numericSearch) && numericSearch !== "") {
        filter.order_code = Number(numericSearch);
      } else {
        filter.receiver_name = { $regex: search, $options: "i" };
      }
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

  static async renderInvoicePage(req, res, next) {
    try {
      const { billId } = req.params;

      // Lấy đơn hàng theo ID
      let bill = await BillService.getBillById({ billId });
      console.log("check bill create", bill);


      if (!bill) {
        return res.status(404).send("Không tìm thấy đơn hàng.");
      }

      // Populate thông tin biến thể của từng sản phẩm trong đơn
      // bill = await bill.populate("products.detailsVariantId").execPopulate?.();

      // (Optional) Nếu muốn populate thêm `variantDetails.variantId`, thì dùng nested populate thủ công

      res.render("admin/invoice", {
        bill,
        logoPath: "/uploads/logo_viettech.png",
        companyName: "CÔNG TY TNHH VietTech",
        issuedDate: new Date(bill.createdAt).toLocaleDateString("vi-VN"),
        totalInWords: readVietnameseNumber(bill.total) + " đồng",
      });
    } catch (error) {
      next(error);
    }
  }




  static async downloadInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const bill = await BillService.getBillById({ billId: id });
      if (!bill) return res.status(404).send('Không tìm thấy đơn hàng');

      const totalInWords = readVietnameseNumber(bill.total);

      const html = await ejs.renderFile(
        path.join(__dirname, '../../views/admin/invoice.ejs'),
        {
          bill,
          logoPath: logoBase64, // ✅ dùng ảnh base64
          companyName: "CÔNG TY TNHH VietTech",
          issuedDate: new Date(bill.createdAt).toLocaleDateString('vi-VN'),
          totalInWords
        }
      );

      // Tùy chọn: Ghi ra HTML để debug
      // fs.writeFileSync('test-invoice.html', html);

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // ✅ nên thêm nếu deploy trên Linux
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${bill.order_code}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer);

    } catch (err) {
      console.error('Error generating invoice PDF:', err);
      next(err);
    }
  }

  static async getBillsByUserId(req, res, next) {
    try {
      const { userId } = req.params;
      console.log("userId: ", userId);

      const bills = await BillService.getBillsByUserId({ userId });

      return res.status(200).json({
        message: "Lấy danh sách hóa đơn theo userId thành công",
        statusCode: 200,
        metadata: bills
      });
    } catch (error) {
      next(error);
    }
  }

  static async handleVnpayReturn(req, res, next) {
    try {
      const vnpay = new VNPay({
        tmnCode: 'HMC4RYL1',
        secureSecret: 'GP6FEUU3UDKCOXM1P5OE3AU1AJN5CDP4',
        vnpayHost: 'https://sandbox.vnpayment.vn',
        testMode: true,
        hashAlgorithm: 'SHA512',
      });

      const isValid = vnpay.verifyReturnUrl(req.query);

      if (!isValid) {
        return res.status(400).json({
          code: 400,
          message: 'Checksum không hợp lệ!',
          status: 'error',
        });
      }

      const { vnp_ResponseCode, vnp_TxnRef } = req.query;

      if (vnp_ResponseCode !== '00') {
        return res.status(400).json({
          code: 400,
          message: 'Thanh toán thất bại!',
          status: 'error',
        });
      }

      const bill = await billRepo.findOne({ order_code: vnp_TxnRef });

      if (!bill) {
        return res.status(404).json({
          code: 404,
          message: 'Không tìm thấy đơn hàng!',
          status: 'error',
        });
      }

      if (!bill.isPay) {
        bill.isPay = true;
        await bill.save();
        console.log(`Cập nhật trạng thái isPay=true cho đơn hàng___ ${bill.order_code}`);
      }
      

      return res.redirect(`http://your-client-app.com/payment-success?billId=${bill._id}`);
    } catch (error) {
      console.error('Lỗi xử lý VNPay Return:', error);
      return res.status(500).json({
        code: 500,
        message: 'Lỗi máy chủ khi xử lý thanh toán!',
        status: 'error',
      });
    }
  }

}

module.exports = BillController;
