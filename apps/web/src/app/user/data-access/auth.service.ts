import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, map, mergeMap, take, tap } from "rxjs";
import { environment } from "src/environments/environment";

// TODO create logged-user route and return a new UserLogged API Resource
export interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}

  private loggedUser$ = new BehaviorSubject<User | null>(null);

  public getLoggedUser() {
    return this.loggedUser$.asObservable();
  }

  public setLoggedUser(value: User | null) {
    this.loggedUser$.next(value);
  }

  public logIn(loginData: { email: string; password: string; remember: boolean }) {
    this.http
      .get(`${environment.apiUrl}/sanctum/csrf-cookie`)
      .pipe(
        take(1),
        mergeMap(() =>
          this.http.post(`${environment.apiUrl}/login`, loginData).pipe(take(1))
        ),
        mergeMap(() => this.fetchLoggedUser()),
        tap(() => this.router.navigate(["/"]))
      )
      .subscribe((user: User) => {
        this.setLoggedUser(user);
      });
  }

  public fetchLoggedUser() {
    return this.http.get<{ data: User }>(`${environment.apiUrl}/api/user`).pipe(
      take(1),
      map((userData) => userData.data)
    );
  }

  public isLogged() {
    return this.getLoggedUser().pipe(map((userOrNull) => (userOrNull ? true : false)));
  }
}
