import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  unreadCount: number;
}

const initialState: UIState = {
  sidebarOpen: true,
  unreadCount: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setUnreadCount: (state, action: PayloadAction<number>) => { state.unreadCount = action.payload; },
  },
});

export const { toggleSidebar, setUnreadCount } = uiSlice.actions;
export default uiSlice.reducer;
