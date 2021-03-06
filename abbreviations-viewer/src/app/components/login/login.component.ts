import {Component} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {last} from 'rxjs/operators';

import {FirebaseService} from '../../services/firebase-config.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  constructor(
      private firebaseService: FirebaseService, private router: Router,
      private snackBar: MatSnackBar) {
    firebaseService.user.pipe(last()).subscribe((user) => {
      if (user) {
        this.done();
      }
    });
  }
  private done() {
    this.router.navigate(['/main']);
  }
  login() {
    this.firebaseService.authenticate()
        .then((user: firebase.default.User) => {
          console.log(`User: ${user.displayName} logged in`);
          this.done();
        })
        .catch(
            e => this.snackBar.open(
                `login failure: ${e.errorMessage}`, 'dismiss'));
  }
}
