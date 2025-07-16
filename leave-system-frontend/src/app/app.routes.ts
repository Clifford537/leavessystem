import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { SetpasswordComponent } from './auth/setpassword/setpassword.component';
import { DashboardComponent } from './staff/dashboard/dashboard.component';
import { NotfoundComponent } from './shared/components/notfound/notfound.component';
import { AdminComponent } from './staff/admin/admin.component';

export const routes: Routes = [
    {
        path:'',
        pathMatch:'full',
        loadComponent:()=>{
            return import('./home/home.component').then((m)=>HomeComponent);
        }
    },
    {
        path:'login',
        loadComponent:()=>{
            return import('./auth/login/login.component').then((m)=>LoginComponent);
        }
    },
    {
        path:'setpassword',
        loadComponent:()=>{
            return import('./auth/setpassword/setpassword.component').then((m)=>SetpasswordComponent);
        }

    },
    {
        path:'staff',
        loadComponent:()=>{
            return import('./staff/dashboard/dashboard.component').then((m)=>DashboardComponent);
        }
    },
    {
        path:'staffaccount',
        loadComponent:()=>{
            return import('./staff/admin/admin.component').then((m)=>AdminComponent);
        }
    },
    {
        path:'**',
        loadComponent:()=>{
            return import('./shared/components/notfound/notfound.component').then((m)=>NotfoundComponent);
        }
    }
];
