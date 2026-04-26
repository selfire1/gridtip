// lib/persister.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'GRIDTIP_QUERY_CACHE',
  throttleTime: 500,
})
