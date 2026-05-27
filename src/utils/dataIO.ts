import { toast } from 'vue-sonner'
import type { StockItem } from '@/utils/stockStats'

type ExportFormat = 'json' | 'csv' | 'xlsx'

const CSV_HEADERS = [
  '股票代码',
  '股票名称',
  '类型',
  '日期',
  '交易方向',
  '价格',
  '数量',
  '手续费',
  '总金额',
  '标签',
]

function stockToCsvRows(stocks: StockItem[]): string[][] {
  const rows: string[][] = []
  for (const stock of stocks) {
    const sortedTxs = [...stock.transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    if (sortedTxs.length === 0) {
      rows.push([stock.code, stock.name, stock.type, '', '', '', '', '', '', ''])
    } else {
      for (const tx of sortedTxs) {
        rows.push([
          stock.code,
          stock.name,
          stock.type,
          tx.date,
          tx.type,
          String(tx.price),
          String(tx.quantity),
          String(tx.fee ?? 0),
          String(tx.totalAmount ?? 0),
          tx.tags?.join(';') || '',
        ])
      }
    }
  }
  return rows
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function rowsToCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\n')
}

async function loadXlsx(): Promise<typeof import('xlsx')> {
  return import('xlsx')
}

export async function exportToFormat(stocks: StockItem[], format: ExportFormat): Promise<boolean> {
  if (stocks.length === 0) {
    toast.warning('没有数据可导出')
    return false
  }

  const dateStr = new Date().toISOString().split('T')[0]

  if (format === 'json') {
    const json = JSON.stringify(stocks, null, 2)
    downloadBlob(new Blob([json], { type: 'application/json' }), `stock-data-${dateStr}.json`)
    return true
  }

  if (format === 'csv') {
    const rows = [CSV_HEADERS, ...stockToCsvRows(stocks)]
    const csv = '\uFEFF' + rowsToCsv(rows)
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `stock-data-${dateStr}.csv`)
    return true
  }

  if (format === 'xlsx') {
    const xlsx = await loadXlsx()
    const wb = xlsx.utils.book_new()
    for (const stock of stocks) {
      const rows = [CSV_HEADERS, ...stockToCsvRows([stock])]
      const ws = xlsx.utils.aoa_to_sheet(rows)
      xlsx.utils.book_append_sheet(wb, ws, safeSheetName(stock.name || stock.code))
    }
    xlsx.writeFile(wb, `stock-data-${dateStr}.xlsx`)
    return true
  }

  return false
}

export async function downloadTemplate(format: Exclude<ExportFormat, 'json'>) {
  const dateStr = new Date().toISOString().split('T')[0]

  if (format === 'csv') {
    const csv = '\uFEFF' + rowsToCsv([CSV_HEADERS])
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `导入模板-${dateStr}.csv`)
    return
  }

  if (format === 'xlsx') {
    const xlsx = await loadXlsx()
    const ws = xlsx.utils.aoa_to_sheet([CSV_HEADERS])
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, '交易记录')
    xlsx.writeFile(wb, `导入模板-${dateStr}.xlsx`)
  }
}

