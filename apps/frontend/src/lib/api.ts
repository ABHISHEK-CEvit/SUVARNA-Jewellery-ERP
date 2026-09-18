import axios from 'axios';

export const api = axios.create({
  baseURL: '/',
  withCredentials: true, // Send HTTP-Only cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});
