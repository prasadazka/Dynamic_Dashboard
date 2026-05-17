import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarOpen: true,
  currentTab: 'dashboard',
  chatOpen: false,
  darkMode: false,
  notifications: [],
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setCurrentTab: (state, action) => {
      state.currentTab = action.payload
    },
    toggleChat: (state) => {
      state.chatOpen = !state.chatOpen
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      })
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      )
    },
  },
})

export const {
  toggleSidebar,
  setCurrentTab,
  toggleChat,
  toggleDarkMode,
  addNotification,
  removeNotification,
} = uiSlice.actions

export default uiSlice.reducer
