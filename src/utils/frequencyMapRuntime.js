import * as echarts from 'echarts/core'
import { CustomChart, LinesChart, ScatterChart } from 'echarts/charts'
import { GeoComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  CustomChart,
  LinesChart,
  ScatterChart,
  GeoComponent,
  TooltipComponent,
  CanvasRenderer
])

export default echarts
