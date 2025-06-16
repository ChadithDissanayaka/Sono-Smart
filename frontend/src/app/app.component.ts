import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'SonoSmart';
  backendMessage = 'Connecting to backend...';
  currentYear = new Date().getFullYear();

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.apiService.getHealthStatus().subscribe({
      next: (response) => {
        this.backendMessage = response.message || 'Connected to backend';
      },
      error: (error) => {
        this.backendMessage = 'Error connecting to backend: ' + (error.message || 'Unknown error');
        console.error('Backend connection error:', error);
      }
    });
  }

  logout() {
    this.authService.logout();
    window.location.href = '/';
  }

  navigateToAbout(event: Event) {
    event.preventDefault();
    if (this.router.url !== '/') {
      this.router.navigate(['/'])
        .then(() => {
          setTimeout(() => {
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
              aboutSection.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        });
    } else {
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}
