import { Injectable } from '@angular/core';
import { PatientReportWithPatient, ScanImage } from './report.service';
import jsPDF from 'jspdf';
import { Patient } from './patient.service';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  constructor() {}

  /**
   * Generates a PDF report from a patient report object
   * @param report The patient report to generate a PDF for
   * @param patient The patient information
   * @returns Promise that resolves when PDF generation is complete
   */
  async generatePdfReport(
    report: PatientReportWithPatient,
    patient: Patient
  ): Promise<void> {
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = 15;

    // Define color scheme for consistent branding with proper tuple types
    const colors: {
      primary: [number, number, number];
      secondary: [number, number, number];
      accent: [number, number, number];
      text: [number, number, number];
      textLight: [number, number, number];
      background: [number, number, number];
      surface1: [number, number, number];
      surface2: [number, number, number];
      border: [number, number, number];
    } = {
      primary: [63, 81, 181], // From --primary-rgb
      secondary: [255, 64, 129], // From --secondary-color (#ff4081)
      accent: [59, 130, 246], // From --info-rgb
      text: [44, 62, 80], // From --text-primary (#2c3e50)
      textLight: [102, 102, 102], // From --text-secondary (#666)
      background: [248, 250, 252], // From --light-bg (#f8fafc)
      surface1: [245, 247, 250], // From --surface-1 (#f5f7fa)
      surface2: [237, 242, 247], // From --surface-2 (#edf2f7)
      border: [226, 232, 240], // From --border-color (#e2e8f0)
    };

    // Function to add header to each page
    const addPageHeader = () => {
      // Header background
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 25, 'F');

      // Add logo image
      const logoPath = 'logo.png';
      const logoWidth = 10;
      const logoHeight = 10;
      doc.addImage(logoPath, 'PNG', margin, 7, logoWidth, logoHeight);

      // Add SonoSmart text as logo
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SonoSmart', margin + 12, 13);

      // Add subtext under logo
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Advanced Ultrasound Diagnostics', margin + 12, 20);

      // Add contact information in header
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const contactInfo = 'Email: contact@sonosmart.com | Phone: +1 (234) 567-890 | www.sonosmart.com';
      const contactWidth = doc.getTextWidth(contactInfo);
      doc.text(
        contactInfo,
        pageWidth - margin - contactWidth,
        13
      );
    };

    // Function to add footer to each page
    const addPageFooter = (pageNumber: number) => {
      const footerPosition = pageHeight - 10;

      // Add decorative line above footer
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(
        margin,
        footerPosition - 8,
        pageWidth - margin,
        footerPosition - 8
      );

      // Footer text with generation timestamp on the same line
      doc.setFontSize(8);
      doc.setTextColor(...colors.textLight);
      const generatedDate = new Date().toLocaleString();
      doc.text(
        `SonoSmart Medical Report - Confidential | Generated on: ${generatedDate}`,
        margin,
        footerPosition
      );

      // Page number
      doc.text(
        `Page ${pageNumber} of ${doc.internal.pages.length-1}`,
        pageWidth - margin - 25,
        footerPosition
      );
    };

    // Add header to first page
    addPageHeader();

    // Helper function to create section headers with consistent styling
    const addSectionHeader = (
      title: string,
      yPos: number,
      fillColor: [number, number, number]
    ) => {
      // Section header background
      doc.setFillColor(...fillColor);
      doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'F');

      // Section header text
      doc.setTextColor(...colors.text);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 6, yPos + 10);

      return yPos + 16; // Return new Y position after header
    };

    // Helper function to add field with label and value
    const addField = (
      label: string,
      value: any,
      x: number,
      y: number,
      maxWidth: number = contentWidth
    ) => {
      const labelWidth = 25; // Fixed width for all labels
      const labelSpacing = 2; // Consistent spacing between label and value

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      doc.text(label, x, y);

      doc.setFont('helvetica', 'normal');
      if (typeof value === 'string') {
        const splitValue = doc.splitTextToSize(
          value,
          maxWidth - (labelWidth + labelSpacing)
        );
        doc.text(splitValue, x + labelWidth, y);
        return splitValue.length > 1 ? y + splitValue.length * 5 : y;
      } else {
        doc.text('N/A', x + labelWidth, y);
        return y;
      }
    };

    // Add report title with decorative elements
    yPosition = 35;

    doc.setTextColor(...colors.text);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const reportTitle = 'Ultrasound Examination Report';
    const titleWidth = doc.getTextWidth(reportTitle);
    doc.text(reportTitle, (pageWidth - titleWidth) / 2, yPosition); // Center the title

    // Add report date with styled box
    yPosition += 8;
    doc.setFillColor(...colors.surface2);
    doc.roundedRect(margin, yPosition - 3, contentWidth, 6, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...colors.textLight);
    const reportDate = report.createdAt
      ? new Date(report.createdAt).toLocaleDateString()
      : new Date().toLocaleDateString();
    doc.text(`Report Date: ${reportDate}`, margin + 5, yPosition + 2);

    // Add patient information section with improved styling
    yPosition = addSectionHeader(
      'Patient Information',
      yPosition + 6,
      colors.surface1
    );

    // Create a styled box for patient details
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, yPosition, contentWidth, 24, 2, 2, 'FD');

    // Patient details with improved layout
    const patientY = yPosition + 8;
    doc.setFontSize(9);

    // Left column
    let leftX = margin + 5;
    addField(
      'Name:',
      `${patient.firstName} ${patient.lastName}`,
      leftX,
      patientY
    );
    addField('Gender:', patient.gender, leftX, patientY + 6);
    addField('Phone:', patient.phone || 'N/A', leftX, patientY + 12);

    // Right column
    let rightX = margin + contentWidth / 2;

    // Calculate age
    const dob = new Date(patient.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (
      today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
    ) {
      age--;
    }

    addField(
      'DOB:',
      new Date(patient.dateOfBirth).toLocaleDateString(),
      rightX,
      patientY
    );
    addField('Age:', `${age} years`, rightX, patientY + 6);

    // Add patient registration date if available
    if (patient.createdAt) {
      addField(
        'Registered:',
        new Date(patient.createdAt).toLocaleDateString(),
        rightX,
        patientY + 12
      );
    }

    // Adjust spacing after patient information
    yPosition += 26;

    // Add diagnostic information with improved styling
    yPosition = addSectionHeader(
      'Diagnostic Information',
      yPosition,
      colors.surface2
    );

    // Calculate total height needed for diagnostic content first
    let diagY = yPosition + 8;
    let contentHeight = 0;

    // Calculate space needed for diagnosis
    const diagnosisText = doc.splitTextToSize(report.diagnosticName, contentWidth - 80);
    contentHeight += diagnosisText.length * 4 + 10;

    // Calculate space for condition details if available
    if (report.conditionDetails) {
      const splitCondition = doc.splitTextToSize(
        report.conditionDetails,
        contentWidth - 80
      );
      contentHeight += splitCondition.length * 4 + 12;
    }

    // Calculate space for instructions if available
    if (report.instructions) {
      const splitInstructions = doc.splitTextToSize(
        report.instructions,
        contentWidth - 15
      );
      contentHeight += splitInstructions.length * 4 + 14;
    }

    // Calculate space for additional notes if available
    if (report.additionalNotes) {
      const splitNotes = doc.splitTextToSize(
        report.additionalNotes,
        contentWidth - 80
      );
      contentHeight += splitNotes.length * 4 + 12;
    }

    // Create the main diagnostic box with calculated height
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, yPosition, contentWidth, contentHeight + 15, 2, 2, 'FD');

    // Now draw the content
    diagY = yPosition + 10;

    // Draw diagnosis section
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...colors.primary);
    doc.roundedRect(margin + 5, diagY - 5, contentWidth - 10, 20, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('Diagnosis:', margin + 8, diagY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.text);
    doc.text(diagnosisText, margin + 60, diagY);
    diagY += diagnosisText.length * 5 + 12;

    // Draw condition details if available
    if (report.conditionDetails) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...colors.secondary);
      doc.roundedRect(margin + 5, diagY - 5, contentWidth - 10, 20, 2, 2, 'FD');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.secondary);
      doc.text('Condition Details:', margin + 8, diagY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      const splitCondition = doc.splitTextToSize(
        report.conditionDetails,
        contentWidth - 80
      );
      doc.text(splitCondition, margin + 60, diagY);
      diagY += splitCondition.length * 4 + 12;
    }

    // Draw instructions if available
    if (report.instructions) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...colors.accent);
      doc.roundedRect(margin + 5, diagY - 5, contentWidth - 10, 20, 2, 2, 'FD');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.accent);
      doc.text('Instructions:', margin + 8, diagY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      const splitInstructions = doc.splitTextToSize(
        report.instructions,
        contentWidth - 15
      );
      doc.text(splitInstructions, margin + 60, diagY);
      diagY += splitInstructions.length * 4 + 14;
    }

    // Draw additional notes if available
    if (report.additionalNotes) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...colors.textLight);
      doc.roundedRect(margin + 5, diagY - 5, contentWidth - 10, 20, 2, 2, 'FD');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textLight);
      doc.text('Additional Notes:', margin + 8, diagY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      const splitNotes = doc.splitTextToSize(
        report.additionalNotes,
        contentWidth - 80
      );
      doc.text(splitNotes, margin + 60, diagY);
      diagY += splitNotes.length * 4 + 12;
    }

    yPosition = diagY + 10;

    // Add scan images if available
    if (report.scanImages && report.scanImages.length > 0) {
      yPosition = diagY + 8;

      // Add section header for scan images
      yPosition = addSectionHeader(
        'Ultrasound Scan Images',
        yPosition + 6,
        colors.surface1
      );

      // Create a grid layout for images
      const imagesPerRow = 2;
      const imageWidth = (contentWidth - margin * (imagesPerRow - 1)) / imagesPerRow;
      const imageHeight = imageWidth * 0.6;
      const imageMargin = 3;

      for (let i = 0; i < report.scanImages.length; i++) {
        const rowIndex = Math.floor(i / imagesPerRow);
        const colIndex = i % imagesPerRow;

        const x = margin + colIndex * (imageWidth + imageMargin);
        const y = yPosition + rowIndex * (imageHeight + 20);

        try {
          // Convert image URL to base64
          const response = await fetch(report.scanImages[i].imageUrl);
          const blob = await response.blob();
          const reader = new FileReader();

          await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          // Add the image to PDF
          const imageData = reader.result as string;
          doc.addImage(imageData, 'JPEG', x, y, imageWidth, imageHeight);

          // Add border around the image
          doc.setDrawColor(...colors.border);
          doc.setLineWidth(0.5);
          doc.rect(x, y, imageWidth, imageHeight);

          // Add organ label
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.text);
          const organLabel = report.scanImages[i].organ || 'Unnamed Scan';
          const labelWidth = doc.getTextWidth(organLabel);
          doc.text(
            organLabel,
            x + (imageWidth - labelWidth) / 2,
            y + imageHeight + 12
          );
        } catch (error) {
          console.error(`Error loading image ${i}:`, error);
          // Fallback to placeholder if image fails to load
          doc.setDrawColor(...colors.border);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(x, y, imageWidth, imageHeight, 2, 2, 'FD');
          doc.setFontSize(8);
          doc.setTextColor(...colors.textLight);
          doc.text('Image not available', x + 5, y + imageHeight/2);
        }

        // Update yPosition based on content
        if (i === report.scanImages.length - 1) {
          yPosition = y + imageHeight + 20;
        }

        // Add page number to each page
        addPageFooter(i + 1);
      }
    }

    // For documents without images, add footer to the last page
    if (!report.scanImages || report.scanImages.length === 0) {
      addPageFooter(1);
    }

    // Save the PDF with a well-formatted filename
    doc.save(
      `${patient.lastName}_${patient.firstName}_Report_${
        new Date().toISOString().split('T')[0]
      }.pdf`
    );

    // Save the PDF
    doc.save(
      `${patient.lastName}_${patient.firstName}_Report_${
        new Date().toISOString().split('T')[0]
      }.pdf`
    );
  }
}
