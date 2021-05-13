import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ActivatedRoute} from '@angular/router';

import {DefinitionItem, DefinitionService} from '../../services/definition.service';
import {FirebaseService} from '../../services/firebase-config.service';
import {EditDefinitionComponent} from '../edit-definition/edit-definition.component';
import {UploadCsvComponent} from '../upload-csv/upload-csv.component';

@Component({
  selector: 'app-definitions-table',
  templateUrl: './definitions-table.component.html',
  styleUrls: ['./definitions-table.component.scss']
})
export class DefinitionsTableComponent implements OnInit, AfterViewInit {
  private idAndContextSet: Set<string> = new Set();
  private idSet: Set<string> = new Set();
  private defaultFilterPredicate:
      ((data: DefinitionItem, filter: string) => boolean);
  private filterFields: {abb?: string, ctx?: string, contrib?: string};
  filterLabel =
      'Filter (eg. "AV", "abb:av", "ctx:motional DOG", "ctx:mcu Aurix abb:D" etc.)';
  adminView = false;
  definitions: MatTableDataSource<DefinitionItem>;
  displayedColumns: string[] =
      ['abbreviation', 'expansion', 'notes', 'context', 'contributor', 'edit'];
  user?: string;
  private viewInitialized = true;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('input', {read: ElementRef}) filter: ElementRef;

  constructor(
      private firebaseService: FirebaseService,
      private definitionsService: DefinitionService, private dialog: MatDialog,
      private snackBar: MatSnackBar, private elementRef: ElementRef,
      private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      this.adminView = params.admin;
    });
  }
  private resize() {
    if (this.elementRef.nativeElement.getBoundingClientRect().width > 600) {
      this.displayedColumns = [
        'abbreviation', 'expansion', 'notes', 'context', 'contributor', 'edit'
      ];
    } else {
      this.displayedColumns = ['abbreviation', 'expansion', 'notes', 'edit'];
    }
  }
  ngOnInit(): void {
    this.firebaseService.user.subscribe((user) => {
      if (user) {
        this.user = user.displayName;
        this.definitionsService.getAll().subscribe((val) => {
          this.idAndContextSet = new Set();
          this.idSet = new Set();
          val.forEach(v => {
            this.idAndContextSet.add([v.abbreviation, v.context].toString());
            this.idSet.add(v.abbreviation);
          });
          this.definitions = new MatTableDataSource(val);
          if (this.viewInitialized) {
            this.configureTableDataSource();
          }
          const event = new Event('keyup');
          if (this.filter) {
            this.filter.nativeElement.dispatchEvent(event);
          }
          this.defaultFilterPredicate =
              this.definitions.filterPredicate.bind({});
          this.definitions.filterPredicate = (data, filter: string) => {
            if (this.filterFields.abb &&
                data.abbreviation.toLowerCase().search(this.filterFields.abb) <
                    0) {
              return false;
            }
            if (this.filterFields.contrib &&
                data.contributor.toLowerCase().search(
                    this.filterFields.contrib) < 0) {
              return false;
            }
            if (this.filterFields.ctx &&
                data.context.toLowerCase().search(this.filterFields.ctx) < 0) {
              return false;
            }
            filter = filter.replace(/(\w+)\:(\w+)/g, '');
            return this.defaultFilterPredicate(data, filter.trim());
          };
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
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    const knownTokens = ['abb', 'ctx', 'contrib'];

    if (this.definitions) {
      const lowerFilterStr = filterValue.trim().toLowerCase();
      this.filterFields = {};
      const tokens = lowerFilterStr.match(/(\w+)\:(\w+)/g);
      if (tokens) {
        tokens.forEach(tok => {
          const matches = tok.match(/(\w+)\:(\w+)/);
          if (knownTokens.includes(matches[1])) {
            switch (matches[1]) {
              case 'abb':
                this.filterFields.abb = matches[2];
                break;
              case 'ctx':
                this.filterFields.ctx = matches[2];
                break;
              case 'contrib':
                this.filterFields.contrib = matches[2];
                break;
            }
          }
        });
      }
      this.definitions.filter = lowerFilterStr;

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
        const newIdAndContext =
            [result.abbreviation, result.context].toString();
        if (this.idAndContextSet.has(newIdAndContext)) {
          this.snackBar.open(
              `An abbreviation '${
                  result.abbreviation}' already exists with context '${
                  result.context ? result.context : ''}'.`,
              'close', {duration: 10000});
          return;
        } else if (this.idSet.has(result.abbreviation)) {
          const snackBarRef = this.snackBar.open(
              `An abbreviation '${
                  result.abbreviation}' already exists (with context '${
                  result.context ? result.context : ''}').`,
              'Add anyway', {duration: 10000});
          snackBarRef.onAction().subscribe(() => {
            this.definitionsService.add(result).then(
                id => console.log(`Added ${id}`));
          });
          return;
        }
        this.definitionsService.add(result).then(
            id => console.log(`Added ${id}`));
      }
    });
  }
  uploadEntries() {
    const dialogRef = this.dialog.open(
        UploadCsvComponent, {width: '350px', data: {filename: ''}});

    dialogRef.afterClosed().subscribe((result: {filename: string}) => {
      if (result) {
        this.definitionsService.uploadCSV(result.filename)
            .then(
                (postResult) => postResult.subscribe(
                    code => console.log('success ' + JSON.stringify(code))),
                (reason) => console.log('failure: ' + reason))
            .catch((err) => console.log(err));
      }
    });
  }
  downloadEntries() {
    if (this.definitions) {
      this.definitionsService.downloadCSV(this.definitions.filteredData);
    }
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
  async signOut() {
    this.definitionsService.unsubscribeAll();
    await this.firebaseService.signOut();
    this.definitions.data = [];
    this.user = undefined;
  }
  stripDomain(val: string) {
    if (!val) {
      return '';
    }
    return val.replace(/@motional.com/gi, '');
  }
  makeLinksClickable(val: string) {
    if (!val) {
      return '';
    }
    return val.replace(/(https?:\/\/[^\s]+)/g, '<a href=\'$1\'>$1</a>');
  }
}
