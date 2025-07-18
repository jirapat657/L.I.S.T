// src/pages/dashboard.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { getAllIssues } from '@/api/issue'
import type { IssueData } from '@/types/issue'

import { Card, Row, Col, Spin, Divider } from 'antd'
import { Pie, Line, Column } from '@ant-design/charts'
import { LoadingOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'


const Dashboard = () => {
  // ใช้ useQuery สำหรับการดึงข้อมูล
  const { data: issues = [], isLoading, isError, error } = useQuery<IssueData[], Error>({
    queryKey: ['LIMIssues'],
    queryFn: getAllIssues
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: 'red' }}>Error: {error?.message}</div>
      </div>
    )
  }

  const getTypeTrendByMonth = (data: IssueData[], dateField: string, typeField: string) => {
  const group: Record<string, Record<string, number>> = {}
  
  // กำหนด Type ทั้ง 4 แบบที่ต้องการแสดง
  const targetTypes = ['Task', 'Bug', 'Performance', 'Enquiry']

  data.forEach((item) => {
    let date = ""
    const value = item[dateField]
    
    // แปลงวันที่ให้อยู่ในรูปแบบ YYYY-MM
    if (value?.toDate) { // กรณีเป็น Firebase Timestamp
      date = dayjs(value.toDate()).format('YYYY-MM')
    } else if (typeof value === "string") { // กรณีเป็น ISO string
      date = dayjs(value).format('YYYY-MM')
    } else if (value instanceof Date) { // กรณีเป็น Date object
      date = dayjs(value).format('YYYY-MM')
    }
    if (!date) return
    
    const type = item[typeField] || 'Unknown'
    
    // กรองเฉพาะ type ที่ต้องการ
    if (targetTypes.includes(type)) {
      group[date] = group[date] || {}
      group[date][type] = (group[date][type] || 0) + 1
    }
  })

  // เติมข้อมูลเดือนที่ขาดหายไปด้วยค่า 0
  const allMonths = Object.keys(group).sort()
  if (allMonths.length > 0) {
    const start = dayjs(allMonths[0])
    const end = dayjs(allMonths[allMonths.length - 1])
    let current = start
    
    while (current.isBefore(end) || current.isSame(end, 'month')) {
      const monthStr = current.format('YYYY-MM')
      group[monthStr] = group[monthStr] || {}
      
      // ตรวจสอบว่าทุก type มีค่าในเดือนนี้ ถ้าไม่มีให้ใส่ 0
      targetTypes.forEach(type => {
        if (!group[monthStr][type]) {
          group[monthStr][type] = 0
        }
      })
      
      current = current.add(1, 'month')
    }
  }

  // จัดเรียงเดือนใหม่หลังจากเติมข้อมูล
  const sortedMonths = Object.keys(group).sort()

  // สร้างข้อมูลสำหรับกราฟ
  const rows: { date: string; type: string; value: number }[] = []
  sortedMonths.forEach(date => {
    targetTypes.forEach(type => {
      rows.push({ 
        date, 
        type, 
        value: group[date][type] || 0 
      })
    })
  })
  
  return rows
}

  // Process data for charts
  const statusData = getCountByField(issues, 'status')
  const typeData = getCountByField(issues, 'type')
  const priorityData = getCountByField(issues, 'priority')
  const typeTrendData = getTypeTrendByMonth(issues, 'createdAt', 'type')

  // Ant Design Charts config
  const pieConfig = {
    data: statusData,
    angleField: 'value',
    colorField: 'name',
    radius: 0.8,
    label: {
      type: 'inner',
      content: '{percentage}',
    },
    interactions: [{ type: 'element-active' }],
  }

  const lineConfig = {
    data: typeTrendData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    point: { size: 4, shape: 'circle' },
    xAxis: {
      label: { 
        autoRotate: false, 
        formatter: (v: string) => dayjs(v).format('MMM YYYY') 
      }
    },
    yAxis: { min: 0, label: { formatter: (v: number) => v.toString() } },
    legend: { position: 'top' },
    color: ({ type }) => {
      const colorMap: Record<string, string> = {
        'Task': '#1890FF',
        'Bug': '#FF4D4F',
        'Performance': '#52C41A',
        'Enquiry': '#FAAD14'
      }
      return colorMap[type] || '#888'
    },
    lineStyle: { lineWidth: 3 },
    tooltip: {
      formatter: (datum: any) => ({
        name: datum.type,
        value: `${datum.value} issues`
      })
    }
  }


  const columnConfig = (title: string) => ({
  data: title === 'Type' ? typeData : priorityData,
  xField: 'name',   // ชื่อประเภท (แกน X)
  yField: 'value',  // จำนวน (แกน Y)
  seriesField: 'name',
  color: title === 'Type'
    ? ['#1890FF', '#FF4D4F', '#52C41A', '#FAAD14']
    : ['#722ED1', '#13C2C2', '#F5222D', '#FA8C16'],
  columnStyle: { radius: [4, 4, 0, 0] },
  label: {
    position: 'top', // แสดงค่าบนหัวแท่ง
  },
  interactions: [{ type: 'active-region' }]
});


  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Dashboard</h1>
      <Divider />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Status Distribution (Pie Chart)" bordered={false}>
            <Pie {...pieConfig} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Issues Over Time (Line Chart)" bordered={false}>
            <Line {...lineConfig} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Issue Type (Bar Chart)" bordered={false}>
            <Column {...columnConfig('Type')} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Priority Breakdown (Bar Chart)" bordered={false}>
            <Column {...columnConfig('Priority')} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

// Helper functions (same as before)
const getCountByField = (data: any[], field: string) => {
  const counts: Record<string, number> = {}
  data.forEach((item) => {
    const key = item[field] || 'Unknown'
    counts[key] = (counts[key] || 0) + 1
  })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}


export default Dashboard