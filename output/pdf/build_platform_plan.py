"""Build the client-facing reSystem platform plan. No credentials or real wallet data."""
from pathlib import Path
from math import pi, cos, sin
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT, TA_CENTER

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
OUT.mkdir(parents=True, exist_ok=True)
PDF = OUT / 'reSystem-Investment-Platform-Plan.pdf'
FONTS = Path('/System/Library/Fonts/Supplemental')
for name, filename in [('Body','Arial.ttf'),('Bold','Arial Bold.ttf'),('Italic','Arial Italic.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONTS/filename)))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='Bold', italic='Italic', boldItalic='Bold')
pdfmetrics.registerFontFamily('Bold', normal='Bold', bold='Bold', italic='Bold', boldItalic='Bold')
W,H=595.276,841.890
M=42
CW=W-2*M
BLUE=colors.HexColor('#0091ff')
NAVY=colors.HexColor('#061d30')
INK=colors.HexColor('#18354a')
MUTED=colors.HexColor('#60798d')
PALE=colors.HexColor('#eaf5ff')
PAPER=colors.HexColor('#f5f8fb')
LINE=colors.HexColor('#dce6ee')
WHITE=colors.white
c=canvas.Canvas(str(PDF),pagesize=(W,H))
c.setTitle('reSystem Investment | Platform blueprint')
c.setAuthor('reSystem')
c.setSubject('Client platform plan: INFRA-only fractional project ownership')
page_no=0

def para(text,x,y,w,size=10,leading=None,color=INK,bold=False,align=TA_LEFT):
    """Draw a paragraph using a top coordinate. Return bottom coordinate."""
    style=ParagraphStyle('p',fontName='Bold' if bold else 'Body',fontSize=size,
        leading=leading or size*1.42,textColor=color,alignment=align,
        spaceBefore=0,spaceAfter=0,allowWidows=0,allowOrphans=0)
    p=Paragraph(text,style)
    _,ht=p.wrap(w,H)
    p.drawOn(c,x,H-y-ht)
    return y+ht

def rect(x,y,w,h,fill=PALE,r=12,stroke=None):
    c.setFillColor(fill)
    if stroke: c.setStrokeColor(stroke)
    else: c.setStrokeColor(fill)
    c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=bool(stroke))

def line(x1,y1,x2,y2,color=LINE,width=1):
    c.setStrokeColor(color); c.setLineWidth(width)
    c.line(x1,H-y1,x2,H-y2)

def pill(text,x,y,w,fill=PALE,color=BLUE):
    rect(x,y,w,23,fill,11)
    para(text,x+7,y+5,w-14,8,11,color,True,TA_CENTER)

def arrow(x1,y1,x2,y2,color=BLUE,width=1.6):
    line(x1,y1,x2,y2,color,width)
    dx,dy=x2-x1,y2-y1
    mag=(dx*dx+dy*dy)**.5
    ux,uy=dx/mag,dy/mag
    for direction in [-1,1]:
        line(x2,y2,x2-7*ux+direction*3.4*uy,y2-7*uy-direction*3.4*ux,color,width)

def note(text,y,fill=PALE,color=INK):
    style=ParagraphStyle('note',fontName='Body',fontSize=9.4,leading=13.4,textColor=color)
    p=Paragraph(text,style); _,ht=p.wrap(CW-28,H)
    rect(M,y,CW,ht+25,fill,10)
    p.drawOn(c,M+14,H-y-12-ht)
    return y+ht+25

def section(title,y):
    return para(title,M,y,CW,13.2,18,NAVY,True)+10

def bullet(text,y,x=M,w=CW,size=10):
    c.setFillColor(BLUE);c.circle(x+3,H-y-6,2.1,fill=1,stroke=0)
    return para(text,x+14,y,w-14,size,size*1.4)+9

def table(headers,rows,widths,y,size=9.0):
    ps=ParagraphStyle('cell',fontName='Body',fontSize=size,leading=size*1.36,textColor=INK)
    ph=ParagraphStyle('head',fontName='Bold',fontSize=size,leading=size*1.3,textColor=WHITE)
    data=[[Paragraph(str(t),ph) for t in headers]]
    for row in rows:
        data.append([Paragraph(str(t),ps) for t in row])
    t=Table(data,colWidths=widths,hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),NAVY),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[WHITE,PAPER]),
        ('VALIGN',(0,0),(-1,-1),'TOP'),
        ('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),
        ('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9),
        ('LINEBELOW',(0,0),(-1,0),0.4,NAVY),
        ('LINEBELOW',(0,1),(-1,-1),0.4,LINE),
    ]))
    _,ht=t.wrap(CW,H)
    t.drawOn(c,M,H-y-ht)
    if y+ht>777: raise ValueError(f'Table overflow page {page_no}: {y+ht}')
    return y+ht

