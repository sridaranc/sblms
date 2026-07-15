import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  roles?: string[];
  department?: string;
  designation?: string;
  phone?: string;
  employeeId?: string;
  address?: string;
  city?: string;
  state?: string;
  reportingManager?: string;
  faceDescriptor?: number[];
  hasFaceDescriptor?: boolean;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  permissions: string[];
  isAuthenticated: boolean;
}

const getStoredPermissions = (): string[] => {
  try {
    const stored = localStorage.getItem('permissions');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  permissions: getStoredPermissions(),
  isAuthenticated: !!localStorage.getItem('accessToken'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string; permissions?: string[] }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.permissions = action.payload.permissions || [];
      state.isAuthenticated = true;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      if (action.payload.permissions) {
        localStorage.setItem('permissions', JSON.stringify(action.payload.permissions));
      }
    },
    setPermissions: (state, action: PayloadAction<string[]>) => {
      state.permissions = action.payload;
      if (state.user) {
        state.user.permissions = action.payload;
      }
      localStorage.setItem('permissions', JSON.stringify(action.payload));
    },
    setFaceDescriptor: (state, action: PayloadAction<{ faceDescriptor: number[] }>) => {
      if (state.user) {
        state.user.faceDescriptor = action.payload.faceDescriptor;
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.permissions = [];
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('permissions');
    },
  },
});

export const { setCredentials, setFaceDescriptor, setPermissions, logout } = authSlice.actions;
export default authSlice.reducer;
