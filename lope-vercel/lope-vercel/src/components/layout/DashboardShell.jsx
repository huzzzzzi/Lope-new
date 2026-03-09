import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'
export default function DashboardShell(){return(<div style={{display:'flex',minHeight:'100vh'}}><Sidebar/><div style={{marginLeft:'var(--sidebar-w)',flex:1,display:'flex',flexDirection:'column'}}><Topbar/><main style={{padding:'24px 28px',flex:1}}><Outlet/></main></div></div>)}
