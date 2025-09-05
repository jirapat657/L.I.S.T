// src/pages/dashboard.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { getAllIssuesWithProjectNames } from '@/api/dashboard'
import type { IssueData } from '@/types/issue'
import { Card, Row, Col, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

// Chart.js
import {
  Pie as PieChart,
  Line as LineChart,
  Bar as BarChart
} from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement)

type DateFieldKey = 'createdAt' | 'startDate' | 'dueDate' | 'completeDate' | 'issueDate'
type TypeFieldKey = 'type' | 'status' | 'priority'

function getField<T, K extends keyof T>(obj: T, key: K) {
  return obj[key]
}

// (ฟังก์ชัน getCountByField, getOnTimeLateTimeByProject, getTypeTrendByMonth ใช้เหมือนเดิม)

function getCountByField(data: IssueData[], field: TypeFieldKey) {
  const counts: Record<string, number> = {}
  data.forEach((item) => {
    const key = item[field] ?? 'Unknown'
    counts[key] = (counts[key] || 0) + 1
  })
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

function getOnTimeLateTimeByProject(data: IssueData[]) {
  const projects: Record<string, { onTime: number; lateTime: number }> = {}
  data.forEach(issue => {
    const projectName = issue.projectName || 'Unknown Project'
    const status = issue.onLateTime || ''
    if (!status.startsWith('On Time') && !status.startsWith('Late Time')) return
    if (!projects[projectName]) {
      projects[projectName] = { onTime: 0, lateTime: 0 }
    }
    if (status.startsWith('On Time')) {
      projects[projectName].onTime += 1
    } else if (status.startsWith('Late Time')) {
      projects[projectName].lateTime += 1
    }
  })
  const result = []
  for (const [projectName, counts] of Object.entries(projects)) {
    if (counts.onTime > 0) {
      result.push({
        projectName,
        status: 'On Time',
        value: counts.onTime,
        label: `${projectName} - On Time`
      })
    }
    if (counts.lateTime > 0) {
      result.push({
        projectName,
        status: 'Late Time',
        value: counts.lateTime,
        label: `${projectName} - Late Time`
      })
    }
  }
  return result
}

const targetTypes = ['Task', 'Bug', 'Performance', 'Enquiry']
function getTypeTrendByMonth(
  data: IssueData[],
  dateField: DateFieldKey,
  typeField: TypeFieldKey
) {
  const group: Record<string, Record<string, number>> = {}
  data.forEach((item) => {
    let date = ''
    const value = getField(item, dateField)
    // Check if value is a Firestore Timestamp (has toDate method)
    if (value && typeof value === 'object' && typeof (value as { toDate?: () => Date }).toDate === 'function') {
      date = dayjs((value as { toDate: () => Date }).toDate()).format('YYYY-MM')
    } else if (typeof value === "string") {
      date = dayjs(value).format('YYYY-MM')
    } else if (value instanceof Date) {
      date = dayjs(value).format('YYYY-MM')
    }
    if (!date) return
    const type = getField(item, typeField) ?? 'Unknown'
    if (targetTypes.includes(type as string)) {
      group[date] = group[date] || {}
      group[date][type as string] = (group[date][type as string] || 0) + 1
    }
  })

  const allMonths = Object.keys(group).sort()
  if (allMonths.length > 0) {
    const start = dayjs(allMonths[0])
    const end = dayjs(allMonths[allMonths.length - 1])
    let current = start
    while (current.isBefore(end) || current.isSame(end, 'month')) {
      const monthStr = current.format('YYYY-MM')
      group[monthStr] = group[monthStr] || {}
      targetTypes.forEach(type => {
        if (!group[monthStr][type]) group[monthStr][type] = 0
      })
      current = current.add(1, 'month')
    }
  }
  const sortedMonths = Object.keys(group).sort()
  const rows: { date: string; type: string; value: number }[] = []
  sortedMonths.forEach(date => {
    targetTypes.forEach(type => {
      rows.push({ date, type, value: group[date][type] || 0 })
    })
  })
  return rows
}

const Dashboard = () => {
  const { data: issues = [], isLoading, isError, error } = useQuery<IssueData[], Error>({
    queryKey: ['LIMIssues'],
    queryFn: getAllIssuesWithProjectNames
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

  // DATA
  const statusData = getCountByField(issues, 'status')
  const typeData = getCountByField(issues, 'type')
  const priorityData = getCountByField(issues, 'priority')
  const typeTrendData = getTypeTrendByMonth(issues, 'createdAt', 'type')
  const projectLateTimeData = getOnTimeLateTimeByProject(issues)

  // Pie Data
  const statusColorMap: Record<string, string> = {
    'Awaiting': '#D9D9D9',
    'Inprogress': '#FF8C00',
    'Complete': '#006B3F',
    'Cancel': '#C20000'
  }
  const statusOrder = ['Awaiting', 'Inprogress', 'Complete', 'Cancel']

  const filteredStatusData = statusOrder
    .map(status => statusData.find(d => d.name === status))
    .filter(Boolean) // กรอง null

  const pieData = {
    labels: filteredStatusData.map(d => d!.name),
    datasets: [
      {
        data: filteredStatusData.map(d => d!.value),
        backgroundColor: filteredStatusData.map(d => statusColorMap[d!.name])
      }
    ]
  }

  
  // Line Data
  const months = [...new Set(typeTrendData.map(d => d.date))].sort()
  const targetTypes = ['Task', 'Bug', 'Performance', 'Enquiry']
  const typeColorMap: Record<string, string> = {
    'Task': '#080808',
    'Bug': '#FC0A18',
    'Performance': '#1490CE',
    'Enquiry': '#D0D5DD'
  }
  const filteredTargetTypes = targetTypes.filter(type => !!typeColorMap[type])
  const lineData = {
    labels: months.map(m => dayjs(m).format('MMM YYYY')),
    datasets: filteredTargetTypes.map(type => ({
      label: type,
      data: months.map(month =>
        typeTrendData.find(d => d.type === type && d.date === month)?.value || 0
      ),
      borderWidth: 3,
      fill: false,


      backgroundColor: typeColorMap[type],
      borderColor: typeColorMap[type],
    }))
  }

  // Column Chart (Bar)
  const barTypeColorMap: Record<string, string> = {
    'Task': '#323232',
    'Bug': '#FC0A18',
    'Performance': '#1490CE',
    'Enquiry': '#D0D5DD'
  }
  const typeOrder = ['Task', 'Bug', 'Performance', 'Enquiry']
  const filteredTypeData = typeOrder
    .map(type => typeData.find(d => d.name === type))
    .filter(Boolean)
  const barTypeData = {
    labels: filteredTypeData.map(d => d!.name),
    datasets: [
      {
        label: 'Issue Type',
        data: filteredTypeData.map(d => d!.value),
        backgroundColor: filteredTypeData.map(d => barTypeColorMap[d!.name])
      }
    ]
  }

  const priorityColorMap: Record<string, string> = {
    'Highest': '#FC0A18',
    'High': '#FC0A18',
    'Medium': '#FF8C00',
    'Low': '#1490CE',
    'Lowest': '#1490CE'
  }
  const priorityOrder = ['Highest', 'High', 'Medium', 'Low', 'Lowest']
  const filteredPriorityData = priorityOrder
    .map(priority => priorityData.find(d => d.name === priority))
    .filter(Boolean)
  const barPriorityData = {
    labels: filteredPriorityData.map(d => d!.name),
    datasets: [
      {
        label: 'Priority',
        data: filteredPriorityData.map(d => d!.value),
        backgroundColor: filteredPriorityData.map(d => priorityColorMap[d!.name])
      }
    ]
  }

  // Horizontal Bar: Project On Time vs Late Time
  const projectLabels = Array.from(
    new Set(projectLateTimeData.map(d => d.projectName))
  )
  const onTimeArr = projectLabels.map(label =>
    projectLateTimeData.find(d => d.projectName === label && d.status === 'On Time')?.value || 0
  )
  const lateTimeArr = projectLabels.map(label =>
    projectLateTimeData.find(d => d.projectName === label && d.status === 'Late Time')?.value || 0
  )
  const barProjectData = {
    labels: projectLabels,
    datasets: [
      {
        label: 'On Time',
        data: onTimeArr,
        backgroundColor: '#009B63',
        barThickness: 20, // ✅ ปรับขนาดแท่ง
      },
      {
        label: 'Late Time',
        data: lateTimeArr,
        backgroundColor: '#FC0A18',
        barThickness: 20, // ✅ ปรับขนาดแท่ง  
      }
    ]
  }

  // OPTIONS
  const pieOptions = {
    plugins: {
      legend: { position: "bottom" as const },
      tooltip: { callbacks: { label: (ctx: import('chart.js').TooltipItem<'pie'>) => `${ctx.label}: ${ctx.parsed}` } }
    }
  }

  const lineOptions = {
    responsive: true,
    plugins: { legend: { position: "top" as const } },
    scales: { y: { beginAtZero: true, stepSize: 1 } }
  }

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, stepSize: 1 } }
  }

  const hBarOptions = {
    responsive: true,
    plugins: { legend: { position: "top" as const } },
    indexAxis: 'y' as const, // horizontal
    scales: { x: { beginAtZero: true, stepSize: 1 } }
  }

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Status Overview" bordered={false}>
            <PieChart data={pieData} options={pieOptions} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Issue" bordered={false}>
            <LineChart data={lineData} options={lineOptions} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Type" bordered={false}>
            <BarChart data={barTypeData} options={barOptions} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Priority Breakdown" bordered={false}>
            <BarChart data={barPriorityData} options={barOptions} />
          </Card>
        </Col>
      </Row>
      <Col xs={24}>
        <Card title="Project" bordered={false}>
          <BarChart data={barProjectData} options={hBarOptions} />
        </Card>
      </Col>
    </div>
  )
}

export default Dashboard
