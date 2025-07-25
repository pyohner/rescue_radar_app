import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTabsModule} from '@angular/material/tabs';
import {CommonModule} from '@angular/common';
import {NgChartsModule, BaseChartDirective} from 'ng2-charts';
import {ChartConfiguration} from 'chart.js';
import {AnimalService, Animal} from '../animal.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule, FormsModule, MatTabsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  @ViewChild('spayChart') spayChart: BaseChartDirective | undefined;
  @ViewChild('typeOverTimeChart') typeOverTimeChart: BaseChartDirective | undefined;
  @ViewChild('breedChart') breedChart: BaseChartDirective | undefined;
  @ViewChild('orgStackedChart') orgStackedChart: BaseChartDirective | undefined;

  featuredAnimal: any = null;
  intervalId: any = null;
  countdown: number = 10;
  isPaused: boolean = false;
  private boundVisibilityHandler = this.handleVisibilityChange.bind(this);
  userPaused: boolean = false;


  loadFeaturedAnimal() {
    this.animalService.getTodaysFeaturedAnimal().subscribe({
      next: (data) => {
        this.featuredAnimal = data;
        this.countdown = 10;
      },
      error: (err) => {
        console.error('Failed to load featured animal:', err);
        this.featuredAnimal = null;
      }
    });
  }

  formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);  // Local time
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  chartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{data: [], label: 'Animal Type Count'}]
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true
  };

  spayChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Spayed/Neutered', 'Not Spayed/Neutered'],
    datasets: [{data: [0, 0]}]
  };

  spayChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
            const value = context.raw;
            const percent = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${percent}%`;
          }
        }
      },
      legend: {
        position: 'top'
      }
    }
  };

  timeframes = [
    {label: 'All Time', value: 'all'},
    {label: 'Past 10 Years', value: '10y'},
    {label: 'Past 5 Years', value: '5y'},
    {label: 'Past 2 Years', value: '2y'},
    {label: 'Past 1 Year', value: '1y'},
    {label: 'YTD', value: 'ytd'},
    {label: 'Past 6 Months', value: '6m'},
    {label: 'Past 3 Months', value: '3m'},
    {label: 'Past 1 Month', value: '1m'},
    {label: 'Past 1 Week', value: '1w'}
  ];
  selectedTimeframe = 'all';

  filterAnimalsByTimeframe(animals: Animal[], timeframe: string): Animal[] {
    if (timeframe === 'all') return animals;

    const now = new Date();
    let cutoff: Date;

    switch (timeframe) {
      case '10y':
        cutoff = new Date(now.setFullYear(now.getFullYear() - 10));
        break;
      case '5y':
        cutoff = new Date(now.setFullYear(now.getFullYear() - 5));
        break;
      case '2y':
        cutoff = new Date(now.setFullYear(now.getFullYear() - 2));
        break;
      case '1y':
        cutoff = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'ytd':
        cutoff = new Date(now.getFullYear(), 0, 1);
        break;  // Jan 1 of this year
      case '6m':
        cutoff = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '3m':
        cutoff = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '1m':
        cutoff = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '1w':
        cutoff = new Date(now.setDate(now.getDate() - 7));
        break;
      default:
        return animals;
    }

    return animals.filter(a => {
      const publishedAt = a.published_at ? new Date(a.published_at) : null;
      return publishedAt && publishedAt >= cutoff;
    });
  }

  updateTypeOverTimeChart() {
    const animals = this.filterAnimalsByTimeframe(this.allAnimals, this.selectedTimeframe);
    const dateTypeCounts: { [date: string]: { [type: string]: number } } = {};
    const typesSet = new Set<string>();

    for (const animal of animals) {
      const date = animal.published_at?.slice(0, 10);
      const type = animal.type || 'Unknown';

      typesSet.add(type);

      if (!dateTypeCounts[date]) {
        dateTypeCounts[date] = {};
      }

      dateTypeCounts[date][type] = (dateTypeCounts[date][type] || 0) + 1;
    }

    const sortedDates = Object.keys(dateTypeCounts).sort();
    this.typeOverTimeData.labels = sortedDates;

    this.typeOverTimeData.datasets = Array.from(typesSet).map(type => ({
      label: type,
      data: sortedDates.map(date => dateTypeCounts[date][type] || 0),
      fill: false,
      tension: 0.3
    }));

    setTimeout(() => this.typeOverTimeChart?.update());
  }


  typeOverTimeData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  typeOverTimeOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: {
      legend: {position: 'top'},
      title: {display: true, text: 'Animal Types Over Time'}
    },
    scales: {
      x: {title: {display: true, text: 'Date'}},
      y: {title: {display: true, text: 'Count'}, beginAtZero: true}
    }
  };

  allAnimals: Animal[] = [];

  selectedAnimalType = 'Dog';
  availableTypes = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Small & Furry', 'Scales, Fins & Other', 'Horse', 'Barnyard']; // populate as needed

  breedChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  breedChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        bottom: 10
      }
    },
    plugins: {
      title: {display: true, text: 'Breeds Over Past 30 Days'},
      legend: {display: false}
    },
    scales: {
      x: {
        title: {display: true, text: 'Date'}
      },
      y: {
        position: 'left',
        title: {display: true, text: 'Breed Count'},
        beginAtZero: true
      },
      y1: {
        position: 'right',
        grid: {drawOnChartArea: false},
        title: {display: true, text: 'Total Daily Count'},
        beginAtZero: true
      }
    }
  };

  customLegendLabels: { label: string, color: string }[] = [];

  orgNameMap: { [id: string]: string } = {};

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
    const totalPerDay: { [date: string]: number } = {};
    const breedsSet = new Set<string>();

    for (const date of past30Days) {
      dateBreedCounts[date] = {};
      totalPerDay[date] = 0;
    }

    for (const a of filtered) {
      const date = a.published_at.slice(0, 10);
      const breed = a.primary_breed || 'Unknown';
      breedsSet.add(breed);
      dateBreedCounts[date][breed] = (dateBreedCounts[date][breed] || 0) + 1;
      totalPerDay[date]++;
    }

    this.breedChartData.labels = past30Days;

    const breedDatasets = Array.from(breedsSet).map(breed => ({
      label: breed,
      data: past30Days.map(date => dateBreedCounts[date][breed] || 0),
      fill: false,
      tension: 0.3,
      pointRadius: 2,
      borderWidth: 1.5,
      yAxisID: 'y'
    }));


    const totalDataset = {
      label: 'Total Breeds',
      data: past30Days.map(date => totalPerDay[date]),
      // borderDash: [5, 5],
      tension: 0.2,
      fill: true,
      backgroundColor: 'rgba(0, 0, 0, 0.1)', // semi-transparent black fill
      borderColor: '#000',
      pointRadius: 0,
      yAxisID: 'y1' // right axis
    };

    this.breedChartData.datasets = [...breedDatasets, totalDataset];

    setTimeout(() => {
      this.breedChart?.update();

      const chart = this.breedChart?.chart;
      if (chart) {
        this.customLegendLabels = chart.data.datasets.map((ds: any, i: number) => {
          const meta = chart.getDatasetMeta(i);
          const color = meta?.dataset?.options?.['borderColor'] || ds.borderColor || '#000';

          return {
            label: ds.label || '',
            color: color
          };
        });
      }
    });

  }

  orgStackedChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  orgStackedChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y', // horizontal
    responsive: true,
    plugins: {
      title: {display: true, text: 'Top 20 Organizations by Animal Type (Past 30 Days)'},
      legend: {position: 'top'}
    },
    scales: {
      x: {stacked: true, title: {display: true, text: 'Number of Animals'}, beginAtZero: true},
      y: {
        stacked: true,
        title: {display: true, text: 'Organization'},
        ticks: {
          autoSkip: false,
          font: {size: 11},
          callback: (value, index) => {
            // Use the actual label from the chart
            const label = this.orgStackedChartData.labels?.[index];
            return typeof label === 'string' ? label : '';
          }
        }
      }
    }
  };


  updateOrgStackedChart(animals: Animal[]) {
    const today = new Date();
    const past30 = new Set(
      [...Array(30)].map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        return d.toISOString().slice(0, 10);
      })
    );

    const orgTypeCounts: { [org: string]: { [type: string]: number } } = {};
    const totalPerOrg: { [org: string]: number } = {};
    const typeSet = new Set<string>();

    for (const a of animals) {
      const date = a.published_at?.slice(0, 10);
      if (!date || !past30.has(date)) continue;

      const org = a.organization_id || 'Unknown';
      const type = a.type || 'Unknown';

      typeSet.add(type);

      if (!orgTypeCounts[org]) {
        orgTypeCounts[org] = {};
      }

      orgTypeCounts[org][type] = (orgTypeCounts[org][type] || 0) + 1;
      totalPerOrg[org] = (totalPerOrg[org] || 0) + 1;
    }

    // Sort orgs by total animals, descending
    const topOrgs = Object.entries(totalPerOrg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([org, _]: [string, number]) => org);

    this.orgStackedChartData.labels = topOrgs.map(id => this.orgNameMap[id] || id);


    this.orgStackedChartData.datasets = Array.from(typeSet).map(type => ({
      label: type,
      data: topOrgs.map(org => orgTypeCounts[org]?.[type] || 0),
      stack: 'stack1'
    }));

    setTimeout(() => this.orgStackedChart?.update());
  }


  constructor(private animalService: AnimalService) {
  }

  todaysRescues: any = null;
  typeKeys: string[] = [];
  topOrgTypeKeys: string[] = [];
  todaysTypeChartData: any;
  todaysTypeChartOptions: any;

  loadTodaysRescues() {
    this.animalService.getTodaysRescues().subscribe({
      next: (data) => {
        this.todaysRescues = data;
        this.typeKeys = Object.keys(data.typeBreakdown);
        this.topOrgTypeKeys = Object.keys(data.topOrganization.typeBreakdown);

        const counts = this.typeKeys.map(key => data.typeBreakdown[key]);
        const colors = ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#FF7043', '#26C6DA'];

        this.todaysTypeChartData = {
          labels: this.typeKeys,
          datasets: [{
            data: counts,
            backgroundColor: colors
          }]
        };

        this.todaysTypeChartOptions = {
          responsive: true,
          plugins: {
            legend: {display: false}
          }
        };
      },
      error: (err) => {
        console.error("Failed to load today's rescues:", err);
      }
    });
  }

  startAutoRefresh() {
    this.intervalId = setInterval(() => {
      if (!this.isPaused) {
        this.countdown--;
        if (this.countdown <= 0) {
          this.loadFeaturedAnimal();
        }
      }
    }, 1000); // every second
  }

  togglePause() {
    this.userPaused = !this.userPaused;
    this.isPaused = this.userPaused;
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.isPaused = true;
    } else {
      this.isPaused = this.userPaused;
      // this.countdown = 10;
    }
  }


  ngOnInit(): void {
    this.loadTodaysRescues();
    this.loadFeaturedAnimal();
    this.startAutoRefresh();
    document.addEventListener('visibilitychange', this.boundVisibilityHandler);


    this.animalService.getAnimals().subscribe((animals: Animal[]) => {
      console.log('Fetched animals:', animals);
      this.allAnimals = animals;
      for (const a of animals) {
        if (a.organization_id && a.organization_name) {
          this.orgNameMap[a.organization_id] = a.organization_name;
        }
      }

      // === Animal Type Count (Bar Chart) ===
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

      if (this.chart) this.chart.update();

      // === Spay/Neuter Doughnut Chart ===
      this.spayChartData.datasets[0].data = [spayed, notSpayed];
      setTimeout(() => this.spayChart?.update());

      // === Animal Types Over Time (Line Chart) ===
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

      const sortedDates = Object.keys(dateTypeCounts).sort();
      this.typeOverTimeData.labels = sortedDates;

      this.typeOverTimeData.datasets = Array.from(typesSet).map(type => ({
        label: type,
        data: sortedDates.map(date => dateTypeCounts[date][type] || 0),
        fill: false,
        tension: 0.3
      }));

      setTimeout(() => this.typeOverTimeChart?.update());

      // === Breeds Over Time (Stacked Bar) ===
      this.updateBreedChart(animals);

      // === Animals by Organization and Type (Horizontal Stacked Bar) ===
      this.updateOrgStackedChart(animals);

      // === Animals Types Over Time (Line Chart) ===
      this.updateTypeOverTimeChart();

      // === Logging for Debugging ===
      // console.log('Chart labels:', this.chartData.labels);
      // console.log('Chart data:', this.chartData.datasets[0].data);
      // console.log('Spay/neuter data:', this.spayChartData.datasets[0].data);
      // console.log('Spayed:', spayed);
      // console.log('Not Spayed:', notSpayed);
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
  }

}
