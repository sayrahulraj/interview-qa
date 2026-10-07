import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'interview-qa', loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage) },
  { path: 'browse', title: 'Browse · interview-qa', loadComponent: () => import('./pages/browse/browse-page').then((m) => m.BrowsePage) },
  { path: 'q/:id', title: 'Question · interview-qa', loadComponent: () => import('./pages/question/question-page').then((m) => m.QuestionPage) },
  { path: 'search', title: 'Search · interview-qa', loadComponent: () => import('./pages/search/search-page').then((m) => m.SearchPage) },
  { path: 'tags', title: 'Tags · interview-qa', loadComponent: () => import('./pages/tags/tags-page').then((m) => m.TagsPage) },
  { path: 'bookmarks', title: 'Bookmarks · interview-qa', loadComponent: () => import('./pages/bookmarks/bookmarks-page').then((m) => m.BookmarksPage) },
  { path: 'practice', title: 'Practice · interview-qa', loadComponent: () => import('./pages/practice/practice-page').then((m) => m.PracticePage) },
  { path: 'interview', title: 'Interview · interview-qa', loadComponent: () => import('./pages/interview/interview-page').then((m) => m.InterviewPage) },
  { path: 'dashboard', title: 'Dashboard · interview-qa', loadComponent: () => import('./pages/dashboard/dashboard-page').then((m) => m.DashboardPage) },
  { path: 'admin', title: 'Admin · interview-qa', loadChildren: () => import('./pages/admin/admin.routes').then((m) => m.ADMIN_ROUTES) },
  { path: '**', title: 'Not found · interview-qa', loadComponent: () => import('./pages/not-found/not-found-page').then((m) => m.NotFoundPage) },
];
