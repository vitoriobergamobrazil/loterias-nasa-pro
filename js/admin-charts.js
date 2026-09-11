// ===================================================================
// ADMIN CHARTS - Revenue and User Growth Visualization
// ===================================================================

// Chart.js CDN - Add to head in index.html:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js" defer></script>

const CHARTS_DATA = {
  revenue: {
    labels: ['Set 1', 'Set 5', 'Set 10', 'Set 15', 'Set 20', 'Set 25', 'Set 30'],
    data: [2400, 2800, 3200, 3800, 4200, 4100, 4450],
    color: 'rgb(34, 197, 94)'
  },
  users: {
    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'],
    data: [120, 180, 250, 310, 342],
    color: 'rgb(6, 182, 212)'
  }
};

// Initialize charts when Chart.js is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if Chart.js is available
  if (typeof Chart !== 'undefined' && isUserAdmin()) {
    setTimeout(() => {
      initializeAdminCharts();
      console.log('✅ Admin charts initialized');
    }, 500); // Wait for DOM to fully render
  }
});

/**
 * Initialize admin charts
 */
function initializeAdminCharts() {
  initRevenueChart();
  initUsersChart();
}

/**
 * Initialize revenue chart (line graph)
 */
function initRevenueChart() {
  const canvas = document.getElementById('admin-chart-revenue');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: CHARTS_DATA.revenue.labels,
      datasets: [{
        label: 'Receita Diária (R$)',
        data: CHARTS_DATA.revenue.data,
        borderColor: CHARTS_DATA.revenue.color,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: CHARTS_DATA.revenue.color,
        pointBorderColor: 'rgb(15, 23, 42)',
        pointBorderWidth: 2,
        pointHoverRadius: 8,
        segment: {
          borderColor: ctx => {
            const data = ctx.p0DataIndex;
            return CHARTS_DATA.revenue.color;
          }
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: 'rgb(203, 213, 225)',
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: 'white',
          bodyColor: 'rgb(203, 213, 225)',
          borderColor: CHARTS_DATA.revenue.color,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          caretPadding: 12,
          callbacks: {
            label: function(context) {
              return 'R$ ' + context.parsed.y.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: 'rgb(148, 163, 184)',
            callback: function(value) {
              return 'R$ ' + (value / 1000).toFixed(1) + 'k';
            }
          },
          grid: {
            color: 'rgba(71, 85, 105, 0.2)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: 'rgb(148, 163, 184)'
          },
          grid: {
            display: false,
            drawBorder: false
          }
        }
      }
    }
  });

  console.log('✅ Revenue chart rendered');
}

/**
 * Initialize users chart (bar chart)
 */
function initUsersChart() {
  const canvas = document.getElementById('admin-chart-users');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: CHARTS_DATA.users.labels,
      datasets: [{
        label: 'Total de Usuários',
        data: CHARTS_DATA.users.data,
        backgroundColor: [
          'rgba(6, 182, 212, 0.6)',
          'rgba(34, 211, 238, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(6, 182, 212, 0.8)',
          'rgba(34, 211, 238, 0.8)'
        ],
        borderColor: [
          CHARTS_DATA.users.color,
          CHARTS_DATA.users.color,
          'rgb(34, 197, 94)',
          CHARTS_DATA.users.color,
          CHARTS_DATA.users.color
        ],
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(6, 182, 212, 0.9)',
        hoverBorderColor: 'white',
        hoverBorderWidth: 3
      }]
    },
    options: {
      indexAxis: 'x',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: 'rgb(203, 213, 225)',
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: 'white',
          bodyColor: 'rgb(203, 213, 225)',
          borderColor: CHARTS_DATA.users.color,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          caretPadding: 12,
          callbacks: {
            label: function(context) {
              return context.parsed.y + ' usuários';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: 'rgb(148, 163, 184)'
          },
          grid: {
            color: 'rgba(71, 85, 105, 0.2)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: 'rgb(148, 163, 184)'
          },
          grid: {
            display: false,
            drawBorder: false
          }
        }
      }
    }
  });

  console.log('✅ Users chart rendered');
}

/**
 * Update charts with new data
 */
function atualizarGraficosAdmin(novaReceita, novosUsuarios) {
  // In production, fetch from API and update chart data
  console.log('Updating charts with new data...');
  // Chart.js: chart.data.labels.push(newLabel); chart.update();
}

console.log('📊 Admin Charts module loaded');
