import { defineStore } from 'pinia';
import api from '../api/axios';

export interface Job {
    id?: number;
    empresa: string;
    puesto: string;
    estado: string;
}

export const useJobStore = defineStore('jobStore', {
    state: () => ({
        jobs: [] as Job[],
        loading: false,
        error: null as string | null
    }),
    actions: {
        // Acción para listar candidaturas (GET)
        async fetchJobs() {
            this.loading = true;
            try {
                const response = await api.get('/jobs');
                this.jobs = response.data;
            } catch (err) {
                this.error = 'Error al cargar las candidaturas';
            } finally {
                this.loading = false;
            }
        },

        // Acción para añadir nueva candidatura (POST) 
        async addJob(job: Job) {
            try {
                await api.post('/jobs', job);
                await this.fetchJobs(); // Recargar la lista tras añadir
            } catch (err) {
                this.error = 'Error al añadir la candidatura';
            }
        },

        // Acción para editar estado (PUT)
        async updateJobStatus(id: number, nuevoEstado: string) {
            try {
                await api.put(`/jobs/${id}`, { estado: nuevoEstado });
                await this.fetchJobs();
            } catch (err) {
                this.error = 'Error al actualizar el estado';
            }
        },

        // Acción para borrar (DELETE)
        async deleteJob(id: number) {
            try {
                await api.delete(`/jobs/${id}`);
                await this.fetchJobs();
            } catch (err) {
                this.error = 'Error al eliminar la candidatura';
            }
        }
    }
});