def card(title,text,x,y,w,h,fill=PALE):
    rect(x,y,w,h,fill,12)
    end=para(title,x+15,y+14,w-30,11.4,15,NAVY,True)
    end=para(text,x+15,end+8,w-30,9.5,13.5)
    if end>y+h-8: raise ValueError(f'Card overflow page {page_no}: {title}')

def newpage(chapter,title,deck):
    global page_no
    page_no+=1
    c.setFillColor(WHITE);c.rect(0,0,W,H,fill=1,stroke=0)
    para('reSystem Investment',M,24,CW,9,12,NAVY,True)
    para(chapter.upper(),M,65,CW,8.7,12,BLUE,True)
    y=para(title,M,88,CW,25,29,NAVY,True)
    y=para(deck,M,y+10,CW,10.5,15.3,MUTED)
    line(M,794,W-M,794)
    para('PLATFORM BLUEPRINT  /  16 OCTOBER 2026  /  V1.1',M,805,CW-45,7.1,9,MUTED)
    para(f'{page_no:02}',W-M-25,803,25,9,12,BLUE,True,TA_CENTER)
    return y+25

def finish(): c.showPage()

def boxlabel(title,subtitle,x,y,w,h,fill=PALE):
    rect(x,y,w,h,fill,12)
    para(title,x+10,y+13,w-20,10,14,NAVY,True,TA_CENTER)
    if subtitle: para(subtitle,x+10,y+35,w-20,8.3,11.5,MUTED,False,TA_CENTER)

def coin(x,y,scale=1):
    c.setFillColor(PALE);c.setStrokeColor(BLUE);c.setLineWidth(1.5)
    c.circle(x,H-y,18*scale,fill=1,stroke=1)
    para('F',x-12*scale,y-12*scale,24*scale,19*scale,24*scale,BLUE,True,TA_CENTER)

# 01 / Cover - purpose-made vector illustration
page_no=1
c.setFillColor(NAVY);c.rect(0,0,W,H,fill=1,stroke=0)
pill('INFRA ONLY',M,38,94,BLUE,WHITE)
para('reSystem\nInvestment'.replace('\n','<br/>'),M,105,CW,42,46,WHITE,True)
para('The platform blueprint',M,224,CW,21,28,colors.HexColor('#7dccff'))
para('Fractional ownership. Transferable rights.<br/>Revenue funded and claimed on-chain.',M,272,CW,13,19,WHITE)
rect(M,365,CW,275,colors.HexColor('#102e44'),20)
# Building silhouette: 100 visible ownership squares
bx,by=70,395
for col in range(10):
    for row in range(10):
        f=BLUE if col==0 else colors.HexColor('#24465e')
        rect(bx+col*16,by+row*16,11,11,f,2)
para('ONE PROJECT',bx,570,170,8.3,12,colors.HexColor('#9bb8cd'),True)
para('Many transferable fractions',bx,589,190,12,17,WHITE,True)
arrow(255,478,308,478,colors.HexColor('#7dccff'),2)
rect(329,409,174,138,WHITE,16)
coin(360,445,0.9)
para('Ownership token',348,477,136,10,14,NAVY,True)
para('ERC-1155 quantity<br/>in the investor wallet',348,499,136,9,13,MUTED)
para('Buy  /  Transfer  /  Resell  /  Claim',319,570,195,10.5,15,colors.HexColor('#7dccff'),True,TA_CENTER)
para('Client planning document',M,682,CW,11,15,WHITE,True)
para('16 October 2026  |  Version 1.1<br/>Business rules, system design, delivery phases and acceptance criteria.',M,708,CW,9.5,14,colors.HexColor('#9bb8cd'))
para('Proposed architecture. Illustrations use examples, not investment performance.',M,789,CW,7.5,11,colors.HexColor('#9bb8cd'))
finish()

