import { Component, HostListener, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    RouterModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements AfterViewInit {
  isMobile: boolean = false;
  @ViewChild('mobileMenuDialog') mobileMenuDialog!: TemplateRef<any>;

  constructor(public dialog: MatDialog) {
    this.checkScreenSize();
  }

  ngAfterViewInit() {
    // Initialization logic if needed
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 480;
  }

  openMobileMenuDialog() {
    if (!this.mobileMenuDialog) {
      return;
    }
    this.dialog.open(this.mobileMenuDialog, {
      width: '250px',
      panelClass: 'mobile-menu-dialog'
    });
  }
}
