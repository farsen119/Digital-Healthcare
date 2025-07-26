import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminRegisterComponent } from './admin-register.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { of, throwError } from 'rxjs';

describe('AdminRegisterComponent', () => {
  let component: AdminRegisterComponent;
  let fixture: ComponentFixture<AdminRegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        AdminRegisterComponent,
        CommonModule,
        FormsModule,
        RouterLink,
        AdminSidebarComponent
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRegisterComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.form.role).toBe('');
    expect(component.form.first_name).toBe('');
    expect(component.form.last_name).toBe('');
    expect(component.form.username).toBe('');
    expect(component.form.email).toBe('');
    expect(component.form.password).toBe('');
    expect(component.form.confirm_password).toBe('');
    expect(component.form.phone).toBe('');
    expect(component.form.specialization).toBe('');
    expect(component.form.city).toBe('');
    expect(component.form.photo).toBeNull();
  });

  it('should have predefined specializations', () => {
    expect(component.specializations).toContain('Cardiology');
    expect(component.specializations).toContain('Dermatology');
    expect(component.specializations).toContain('Neurology');
    expect(component.specializations).toContain('Orthopedics');
    expect(component.specializations).toContain('Pediatrics');
    expect(component.specializations).toContain('General Physician');
    expect(component.specializations).toContain('Other');
  });

  it('should handle file change', () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const mockEvent = {
      target: {
        files: [mockFile]
      }
    };

    component.onFileChange(mockEvent as any);

    expect(component.form.photo).toBe(mockFile);
  });

  it('should handle file change with no files', () => {
    const mockEvent = {
      target: {
        files: []
      }
    };

    component.onFileChange(mockEvent as any);

    expect(component.form.photo).toBeNull();
  });

  it('should validate password mismatch', () => {
    component.form.password = 'password123';
    component.form.confirm_password = 'password456';

    spyOn(window, 'alert');

    component.register();

    expect(window.alert).toHaveBeenCalledWith('Passwords do not match!');
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should validate role selection', () => {
    component.form.password = 'password123';
    component.form.confirm_password = 'password123';
    component.form.role = '';

    spyOn(window, 'alert');

    component.register();

    expect(window.alert).toHaveBeenCalledWith('Please select a user role.');
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should validate doctor specialization', () => {
    component.form.password = 'password123';
    component.form.confirm_password = 'password123';
    component.form.role = 'doctor';
    component.form.specialization = '';

    spyOn(window, 'alert');

    component.register();

    expect(window.alert).toHaveBeenCalledWith('Please select a specialization for the doctor role.');
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should register patient successfully', () => {
    component.form.password = 'password123';
    component.form.confirm_password = 'password123';
    component.form.role = 'patient';
    component.form.first_name = 'John';
    component.form.last_name = 'Doe';
    component.form.username = 'johndoe';
    component.form.email = 'john@example.com';

    authService.register.and.returnValue(of({}));
    spyOn(window, 'alert');

    component.register();

    expect(authService.register).toHaveBeenCalledWith(jasmine.objectContaining({
      role: 'patient',
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'password123'
    }));
    expect(window.alert).toHaveBeenCalledWith('User registered successfully as patient!');
    expect(router.navigate).toHaveBeenCalledWith(['/admin-dashboard']);
  });

  it('should register doctor successfully', () => {
    component.form.password = 'password123';
    component.form.confirm_password = 'password123';
    component.form.role = 'doctor';
    component.form.specialization = 'Cardiology';
    component.form.first_name = 'Dr. Jane';
    component.form.last_name = 'Smith';
    component.form.username = 'drsmith';
    component.form.email = 'dr.smith@example.com';

    authService.register.and.returnValue(of({}));
    spyOn(window, 'alert');

    component.register();

    expect(authService.register).toHaveBeenCalledWith(jasmine.objectContaining({
      role: 'doctor',
      specialization: 'Cardiology',
      first_name: 'Dr. Jane',
      last_name: 'Smith',
      username: 'drsmith',
      email: 'dr.smith@example.com',
      password: 'password123'
    }));
    expect(window.alert).toHaveBeenCalledWith('User registered successfully as doctor!');
    expect(router.navigate).toHaveBeenCalledWith(['/admin-dashboard']);
  });

  it('should handle registration error', () => {
    component.form.password = 'password123';
    component.form.confirm_password = 'password123';
    component.form.role = 'patient';
    component.form.first_name = 'John';
    component.form.last_name = 'Doe';
    component.form.username = 'johndoe';
    component.form.email = 'john@example.com';

    const error = { error: 'Registration failed' };
    authService.register.and.returnValue(throwError(() => error));
    spyOn(window, 'alert');
    spyOn(console, 'error');

    component.register();

    expect(console.error).toHaveBeenCalledWith(error);
    expect(window.alert).toHaveBeenCalledWith('Registration failed. Please check your details.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should not include specialization for non-doctor roles', () => {
    component.form.password = 'password123';
    component.form.confirm_password = 'password123';
    component.form.role = 'patient';
    component.form.specialization = 'Cardiology'; // This should be removed

    authService.register.and.returnValue(of({}));

    component.register();

    const callArgs = authService.register.calls.mostRecent().args[0];
    expect(callArgs.specialization).toBeUndefined();
  });

  it('should include specialization for doctor role', () => {
    component.form.password = 'password123';
    component.form.confirm_password = 'password123';
    component.form.role = 'doctor';
    component.form.specialization = 'Cardiology';

    authService.register.and.returnValue(of({}));

    component.register();

    const callArgs = authService.register.calls.mostRecent().args[0];
    expect(callArgs.specialization).toBe('Cardiology');
  });

  it('should remove confirm_password from submission', () => {
    component.form.password = 'password123';
    component.form.confirm_password = 'password123';
    component.form.role = 'patient';

    authService.register.and.returnValue(of({}));

    component.register();

    const callArgs = authService.register.calls.mostRecent().args[0];
    expect(callArgs.confirm_password).toBeUndefined();
  });
});