# 02 / rules
y=newpage('01 / Business model','What the platform does','A single INFRA platform for publishing projects, buying fractions, transferring ownership, reselling and claiming funded revenue.')
y=table(['Area','Agreed rule'],[
('Project publication','Images, documents, project value, fraction count and manual indicative yield.'),
('Payment','Accept reAED or USDT directly. Fixed internal pricing: 1 USDT = 3.6 reAED.'),
('Ownership','Each project has a separate contract. Whole ERC-1155 units represent fractions.'),
('Participation','Any INFRA wallet may receive or trade fractions. Investor connection in the app uses reID.'),
('Transfers and resale','Transfer any whole quantity. Marketplace supports partial fills in the first release.'),
('Revenue','Only sold fractions share a funded allocation. Previously allocated rewards stay with the previous holder.'),
('Administration','Username/password account, role permission and an authorized signing wallet.'),
('Infrastructure','Separate repositories and deployments for each frontend, backend, contracts and indexer.'),
], [118,CW-118],y,9.2)
y=note('<b>The fixed rate is a protocol pricing rule.</b> It is not an automatic asset swap or a guarantee of external redemption.',y+20)
y=section('The first release must keep these actions distinct',y+23)
para('Buy fractions invests principal. Fund revenue creates claimable rewards. Sell fractions finds another buyer. Collect proceeds receives resale funds. Send wallet funds transfers assets to another INFRA address.',M,y,CW,10,14.5)
finish()

# 03 / chart
y=newpage('02 / Fraction economics','One project, two percentages','Project ownership and participation in the next revenue allocation use different denominators.')
rows=[('Total project value','100,000 USDT / 360,000 reAED'),('Maximum fractions','10,000'),('Price per fraction','10 USDT / 36 reAED'),('Fractions sold','2,000'),('Investor holding','1,000')]
y=table(['Illustrative setting','Value'],rows,[205,CW-205],y,9.5)
chart_y=y+26
card('Project ownership','1,000 held / 10,000 maximum',M,chart_y,245,181)
card('Next revenue allocation','1,000 held / 2,000 sold',M+265,chart_y,CW-265,181)
for cx,pct in [(M+122.5,10),(M+265+(CW-265)/2,50)]:
    cy=chart_y+117
    c.setStrokeColor(colors.HexColor('#cfe6f8'));c.setLineWidth(13);c.circle(cx,H-cy,36,fill=0,stroke=1)
    p=c.beginPath()
    n=round(pct*2)
    for i in range(n+1):
        a=pi/2-i*(2*pi*pct/100)/n
        px=cx+36*cos(a);py=H-cy+36*sin(a)
        if i==0:p.moveTo(px,py)
        else:p.lineTo(px,py)
    c.setStrokeColor(BLUE);c.drawPath(p,stroke=1)
    para(f'{pct}%',cx-35,cy-14,70,22,28,NAVY,True,TA_CENTER)
y=chart_y+201
y=note('<b>Why this matters:</b> when more fractions sell, an existing investor keeps the same project ownership percentage. Their share of future revenue allocations changes as the sold-fraction denominator grows.',y)
para('Publishing validates exact unit pricing. Maximum supply and initial economic terms become fixed when published. Token rights and any off-chain project obligations must be defined in the project documents.',M,y+20,CW,9.8,14)
para('Illustrative arithmetic only. These charts are not forecasts or yield estimates.',M,755,CW,8.2,12,MUTED)
finish()

