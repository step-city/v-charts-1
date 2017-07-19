import { itemPoint } from '../echarts-base'
import { getFormated, getStackMap } from '../util'
import 'echarts/lib/chart/line'

function getLineXAxis (args) {
  const { dimension, rows, xAxisName, axisVisible } = args
  return dimension.map((item, index) => ({
    type: 'category',
    nameLocation: 'middle',
    nameGap: 22,
    boundaryGap: false,
    name: xAxisName[index] || '',
    axisTick: { show: true, lineStyle: { color: '#eee' } },
    data: rows.map(row => row[item]),
    axisLabel: {
      formatter (v) {
        return String(v)
      }
    },
    show: axisVisible
  }))
}

function getLineSeries (args) {
  const {
    rows,
    axisSite,
    metrics,
    area,
    stack,
    nullAddZero
  } = args
  let series = []
  const dataTemp = {}
  const stackMap = stack && getStackMap(stack)
  metrics.forEach(item => { dataTemp[item] = [] })
  rows.forEach(row => {
    metrics.forEach(item => {
      let value = null
      if (row[item] != null) {
        value = row[item]
      } else if (nullAddZero) {
        value = 0
      }
      dataTemp[item].push(value)
    })
  })
  metrics.forEach(item => {
    let seriesItem = {
      name: item,
      type: 'line',
      data: dataTemp[item]
    }

    if (area) seriesItem.areaStyle = { normal: {} }
    seriesItem.yAxisIndex = ~axisSite.right.indexOf(item) ? 1 : 0

    if (stack && stackMap[item]) seriesItem.stack = stackMap[item]

    series.push(seriesItem)
  })
  return series.length ? series : false
}

function getLineYAxis (args) {
  const {
    yAxisName,
    yAxisType,
    axisVisible,
    scale,
    min,
    max,
    digit
  } = args
  const yAxisBase = {
    type: 'value',
    axisTick: {
      show: false
    },
    show: axisVisible
  }
  let yAxis = []
  for (let i = 0; i < 2; i++) {
    if (yAxisType[i]) {
      yAxis[i] = Object.assign({}, yAxisBase, {
        axisLabel: {
          formatter (val) {
            return getFormated(val, yAxisType[i], digit)
          }
        }
      })
    } else {
      yAxis[i] = Object.assign({}, yAxisBase)
    }
    yAxis[i].name = yAxisName[i] || ''
    yAxis[i].scale = scale[i] || false
    yAxis[i].min = min[i] || null
    yAxis[i].max = max[i] || null
  }
  return yAxis
}

function getLineTooltip (axisSite, yAxisType, digit) {
  return {
    trigger: 'axis',
    formatter (items) {
      let tpl = []
      tpl.push(`${items[0].name}<br>`)
      items.forEach(item => {
        let showData
        const type = ~axisSite.right.indexOf(item.seriesName)
          ? yAxisType[1]
          : yAxisType[0]
        showData = getFormated(item.data, type, digit)
        tpl.push(itemPoint(item.color))
        tpl.push(`${item.seriesName}: ${showData}`)
        tpl.push('<br>')
      })
      return tpl.join('')
    }
  }
}

export const line = (columns, rows, settings, extra) => {
  const {
    axisSite = { right: [] },
    yAxisType = ['normal', 'normal'],
    yAxisName = [],
    dimension = [columns[0]],
    xAxisName = [],
    axisVisible = true,
    area,
    stack,
    scale = [false, false],
    min = [null, null],
    max = [null, null],
    nullAddZero = false,
    digit = 2
  } = settings
  const { tooltipVisible, legendVisible } = extra
  let metrics = columns.slice()

  if (settings.metrics) {
    metrics = settings.metrics
  } else {
    metrics.splice(columns.indexOf(dimension[0]), 1)
  }

  const legend = legendVisible && { data: metrics }
  const tooltip = tooltipVisible && getLineTooltip(axisSite, yAxisType, digit)
  const xAxis = getLineXAxis({ dimension, rows, xAxisName, axisVisible })
  const yAxisParams = {
    yAxisName,
    yAxisType,
    axisVisible,
    scale,
    min,
    max,
    digit
  }
  const yAxis = getLineYAxis(yAxisParams)
  const seriesParams = {
    rows,
    axisSite,
    metrics,
    area,
    stack,
    nullAddZero
  }
  const series = getLineSeries(seriesParams)
  if (!xAxis || !series) return false

  let options = { legend, xAxis, series, yAxis, tooltip }
  return options
}
