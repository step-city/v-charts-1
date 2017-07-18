import { getMapJSON, getFormated } from '../util'
import { default as echarts, itemPoint } from '../echarts-base'
import 'echarts/lib/chart/map'

function getTooltip (dataType, digit, dataStore, metrics, color) {
  return {
    formatter (item) {
      let tpl = []
      tpl.push(`${item.name}<br>`)
      metrics.forEach((label, index) => {
        tpl.push(`${itemPoint(color[index])} ${label} : `)
        if (dataStore[item.name]) {
          tpl.push(getFormated(dataStore[item.name][label], dataType[item.name], digit))
        } else {
          tpl.push('-')
        }
        tpl.push('<br>')
      })
      return tpl.join(' ')
    }
  }
}

function getSeries (args) {
  const {
    position,
    selectData,
    dimension,
    metrics,
    rows,
    label,
    itemStyle
  } = args

  const result = []
  const mapBase = {
    type: 'map',
    mapType: position
  }

  metrics.forEach(itemName => {
    const itemResult = Object.assign({
      name: itemName,
      data: []
    }, mapBase)

    setGeoLabel(itemStyle, itemResult, 'itemStyle')
    setGeoLabel(label, itemResult, 'label')
    rows.forEach(row => {
      itemResult.data.push({
        name: row[dimension],
        value: row[itemName],
        selected: selectData
      })
    })
    result.push(itemResult)
  })

  return result
}

function setGeoLabel (value, target, label) {
  if (typeof value === 'object') {
    target[label] = value
  } else if (value) {
    target[label] = {
      normal: { show: true },
      emphasis: { show: true }
    }
  }
}

export const map = (columns, rows, settings, extra) => {
  const {
    position = 'china',
    selectData = false,
    selectedMode,
    label = true,
    dataType = {},
    digit = 2,
    dimension = columns[0],
    room,
    center,
    aspectScale,
    boundingCoords,
    zoom,
    scaleLimit,
    mapGrid,
    itemStyle,
    geoItemStyle,
    geoLabel
  } = settings
  let metrics = columns.slice()
  if (settings.metrics) {
    metrics = settings.metrics
  } else {
    metrics.splice(columns.indexOf(dimension), 1)
  }
  const { tooltipVisible, legendVisible, color } = extra
  const dataStore = {}
  rows.forEach(row => { dataStore[row[dimension]] = row })
  const tooltip = tooltipVisible && getTooltip(dataType, digit, dataStore, metrics, color)
  const legend = legendVisible && { data: metrics }
  const seriesParams = {
    position,
    selectData,
    label,
    itemStyle,
    dimension,
    metrics,
    rows
  }
  const series = getSeries(seriesParams)
  const geo = {
    map: position,
    selectedMode,
    room,
    center,
    aspectScale,
    boundingCoords,
    zoom,
    scaleLimit,
    grid: mapGrid,
    itemStyle: geoItemStyle
  }

  setGeoLabel(geoLabel, geo, 'label')
  setGeoLabel(geoItemStyle, geo, 'itemStyle')

  return getMapJSON(position).then(json => {
    echarts.registerMap(position, json)
    return { series, tooltip, geo, legend }
  })
}
