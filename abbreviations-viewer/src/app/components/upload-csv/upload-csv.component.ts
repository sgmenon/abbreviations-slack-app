import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-upload-csv',
  templateUrl: './upload-csv.component.html',
  styleUrls: ['./upload-csv.component.scss']
})
export class UploadCsvComponent {
  constructor(
      public dialogRef: MatDialogRef<UploadCsvComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {filename: string}) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