# 04 / journey
y=newpage('03 / Investor journey','From project discovery to ownership','The wallet approves financial actions. Successful contract execution is the source of truth.')
steps=[('01','Discover','Read published terms, value, supply, documents and indicative yield.'),('02','Connect reID','Confirm the actual INFRA wallet and signing permissions.'),('03','Choose fractions','Select a whole quantity and reAED or USDT. Read the exact quote.'),('04','Approve and buy','USDT may require token approval before the purchase transaction.'),('05','Receive ownership','Payment and fraction minting complete atomically or revert together.')]
for n,title,body in steps:
    rect(M,y,43,43,BLUE,12);para(n,M+3,y+10,37,15,20,WHITE,True,TA_CENTER)
    para(title,M+60,y+2,CW-60,12,16,NAVY,True)
    end=para(body,M+60,y+24,CW-60,10,14)
    y=max(y+43,end)+17
y=note('<b>Contract checks:</b> valid quantity, remaining supply, verified payment asset, exact amount received, current terms and successful receiver handling. Sale proceeds are kept separate from reward reserves.',y+5)
y=section('Honest transaction status',y+22)
status=['Awaiting\napproval','Broadcast','Confirmed','Indexed']
sw=(CW-30)/4
for i,s in enumerate(status):
    rect(M+i*(sw+10),y,sw,47,PALE,10)
    para(s.replace('\n','<br/>'),M+i*(sw+10)+5,y+10,sw-10,8.4,11.3,NAVY,True,TA_CENTER)
    if i<3:arrow(M+(i+1)*sw+i*10+2,y+24,M+(i+1)*(sw+10)-2,y+24)
para('A transaction hash alone is not success. Rejected, expired, failed and delayed-indexing states each need a clear recovery path.',M,y+62,CW,9.5,13.5,MUTED)
finish()

# 05 / reward semantics
y=newpage('04 / Revenue and claims','Earlier rewards stay with the holder','Allocation occurs at the revenue funding transaction. Future allocations follow the latest fraction balances.')
# panels
py=y
card('1. Owner funds the pool','A real reAED or USDT deposit is allocated to the sold fractions at that transaction.',M,py,CW,86)
py+=106
card('Before transfer','Alice owns 1,000 fractions. Her existing reward entitlement is recorded.',M,py,240,112)
card('Transfer 10 fractions','Alice sends 10 whole units to Bob. The transfer settles historical entitlement first.',M+265,py,CW-265,112)
arrow(M+243,py+56,M+261,py+56)
py+=134
card('After transfer: Alice','990 fractions earn future allocations.<br/><b>All of Alice\'s earlier allocated rewards remain hers.</b>',M,py,240,119)
card('After transfer: Bob','10 fractions earn future allocations.<br/><b>Bob does not receive Alice\'s earlier rewards.</b>',M+265,py,CW-265,119)
y=py+140
y=bullet('Claims pay the same asset that funded the allocation: reAED or USDT.',y)
y=bullet('A holder can claim earlier rewards after selling or transferring every fraction.',y)
y=bullet('New purchases never inherit historical allocations. Unsold fractions earn nothing.',y)
y=note('<b>Manual yield is descriptive.</b> The owner enters an indicative yield, period and effective date. That number creates no claimable funds; only actual funded allocations do.',y+5)
para('Accounting uses high-precision cumulative rewards per fraction, asset-specific balances and explicit rounding reserves. Deposits do not loop through all holders. Funding is rejected if no fractions have sold.',M,y+18,CW,9.5,13.6)
finish()

# 06 / marketplace
y=newpage('05 / Resale marketplace','Sell a portion, keep the rest','One shared on-chain marketplace supports registered projects and partial fills in the first release.')
rect(M,y,CW,128,PALE,14)
para('SELLER LISTS',M+18,y+16,180,8,12,BLUE,True)
para('1,000 fractions',M+18,y+39,220,21,27,NAVY,True)
para('Unit price + payment asset + expiry',M+18,y+77,240,9.5,14,MUTED)
arrow(M+278,y+63,M+322,y+63)
para('Buyer purchases',M+345,y+26,140,10,14,MUTED)
para('10 fractions',M+345,y+48,140,18,24,NAVY,True)
para('990 remain listed',M+345,y+83,140,10,14,BLUE,True)
y+=152
y=table(['Step','Required behavior'],[
('Create listing','Seller selects project, quantity, unit price, settlement asset and expiry, then grants approval.'),
('Keep ownership','Fractions stay in the seller wallet until filled. The seller earns allocations while holding them.'),
('Validate fill','Check listing, expiry, quantity, balance, approval, price, asset and registered project.'),
('Settle atomically','Collect buyer payment and transfer fractions together, or revert the complete trade.'),
('Collect proceeds','Credit a separate on-chain seller proceeds balance. Seller withdraws these funds.'),
('Cancel or invalidate','Seller can cancel. Missing balance, revoked approval or expiry makes a listing unavailable.'),
],[117,CW-117],y,9.2)
y=note('<b>No guaranteed buyer or buyback.</b> A listing does not promise an instant sale or recovery of the original investment. Proposed launch marketplace fee: zero.',y+20)
para('A seller\'s historical project rewards are separate from resale proceeds. The UI must show each balance and collection action clearly.',M,y+18,CW,9.8,14)
finish()

