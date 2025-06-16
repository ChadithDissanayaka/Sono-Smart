import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { QaComponent } from './components/qa/qa.component';
import { PatientComponent } from './components/patient/patient.component';
import { ScansComponent } from './components/scans/scans.component';
import { ReportsComponent } from './components/reports/reports.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'qa', component: QaComponent, canActivate: [authGuard] },
  { path: 'patients', component: PatientComponent, canActivate: [authGuard] },
  { path: 'scans', component: ScansComponent, canActivate: [authGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [authGuard] },
  { path: '', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) }
];
