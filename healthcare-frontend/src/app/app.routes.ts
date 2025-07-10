import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { DoctorDashboardComponent } from './pages/doctor-dashboard/doctor-dashboard.component';
import { PatientDashboardComponent } from './pages/patient-dashboard/patient-dashboard.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { NoAuthGuard } from './guards/no-auth.guard';
import { BookAppointmentComponent } from './pages/book-appointment/book-appointment.component';
import { DoctorAppointmentsComponent } from './pages/doctor-appointments/doctor-appointments.component';
import { AdminAppointmentsComponent } from './pages/admin-appointments/admin-appointments.component';
import { PatientAppointmentsComponent } from './pages/patient-appointments/patient-appointments.component';
import { AdminBookAppointmentComponent } from './pages/admin-book-appointment/admin-book-appointment.component';
import { PrescriptionWriteComponent } from './pages/prescriptions/prescription-write/prescription-write.component';
import { PrescriptionViewComponent } from './pages/prescriptions/prescription-view/prescription-view.component'; 
import { PatientPrescriptionViewComponent } from './pages/patient/patient-prescription-view/patient-prescription-view.component';

import { AdminPrescriptionListComponent } from './pages/admin/admin-prescription-list/admin-prescription-list.component';
import { AdminPrescriptionViewComponent } from './pages/admin/admin-prescription-view/admin-prescription-view.component';


import { MedicineStoreComponent } from './pages/medicine_store/medicine-store/medicine-store.component';
import { CartComponent } from './pages/medicine_store/cart/cart.component';
import { OrdersComponent } from './pages/medicine_store/orders/orders.component';
import { MedicineStoreSettingsComponent } from './pages/medicine_store/admin/medicine-store-settings/medicine-store-settings.component';



export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent, canActivate: [NoAuthGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [NoAuthGuard] },
  { path: 'doctor-dashboard', component: DoctorDashboardComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['doctor'] } },
  { path: 'patient-dashboard', component: PatientDashboardComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['patient'] } },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['admin'] } },
  { path: 'admin-users', component: AdminUsersComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['admin'] } },

  { path: 'book-appointment', component: BookAppointmentComponent },
  { path: 'doctor-appointments', component: DoctorAppointmentsComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['doctor'] } },
  { path: 'admin-appointments', component: AdminAppointmentsComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['admin'] } },
  { path: 'admin-book-appointment', component: AdminBookAppointmentComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['admin'] } },

  { path: 'patient-appointments', component: PatientAppointmentsComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['patient'] } },

  { path: 'prescriptions/write/:appointmentId', component: PrescriptionWriteComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['doctor'] } },

  { path: 'prescriptions/view/:appointmentId', component: PrescriptionViewComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['doctor', 'patient'] } },

  { path: 'patient/prescriptions/view/:appointmentId', component: PatientPrescriptionViewComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['patient'] } },

  { path: 'admin/prescriptions', component: AdminPrescriptionListComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['admin'] } },
  { path: 'admin/prescriptions/view/:appointmentId', component: AdminPrescriptionViewComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['admin'] } },



  { path: 'medicine-store', component: MedicineStoreComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['patient', 'doctor', 'admin'] } },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['patient', 'doctor', 'admin'] } },
  { path: 'orders', component: OrdersComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['patient', 'doctor', 'admin'] } },
  { path: 'medicine-store-settings', component: MedicineStoreSettingsComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['admin'] } },

  






  
  { path: '**', redirectTo: '' },

];