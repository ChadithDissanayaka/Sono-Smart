import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PatientService, Patient } from '../../services/patient.service';
import { ScanService, ScanSection } from '../../services/scan.service';
import { ReportService, ScanImage } from '../../services/report.service';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-scans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scans.component.html',
  styleUrls: ['./scans.component.css'],
  animations: [
    trigger('fadeIn', [
      state(
        'void',
        style({
          opacity: 0,
        })
      ),
      transition('void => *', [animate('0.3s ease-in')]),
    ]),
  ],
})
export class ScansComponent implements OnInit {
  isLoading = false;
  sessionStartTime: Date | null = null;

  // Interface for scan section data
  scanSections: {
    id: number;
    selectedFile: File | null;
    imagePreview: string | null;
    predictionResult: string | null;
    predictionSuccess: boolean | null;
    detectedOrgans: { name: string; confidence: number }[];
    userPrediction: string;
    reportOrgan: string; // Added for report creation
  }[] = [];
  confident : any = null;
  // Current active scan section (for backward compatibility)
  get selectedFile(): File | null {
    return this.scanSections[0]?.selectedFile || null;
  }
  get imagePreview(): string | null {
    return this.scanSections[0]?.imagePreview || null;
  }
  get predictionResult(): string | null {
    return this.scanSections[0]?.predictionResult || null;
  }
  get predictionSuccess(): boolean | null {
    return this.scanSections[0]?.predictionSuccess || null;
  }
  get detectedOrgans(): { name: string; confidence: number }[] {
    return this.scanSections[0]?.detectedOrgans || [];
  }
  get userPrediction(): string {
    return this.scanSections[0]?.userPrediction || '';
  }
  set userPrediction(value: string) {
    if (this.scanSections[0]) this.scanSections[0].userPrediction = value;
  }

  // For professionals
  isReportGenerated: boolean = false;

  // For patient selection
  patients: Patient[] = [];
  selectedPatientId: string = '';
  selectedPatient: Patient | null = null;

  // For report form
  diagnosticName: string = '';
  instructions: string = '';
  conditionDetails: string = '';

  constructor(
    public authService: AuthService,
    private patientService: PatientService,
    private scanService: ScanService,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    // Initialize component with first scan section
    this.addScanSection();
    // Record session start time
    this.sessionStartTime = new Date();
  }

