export type RolNombre = 'propietario' | 'personal';

export interface Rol {
  id: string;
  nombre: RolNombre;
  descripcion: string;
  createdAt: string;
}

export interface Perfil {
  id: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  rolId: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SesionUsuario {
  perfil: Perfil;
  rol: Rol;
  token: string;
}

export interface LoginCredenciales {
  correo: string;
  password: string;
}
