import PDFDocument from 'pdfkit';
import fs from 'fs';

/**
 * Generates a PDF receipt for a dine-in table session and writes it to a file.
 * @param {Object} session - The table session object.
 * @param {Object} user - The user object.
 * @param {string} filePath - Path where the PDF should be created.
 * @returns {Promise<void>}
 */
export const generateTableSessionPDF = (session, user, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            // Title Header
            doc.fillColor('#ff4d2d')
               .fontSize(22)
               .text('PrimeDine', 50, 50, { font: 'Helvetica-Bold' })
               .fillColor('#444444')
               .fontSize(10)
               .text('Premium Dining & Culinary Experience', 50, 75)
               .text('Phone: +91 88498 19915 | Email: info@primedine.com', 50, 90);

            // Draw header line
            doc.strokeColor('#e5e7eb')
               .lineWidth(1)
               .moveTo(50, 115)
               .lineTo(550, 115)
               .stroke();

            // Metadata info
            doc.fontSize(12)
               .fillColor('#111827')
               .text('TAX INVOICE / RECEIPT', 50, 130, { font: 'Helvetica-Bold' })
               .fontSize(10)
               .fillColor('#4b5563')
               .text(`Invoice No: INV-TS-${session._id.toString().substring(18).toUpperCase()}`, 50, 150)
               .text(`Date: ${new Date(session.updatedAt || new Date()).toLocaleString()}`, 50, 165)
               .text(`Table Number: Table ${session.tableNumber}`, 50, 180)
               .text(`Payment Status: PAID`, 50, 195, { font: 'Helvetica-Bold' });

            // Customer info
            doc.fontSize(11)
               .fillColor('#111827')
               .text('Billed To:', 350, 130, { font: 'Helvetica-Bold' })
               .fontSize(10)
               .fillColor('#4b5563')
               .text(user.fullName || 'Valued Guest', 350, 150)
               .text(user.email || '', 350, 165)
               .text(user.mobile || '', 350, 180);

            // Items table
            const tableTop = 230;
            doc.strokeColor('#cccccc')
               .lineWidth(1)
               .moveTo(50, tableTop)
               .lineTo(550, tableTop)
               .stroke();

            doc.fillColor('#111827')
               .text('Item Description', 60, tableTop + 8, { font: 'Helvetica-Bold' })
               .text('Price', 280, tableTop + 8, { width: 90, align: 'right', font: 'Helvetica-Bold' })
               .text('Qty', 380, tableTop + 8, { width: 50, align: 'right', font: 'Helvetica-Bold' })
               .text('Total (INR)', 450, tableTop + 8, { width: 90, align: 'right', font: 'Helvetica-Bold' });

            doc.strokeColor('#e5e7eb')
               .lineWidth(1)
               .moveTo(50, tableTop + 25)
               .lineTo(550, tableTop + 25)
               .stroke();

            let rowTop = tableTop + 32;
            const items = session.items || [];
            items.forEach((item) => {
                doc.fillColor('#4b5563')
                   .text(item.name || 'Unknown Item', 60, rowTop)
                   .text(`INR ${parseFloat(item.price || 0).toFixed(2)}`, 280, rowTop, { width: 90, align: 'right' })
                   .text(item.quantity.toString(), 380, rowTop, { width: 50, align: 'right' })
                   .text(`INR ${(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)}`, 450, rowTop, { width: 90, align: 'right' });
                rowTop += 20;
            });

            doc.strokeColor('#cccccc')
               .lineWidth(1)
               .moveTo(50, rowTop + 5)
               .lineTo(550, rowTop + 5)
               .stroke();

            // Total section
            doc.fillColor('#111827')
               .fontSize(12)
               .text('Grand Total:', 280, rowTop + 15, { width: 150, align: 'right', font: 'Helvetica-Bold' })
               .text(`INR ${parseFloat(session.billAmount || 0).toFixed(2)}`, 450, rowTop + 15, { width: 90, align: 'right', font: 'Helvetica-Bold' });

            // Footer
            doc.fillColor('#9ca3af')
               .fontSize(9)
               .text('This is a computer-generated tax invoice receipt.', 50, rowTop + 50, { align: 'center', width: 500 })
               .text('Thank you for dining with PrimeDine! Please visit us again.', 50, rowTop + 65, { align: 'center', width: 500, font: 'Helvetica-Oblique' });

            doc.end();
            writeStream.on('finish', () => resolve());
            writeStream.on('error', (err) => reject(err));
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Generates a PDF receipt for a reservation and writes it to a file.
 * @param {Object} reservation - The reservation object.
 * @param {Object} user - The user object.
 * @param {string} filePath - Path where the PDF should be created.
 * @returns {Promise<void>}
 */
export const generateReservationPDF = (reservation, user, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const writeStream = fs.createWriteStream(filePath);
            doc.pipe(writeStream);

            // Title Header
            doc.fillColor('#ff4d2d')
               .fontSize(22)
               .text('PrimeDine', 50, 50, { font: 'Helvetica-Bold' })
               .fillColor('#444444')
               .fontSize(10)
               .text('Premium Catering & Booking Experience', 50, 75)
               .text('Phone: +91 88498 19915 | Email: info@primedine.com', 50, 90);

            // Draw header line
            doc.strokeColor('#e5e7eb')
               .lineWidth(1)
               .moveTo(50, 115)
               .lineTo(550, 115)
               .stroke();

            // Metadata info
            doc.fontSize(12)
               .fillColor('#111827')
               .text('EVENT BOOKING INVOICE / RECEIPT', 50, 130, { font: 'Helvetica-Bold' })
               .fontSize(10)
               .fillColor('#4b5563')
               .text(`Booking No: INV-RES-${reservation._id.toString().substring(18).toUpperCase()}`, 50, 150)
               .text(`Date: ${new Date(reservation.updatedAt || new Date()).toLocaleString()}`, 50, 165)
               .text(`Event Date: ${new Date(reservation.eventDate).toLocaleDateString()}`, 50, 180)
               .text(`Payment Status: PAID`, 50, 195, { font: 'Helvetica-Bold' });

            // Customer info
            doc.fontSize(11)
               .fillColor('#111827')
               .text('Billed To:', 350, 130, { font: 'Helvetica-Bold' })
               .fontSize(10)
               .fillColor('#4b5563')
               .text(reservation.fullName || user.fullName || 'Valued Guest', 350, 150)
               .text(user.email || '', 350, 165)
               .text(reservation.phone || user.mobile || '', 350, 180);

            // Details section
            const tableTop = 230;
            doc.strokeColor('#cccccc')
               .lineWidth(1)
               .moveTo(50, tableTop)
               .lineTo(550, tableTop)
               .stroke();

            doc.fillColor('#111827')
               .text('Booking Detail Description', 60, tableTop + 8, { font: 'Helvetica-Bold' })
               .text('Value / Configuration', 250, tableTop + 8, { font: 'Helvetica-Bold' });

            doc.strokeColor('#e5e7eb')
               .lineWidth(1)
               .moveTo(50, tableTop + 25)
               .lineTo(550, tableTop + 25)
               .stroke();

            let rowTop = tableTop + 32;
            const details = [
                { label: 'Event Type', val: reservation.eventType || 'N/A' },
                { label: 'Guests Attending', val: (reservation.guests || 1).toString() },
                { label: 'Package Selected', val: reservation.packageTitle || 'Standard Package' },
                { label: 'Decoration Theme', val: reservation.decorationTheme || 'Classic Style' },
                { label: 'Meeting Mode', val: reservation.meetingMode || 'In Person' },
                { label: 'Budget Range', val: reservation.budgetRange || 'Default' },
                { label: 'Special Requests', val: reservation.requirements || 'None specified' }
            ];

            details.forEach((item) => {
                doc.fillColor('#111827')
                   .text(item.label, 60, rowTop, { font: 'Helvetica-Bold' })
                   .fillColor('#4b5563')
                   .text(item.val, 250, rowTop, { width: 300 });
                rowTop += 20;
            });

            doc.strokeColor('#cccccc')
               .lineWidth(1)
               .moveTo(50, rowTop + 5)
               .lineTo(550, rowTop + 5)
               .stroke();

            // Total section
            const paid = reservation.paidAmount || reservation.bill || 0;
            doc.fillColor('#111827')
               .fontSize(12)
               .text('Amount Paid:', 280, rowTop + 15, { width: 150, align: 'right', font: 'Helvetica-Bold' })
               .text(`INR ${parseFloat(paid).toFixed(2)}`, 450, rowTop + 15, { width: 90, align: 'right', font: 'Helvetica-Bold' });

            // Footer
            doc.fillColor('#9ca3af')
               .fontSize(9)
               .text('This is a computer-generated event booking receipt.', 50, rowTop + 50, { align: 'center', width: 500 })
               .text('Thank you for booking with PrimeDine Events!', 50, rowTop + 65, { align: 'center', width: 500, font: 'Helvetica-Oblique' });

            doc.end();
            writeStream.on('finish', () => resolve());
            writeStream.on('error', (err) => reject(err));
        } catch (err) {
            reject(err);
        }
    });
};
