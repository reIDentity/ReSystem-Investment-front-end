"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useDemo } from "./DemoProvider";
import { Initials, InvestorShell, Modal, Panel, Tag, usd } from "./InvestorUI";

export function InvestorActivity() {
  const demo = useDemo();
  const [filter, setFilter] = useState("All");
  const transactions=demo.transactions.filter(t=>filter==="All"||t.kind===filter);
  return <InvestorShell page="activity" title="Activity" subtitle="Every purchase, payout, deposit and withdrawal, recorded on INFRA"><Panel className="iv-transactions"><div className="iv-panel-toolbar"><h2>Transactions</h2><div className="iv-tabs" role="tablist" aria-label="Transaction type">{["All","Payouts","Buys","Deposits","Withdrawals"].map(value=><button key={value} role="tab" aria-selected={value===filter} onClick={()=>setFilter(value)}>{value}</button>)}</div></div><div className="iv-table-scroll"><table className="iv-table iv-activity-table"><thead><tr>{["Activity","Product","Date","Transaction","Status","Amount",""].map((label,i)=><th key={i}>{label}</th>)}</tr></thead><tbody>{transactions.map(t=><tr key={t.id}><td><Initials name={t.kind==="Withdrawals"?"↑":t.kind==="Payouts"?"$":t.kind==="Buys"?"+":"↓"} tone={t.kind==="Withdrawals"?"orange":t.kind==="Payouts"?"green":"blue"} />{t.title}</td><td>{t.product}</td><td>{t.date}</td><td><button className="iv-text-link" onClick={()=>demo.notify(`${t.reference}: ${t.title}. This is sample activity from the demo.`)}>{t.reference}</button></td><td><Tag tone={t.status==="Processing"?"amber":"green"}>{t.status}</Tag></td><td className={t.amount>0?"iv-green":""}>{t.amount>0?"+":"−"}{usd(Math.abs(t.amount))}</td><td><Link className="iv-button iv-small" href="/invest/support">Get help</Link></td></tr>)}</tbody></table></div>{transactions.length===0 && <p className="iv-empty">No {filter.toLowerCase()} yet.</p>}</Panel></InvestorShell>;
}

const answers=[
  ["How are my earnings calculated?","Each product shares its revenue in proportion to the shares held. Your earnings are the shareholder pool multiplied by your shares, divided by all shares sold."],
  ["Is there a lock period?","There is no lock period. Claim earnings or sell available product shares whenever you like."],
  ["How long do withdrawals take?","INFRA withdrawals normally arrive within a few seconds after approval. This preview simulates the process without transferring funds."],
];

export function InvestorSupport() {
  const demo=useDemo();
  const {tickets,setTickets}=demo;
  const [active,setActive]=useState("T-1042");
  const [message,setMessage]=useState("");
  const [openAnswer,setOpenAnswer]=useState<number|null>(null);
  const [newTicket,setNewTicket]=useState(false);
  const ticket=tickets.find(t=>t.id===active)!;
  function send(e:FormEvent) {
    e.preventDefault();if(!message.trim())return;
    setTickets(old=>old.map(t=>t.id===active?{...t,messages:[...t.messages,{author:"You",text:message.trim(),date:"Just now"}]}:t));setMessage("");
  }
  function create(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();const data=new FormData(e.currentTarget);const title=String(data.get("title")??"").trim(),text=String(data.get("message")??"").trim();if(!title||!text)return;
    const id=`T-${1043+tickets.length-2}`;
    setTickets(old=>[{id,category:String(data.get("category")),title,resolved:false,messages:[{author:"You",text,date:"Just now"}]},...old]);setActive(id);setNewTicket(false);demo.notify("Demo ticket created locally. No message was sent to the support team.");
  }
  return <InvestorShell page="support" title="Support" subtitle="Tickets, answers and help from the reSystem team"><div className="iv-support-layout"><aside><Panel className="iv-ticket-list"><div className="iv-panel-toolbar"><h2>Your tickets</h2><button className="iv-button iv-dark iv-small" onClick={()=>setNewTicket(true)}>New ticket</button></div>{tickets.map(t=><button key={t.id} className={`iv-ticket ${t.id===active?"iv-ticket-active":""}`} onClick={()=>{setActive(t.id);setMessage("");}}><span>{t.id}, {t.category}<Tag tone={t.resolved?"neutral":"blue"}>{t.resolved?"Resolved":"Open"}</Tag></span><strong>{t.title}</strong><p>{t.messages.at(-1)?.author}: {t.messages.at(-1)?.text}</p></button>)}</Panel><Panel className="iv-popular-answers" title="Popular answers">{answers.map(([question,answer],i)=><div key={question}><button aria-expanded={openAnswer===i} aria-controls={`answer-${i}`} onClick={()=>setOpenAnswer(openAnswer===i?null:i)}>{question}<span>{openAnswer===i?"−":"+"}</span></button>{openAnswer===i&&<p id={`answer-${i}`}>{answer}</p>}</div>)}</Panel></aside>
    <Panel className="iv-conversation"><div className="iv-conversation-heading"><div><p>{ticket.id}, {ticket.category}</p><h2>{ticket.title}</h2></div><Tag tone={ticket.resolved?"neutral":"blue"}>{ticket.resolved?"Resolved":"Open"}</Tag><button className="iv-button iv-small" onClick={()=>setTickets(old=>old.map(t=>t.id===active?{...t,resolved:!t.resolved}:t))}>{ticket.resolved?"Reopen ticket":"Mark as resolved"}</button></div><div className="iv-messages" aria-live="polite">{ticket.messages.map((m,i)=><div key={i} className={`iv-message ${m.author==="You"?"iv-message-you":""}`}><Initials name={m.author==="You"?"MK":"AS"} /><div><p>{m.text}</p><small>{m.author==="You"?"You":"Aisha, reSystem Support"}, {m.date}</small></div></div>)}</div><form className="iv-message-composer" onSubmit={send}><label className="sr-only" htmlFor="support-message">Message</label><textarea id="support-message" value={message} onChange={e=>setMessage(e.target.value)} aria-describedby="support-demo-note" disabled={ticket.resolved} placeholder={ticket.resolved?"Reopen this ticket to reply":""} rows={2} /><button className="iv-button iv-blue" disabled={!message.trim()||ticket.resolved}>Send</button></form><small id="support-demo-note" className="iv-support-demo">Demo messages stay in this preview and are not sent to support.</small></Panel></div>
    {newTicket&&<Modal title="New support ticket" onClose={()=>setNewTicket(false)}><form onSubmit={create} className="iv-ticket-form"><label>Category<select className="iv-input" name="category"><option>Payments</option><option>Shares</option><option>Account</option></select></label><label>Subject<input className="iv-input" name="title" required maxLength={120} /></label><label>Message<textarea className="iv-input" name="message" required rows={4} /></label><p className="iv-muted">This demo saves the ticket only in the current preview.</p><button className="iv-button iv-primary iv-full">Create demo ticket</button></form></Modal>}
  </InvestorShell>;
}
