import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleMobileSidebar = new EventEmitter<void>();

  constructor(private authService: AuthService) {}

  onToggleSidebar() {
    if (window.innerWidth <= 768) {
      this.toggleMobileSidebar.emit();
    } else {
      this.toggleSidebar.emit();
    }
  }

  logout() {
    this.authService.logout();
  }
}
