import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DefinitionItem} from 'src/app/services/definition.service';

@Component({
  selector: 'app-edit-definition',
  templateUrl: './edit-definition.component.html',
  styleUrls: ['./edit-definition.component.scss']
})
export class EditDefinitionComponent {
  mode: 'Editing'|'Adding a new entry' = 'Adding a new entry';
  constructor(
      public dialogRef: MatDialogRef<EditDefinitionComponent>,
      @Inject(MAT_DIALOG_DATA) public data: DefinitionItem) {
    if (data.id) {
      this.mode = 'Editing';
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
