import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-range-modal',
  templateUrl: './date-range-modal.component.html',
  styleUrls: ['./date-range-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DateRangeModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() title = 'Select Date Range';
  @Input() loading = false;

  @Output() confirm = new EventEmitter<{ startDate: string; endDate: string }>();
  @Output() cancel = new EventEmitter<void>();

  startDate: string = '';
  endDate: string = '';

  ngOnInit(): void {
    // Set default dates (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.startDate = this.formatDate(firstDay);
    this.endDate = this.formatDate(lastDay);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onConfirm(): void {
    if (this.startDate && this.endDate) {
      if (new Date(this.startDate) > new Date(this.endDate)) {
        alert('Start date cannot be after end date');
        return;
      }
      this.confirm.emit({
        startDate: this.startDate,
        endDate: this.endDate
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