# 07 / architecture
y=newpage('06 / System architecture','Blockchain settles. Services organize.','Economic rights and asset movements live on INFRA. Off-chain services make the platform searchable, manageable and reliable.')
ay=y
boxlabel('Investor app','Vercel / reID connection',M,ay,245,65)
boxlabel('Admin app','FP server / Teleport access',M+265,ay,CW-265,65)
arrow(M+122,ay+67,M+122,ay+97);arrow(M+388,ay+67,M+388,ay+97)
boxlabel('NestJS backend API','FP server / REST + OpenAPI / identity, roles, drafts, quotes and transactions',M,ay+100,CW,69)
arrow(M+255,ay+171,M+255,ay+201)
rect(M,ay+204,CW,199,NAVY,14)
para('INFRA BLOCKCHAIN / CURRENT TESTNET',M+15,ay+218,CW-30,8,12,colors.HexColor('#7dccff'),True)
boxlabel('Master factory','Creates project contracts',M+15,ay+244,155,61)
boxlabel('Marketplace','Listings + partial fills',M+185,ay+244,155,61)
boxlabel('Claim router','Bounded multi-project claims',M+355,ay+244,CW-370,61)
for i,label in enumerate(['Project A','Project B','Project C']):
    bx=M+15+i*170
    boxlabel(label,'Fractions + sale + revenue',bx,ay+329,155 if i<2 else CW-370,56,WHITE)
line(M+93,ay+307,M+93,ay+317,colors.HexColor('#7dccff'),1.2)
line(M+93,ay+317,M+433,ay+317,colors.HexColor('#7dccff'),1.2)
for px in [M+93,M+263,M+433]:
    arrow(px,ay+317,px,ay+326,colors.HexColor('#7dccff'),1.2)
arrow(M+123,ay+405,M+123,ay+433)
arrow(M+388,ay+405,M+388,ay+433)
boxlabel('Indexer + PostgreSQL','FP server / confirmed event projections',M,ay+437,245,65)
boxlabel('IPFS / Pinata','Public media + metadata CIDs',M+265,ay+437,CW-265,65)
y=ay+524
para('<b>Trust boundary:</b> the database cannot create ownership or rewards. Contract balances, funded allocations and confirmed receipts remain authoritative. Indexer projections are rebuildable.',M,y,CW,10,14.2)
para('<b>Target hosting, not a deployment claim.</b> FP services use Teleport for server access. Project documents define off-chain rights; contracts cannot prove that all external revenue was deposited.',M,y+57,CW,9.5,13.5,MUTED)
finish()