export async function importFromFile(file: File): Promise<StockItem[]> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'json') {
    return importJson(file)
  }

  if (ext === 'csv') {
    return importCsv(file)
  }

  if (ext === 'xlsx' || ext === 'xls') {
    return importXlsx(file)
  }

  throw new Error('不支持的文件格式，请选择 .json、.csv 或 .xlsx 文件')
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function safeSheetName(name: string): string {
  return name.replace(/[\\/*?[\]:]/g, '_').slice(0, 31)
}

async function importJson(file: File): Promise<StockItem[]> {
  const text = await file.text()
  const data = JSON.parse(text)
  if (!Array.isArray(data)) throw new Error('JSON 数据格式不正确，应为数组')
  const valid = data.every(
    (s: StockItem) => typeof s === 'object' && 'code' in s && 'name' in s && 'type' in s,
  )
  if (!valid) throw new Error('JSON 数据格式不正确')
  return data as StockItem[]
}

async function importCsv(file: File): Promise<StockItem[]> {
  const text = await file.text()
  return parseCsvToStocks(text)
}

function parseCsvToStocks(csvText: string): StockItem[] {
  const rows = parseCsvText(csvText)

  if (rows.length < 2) throw new Error('CSV 数据为空或格式不正确')

  const header = rows[0]
  const codeIdx = header.findIndex((h) => h.includes('代码') || h === 'code')
  const nameIdx = header.findIndex((h) => h.includes('名称') || h === 'name')
  const typeIdx = header.findIndex((h) => h.includes('类型') || h === 'type')
  const dateIdx = header.findIndex((h) => h.includes('日期') || h === 'date')
  const dirIdx = header.findIndex((h) => h.includes('方向') || h === 'type')
  const priceIdx = header.findIndex((h) => h.includes('价格') || h === 'price')
  const qtyIdx = header.findIndex((h) => h.includes('数量') || h === 'quantity')
  const feeIdx = header.findIndex((h) => h.includes('手续费') || h === 'fee')
  const totalIdx = header.findIndex((h) => h.includes('总金额') || h === 'totalAmount')
  const tagIdx = header.findIndex((h) => h.includes('标签') || h === 'tag')

  if (codeIdx < 0 || nameIdx < 0) throw new Error('CSV 缺少必要的列（代码、名称）')

  const stockMap = new Map<string, StockItem>()
  const validTypes = new Set(['A股', 'ETF', '积存金'])

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const code = row[codeIdx]?.trim()
    const name = row[nameIdx]?.trim()
    if (!code || !name) continue

    const stockType =
      typeIdx >= 0 && validTypes.has(row[typeIdx]) ? (row[typeIdx] as StockItem['type']) : 'A股'

    if (!stockMap.has(code)) {
      stockMap.set(code, { code, name, type: stockType, transactions: [], currentPrice: 0 })
    }

    if (dateIdx < 0 || dirIdx < 0) continue
    const date = row[dateIdx]?.trim()
    const direction = row[dirIdx]?.trim()
    if (!date || !direction) continue

    const txDirection = direction === '买入' ? '买入' : direction === '卖出' ? '卖出' : null
    if (!txDirection) continue

    const price = parseFloat(row[priceIdx])
    const quantity = parseFloat(row[qtyIdx])
    if (isNaN(price) || isNaN(quantity)) continue

    stockMap.get(code)!.transactions.push({
      date,
      type: txDirection,
      price,
      quantity,
      fee: feeIdx >= 0 ? parseFloat(row[feeIdx]) || 0 : 0,
      totalAmount: totalIdx >= 0 ? parseFloat(row[totalIdx]) || 0 : 0,
      tags:
        tagIdx >= 0 && row[tagIdx]?.trim()
          ? row[tagIdx]
              .trim()
              .split(';')
              .map((t: string) => t.trim())
              .filter(Boolean)
          : undefined,
    })
  }

  return [...stockMap.values()]
}

/**
 * 解析CSV格式的文本，将其转换为二维字符串数组
 * @param text CSV格式的文本字符串
 * @returns 二维字符串数组，每一行是一个字符串数组
 */
function parseCsvText(text: string): string[][] {
  // 存储所有解析出的行
  const rows: string[][] = []
  // 存储当前正在构建的字段内容
  let current = ''
  // 标记当前是否处于引号包围的字段中
  let inQuotes = false
  // 存储当前行的所有字段
  const currentRow: string[] = []

  // 遍历输入文本的每一个字符
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    // 如果当前在引号内部，特殊处理引号内容
    if (inQuotes) {
      if (ch === '"') {
        // 检查是否是转义的双引号（两个连续的双引号）
        if (i + 1 < text.length && text[i + 1] === '"') {
          // 添加一个双引号字符到当前字段，然后跳过下一个字符
          current += '"'
          i++
        } else {
          // 单独的双引号表示引号字段结束
          inQuotes = false
        }
      } else {
        // 普通字符直接添加到当前字段
        current += ch
      }
    } else {
      // 不在引号内部时，按CSV标准规则处理
      if (ch === '"') {
        // 开始一个新的引号字段
        inQuotes = true
      } else if (ch === ',') {
        // 遇到逗号，当前字段结束，添加到当前行
        currentRow.push(current)
        current = '' // 重置当前字段
      } else if (ch === '\n' || ch === '\r') {
        // 遇到换行符，当前行结束

        // 特殊处理Windows换行符 \r\n
        if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
          i++ // 跳过 \n 字符
        }

        // 将当前字段添加到当前行（即使为空）
        currentRow.push(current)

        // 只有当前行包含非空字段时才添加到结果中
        if (currentRow.some((f) => f !== '')) {
          // 使用扩展运算符复制当前行，避免后续修改影响已添加的行
          rows.push([...currentRow])
        }

        // 清空当前行数组，准备下一行
        currentRow.length = 0
        current = '' // 重置当前字段
      } else {
        // 普通字符直接添加到当前字段
        current += ch
      }
    }
  }

  // 处理文本末尾可能剩余的内容（最后一个字段和最后一行）
  currentRow.push(current)
  if (currentRow.some((f) => f !== '')) {
    rows.push([...currentRow])
  }

  // 返回解析完成的二维数组
  return rows
}

/**
 * 安全地将单元格值转换为CSV格式
 * @param value 单元格原始值
 * @returns 转义后的CSV单元格值
 */
function escapeCsvValue(value: unknown): string {
  // 转换为字符串
  let str = String(value ?? '')

  // 如果字符串为空，直接返回
  if (str === '') {
    return '""' // 空字符串用引号包围
  }

  // 如果字符串包含逗号、换行符或引号，则需要用引号包围并转义引号
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    // 将双引号转义为两个双引号
    str = str.replace(/"/g, '""')
    // 用双引号包围整个字段
    return `"${str}"`
  }

  // 否则直接返回原字符串
  return str
}

async function importXlsx(file: File): Promise<StockItem[]> {
  const xlsx = await loadXlsx()
  const buffer = await file.arrayBuffer()
  const wb = xlsx.read(buffer, { type: 'array' })

  if (wb.SheetNames.length === 0) throw new Error('Excel 文件中没有工作表')

  const allStocks: StockItem[] = []

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][]
    const csvText = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n')
    try {
      const sheetStocks = parseCsvToStocks(csvText)
      allStocks.push(...sheetStocks)
    } catch {
      // 跳过无法解析的工作表
    }
  }

  if (allStocks.length === 0) throw new Error('Excel 文件中未找到有效的股票数据')
  return allStocks
}

export function mergeImportStocks(
  existing: StockItem[],
  incoming: StockItem[],
  overwrite: boolean,
): StockItem[] {
  const codeIndex = new Map<string, number>()
  existing.forEach((s, i) => codeIndex.set(s.code, i))

  for (const stock of incoming) {
    const existingIdx = codeIndex.get(stock.code)
    if (existingIdx !== undefined) {
      if (overwrite) {
        existing[existingIdx] = stock
      }
    } else {
      existing.push(stock)
      codeIndex.set(stock.code, existing.length - 1)
    }
  }

  return existing
}
