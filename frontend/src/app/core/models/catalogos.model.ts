export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Marca {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnidadMedida {
  id: string;
  nombre: string;
  abreviatura: string;
  activo: boolean;
  createdAt: string;
}