# 08 / contract functions
y=newpage('07 / Contract inventory','The on-chain function map','Proposed interfaces. Final ABIs follow the detailed specification and INFRA compatibility checks.')
y=table(['Contract / area','Functions and responsibilities'],[
('Master factory','createProject; getProject; isRegisteredProject; implementation version registry; authorized creation; pauseCreation.'),
('Project configuration','Read value, maximum fractions, sold fractions, owner, treasury, prices, metadata URI and sale state.'),
('Primary sale','quotePurchase; buyWithReAED; buyWithUSDT; openSale; closeSale; withdrawSaleProceeds.'),
('ERC-1155 ownership','balanceOf; safeTransferFrom; safeBatchTransferFrom; setApprovalForAll. Reward settlement on balance changes.'),
('Revenue pool','depositRevenueReAED; depositRevenueUSDT; claimable; claim; claimBoth; claimFor with fixed entitled recipient.'),
('Project presentation','setIndicativeYield; metadata revisions; freezeMetadata. Record version and effective date.'),
('Marketplace','createListing; cancelListing; getListing; quoteFill; fillWithReAED; fillWithUSDT; withdrawProceeds.'),
('Claim router','Bounded claims across registered projects. Each payment goes to the entitled wallet.'),
('Access and recovery','Explicit roles; two-step ownership transfer; scoped pause controls; no reward-reserve withdrawal or unlimited mint.'),
], [127,CW-127],y,8.9)
y=note('<b>Recommended deployment model:</b> ERC-1167 clones with fixed implementation versions. Every project receives a separate address. New versions serve new projects; existing projects do not change silently.',y+20)
para('<b>Event coverage:</b> project creation, purchases, ownership transfers, sale changes, revenue funding, claims, yield and metadata changes, listings, fills, cancellations, proceeds withdrawals and role changes.',M,y+18,CW,9.5,13.5)
finish()

# 09 / admin
y=newpage('08 / Admin application','Controlled operations, visible accountability','Application authorization and blockchain signing authority are independent requirements.')
rect(M,y,CW,58,PALE,12)
para('Account session  +  Required permission  +  Authorized wallet',M+12,y+18,CW-24,11,16,NAVY,True,TA_CENTER)
y+=80
y=table(['Role','Primary permissions'],[
('Super admin','Staff, roles and platform configuration.'),
('Project manager','Draft content, media, review and publication workflow.'),
('Project owner','Assigned projects, indicative yield and authorized project operations.'),
('Finance preparer','Prepare revenue funding and treasury requests.'),
('Finance approver','Approve and sign permitted finance actions.'),
('Support','Ticket handling and limited investor context.'),
('Auditor','Read-only records, transactions and reports.'),
('Operator','Indexer health, recovery and backfills.'),
],[126,CW-126],y,9.3)
y=section('Admin modules',y+23)
y=para('Dashboard and alerts; project creation wizard; preview and publication; documents and metadata; holders and primary sales; revenue and claims; resale listings and proceeds; investor records; staff and wallet bindings; support inbox; audit logs; chain health.',M,y,CW,10,14.5)+19
y=note('Username/password uses Argon2id, secure sessions, rate limiting and privileged-user MFA. MetaMask or reID supplies the signing wallet. Connecting a wallet does not create an admin role.',y)
para('Treasury and contract administration should use an INFRA-compatible multisignature arrangement after compatibility verification.',M,y+17,CW,9.5,13.5,MUTED)
finish()

# 10 / repos
y=newpage('09 / Repositories and technology','Five independent codebases','Each repository has its own CI, release process and deployment. Shared interfaces are versioned artifacts.')
y=table(['Repository','Technology / responsibility','Target hosting'],[
('Investor frontend<br/><b>Existing investment repo</b>','Next.js, React, TypeScript; public site and investor app.','Vercel'),
('Admin frontend','Independent Next.js app; staff operations and signing.','FP server'),
('Backend','NestJS / TypeScript, PostgreSQL, Prisma; auth, workflows, APIs and reports.','FP server'),
('Smart contracts','Solidity, OpenZeppelin, Foundry; factory, projects, marketplace, tests, deployment manifests and ABIs.','INFRA; current integration is testnet'),
('Standalone indexer','TypeScript and viem; ingestion, confirmations, reconciliation and backfills.','FP server'),
],[123,270,CW-393],y,9.0)
y=section('Supporting tools',y+24)
y=bullet('<b>viem:</b> reads, calldata, transaction simulation and receipts.',y)
y=bullet('<b>reID SDK:</b> investor connection and transaction approval. <b>MetaMask:</b> admin signing.',y)
y=bullet('<b>Pinata / IPFS:</b> public images, NFT metadata and published documents.',y)
y=bullet('<b>PostgreSQL + Redis / BullMQ workers:</b> FP server. <b>Docker:</b> service packaging.',y)
y=bullet('<b>GitHub Actions:</b> CI and releases. <b>Vitest / Playwright:</b> application checks.',y)
y=note('<b>Confirmed target:</b> the investor frontend uses Vercel. Admin, backend, database, worker and indexer services use the FP server, accessed through Teleport. New services are not claimed as deployed.',y+5)
y=para('<b>API choice:</b> REST / OpenAPI remains the default. GraphQL is optional and, if adopted, runs on the FP server. Use versioned generated clients and contract artifacts; avoid cross-repository relative imports.',M,y+16,CW,9.4,13.4)+12
para('Pin compiler, libraries and the EVM target after checking INFRA compatibility.',M,y,CW,9.4,13.4)
finish()

