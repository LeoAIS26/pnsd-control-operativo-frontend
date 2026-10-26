/**
 * Estructura estándar de respuesta de la API del Backend (SERNANP)
 */
export interface BaseResponse<T> {
  exito: boolean;
  mensaje: string;
  datos: T;
  fecha: string;
}
