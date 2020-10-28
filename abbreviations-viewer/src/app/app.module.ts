import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './components/app.component';
import {DefinitionsTableComponent} from './components/definitions-table/definitions-table.component';
import {EditDefinitionComponent} from './components/edit-definition/edit-definition.component';
import {LoginComponent} from './components/login/login.component';
import {DefinitionService} from './services/definition.service';
import {FirebaseService} from './services/firebase-config.service';

@NgModule({
  declarations: [
    AppComponent, LoginComponent, DefinitionsTableComponent,
    EditDefinitionComponent
  ],
  imports: [
    AppRoutingModule, BrowserAnimationsModule, BrowserModule, FormsModule,
    MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatPaginatorModule, MatSortModule, MatTableModule
  ],
  providers: [DefinitionService, FirebaseService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