# 11 / backend reliability
y=newpage('10 / Backend and indexing','Live data with recoverable operations','Services support identity, workflow and search. They never substitute a database record for a confirmed blockchain action.')
y=table(['Backend module','Required functions'],[
('Identity and connections','reID callbacks; encrypted sessions and tokens; refresh rotation; scopes; reconnect and logout.'),
('Admin and authorization','Username/password, MFA, invites, recovery, roles, project scope, wallet binding and suspension.'),
('Projects','Draft, validate, media/documents, review, publish, revisions and archive.'),
('Transactions','Validated commands, quotes, simulation, gas checks, intents, approval status, receipts and idempotency.'),
('Read models','Portfolio, balances, ownership, activity, revenue, claims, listings, fills and proceeds.'),
('Operations','Tickets, notifications, audit, reconciliation, backfills and deployment registry.'),
],[128,CW-128],y,9)
y=section('Indexer guarantees',y+22)
cols=(CW-18)/2
card('Rebuildable history','Durable block cursors, deduplicated events, block hashes, reorganization recovery and ordered processing.',M,y,cols,112)
card('Operational clarity','Confirmation policy, retries, backfills, restart safety, reconciliation and visible indexing lag.',M+cols+18,y,cols,112)
y+=131
y=note('<b>reID work still required:</b> the existing sign-in uses read permissions. Production signing needs wallet:tx consent, encrypted connection storage, token rotation, approval links, polling and receipt tracking.',y)
para('The backend constructs transactions from validated commands. It checks chain, project, function, quantity, asset, recipient and price. It must not expose an unrestricted arbitrary-calldata signing endpoint.',M,y+16,CW,9.5,13.6)
para('Wallet deposits need native and ERC-20 activity ingestion. An incoming wallet transfer does not automatically create a purchase or a project revenue allocation. Use integer base units throughout.',M,y+75,CW,9.5,13.6,MUTED)
finish()

# 12 / UI
y=newpage('11 / Investor screens','Turn the existing UI into a live product','Keep the established branding and responsive layouts while replacing simulated state with verified records.')
y=table(['Screen','Production behavior'],[
('Homepage and explore','Published projects, real availability, search/filter and manually entered indicative yield.'),
('Project details','Value, unit prices, supply, documents, pool activity and purchases.'),
('Dashboard and portfolio','Actual holdings, ownership percentages, balances, claims and activity.'),
('Earnings','Funded allocations, per-asset history and real claim transactions.'),
('Wallet and deposit','Actual reAED, USDT and ERC-1155 balances; user address, QR and incoming transfers.'),
('Fraction transfer','Select project, recipient and whole quantity; review and approve.'),
('Marketplace','Browse, list, partially buy, cancel and collect seller proceeds.'),
('Withdraw / send','Send wallet assets to an INFRA address while reserving native gas.'),
('Activity','Purchases, transfers, fills, claims and wallet transactions with confirmation status.'),
('Support / notifications','Persistent tickets, replies, account events and read/unread state.'),
],[130,CW-130],y,9.1)
y=note('<b>Current baseline:</b> reID sign-in and the deposit receiving flow have real integrations. The broader investment UI is still a prototype. Balances, purchases, claims, resale and related activity need production contracts and services.',y+20)
para('Remove hard-coded prices, contradictory supplies, sample transactions, fake live activity and simulated credits. Bank transfer and card stay disabled with Coming soon treatment.',M,y+16,CW,9.5,13.5)
finish()

