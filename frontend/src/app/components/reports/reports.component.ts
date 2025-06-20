import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ReportService, PatientReportWithPatient } from '../../services/report.service';
import { QuizService, QuizResult } from '../../services/quiz.service';
import { ScanService, ScanResult } from '../../services/scan.service';
import { PdfService } from '../../services/pdf.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { PatientService } from 'src/app/services/patient.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class ReportsComponent implements OnInit {
  patientReports: PatientReportWithPatient[] = [];
  quizResults: QuizResult[] = [];
  scanResults: ScanResult[] = [];
  isLoading = true;
  errorMessage = '';
  selectedReport: PatientReportWithPatient | null = null;
  currentReport: Partial<PatientReportWithPatient> = {};
  showDetailsModal = false;
  showDeleteModal = false;
  showForm = false;
  isEditing = false;

  constructor(
    public authService: AuthService,
    private reportService: ReportService,
    private quizService: QuizService,
    private scanService: ScanService,
    private pdfService: PdfService,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;

    if (this.authService.getCurrentUser()?.role === 'professional') {
      this.loadPatientReports();
    } else if (this.authService.getCurrentUser()?.role === 'trainee') {
      this.loadTraineeReports();
    }
  }

  loadPatientReports(): void {
    this.reportService.getPatientReports().subscribe({
      next: async (reports) => {
        // For each report, fetch the patient details if patient is just an ID
        const reportsWithPatients = await Promise.all(reports.map(async (report) => {
          if (typeof report.patient === 'string') {
            try {
              const patient = await this.patientService.getPatient(report.patient).toPromise();
              return { ...report, patient: patient || report.patient };
            } catch (error) {
              console.error('Error loading patient details:', error);
              return report;
            }
          }
          return report;
        }));
        this.patientReports = reportsWithPatients;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load patient reports. Please try again later.';
        this.isLoading = false;
        console.error('Error loading patient reports:', error);
      }
    });
  }

  loadTraineeReports(): void {
    // Load both quiz and scan results for trainees
    this.quizService.getQuizResults().subscribe({
      next: (results) => {
        this.quizResults = results;
        this.loadScanResults(); // Load scan results after quiz results
      },
      error: (error) => {
        this.errorMessage = 'Failed to load quiz results. Please try again later.';
        this.isLoading = false;
        console.error('Error loading quiz results:', error);
      }
    });
  }

  loadScanResults(): void {
    this.scanService.getScanResults().subscribe({
      next: (results) => {
        this.scanResults = results;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load scan results. Please try again later.';
        this.isLoading = false;
        console.error('Error loading scan results:', error);
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(startTime: Date | null | undefined, endTime: Date | null | undefined): string {
    if (!startTime || !endTime) return 'N/A';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();

    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    return `${minutes}m ${seconds}s`;
  }

  // Action button functionality
  viewReport(report: PatientReportWithPatient): void {
    this.selectedReport = report;
    this.showDetailsModal = true;
  }

  editReport(report: PatientReportWithPatient): void {
    this.currentReport = { ...report };
    this.isEditing = true;
    this.showForm = true;
    this.showDetailsModal = false;
  }

  saveReport(): void {
    this.isLoading = true;
    this.errorMessage = '';

    if (!this.currentReport.diagnosticName) {
      this.errorMessage = 'Diagnostic name is required';
      this.isLoading = false;
      return;
    }

    if (this.isEditing && this.currentReport._id) {
      this.reportService.updatePatientReport(this.currentReport._id, this.currentReport).subscribe({
        next: (report) => {
          if (report) {
            this.loadPatientReports();
            this.cancelForm();
          } else {
            this.errorMessage = 'Failed to update report. Please try again.';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating report:', error);
          this.errorMessage = 'Failed to update report. Please try again.';
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage = 'Invalid report data';
      this.isLoading = false;
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.currentReport = {};
    this.isEditing = false;
  }

  confirmDelete(report: PatientReportWithPatient): void {
    this.selectedReport = report;
    this.showDeleteModal = true;
  }

  deleteReport(): void {
    if (this.selectedReport && this.selectedReport._id) {
      this.isLoading = true;
      this.errorMessage = '';
      this.reportService.deletePatientReport(this.selectedReport._id).subscribe({
        next: (success) => {
          if (success) {
            this.showDeleteModal = false;
            this.selectedReport = null;
            this.loadPatientReports();
          } else {
            this.errorMessage = 'Failed to delete report. Please try again.';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting report:', error);
          this.errorMessage = 'Failed to delete report. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  closeModal(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay') || target.classList.contains('close-btn') || target.closest('.close-btn') || target.classList.contains('btn-secondary')) {
      this.showDetailsModal = false;
      this.showDeleteModal = false;
    }
  }

  /**
   * Generates a PDF report for the selected patient report
   * @param report The patient report to generate a PDF for
   */
  async generatePdf(report: PatientReportWithPatient): Promise<void> {
    if (!report) return;

    this.isLoading = true;

    try {
      // Get patient details
      await this.reportService.getPatientReport(report._id as string).subscribe({
        next: async (fullReport) => {
          if (!fullReport) {
            this.errorMessage = 'Failed to load report details for PDF generation.';
            this.isLoading = false;
            return;
          }

          // Fetch complete patient data
          const patientId = typeof fullReport.patient === 'string' ? fullReport.patient : (fullReport.patient as any)._id;
          this.patientService.getPatient(patientId).subscribe({
            next: async (patient) => {
              if (!patient) {
                this.errorMessage = 'Failed to load patient details for PDF generation.';
                this.isLoading = false;
                return;
              }

              // Generate the PDF
              await this.pdfService.generatePdfReport(fullReport, patient);
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error loading patient details for PDF generation:', error);
              this.errorMessage = 'Failed to generate PDF. Please try again.';
              this.isLoading = false;
            }
          });
        },
        error: (error) => {
          console.error('Error loading report for PDF generation:', error);
          this.errorMessage = 'Failed to generate PDF. Please try again.';
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.errorMessage = 'Failed to generate PDF. Please try again.';
      this.isLoading = false;
    }
  }

  /**
   * Calculates age from date of birth
   * @param dateOfBirth Date of birth string
   * @returns Age as a string (e.g., "21 Years")
   */
  private calculateAge(dateOfBirth: string): string {
    if (!dateOfBirth) return 'N/A';

    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();

    // Adjust age if birthday hasn't occurred yet this year
    if (
      today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
    ) {
      age--;
    }

    return `${age} Years`;
  }
}
