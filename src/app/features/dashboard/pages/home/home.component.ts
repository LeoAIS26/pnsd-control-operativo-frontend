import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatChipsModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Estados reactivos para PWA y Conectividad
  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly canInstallPwa = signal<boolean>(false);
  readonly isInstalled = signal<boolean>(false);
  readonly isSimulatingOffline = signal<boolean>(false);

  private deferredPrompt: any = null;
  private onlineHandler = () => this.isOnline.set(true);
  private offlineHandler = () => this.isOnline.set(false);

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onlineHandler);
      window.addEventListener('offline', this.offlineHandler);

      // Detectar si la app ya fue instalada o corre en modo standalone PWA
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        this.isInstalled.set(true);
      }

      // Capturar evento de instalación nativa PWA
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.canInstallPwa.set(true);
      });

      // Detectar cuando el usuario instala la PWA
      window.addEventListener('appinstalled', () => {
        this.isInstalled.set(true);
        this.canInstallPwa.set(false);
        this.deferredPrompt = null;
      });
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineHandler);
      window.removeEventListener('offline', this.offlineHandler);
    }
  }

  instalarPwa(): void {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] Usuario aceptó instalar SISCOP en su dispositivo');
        }
        this.deferredPrompt = null;
        this.canInstallPwa.set(false);
      });
    } else {
      alert('Para instalar en tu teléfono:\n\n• En Android (Chrome): Toca el menú de tres puntos (⋮) y selecciona "Instalar aplicación" o "Agregar a la pantalla principal".\n\n• En iPhone (Safari): Toca el botón Compartir (cuadrado con flecha hacia arriba) y selecciona "Agregar a Inicio".');
    }
  }

  toggleSimulacionOffline(): void {
    this.isSimulatingOffline.update((val) => !val);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login'], { queryParams: { loggedOut: true } });
  }
}
