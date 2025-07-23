import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../environments/environment';


export interface Animal {
  id: number;
  name: string;
  type: string;
  spayed_neutered: boolean;
  house_trained: boolean;
  special_needs: boolean;
  published_at: string;
  primary_breed: string;
  organization_id: string;
  organization_name: string;
  // Add other fields as needed
}

export interface TodaysRescues {
  date: string;
  total: number;
  typeBreakdown: { [type: string]: number };
  topOrganization: {
    id: string;
    name: string;
    total: number;
    typeBreakdown: { [type: string]: number };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnimalService {
  private apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {
  }

  getAnimals(): Observable<Animal[]> {
    return this.http.get<Animal[]>(`${this.apiBaseUrl}/animals`);
  }

  getTodaysRescues(): Observable<TodaysRescues> {
    return this.http.get<TodaysRescues>(`${this.apiBaseUrl}/animals/todays-rescues`);
  }

  getTodaysFeaturedAnimal() {
    return this.http.get<any>(`${this.apiBaseUrl}/animals/todays-featured`);
  }
}
