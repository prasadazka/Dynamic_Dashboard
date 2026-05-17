import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export const uploadCsvFile = createAsyncThunk(
  'data/uploadCsv',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload CSV file')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const analyzeData = createAsyncThunk(
  'data/analyzeData',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { data } = getState()
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId: data.fileId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze data')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const initialState = {
  data: null,
  fileId: null,
  domain: null,
  metrics: [],
  visualizations: [],
  loading: false,
  error: null,
  analysisResults: null,
}

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    resetData: () => initialState,
    setDomain: (state, action) => {
      state.domain = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadCsvFile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(uploadCsvFile.fulfilled, (state, action) => {
        state.loading = false
        state.fileId = action.payload.fileId
        state.data = action.payload.data
      })
      .addCase(uploadCsvFile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(analyzeData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(analyzeData.fulfilled, (state, action) => {
        state.loading = false
        state.analysisResults = action.payload
        state.domain = action.payload.domain
        state.metrics = action.payload.metrics
        state.visualizations = action.payload.visualizations
      })
      .addCase(analyzeData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { resetData, setDomain } = dataSlice.actions

export default dataSlice.reducer
