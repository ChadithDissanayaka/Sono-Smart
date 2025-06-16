import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutComponent } from '../about/about.component';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, AboutComponent],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        overflow: 'hidden',
        opacity: '0',
        padding: '0',
        margin: '0'
      })),
      state('expanded', style({
        height: '*',
        opacity: '1'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease-in-out')
      ])
    ])
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  constructor(private router: Router) {}
  isUsersSectionExpanded = false;
  isAnimating = false;

  // Carousel properties
  carouselImages = [
    'home/doctor-crossing-arms-while-holding-stethoscope-white-coat_176474-8491.jpg',
    'home/nurse-using-ultrasonic-device.jpg',
    'home/doctors-nurses-sitting-staircase.jpg',
    'home/wp14337423-utrasound-nurse-wallpapers.jpg'
  ];
  currentSlide = 0;
  autoRotateInterval: any;

  ngOnInit() {
    this.startAutoRotate();
  }

  ngOnDestroy() {
    this.stopAutoRotate();
  }

  toggleUsersSection() {
    this.isAnimating = true;
    this.isUsersSectionExpanded = !this.isUsersSectionExpanded;

    if (!this.isUsersSectionExpanded) {
      setTimeout(() => {
        this.isAnimating = false;
      }, 300);
    }
  }

  prevSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.carouselImages.length - 1 : this.currentSlide - 1;
    this.resetAutoRotate();
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.carouselImages.length;
    this.resetAutoRotate();
  }

  setCurrentSlide(index: number) {
    this.currentSlide = index;
    this.resetAutoRotate();
  }

  startAutoRotate() {
    this.autoRotateInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoRotate() {
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
    }
  }

  resetAutoRotate() {
    this.stopAutoRotate();
    this.startAutoRotate();
  }

  scrollToSolutions() {
    const solutionsSection = document.getElementById('solutions');
    if (solutionsSection) {
      solutionsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navigateToScan() {
    this.router.navigate(['/scans']);
  }
}
