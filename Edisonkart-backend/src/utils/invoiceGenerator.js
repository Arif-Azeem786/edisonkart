const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoice = (order, stream) => {
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(stream);

    // Header
    doc.fillColor('#1E3A8A')
       .fontSize(20)
       .text('EDISONKART', 50, 50)
       .fontSize(10)
       .fillColor('#444444')
       .text('E-Commerce Reimagined', 50, 75)
       .moveDown();

    // Invoice Info
    doc.fontSize(14)
       .text('INVOICE', 200, 50, { align: 'right' })
       .fontSize(10)
       .text(`Order ID: ${order.orderId}`, 200, 70, { align: 'right' })
       .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 200, 85, { align: 'right' })
       .moveDown();

    doc.moveTo(50, 110).lineTo(550, 110).stroke('#EEEEEE');

    // Bill To
    doc.fontSize(12)
       .text('Bill To:', 50, 130)
       .fontSize(10)
       .text(order.addressSnapshot.name, 50, 150)
       .text(order.addressSnapshot.addressLine1, 50, 165)
       .text(order.addressSnapshot.addressLine2 || '', 50, 180)
       .text(`${order.addressSnapshot.city}, ${order.addressSnapshot.state} - ${order.addressSnapshot.pincode}`, 50, 195)
       .text(`Phone: ${order.addressSnapshot.phone}`, 50, 210);

    // Table Header
    const tableTop = 260;
    doc.fontSize(10).fillColor('#1E3A8A')
       .text('Item', 50, tableTop)
       .text('Price', 300, tableTop)
       .text('Qty', 400, tableTop)
       .text('Total', 500, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#EEEEEE');

    // Table Items
    let currentY = tableTop + 30;
    order.items.forEach(item => {
        doc.fillColor('#444444')
           .text(item.nameSnapshot, 50, currentY, { width: 200 })
           .text(`INR ${item.priceSnapshot.toLocaleString()}`, 300, currentY)
           .text(item.quantity.toString(), 400, currentY)
           .text(`INR ${(item.priceSnapshot * item.quantity).toLocaleString()}`, 500, currentY);

        currentY += 25;
    });

    doc.moveTo(50, currentY + 10).lineTo(550, currentY + 10).stroke('#EEEEEE');

    // Total
    doc.fontSize(12)
       .fillColor('#1E3A8A')
       .text('Grand Total:', 400, currentY + 30)
       .text(`INR ${order.totalAmount.toLocaleString()}`, 500, currentY + 30);

    // Footer
    doc.fontSize(10)
       .fillColor('#999999')
       .text('Thank you for shopping with EdisonKart!', 50, 700, { align: 'center', width: 500 });

    doc.end();
};

module.exports = { generateInvoice };
