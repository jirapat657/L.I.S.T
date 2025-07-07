import { UpOutlined, DownOutlined, DoubleRightOutlined, PauseOutlined, AppstoreFilled, BugFilled, DashboardFilled, WechatOutlined } from '@ant-design/icons';

export const priorityOptions = [
  { value: 'Highest', label: <><DoubleRightOutlined style={{ color: '#FC0A18', marginRight: 8, transform: 'rotate(-90deg)' }} />Highest</> },
  { value: 'High', label: <><UpOutlined style={{ color: '#FC0A18', marginRight: 8 }} />High</> },
  { value: 'Medium', label: <><PauseOutlined style={{ color: '#FF8C00', marginRight: 8 , transform: 'rotate(90deg)'}} />Medium</> },
  { value: 'Low', label: <><DownOutlined style={{ color: '#1490CE', marginRight: 8 }} />Low</> },
  { value: 'Lowest', label: <><DoubleRightOutlined  style={{ color: '#1490CE', marginRight: 8, transform: 'rotate(90deg)' }} />Lowest</> },
];

export const typeOptions = [
  { value: 'Task', label: <><AppstoreFilled style={{ color: '#000000D9', marginRight: 8 }} />Task</> },
  { value: 'Bug', label: <><BugFilled style={{ color: '#FC0A18', marginRight: 8 }} />Bug</> },
  { value: 'Performance', label: <><DashboardFilled  style={{ color: '#1490CE', marginRight: 8 }} />Performance</> },
  { value: 'Enquiry', label: <><WechatOutlined   style={{ color: '#D0D5DD', marginRight: 8 }} />Enquiry</> },
];
