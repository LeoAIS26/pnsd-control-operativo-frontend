import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { HomeComponent } from './features/dashboard/pages/home/home.component';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [noAuthGuard],
    title: 'Iniciar Sesión - SISCOP PNSD'
  },
  {
    path: 'dashboard',
    component: HomeComponent,
    canActivate: [authGuard],
    title: 'Inicio - SISCOP PNSD'
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
