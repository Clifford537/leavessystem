import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(),provideNativeDateAdapter(),
    provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]
};