# 13 / delivery
y=newpage('12 / Delivery and acceptance','Build in dependency order','No deadline or budget is assumed. Each phase has an explicit completion gate.')
phases=[('1','Specify','Finalize economic rules, permissions, interfaces and transaction state machines.'),('2','Prove integrations','Verify INFRA, reID signing, MetaMask, USDT approval and ERC-1155 receipt.'),('3','Build contracts','Implement and test the factory, project, marketplace and claim router.'),('4','Build services','Persistent auth, API, indexer, reconciliation and generated clients.'),('5','Build admin','Project publication, roles, wallet signing and revenue funding.'),('6','Make investor UI live','Purchases, transfers, partial resale, claims, balances and activity.'),('7','Rehearse on UAT','Complete multi-wallet lifecycle, failures, indexing recovery and role checks.'),('8','Release','Security review, verified deployments, role setup, monitoring and configuration.')]
for n,title,body in phases:
    pill(n,M,y,28,BLUE,WHITE)
    para(title,M+43,y-1,CW-43,10.6,15,NAVY,True)
    end=para(body,M+43,y+18,CW-43,9.3,13.1)
    y=max(y+38,end)+12
y=section('Required release rehearsal',y+5)
para('Create project → publish → buy in both assets → buy more → transfer 10 fractions → partially resell → fund revenue → claim → fully exit → claim historical rewards.',M,y,CW,10.2,15,NAVY,True)
y=note('Contract verification combines unit, fuzz and invariant tests with static analysis. Application verification covers API authorization, real receipts, indexed state, mobile layouts and failure recovery.',y+51)
finish()

# 14 / safety + sources
y=newpage('13 / Final gates and references','What must be true before launch','These rules are acceptance criteria, not optional implementation details.')
for txt in [
    'Supply never exceeds the fixed maximum. Transfers and resale never create fractions.',
    'New buyers receive no old allocations; previous holders retain their settled rewards.',
    'Claims never exceed funded revenue; treasury actions cannot consume reward reserves.',
    'Partial fills cannot oversell. Failed payment or receiver handling reverts the complete trade.',
    'All financial actions require wallet authorization and the correct INFRA network.',
]: y=bullet(txt,y,size=9.6)
y=note('<b>Proposed defaults to confirm:</b> zero platform fees; allocation at the funding transaction; versioned fixed implementations; no guaranteed platform buyback. Revenue participation is not time-weighted across a reporting period.',y+3)
y=section('Deployment prerequisites',y+20)
y=para('Verify the intended INFRA environment, RPC behavior, USDT address and decimals, gas rules, finality policy, explorer support and multisignature compatibility. The current integration uses INFRA UAT chain ID 15324; do not assume that this is the final production configuration.',M,y,CW,9.5,13.5)+16
y=para('Development credentials are held in a dedicated private operational Notion page. Rotate them before production. This PDF contains no credential values, private keys, access tokens or real investor wallet data.',M,y,CW,9.5,13.5)+22
y=section('Technical references',y)
refs=[
('ERC-1155 ownership standard','https://eips.ethereum.org/EIPS/eip-1155'),
('ERC-1167 minimal proxy standard','https://eips.ethereum.org/EIPS/eip-1167'),
('OpenZeppelin ERC-1155 implementation','https://docs.openzeppelin.com/contracts/5.x/api/token/erc1155'),
('OpenZeppelin ERC-20 utilities','https://docs.openzeppelin.com/contracts/5.x/api/token/erc20'),
('Pinata upload documentation','https://docs.pinata.cloud/files/uploading-files'),
('viem contract simulation','https://viem.sh/docs/contract/simulateContract'),
('Foundry invariant testing','https://getfoundry.sh/forge/invariant-testing'),
('OWASP password storage guidance','https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html'),
]
for title,url in refs:
    y=para(f'<link href="{url}" color="#0077cc"><u>{title}</u></link>',M,y,CW,8.9,12)+6
para('Planning baseline: the agreed requirements and platform plan recorded on 16 October 2026. Detailed implementation and test evidence are tracked separately in the project task system.',M,752,CW,8,11,MUTED)
finish()
c.save()
print(f'Created {PDF} ({page_no} pages)')
