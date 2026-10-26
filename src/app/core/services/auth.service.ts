import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BaseResponse } from '../models/base-response.model';
import { AuthResponse, LoginRequest, RolUsuario, UsuarioSesion } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly apiUrl = environment.apiUrl;
  private readonly tokenKey = environment.tokenKey;
  private readonly userKey = environment.userKey;

  // Signal reactivo para el usuario autenticado
  private readonly _currentUser = signal<UsuarioSesion | null>(this.obtenerUsuarioAlmacenado());
  readonly currentUser = this._currentUser.asReadonly();

  // Signals computados
  readonly isAuthenticated = computed(() => !!this._currentUser() && !!this.obtenerToken());
  readonly userRole = computed<RolUsuario | null>(() => this._currentUser()?.rol ?? null);
  readonly userName = computed<string>(() => this._currentUser()?.nombre ?? '');

  /**
   * Envía credenciales al Backend para iniciar sesión
   */
  login(credenciales: LoginRequest): Observable<BaseResponse<AuthResponse>> {
    return this.http
      .post<BaseResponse<AuthResponse>>(`${this.apiUrl}/auth/login`, credenciales)
      .pipe(
        tap((respuesta) => {
          if (respuesta.exito && respuesta.datos) {
            this.guardarSesion(respuesta.datos);
          }
        })
      );
  }

  /**
   * Guarda el token JWT y los datos del usuario en localStorage y actualiza el signal
   */
  guardarSesion(auth: AuthResponse): void {
    const usuario: UsuarioSesion = {
      idUsuario: auth.idUsuario,
      uuid: auth.uuid,
      nombre: auth.nombre,
      rol: auth.rol,
      estado: auth.estado
    };

    localStorage.setItem(this.tokenKey, auth.token);
    localStorage.setItem(this.userKey, JSON.stringify(usuario));

    this._currentUser.set(usuario);
  }

  /**
   * Obtiene el token JWT actual
   */
  obtenerToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Cierra la sesión activa, limpia el almacenamiento y redirige a /login
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Verifica de forma síncrona si hay sesión activa
   */
  estaAutenticado(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Comprueba si el usuario en sesión tiene un rol específico
   */
  tieneRol(rol: RolUsuario): boolean {
    return this.userRole() === rol;
  }

  /**
   * Recupera los datos del usuario persistidos en localStorage
   */
  private obtenerUsuarioAlmacenado(): UsuarioSesion | null {
    try {
      const data = localStorage.getItem(this.userKey);
      return data ? (JSON.parse(data) as UsuarioSesion) : null;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }
}
