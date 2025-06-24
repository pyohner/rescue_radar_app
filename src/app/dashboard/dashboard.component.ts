import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { AnimalService, Animal } from '../animal.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  @ViewChild('spayChart') spayChart: BaseChartDirective | undefined;
  @ViewChild('typeOverTimeChart') typeOverTimeChart: BaseChartDirective | undefined;
  @ViewChild('breedChart') breedChart: BaseChartDirective | undefined;


  chartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Animal Type Count' }]
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true
  };

  spayChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Spayed/Neutered', 'Not Spayed/Neutered'],
    datasets: [{ data: [0, 0], backgroundColor: ['#4caf50', '#f44336'] }]
  };

  spayChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true
  };

  typeOverTimeData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  typeOverTimeOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Animal Types Over Time' }
    },
    scales: {
      x: { title: { display: true, text: 'Date' } },
      y: { title: { display: true, text: 'Count' }, beginAtZero: true }
    }
  };

  allAnimals: Animal[] = [];


  selectedAnimalType = 'Dog';
  availableTypes = ['Dog', 'Cat', 'Rabbit', 'Bird']; // populate as needed

  breedChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  breedChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      title: { display: true, text: 'Breeds Over Past 30 Days' },
      legend: { position: 'top' }
    },
    scales: {
      x: { stacked: true, title: { display: true, text: 'Date' } },
      y: { stacked: true, title: { display: true, text: 'Count' }, beginAtZero: true }
    }
  };

  updateBreedChart(animals: Animal[]) {
    const today = new Date();
    const past30Days = [...Array(30)].map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 29 + i);
      return d.toISOString().slice(0, 10);
    });

    const filtered = animals.filter(a =>
      a.type === this.selectedAnimalType &&
      a.primary_breed &&
      a.published_at &&
      past30Days.includes(a.published_at.slice(0, 10))
    );

    const dateBreedCounts: { [date: string]: { [breed: string]: number } } = {};
    const breedsSet = new Set<string>();

    for (const date of past30Days) {
      dateBreedCounts[date] = {};
    }

    for (const a of filtered) {
      const date = a.published_at.slice(0, 10);
      const breed = a.primary_breed || 'Unknown';
      breedsSet.add(breed);
      dateBreedCounts[date][breed] = (dateBreedCounts[date][breed] || 0) + 1;
    }

    this.breedChartData.labels = past30Days;

    this.breedChartData.datasets = Array.from(breedsSet).map(breed => ({
      label: breed,
      data: past30Days.map(date => dateBreedCounts[date][breed] || 0),
      stack: 'stack1'
    }));

    setTimeout(() => this.breedChart?.update());
  }



  constructor(private animalService: AnimalService) {}

  ngOnInit(): void {
    this.animalService.getAnimals().subscribe((animals: Animal[]) => {
      console.log('Fetched animals:', animals);

      const counts: { [type: string]: number } = {};

      let spayed = 0;
      let notSpayed = 0;

      for (const animal of animals) {
        const type = animal.type || 'Unknown';
        counts[type] = (counts[type] || 0) + 1;

        if (animal.spayed_neutered) {
          spayed++;
        } else {
          notSpayed++;
        }
      }

      this.chartData.labels = Object.keys(counts);
      this.chartData.datasets[0].data = Object.values(counts);

      this.spayChartData.datasets[0].data = [spayed, notSpayed];

      if (this.chart) this.chart.update();
      setTimeout(() => {
        if (this.spayChart) this.spayChart.update();
      });

      const dateTypeCounts: { [date: string]: { [type: string]: number } } = {};
      const typesSet = new Set<string>();

      for (const animal of animals) {
        const date = animal.published_at?.slice(0, 10); // 'YYYY-MM-DD'
        const type = animal.type || 'Unknown';

        typesSet.add(type);

        if (!dateTypeCounts[date]) {
          dateTypeCounts[date] = {};
        }

        dateTypeCounts[date][type] = (dateTypeCounts[date][type] || 0) + 1;
      }

// Sorted dates
      const sortedDates = Object.keys(dateTypeCounts).sort();
      this.typeOverTimeData.labels = sortedDates;

      this.typeOverTimeData.datasets = Array.from(typesSet).map(type => {
        return {
          label: type,
          data: sortedDates.map(date => dateTypeCounts[date][type] || 0),
          fill: false,
          tension: 0.3
        };


      });

      setTimeout(() => {
        this.typeOverTimeChart?.update();
      });

      this.animalService.getAnimals().subscribe((animals: Animal[]) => {
        this.allAnimals = animals;
        // ...existing chart logic
        this.updateBreedChart(animals);
      });






      console.log('Chart labels:', this.chartData.labels);
      console.log('Chart data:', this.chartData.datasets[0].data);
      console.log('Spay/neuter data:', this.spayChartData.datasets[0].data);
      console.log('Spayed:', spayed);
      console.log('Not Spayed:', notSpayed);
    });
  }
}
