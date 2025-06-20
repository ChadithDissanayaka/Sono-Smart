import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Patient, PatientService } from '../../services/patient.service';

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.css']
})
export class PatientComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  currentPatient: Partial<Patient> = {};
  selectedPatient: Patient | null = null;
  showForm = false;
  isEditing = false;
  showDetailsModal = false;
  showDeleteModal = false;
  searchTerm = '';
  isLoading = false;
  errorMessage = '';

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.filteredPatients = patients;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.errorMessage = 'Failed to load patients. Please try again.';
        this.isLoading = false;
      }
    });
  }

  filterPatients(): void {
    if (!this.searchTerm.trim()) {
      this.filteredPatients = this.patients;
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredPatients = this.patients.filter(patient =>
      patient.firstName.toLowerCase().includes(term) ||
      patient.lastName.toLowerCase().includes(term) ||
      patient.email?.toLowerCase().includes(term) ||
      patient.phone?.includes(term)
    );
  }

  showAddPatientForm(): void {
    this.currentPatient = {};
    this.isEditing = false;
    this.showForm = true;
  }

  editPatient(patient: Patient): void {
    this.currentPatient = { ...patient };
    this.isEditing = true;
    this.showForm = true;
    this.showDetailsModal = false;
  }

  viewPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.showDetailsModal = true;
  }

  confirmDelete(patient: Patient): void {
    this.selectedPatient = patient;
    this.showDeleteModal = true;
  }

  deletePatient(): void {
    if (this.selectedPatient) {
      this.isLoading = true;
      this.errorMessage = '';
      this.patientService.deletePatient(this.selectedPatient._id).subscribe({
        next: (success) => {
          if (success) {
            this.showDeleteModal = false;
            this.selectedPatient = null;
            this.loadPatients();
          } else {
            this.errorMessage = 'Failed to delete patient. Please try again.';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting patient:', error);
          this.errorMessage = 'Failed to delete patient. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  savePatient(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender'];
    const missingFields = requiredFields.filter(field => !this.currentPatient[field as keyof Patient]);

    if (missingFields.length > 0) {
      this.errorMessage = `Please fill in all required fields: ${missingFields.join(', ')}`;
      this.isLoading = false;
      return;
    }

    if (this.isEditing && this.currentPatient._id) {
      this.patientService.updatePatient(this.currentPatient._id, this.currentPatient).subscribe({
        next: (patient) => {
          if (patient) {
            this.loadPatients();
            this.cancelForm();
          } else {
            this.errorMessage = 'Failed to update patient. Please try again.';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating patient:', error);
          this.errorMessage = 'Failed to update patient. Please try again.';
          this.isLoading = false;
        }
      });
    } else {
      const patientData = {
        firstName: this.currentPatient.firstName!,
        lastName: this.currentPatient.lastName!,
        dateOfBirth: this.currentPatient.dateOfBirth!,
        gender: this.currentPatient.gender!,
        email: this.currentPatient.email,
        phone: this.currentPatient.phone,
        address: this.currentPatient.address,
        medicalHistory: this.currentPatient.medicalHistory
      };

      this.patientService.createPatient(patientData).subscribe({
        next: (patient) => {
          if (patient) {
            this.loadPatients();
            this.cancelForm();
          } else {
            this.errorMessage = 'Failed to create patient. Please try again.';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating patient:', error);
          this.errorMessage = 'Failed to create patient. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.currentPatient = {};
    this.isEditing = false;
  }

  closeModal(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay') || target.classList.contains('close-btn') || target.closest('.close-btn') || target.classList.contains('btn-secondary')) {
      this.showDetailsModal = false;
      this.showDeleteModal = false;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
}
