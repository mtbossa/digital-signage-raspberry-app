import { HttpClient } from "@angular/common/http";
import { Component } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";

import { AuthService } from "../../data-access/auth.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
  constructor(private http: HttpClient, private authService: AuthService) {}

  loginForm = new FormGroup({
    email: new FormControl("t@t", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("password", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    remember: new FormControl(false, {
      nonNullable: true,
    }),
  });

  submitLogin() {
    if (this.loginForm.invalid) return;

    this.authService.logIn(this.loginForm.getRawValue());
  }
}
