export type Demo = {
  label: string;
  url: string;
};

export type Categoria = "hotelero" | "huesped";

export type Product = {
  id: string;
  categoria: Categoria;
  orden: number;
  titulo: string;
  descripcion: string;
  imagen: string;
  demos: Demo[];
  pdfUrl: string;
  videoUrl: string;
};
