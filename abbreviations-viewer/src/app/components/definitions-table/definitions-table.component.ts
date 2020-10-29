import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';

import {DefinitionItem, DefinitionService} from '../../services/definition.service';
import {FirebaseService} from '../../services/firebase-config.service';
import {EditDefinitionComponent} from '../edit-definition/edit-definition.component';

@Component({
  selector: 'app-definitions-table',
  templateUrl: './definitions-table.component.html',
  styleUrls: ['./definitions-table.component.scss']
})
export class DefinitionsTableComponent implements OnInit, AfterViewInit {
  constructor(
      private firebaseService: FirebaseService,
      private definitionsService: DefinitionService,
      private dialog: MatDialog) {}
  definitions: MatTableDataSource<DefinitionItem>;
  displayedColumns: string[] =
      ['abbreviation', 'expansion', 'description', 'contributor', 'edit'];
  user: string;
  private viewInitialized = true;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  ngOnInit(): void {
    this.firebaseService.user.subscribe((user) => {
      if (user) {
        this.user = user.displayName;
        this.definitionsService.getAll().subscribe((val) => {
          this.definitions = new MatTableDataSource(val);
          if (this.viewInitialized) {
            this.configureTableDataSource();
          }
        });
      }
    });
  }
  private configureTableDataSource() {
    if (this.definitions) {
      this.definitions.paginator = this.paginator;
      this.definitions.sort = this.sort;
    }
  }
  ngAfterViewInit() {
    this.viewInitialized = true;
    this.configureTableDataSource();
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    if (this.definitions) {
      this.definitions.filter = filterValue.trim().toLowerCase();

      if (this.definitions.paginator) {
        this.definitions.paginator.firstPage();
      }
    }
  }
  addNewEntry() {
    const definitionItem: DefinitionItem = {
      id: undefined,
      abbreviation: undefined,
      expansion: undefined,
      contributor: undefined
    };
    const dialogRef = this.dialog.open(
        EditDefinitionComponent, {width: '350px', data: definitionItem});

    dialogRef.afterClosed().subscribe((result: DefinitionItem) => {
      if (result) {
        this.definitionsService.add(result).then(
            id => console.log(`Added ${id}`));
      }
    });
  }
  editEntry(definitionItem: DefinitionItem) {
    const dialogRef = this.dialog.open(
        EditDefinitionComponent, {width: '350px', data: definitionItem});

    dialogRef.afterClosed().subscribe((result: DefinitionItem) => {
      if (result) {
        this.definitionsService.update(result).then(
            id => console.log(`Modified ${id}`));
      }
    });
  }
}
