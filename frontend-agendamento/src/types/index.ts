export interface Artist {
  id: string;
  name: string;
  specialty: string;
}

export interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  artist: Artist;
}

export interface Login{
  username: string;
  password: string;
}