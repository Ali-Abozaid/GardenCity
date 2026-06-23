export interface GameResponse {
  id: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  price: number;
  currency: string;
  gameBoyId: string | null;
  gameBoyName: string | null;
}

export interface CreateGameRequest {
  nameAr: string;
  nameEn: string;
  price: number;
  isActive?: boolean;
  gameBoyId?: string | null;
}

export interface UpdateGameRequest {
  nameAr: string;
  nameEn: string;
  price: number;
  isActive: boolean;
  gameBoyId?: string | null;
}

export interface GameBoyOption {
  id: string;
  name: string;
}
