import { use } from 'echarts/core'
import { HeatmapChart, LineChart, BarChart, ScatterChart } from 'echarts/charts'
import {
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  HeatmapChart,
  LineChart,
  BarChart,
  ScatterChart,
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
])
