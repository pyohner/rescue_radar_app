import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { AnimalService, Animal } from '../animal.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  chartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Animal Type Count' }]
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true
  };

  constructor(private animalService: AnimalService) {}

  ngOnInit(): void {
    this.animalService.getAnimals().subscribe((animals: Animal[]) => {
      console.log('Fetched animals:', animals);

      const counts: { [type: string]: number } = {};

      for (const animal of animals) {
        const type = animal.type || 'Unknown';
        counts[type] = (counts[type] || 0) + 1;
      }

      this.chartData.labels = Object.keys(counts);
      this.chartData.datasets[0].data = Object.values(counts);

      console.log('Chart labels:', this.chartData.labels);
      console.log('Chart data:', this.chartData.datasets[0].data);

      if (this.chart) {
        this.chart.update();
      }
    });
  }
}