  onFileSelected(event: Event, sectionIndex: number = 0): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.scanSections[sectionIndex].selectedFile = input.files[0];
      this.previewImage(sectionIndex);
      // Reset previous results
      this.scanSections[sectionIndex].predictionResult = null;
      this.scanSections[sectionIndex].predictionSuccess = null;
      this.scanSections[sectionIndex].detectedOrgans = [];
      this.isReportGenerated = false;
      
    }
  }

  previewImage(sectionIndex: number = 0): void {
    const section = this.scanSections[sectionIndex];
    if (!section || !section.selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      section.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(section.selectedFile);
  }

  submitForTrainee(sectionIndex: number = 0): void {
    const section = this.scanSections[sectionIndex];
    if (!section || !section.selectedFile || !section.imagePreview || !section.userPrediction) return;

    this.isLoading = true;

    // Extract the base64 image data from the image preview
    const imageData = section.imagePreview.split(',')[1];

    // Call the real organ detection API
    this.scanService.detectOrgans(imageData).subscribe({
      next: (result) => {
        if (result && result.detectedOrgan && result.detectedOrgan !== 'No Detection') {
          section.predictionResult = result.detectedOrgan;
          section.predictionSuccess = section.userPrediction.toLowerCase() === result.detectedOrgan.toLowerCase();
        } else {
          console.error('No organs detected or invalid response format');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error detecting organs:', error);
        section.predictionResult = 'Error detecting organ';
        section.predictionSuccess = false;
        this.isLoading = false;
      }
    });
  }

  submitForProfessional(sectionIndex: number = 0): void {
    const section = this.scanSections[sectionIndex];
    if (!section || !section.selectedFile || !section.imagePreview) return;

    this.isLoading = true;

    // Extract the base64 image data from the image preview
    const imageData = section.imagePreview.split(',')[1];

    // Call the real organ detection API
    this.scanService.detectOrgans(imageData).subscribe({
      next: (result) => {
        if (result && result.detectedOrgan && result.detectedOrgan !== 'No Detection') {
          // Convert single organ name to the array format for backward compatibility
          this.confident = result;
          section.detectedOrgans = [{ name: result.detectedOrgan, confidence: 1.0 }];
        } else {
          section.detectedOrgans = [];
          console.error('No organs detected or invalid response format');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error detecting organs:', error);
        section.detectedOrgans = [];
        this.isLoading = false;
      }
    });
  }

  // Dialog properties
  showReportDialog = false;
  reportNotes: string = '';
  activeSectionIndex: number = 0; // Track which scan section is being reported on

  openReportDialog(sectionIndex: number = 0): void {
    this.activeSectionIndex = sectionIndex;
    this.showReportDialog = true;
    this.loadPatients();
  }

  loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
      },
      error: (error) => {
        console.error('Error loading patients:', error);
      },
    });
  }

  onPatientSelected(): void {
    if (this.selectedPatientId) {
      this.patientService.getPatient(this.selectedPatientId).subscribe({
        next: (patient) => {
          this.selectedPatient = patient;
        },
        error: (error) => {
          console.error('Error loading patient details:', error);
        },
      });
    } else {
      this.selectedPatient = null;
    }
  }

  calculateAge(dateOfBirth: string): string {
    if (!dateOfBirth) return 'N/A';

    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age.toString();
  }

  closeReportDialog(event: Event): void {
    const target = event.target as HTMLElement;
    if (
      target.classList.contains('modal-overlay') ||
      target.classList.contains('close-btn') ||
      target.closest('.close-btn') ||
      target.classList.contains('btn-secondary')
    ) {
      this.showReportDialog = false;
    }
  }

  generateReport(): void {
    if (!this.selectedPatientId || !this.selectedPatient) {
      return; // Require patient selection
    }

    this.isLoading = true;

    // Get selected patient information
    const patientInfo = {
      name: `${this.selectedPatient.firstName} ${this.selectedPatient.lastName}`,
      age: this.calculateAge(this.selectedPatient.dateOfBirth),
      gender: this.selectedPatient.gender,
      email: this.selectedPatient.email || 'N/A',
      phone: this.selectedPatient.phone || 'N/A',
    };

    // Get only the active scan section information
    const activeSection = this.scanSections[this.activeSectionIndex];
    const scanImages: ScanImage[] = [];

    if (activeSection && activeSection.imagePreview && activeSection.reportOrgan) {
      scanImages.push({
        imageUrl: activeSection.imagePreview,
        organ: activeSection.reportOrgan,
      });
    }

    // Save the patient report to the database
    this.reportService.savePatientReport({
      patient: this.selectedPatientId,
      scanImages: scanImages,
      diagnosticName: this.diagnosticName,
      instructions: this.instructions,
      conditionDetails: this.conditionDetails,
      additionalNotes: this.reportNotes,
    }).subscribe(
      (report) => {
        console.log('Patient report saved:', report);
        this.isReportGenerated = true;
        this.isLoading = false;
        this.showReportDialog = false;

        // Reset form fields
        this.reportNotes = '';
        this.diagnosticName = '';
        this.instructions = '';
        this.conditionDetails = '';
        this.selectedPatientId = '';
        this.selectedPatient = null;
      },
      (error) => {
        console.error('Error saving patient report:', error);
        this.isLoading = false;
        alert('Error saving patient report. Please try again.');
      }
    );
  }

  resetForm(sectionIndex: number = 0): void {
    if (sectionIndex >= 0 && sectionIndex < this.scanSections.length) {
      this.scanSections[sectionIndex] = {
        id: this.scanSections[sectionIndex].id,
        selectedFile: null,
        imagePreview: null,
        predictionResult: null,
        predictionSuccess: null,
        userPrediction: '',
        detectedOrgans: [],
        reportOrgan: '',
      };
      this.isReportGenerated = false;
    }
  }

  // Add a new scan section
  addScanSection(): void {
    const newId =
      this.scanSections.length > 0
        ? Math.max(...this.scanSections.map((s) => s.id)) + 1
        : 1;

    this.scanSections.push({
      id: newId,
      selectedFile: null,
      imagePreview: null,
      predictionResult: null,
      predictionSuccess: null,
      detectedOrgans: [],
      userPrediction: '',
      reportOrgan: '',
    });
  }

  // Remove a scan section
  removeScanSection(sectionIndex: number): void {
    if (
      this.scanSections.length > 1 &&
      sectionIndex >= 0 &&
      sectionIndex < this.scanSections.length
    ) {
      this.scanSections.splice(sectionIndex, 1);
    }
  }

  // Check if there are any completed scans
  hasCompletedScans(): boolean {
    return this.scanSections.some(
      (section) => section.predictionResult && section.userPrediction
    );
  }

  // End session and save all results at once
  endSession(): void {
    this.isLoading = true;

    // Get all completed sections
    const completedSections = this.scanSections.filter(
      (s) => s.predictionResult && s.userPrediction
    );
    const correctSections = completedSections.filter(
      (s) => s.predictionSuccess
    );

    if (completedSections.length === 0) {
      this.isLoading = false;
      return;
    }

    // Record session end time
    const sessionEndTime = new Date();

    // Prepare scan sections data
    const scanSectionsData: ScanSection[] = completedSections.map((s) => ({
      imageUrl: s.imagePreview || '',
      userPrediction: s.userPrediction,
      correctOrgan: s.predictionResult || '',
      isCorrect: s.predictionSuccess || false,
    }));

    // Save all scan results at once
    this.scanService
      .saveScanResult({
        scanSections: scanSectionsData,
        totalScans: completedSections.length,
        correctScans: correctSections.length,
        startTime: this.sessionStartTime,
        endTime: sessionEndTime,
      })
      .subscribe(
        (result) => {
          console.log('Scan session saved:', result);
          this.isLoading = false;

          // Show success message (could be enhanced with a proper notification system)
          alert('Session saved successfully!');

          // Reset all scan sections to start a new session
          this.scanSections = [];
          this.addScanSection();
        },
        (error) => {
          console.error('Error saving scan session:', error);
          this.isLoading = false;
          alert('Error saving session. Please try again.');
        }
      );
  }
}
