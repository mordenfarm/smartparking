import type { Reservation, User, ParkingLot } from '../types';

// Declare jsPDF and autoTable from the global scope (CDN)
declare const jspdf: any;

// Define an interface for jsPDF instance with the autoTable method
// FIX: Replaced the problematic 'extends jspdf.jsPDF' with a self-contained interface
// that declares all the methods and properties used in this file. This resolves
// the "Cannot find namespace 'jspdf'" error and all subsequent property access errors.
interface jsPDFWithAutoTable {
  autoTable: (options: any) => jsPDFWithAutoTable;
  setFontSize(size: number): jsPDFWithAutoTable;
  setTextColor(color: string): jsPDFWithAutoTable;
  text(text: string | string[], x: number, y: number, options?: any): jsPDFWithAutoTable;
  internal: {
    getNumberOfPages(): number;
    pageSize: {
      height: number;
    };
  };
  save(filename: string): void;
  lastAutoTable: {
    finalY: number;
  };
}

export const generateReport = (reservations: Reservation[], users: User[], parkingLots: ParkingLot[]) => {
    const doc = new jspdf.jsPDF() as jsPDFWithAutoTable;
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // --- Report Header ---
    doc.setFontSize(22);
    doc.setTextColor('#818cf8'); // Indigo-400
    doc.text('SmartPark Admin Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor('#94a3b8'); // Slate-400
    doc.text(`Generated on: ${formattedDate}`, 14, 30);
    
    // --- Summary Statistics ---
    const totalRevenue = reservations.reduce((sum, res) => sum + res.amountPaid, 0);
    const totalReservations = reservations.length;
    const totalLots = parkingLots.length;
    const totalSlots = parkingLots.reduce((sum, lot) => sum + lot.slots.length, 0);
    const occupiedSlots = parkingLots.reduce((sum, lot) => sum + lot.slots.filter(s => s.isOccupied).length, 0);
    const occupancyRate = totalSlots > 0 ? ((occupiedSlots / totalSlots) * 100).toFixed(1) : '0';

    doc.setFontSize(14);
    doc.setTextColor('#a5b4fc'); // Indigo-300
    doc.text('Summary', 14, 45);
    
    const summaryData = [
        ['Total Revenue:', `$${totalRevenue.toFixed(2)}`],
        ['Total Reservations:', `${totalReservations}`],
        ['Parking Lots:', `${totalLots}`],
        ['Total Slots:', `${totalSlots}`],
        ['Current Occupancy:', `${occupancyRate}% (${occupiedSlots}/${totalSlots})`],
    ];

    doc.autoTable({
        startY: 50,
        head: [],
        body: summaryData,
        theme: 'plain',
        styles: {
            fontSize: 10,
            cellPadding: 2,
            textColor: '#e2e8f0' // Slate-200
        },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: '#c7d2fe' }, // Indigo-200
        }
    });

    // --- Detailed Reservations Table ---
    const tableStartY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor('#a5b4fc');
    doc.text('Detailed Reservations Log', 14, tableStartY);

    const tableColumn = ["Date", "User", "Lot Name", "Slot", "Duration", "Amount"];
    const tableRows = reservations.map(res => {
        const user = users.find(u => u.uid === res.userId);
        return [
            res.startTime.toDate().toLocaleDateString(),
            user ? user.username : 'N/A',
            res.parkingLotName,
            res.slotId.toUpperCase(),
            `${res.durationHours}h`,
            `$${res.amountPaid.toFixed(2)}`
        ];
    });

    doc.autoTable({
        startY: tableStartY + 5,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: {
            fillColor: '#4f46e5', // Indigo-600
            textColor: '#ffffff'
        },
        styles: {
            fillColor: '#1e293b', // Slate-800
            textColor: '#cbd5e1', // Slate-300
            lineColor: '#334155', // Slate-700
            lineWidth: 0.1,
        },
        alternateRowStyles: {
            fillColor: '#334155', // Slate-700
        },
        didDrawPage: (data) => {
            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            doc.setTextColor('#64748b'); // Slate-500
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
    });

    // --- Save the PDF ---
    doc.save(`SmartPark_Report_${today.toISOString().split('T')[0]}.pdf`);
};
