import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { UserManagementComponent } from './user-management.component';
import { UsersService } from '../users.service';
import { User, ApiListResponse, Role } from '../../../shared/models/user.model';

const mockUsers: User[] = [
  {
    _id: '1',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    phone: '555-0001',
    role: { _id: 'r1', name: 'admin' },
    isEmailVerified: true,
    isRestricted: false,
    isDeleted: false,
    deletedAt: null,
  },
  {
    _id: '2',
    firstName: 'Bob',
    lastName: 'Jones',
    email: 'bob@example.com',
    phone: '555-0002',
    role: { _id: 'r2', name: 'customer' },
    isEmailVerified: false,
    isRestricted: false,
    isDeleted: false,
    deletedAt: null,
  },
];

const mockRoles: Role[] = [
  { _id: 'r1', name: 'admin' },
  { _id: 'r2', name: 'customer' },
];

describe('UserManagementComponent', () => {
  const getUsersSpy = vi.fn();
  const getRolesSpy = vi.fn();

  beforeEach(async () => {
    getUsersSpy.mockReset();
    getRolesSpy.mockReset();
    getRolesSpy.mockReturnValue(of({ data: mockRoles }));

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent],
      providers: [
        provideHttpClient(),
        { provide: UsersService, useValue: { getUsers: getUsersSpy, getRoles: getRolesSpy } },
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    getUsersSpy.mockReturnValue(of({ data: [] }));
    const fixture = TestBed.createComponent(UserManagementComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show loading state initially', () => {
    const subject = new Subject<ApiListResponse<User>>();
    getUsersSpy.mockReturnValue(subject.asObservable());
    const fixture = TestBed.createComponent(UserManagementComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.state-message')?.textContent).toContain('Loading');
    subject.complete();
  });

  it('should show empty state when no users are returned', async () => {
    getUsersSpy.mockReturnValue(of({ data: [] }));
    const fixture = TestBed.createComponent(UserManagementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.state-message')?.textContent).toContain('No users found');
  });

  it('should render users in the table when data is returned', async () => {
    getUsersSpy.mockReturnValue(of({ data: mockUsers }));
    const fixture = TestBed.createComponent(UserManagementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const rows = el.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Alice Smith');
    expect(rows[1].textContent).toContain('Bob Jones');
  });

  it('should show empty state on service error', async () => {
    getUsersSpy.mockReturnValue(throwError(() => new Error('Network error')));
    const fixture = TestBed.createComponent(UserManagementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.state-message')?.textContent).toContain('No users found');
  });

  it('should generate correct initials', async () => {
    getUsersSpy.mockReturnValue(of({ data: mockUsers }));
    const fixture = TestBed.createComponent(UserManagementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const avatars = el.querySelectorAll('.avatar');
    expect(avatars[0].textContent).toBe('AS');
    expect(avatars[1].textContent).toBe('BJ');
  });

  it('should generate correct user codes', async () => {
    getUsersSpy.mockReturnValue(of({ data: mockUsers }));
    const fixture = TestBed.createComponent(UserManagementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const ids = el.querySelectorAll('.user-id');
    expect(ids[0].textContent).toContain('USR-001');
    expect(ids[1].textContent).toContain('USR-002');
  });
});
