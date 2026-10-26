/**
 * Credenciales para iniciar sesión en SIGCOB
 */
export interface LoginRequest {
  nombre: string;
  password: string;
}

/**
 * Roles disponibles en el sistema PNSD
 */
export type RolUsuario = 'ADMIN' | 'GUARDAPARQUE';

/**
 * Datos que retorna el Backend al iniciar sesión exitosamente
 */
export interface AuthResponse {
  token: string;
  tipoToken: string;
  expiracionMilisegundos: number;
  idUsuario: number;
  uuid: string;
  nombre: string;
  rol: RolUsuario;
  estado: boolean;
}

/**
 * Datos del usuario autenticado almacenados en la sesión
 */
export interface UsuarioSesion {
  idUsuario: number;
  uuid: string;
  nombre: string;
  rol: RolUsuario;
  estado: boolean;
}
