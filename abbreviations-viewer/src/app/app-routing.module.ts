import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {DefinitionsTableComponent} from './components/definitions-table/definitions-table.component';
import {LoginComponent} from './components/login/login.component';

const routes: Routes = [
  {path: '', redirectTo: '/main', pathMatch: 'full'},
  {path: 'main', component: DefinitionsTableComponent}
];

@NgModule({imports: [RouterModule.forRoot(routes)], exports: [RouterModule]})
export class AppRoutingModule {
}
