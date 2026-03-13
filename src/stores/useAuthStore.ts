import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as string | null,
        token: localStorage.getItem('auth_token') || null,
    }),
    actions: {
        login(user: string, token: string) {
            this.user = user;
            this.token = token;
            localStorage.setItem('auth_token', token);
        },
        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem('auth_token');
        }
    }
});