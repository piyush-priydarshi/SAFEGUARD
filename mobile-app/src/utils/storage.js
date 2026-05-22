import * as SecureStore from 'expo-secure-store';

export const setToken = async (token) => {
  await SecureStore.setItemAsync('token', token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync('token');
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync('token');
};

export const setUser = async (user) => {
  await SecureStore.setItemAsync('user', JSON.stringify(user));
};

export const getUser = async () => {
  const user = await SecureStore.getItemAsync('user');
  return user ? JSON.parse(user) : null;
};

export const removeUser = async () => {
  await SecureStore.deleteItemAsync('user');
};

export const saveSettings = async (settings) => {
  await SecureStore.setItemAsync('settings', JSON.stringify(settings));
};

export const getSettings = async () => {
  const data = await SecureStore.getItemAsync('settings');
  return data ? JSON.parse(data) : null;
};
