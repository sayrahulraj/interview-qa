import { Routes } from '@angular/router';
import { authGuard } from '../../guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  { path: 'login', title: 'Admin login', loadComponent: () => import('./admin-login').then((m) => m.AdminLogin) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', title: 'Admin · Questions', loadComponent: () => import('./admin-list').then((m) => m.AdminList) },
      { path: 'new', title: 'Admin · Add question', loadComponent: () => import('./admin-form').then((m) => m.AdminForm) },
      { path: 'edit/:id', title: 'Admin · Edit question', loadComponent: () => import('./admin-form').then((m) => m.AdminForm) },
      { path: 'data', title: 'Admin · Import / Export', loadComponent: () => import('./admin-data').then((m) => m.AdminData) },
    ],
  },
];
