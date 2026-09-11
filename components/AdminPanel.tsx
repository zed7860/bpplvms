"use client";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { formatISTDateTime, formatISTTime12, formatISTTime24, todayIST } from "@/lib/datetime";

type Visitor={id:string;name:string;email:string|null;phone:string;company:string|null;visitor_type:string;photo_url:string|null;meeting_with_name:string;purpose:string|null;check_in:string;check_out:string|null;status:string};
type Employee={id:string;name:string;department:string|null;email:string|null;active:boolean};

export default function AdminPanel(){
  const [visitors,setVisitors]=useState<Visitor[]>([]);
  const [employees,setEmployees]=useState<Employee[]>([]);
  const [from,setFrom]=useState(todayIST());
  const [to,setTo]=useState(todayIST());
  const [tab,setTab]=useState<"visitors"|"employees"|"email">("visitors");
  const [form,setForm]=useState({name:"",department:"",email:""});
  const [loading,setLoading]=useState(false);
  const [employeeError,setEmployeeError]=useState("");
  const [emailSettings,setEmailSettings]=useState({email:"",appPassword:"",recipient:"",configured:false,ccEmail:"",updatedAt:null as string|null});
  const [emailMessage,setEmailMessage]=useState("");
  const [emailError,setEmailError]=useState("");
  const [employeeEmailDrafts,setEmployeeEmailDrafts]=useState<Record<string,string>>({});
  const [editingEmployeeId,setEditingEmployeeId]=useState<string|null>(null);
  const [editDraft,setEditDraft]=useState({name:"",department:"",email:""});

  async function loadVisitors(){
    setLoading(true); const r=await fetch(`/api/reports?from=${from}&to=${to}`); const d=await r.json(); setVisitors(d.visitors||[]); setLoading(false);
  }
  async function loadEmployees(){
    const r=await fetch("/api/admin/employees");
    const d=await r.json();
    if (!r.ok) { setEmployeeError(d.error || "Unable to load employees."); return; }
    setEmployeeError(""); setEmployees(d.employees||[]); setEmployeeEmailDrafts(Object.fromEntries((d.employees||[]).map((employee:Employee)=>[employee.id,employee.email||""])));
  }
  useEffect(()=>{loadVisitors();loadEmployees()},[]);

  async function checkout(id:string){await fetch(`/api/visitors/${id}/checkout`,{method:"PATCH"});loadVisitors();}
  async function addEmployee(e:React.FormEvent){e.preventDefault();setEmployeeError("");const response=await fetch("/api/admin/employees",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const data=await response.json();if(!response.ok){setEmployeeError(data.error||"Unable to add employee.");return;}setForm({name:"",department:"",email:""});loadEmployees();}
  async function toggleEmployee(x:Employee){await fetch("/api/admin/employees",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...x,active:!x.active})});loadEmployees();}
  function startEditEmployee(x:Employee){setEditingEmployeeId(x.id);setEditDraft({name:x.name,department:x.department||"",email:x.email||""});setEmployeeError("");}
  function cancelEditEmployee(){setEditingEmployeeId(null);}
  async function saveEditEmployee(x:Employee){
    if(!editDraft.name.trim()){setEmployeeError("Employee name is required.");return;}
    const response=await fetch("/api/admin/employees",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...x,name:editDraft.name.trim(),department:editDraft.department.trim(),email:editDraft.email.trim()})});
    const data=await response.json();
    if(!response.ok){setEmployeeError(data.error||"Unable to update employee.");return;}
    setEmployeeError(""); setEditingEmployeeId(null); loadEmployees();
  }
  async function deleteEmployee(x:Employee){
    if(!confirm(`Delete ${x.name}? This cannot be undone.`)) return;
    const response=await fetch(`/api/admin/employees?id=${x.id}`,{method:"DELETE"});
    const data=await response.json();
    if(!response.ok){setEmployeeError(data.error||"Unable to delete employee.");return;}
    setEmployeeError(""); loadEmployees();
  }
  async function saveEmployeeEmail(employee:Employee){
    const email=(employeeEmailDrafts[employee.id]||"").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setEmployeeError(`Enter a valid email address for ${employee.name}.`); return; }
    const response=await fetch("/api/admin/employees",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({...employee,email})});
    const data=await response.json();
    if(!response.ok){setEmployeeError(data.error||"Unable to save employee email.");return;}
    setEmployeeError(""); setEmployees(current=>current.map(item=>item.id===employee.id?{...item,email}:item));
  }
  async function loadEmailSettings(){const response=await fetch("/api/admin/email-settings");const data=await response.json();if(response.ok)setEmailSettings(current=>({...current,email:data.email||"",configured:Boolean(data.configured),ccEmail:data.ccEmail||"",updatedAt:data.updatedAt||null}));}
  async function saveEmailSettings(event:React.FormEvent){event.preventDefault();setEmailError("");setEmailMessage("");const response=await fetch("/api/admin/email-settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(emailSettings)});const data=await response.json();if(!response.ok)return setEmailError(data.error||"Unable to save email settings.");setEmailSettings(current=>({...current,appPassword:"",configured:true,ccEmail:data.ccEmail,updatedAt:data.updatedAt}));setEmailMessage("Gmail settings saved securely.");}
  async function sendTestEmail(){setEmailError("");setEmailMessage("");const response=await fetch("/api/admin/email-settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({recipient:emailSettings.recipient||emailSettings.email})});const data=await response.json();if(!response.ok)return setEmailError(data.error||"Unable to send test email.");setEmailMessage(`Test email sent to ${data.recipient}${data.ccEmail ? ` with ${data.ccEmail} in CC.` : "."}`);}
  function csv(){
    const headers=["Visitor ID","Name","Email","Phone","Company","Type","Meeting With","Purpose","Check In (IST)","Check Out (IST)","Status","Photo URL"];
    const rows=visitors.map(v=>[v.id,v.name,v.email||"",v.phone,v.company||"",v.visitor_type,v.meeting_with_name,v.purpose||"",formatISTDateTime(v.check_in),v.check_out?formatISTDateTime(v.check_out):"",v.status,v.photo_url||""]);
    const esc=(value:string|null|undefined)=>{
      const text=String(value??"");
      const safe=/^[=+\-@]/.test(text)?`'${text}`:text;
      return `"${safe.replaceAll('"','""')}"`;
    };
    const text="\ufeff"+[headers,...rows].map(row=>row.map(esc).join(",")).join("\r\n")+"\r\n";
    const url=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8;"}));
    const link=document.createElement("a");
    link.href=url;
    link.download=`visitor-report-${from}-to-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  function xlsx(){
    const rows=visitors.map(v=>({"Visitor ID":v.id,"Name":v.name,"Email":v.email||"","Phone":v.phone,"Company":v.company||"","Type":v.visitor_type,"Meeting With":v.meeting_with_name,"Purpose":v.purpose||"","Check In (IST)":formatISTDateTime(v.check_in),"Check Out (IST)":v.check_out?formatISTDateTime(v.check_out):"","Status":v.status,"Photo URL":v.photo_url||""}));
    const sheet=XLSX.utils.json_to_sheet(rows);
    sheet["!cols"]=[{wch:38},{wch:22},{wch:28},{wch:17},{wch:22},{wch:14},{wch:24},{wch:32},{wch:24},{wch:24},{wch:12},{wch:55}];
    const workbook=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook,sheet,"Visitors");
    XLSX.writeFile(workbook,`visitor-report-${from}-to-${to}.xlsx`);
  }
  async function downloadPdf(visitor:Visitor){
    const doc=new jsPDF();
    doc.setTextColor(16,59,84); doc.setFontSize(22); doc.text("Bhoruka Park",20,24);
    doc.setFontSize(11); doc.setTextColor(102,119,123); doc.text("Visitor check-in record",20,32);
    doc.setDrawColor(231,124,91); doc.line(20,39,190,39);
    let y=53;
    if (visitor.photo_url) {
      try {
        const image=await fetch(visitor.photo_url).then(response=>response.blob());
        const dataUrl=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(image);});
        doc.addImage(dataUrl,"JPEG",150,48,38,38);
      } catch { }
    }
    doc.setTextColor(23,50,74); doc.setFontSize(10);
    [["Name",visitor.name],["Email",visitor.email||"Not provided"],["Phone",visitor.phone],["Company",visitor.company||"Not provided"],["Visitor type",visitor.visitor_type],["Meeting with",visitor.meeting_with_name],["Purpose",visitor.purpose||"Not provided"],["Check in",formatISTDateTime(visitor.check_in)],["Check out",visitor.check_out?formatISTDateTime(visitor.check_out):"Still in"],["Status",visitor.status]].forEach(([label,value])=>{doc.setFont("helvetica","bold");doc.text(`${label}:`,20,y);doc.setFont("helvetica","normal");doc.text(String(value),57,y);y+=9;});
    doc.setFontSize(8); doc.setTextColor(102,119,123); doc.text(`Visitor ID: ${visitor.id}`,20, y+8);
    doc.save(`visitor-${visitor.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${visitor.id.slice(0,8)}.pdf`);
  }
  async function logout(){await fetch("/api/admin/logout",{method:"POST"});location.href="/admin/login";}

  return <>
    <header className="header admin-header"><div className="header-inner"><div className="brand admin-brand"><img className="brand-mark-logo" src="/images/bppl-logo.png" alt="Bhoruka Park logo" /><span>Bhoruka Park <small>VISITOR ADMIN</small></span></div><div className="admin-actions"><a href="/">Public page</a><button className="btn secondary small" onClick={logout}>Log out</button></div></div></header>
    <main className="container admin-container">
      <div className="admin-intro"><div><p className="eyebrow">Operations dashboard</p><h1>Visitor overview</h1><p>Keep today&apos;s arrivals moving and your reception team informed.</p></div><div className="live-pill"><span /> Live workspace</div></div>
      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button role="tab" aria-selected={tab==="visitors"} className={`btn ${tab==="visitors"?"primary":"secondary"}`} onClick={()=>setTab("visitors")}>Visitors &amp; reports</button>
        <button role="tab" aria-selected={tab==="employees"} className={`btn ${tab==="employees"?"primary":"secondary"}`} onClick={()=>setTab("employees")}>Employees</button>
        <button role="tab" aria-selected={tab==="email"} className={`btn ${tab==="email"?"primary":"secondary"}`} onClick={()=>{setTab("email");loadEmailSettings();}}>Email settings</button>
      </div>

      {tab==="visitors" ? <div className="grid">
        <div className="grid grid3 stat-grid">
          <div className="card stat-card"><div className="stat-label">Total visitors</div><div className="kpi">{visitors.length}</div><span className="stat-accent coral" /></div>
          <div className="card stat-card"><div className="stat-label">Currently in</div><div className="kpi">{visitors.filter(v=>v.status==="IN").length}</div><span className="stat-accent teal" /></div>
          <div className="card stat-card"><div className="stat-label">Currently out</div><div className="kpi">{visitors.filter(v=>v.status==="OUT").length}</div><span className="stat-accent gold" /></div>
        </div>
        <div className="card report-card">
          <div className="space report-heading"><div><p className="eyebrow">Activity log</p><h2>Visitor report</h2></div><div className="export-actions"><button className="btn secondary" onClick={csv}>CSV</button><button className="btn secondary" onClick={xlsx}>XLSX</button></div></div>
          <div className="report-filters">
            <div><label>From</label><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div>
            <div><label>To</label><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
            <button className="btn secondary" onClick={loadVisitors}>Apply</button>
          </div>
          {loading ? <p className="loading-state">Loading visitor activity...</p> : <div className="table-wrap"><table><thead><tr><th>Photo</th><th>Visitor</th><th>Contact</th><th>Meeting With</th><th>Type</th><th>Check In</th><th>Status</th><th></th></tr></thead>
          <tbody>{visitors.map(v=><tr key={v.id}>
            <td>{v.photo_url?<img src={v.photo_url} className="photo" alt="" />:"—"}</td>
            <td><b>{v.name}</b><br/><span className="muted">{v.company||""}</span></td>
            <td>{v.phone}<br/>{v.email||""}</td>
            <td>{v.meeting_with_name}</td><td>{v.visitor_type}</td>
            <td>{formatISTTime12(v.check_in)}<br/><small className="muted">{formatISTTime24(v.check_in)} · IST</small></td>
            <td><span className={`badge ${v.status==="OUT"?"out":""}`}>{v.status}</span>{v.check_out&&<><br/><small>{formatISTTime12(v.check_out)}</small><br/><small className="muted">{formatISTTime24(v.check_out)} · IST</small></>}</td>
            <td><div className="table-actions">{v.status==="IN"&&<button className="btn secondary small" onClick={()=>checkout(v.id)}>Check out</button>}<button className="btn primary small" onClick={()=>downloadPdf(v)}>PDF</button></div></td>
          </tr>)}</tbody></table></div>}
        </div>
      </div> : tab==="employees" ?
      <div className="grid grid2">
        <div className="card employee-form-card">{employeeError && <div className="error" role="alert">{employeeError}</div>}<p className="eyebrow">Team directory</p><h2>Add employee</h2><p className="muted">Add a host so visitors can find them during check-in.</p><form onSubmit={addEmployee} className="grid">
          <div><label>Name *</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><label>Department</label><input value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/></div>
          <div><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <button className="btn primary">Add Employee</button>
        </form></div>
        <div className="card employee-list-card"><div className="space"><div><p className="eyebrow">Directory</p><h2>Employee list</h2></div><span className="count-pill">{employees.length} total</span></div>{employees.map(x=><div key={x.id} className="employee-row">
          {editingEmployeeId===x.id ? <div className="employee-info">
            <input aria-label="Edit name" value={editDraft.name} onChange={e=>setEditDraft({...editDraft,name:e.target.value})}/>
            <input aria-label="Edit department" placeholder="Department" value={editDraft.department} onChange={e=>setEditDraft({...editDraft,department:e.target.value})}/>
            <input aria-label="Edit email" type="email" placeholder="employee@bhorukapark.com" value={editDraft.email} onChange={e=>setEditDraft({...editDraft,email:e.target.value})}/>
            <div className="table-actions"><button className="btn primary small" onClick={()=>saveEditEmployee(x)}>Save</button><button className="btn secondary small" onClick={cancelEditEmployee}>Cancel</button></div>
          </div> : <div className="employee-info"><b>{x.name}</b><span className="muted">{x.department||""}</span><div className="employee-email-editor"><input aria-label={`Email for ${x.name}`} type="email" placeholder="employee@bhorukapark.com" value={employeeEmailDrafts[x.id]||""} onChange={event=>setEmployeeEmailDrafts({...employeeEmailDrafts,[x.id]:event.target.value})}/><button className="btn secondary small" onClick={()=>saveEmployeeEmail(x)}>Save email</button></div>{!x.email&&<small className="missing-email">Email required for visitor notifications</small>}</div>}
          <div className="table-actions"><button className="btn secondary small" onClick={()=>toggleEmployee(x)}>{x.active?"Disable":"Enable"}</button>{editingEmployeeId!==x.id&&<button className="btn secondary small" onClick={()=>startEditEmployee(x)}>Edit</button>}<button className="btn danger small" onClick={()=>deleteEmployee(x)}>Delete</button></div>
        </div>)}</div>
      </div> :
      <div className="card email-settings-card">
        <div className="email-settings-heading"><div><p className="eyebrow">Notifications</p><h2>Gmail email setup</h2><p className="muted">Use a Gmail App Password to notify hosts automatically when visitors arrive.</p></div><span className={`config-pill ${emailSettings.configured?"ready":"pending"}`}>{emailSettings.configured?"Configured":"Not configured"}</span></div>
        {emailError && <div className="error" role="alert">{emailError}</div>}{emailMessage && <div className="notice" role="status">{emailMessage}</div>}
        <div className="gmail-help"><strong>Before you start</strong><span>Gmail or Google Workspace addresses such as name@bhorukapark.com are supported. Turn on 2-Step Verification in Google Account → Security, then create an App Password. Do not use your normal account password.</span></div>
        <form onSubmit={saveEmailSettings} className="grid email-settings-form">
          <div><label htmlFor="gmail-address">Gmail address</label><input id="gmail-address" type="email" required placeholder="reception@gmail.com" value={emailSettings.email} onChange={e=>setEmailSettings({...emailSettings,email:e.target.value})}/></div>
          <div><label htmlFor="gmail-app-password">Gmail App Password</label><input id="gmail-app-password" type="password" required={!emailSettings.configured} placeholder={emailSettings.configured?"Saved securely — enter a new one to replace it":"16-character App Password"} value={emailSettings.appPassword} onChange={e=>setEmailSettings({...emailSettings,appPassword:e.target.value})}/></div>
          <div><label htmlFor="gmail-cc">CC email addresses <span className="optional">Optional, up to 10</span></label><textarea id="gmail-cc" rows={3} placeholder="person1@example.com, person2@example.com" value={emailSettings.ccEmail} onChange={e=>setEmailSettings({...emailSettings,ccEmail:e.target.value})}/><small className="muted">Separate addresses with commas, semicolons, or new lines.</small></div>
          <button className="btn primary" type="submit">Save Gmail settings</button>
        </form>
        <div className="test-email-box"><div><strong>Send a test email</strong><p className="muted">Confirm the Gmail connection before receiving visitor alerts.</p></div><div className="test-email-controls"><input aria-label="Test recipient" type="email" placeholder={emailSettings.email||"Test recipient email"} value={emailSettings.recipient} onChange={e=>setEmailSettings({...emailSettings,recipient:e.target.value})}/><button type="button" className="btn secondary" disabled={!emailSettings.configured} onClick={sendTestEmail}>Send test</button></div></div>
      </div>}
    </main>
  </>;
}
