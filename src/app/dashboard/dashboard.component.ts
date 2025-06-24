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
  @ViewChild('spayChart') spayChart: BaseChartDirective | undefined;

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

      console.log('Chart labels:', this.chartData.labels);
      console.log('Chart data:', this.chartData.datasets[0].data);
      console.log('Spay/neuter data:', this.spayChartData.datasets[0].data);
      console.log('Spayed:', spayed);
      console.log('Not Spayed:', notSpayed);
    });
  }
}
