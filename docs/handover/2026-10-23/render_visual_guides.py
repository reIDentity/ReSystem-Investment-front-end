"""Build screenshot-led admin/investor PDFs, with the complete text reference appended.

Usage: python render_visual_guides.py --output /absolute/output/pdf --fonts /DejaVu/font/folder
Requires reportlab, pypdf, Pillow and markdown-it-py. Source screenshots are genuine
captures. Crop rectangles and numbered annotations are applied in PDF only.
"""
from pathlib import Path
import argparse, json, html, io, re
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from pypdf import PdfReader, PdfWriter
import render_guides as reference
ROOT=Path(__file__).resolve().parent
W,H=landscape(A4); M=32; CW=W-2*M
BLUE=HexColor('#0091FF'); INK=HexColor('#081D2B'); MUTED=HexColor('#657890'); LIGHT=HexColor('#F4F6FA'); LINE=HexColor('#DEE6F0')

def para(c,text,x,top,width,size=10.2,color=INK,bold=False,maxheight=None):
 style=ParagraphStyle('p',fontName='BodyBold' if bold else 'Body',fontSize=size,leading=size*1.42,textColor=color)
 p=Paragraph(text,style);_,h=p.wrap(width,1000)
 if maxheight is not None and h>maxheight:raise ValueError(f'Text overflow: {text[:55]} {h}>{maxheight}')
 p.drawOn(c,x,top-h);return h

def screenshot(c,name,crop,box,points=[]):
 path=ROOT/'assets/screenshots'/name; iw,ih=Image.open(path).size
 sx,sy,sw,sh=crop; x,y,bw,bh=box
 if sx<0 or sy<0 or sx+sw>iw or sy+sh>ih:raise ValueError(f'Bad crop {name} {crop} vs {(iw,ih)}')
 scale=min(bw/sw,bh/sh); dw,dh=sw*scale,sh*scale; dx=x+(bw-dw)/2;dy=y+(bh-dh)/2
 c.setFillColor(white);c.setStrokeColor(LINE);c.roundRect(dx-1,dy-1,dw+2,dh+2,7,fill=1,stroke=1)
 c.saveState();p=c.beginPath();p.roundRect(dx,dy,dw,dh,6);c.clipPath(p,stroke=0)
 c.drawImage(str(path),dx-sx*scale,dy-(ih-sy-sh)*scale,width=iw*scale,height=ih*scale,mask='auto');c.restoreState()
 for n,pt in enumerate(points,1):
  px,py=pt[:2]; n=pt[2] if len(pt)>2 else n; assert sx<=px<=sx+sw and sy<=py<=sy+sh,(name,pt,crop)
  cx=dx+(px-sx)*scale;cy=dy+dh-(py-sy)*scale
  c.setFillColor(BLUE);c.setStrokeColor(white);c.setLineWidth(2);c.circle(cx,cy,10.5,fill=1,stroke=1)
  c.setFillColor(white);c.setFont('BodyBold',10);c.drawCentredString(cx,cy-3.4,str(n))

def footer(c,num,title):
 c.setStrokeColor(LINE);c.line(M,31,W-M,31);c.setFont('Body',7.2);c.setFillColor(MUTED)
 c.drawString(M,18,'23 October 2026  |  Version 1.1  |  INFRA UAT 15324');c.drawRightString(W-M,18,f'{title}  |  {num}')

def header(c,title):
 c.drawImage(str(ROOT/'assets/brand-mark.png'),M,H-35,width=31.8,height=15,mask='auto')
 c.setFillColor(INK);c.setFont('BodyBold',9);c.drawString(M+36,H-31,'System Investment')
 c.setFillColor(MUTED);c.setFont('Body',8);c.drawRightString(W-M,H-31,title)

def steps(c,page):
 side=page['layout']=='side'
 for j,s in enumerate(page['steps'],1):
  x=535 if side else M+(j-1)*(CW+18)/3
  top=460-(j-1)*107 if side else 165
  width=270 if side else (CW-36)/3
  c.setFillColor(BLUE);c.circle(x+9,top-9,9,fill=1,stroke=0);c.setFillColor(white);c.setFont('BodyBold',9);c.drawCentredString(x+9,top-12,str(j))
  h=para(c,html.escape(s['title']),x+26,top,width-26,10.8,bold=True,maxheight=32)
  para(c,html.escape(s['body']),x,top-h-12,width,10,maxheight=79 if side else 65)

def visual_pdf(key,g,out):
 buf=io.BytesIO();c=canvas.Canvas(buf,pagesize=(W,H));c.setTitle('reSystem Investment - '+g['title']);c.setAuthor('reSystem Investment')
 header(c,g['title']);c.bookmarkPage('cover');c.addOutlineEntry(g['title'],'cover')
 c.setFillColor(BLUE);c.roundRect(M,483,120,22,11,fill=1,stroke=0);c.setFont('BodyBold',8);c.setFillColor(white);c.drawCentredString(M+60,490,'VISUAL WALKTHROUGH')
 para(c,g['title'],M,460,370,32,bold=True);para(c,g['audience'],M,364,330,15,MUTED)
 para(c,'Follow real screens.<br/>Use the numbered steps.<br/>Check the result before continuing.',M,296,328,14)
 para(c,'<a href="'+g['url']+'" color="#0074CC">Open the application</a>',M,207,330,11)
 para(c,'Client UAT edition | Version 1.1<br/>Screens captured 23 October 2026',M,163,330,10,MUTED)
 screenshot(c,g['cover_image'],g['cover_crop'],(410,140,400,350))
 para(c,'The screens contain dated test-account values. Always use your own live account, addresses and current review. This guide does not authorize a transaction.',M,93,CW,10,MUTED,maxheight=35)
 footer(c,1,g['title']);c.showPage()
 header(c,g['title']);c.bookmarkPage('contents');c.addOutlineEntry('Visual contents','contents')
 para(c,'Choose the task you want to do',M,H-62,CW,25,bold=True)
 pages=g['pages'];n=len(pages);half=(n+1)//2
 for j,p in enumerate(pages):
  col=j//half;row=j%half;x=M+col*(CW/2+8);top=H-120-row*43
  c.setFillColor(BLUE);c.setFont('BodyBold',10);c.drawString(x,top,f'{j+1:02d}')
  para(c,html.escape(p['title']),x+30,top+9,CW/2-65,10.5,maxheight=31)
  c.setFillColor(MUTED);c.setFont('Body',9);c.drawRightString(x+CW/2-18,top,str(j+3))
  c.linkRect('',f'task-{j}',(x,top-21,x+CW/2-15,top+15),relative=0,thickness=0)
 para(c,'Then use the detailed reference for permissions, exceptions, recovery and troubleshooting.',M,85,CW,11)
 c.linkRect('','reference',(M,54,W-M,88),relative=0,thickness=0)
 footer(c,2,g['title']);c.showPage()
 for j,p in enumerate(pages):
  header(c,g['title']);c.bookmarkPage(f'task-{j}');c.addOutlineEntry(f'{j+1:02d}. '+p['title'],f'task-{j}')
  para(c,f'{j+1:02d}  '+html.escape(p['title']),M,H-58,CW,22,bold=True,maxheight=33)
  para(c,'OPEN  '+html.escape(p['route']),M,H-96,CW,9,MUTED,maxheight=15)
  side=p['layout']=='side'
  box=(M,98,470,370) if side else (M,196,CW,278)
  if p.get('panels'):
   for panel in p['panels']: screenshot(c,p['image'],panel['crop'],panel['box'],panel['points'])
  else: screenshot(c,p['image'],p['crop'],box,p['points'])
  steps(c,p)
  c.setFillColor(LIGHT);c.roundRect(M,43,CW,43,6,fill=1,stroke=0)
  para(c,'<b>Remember:</b> '+html.escape(p['note']),M+10,77,CW-20,9,maxheight=32)
  c.setFont('Body',6.6);c.setFillColor(MUTED);c.drawString(M,90,'Actual application screenshot | '+p['captured']+' | Cropped and annotated for clarity')
  footer(c,j+3,g['title']);c.showPage()
 c.bookmarkPage('reference');c.addOutlineEntry('Detailed reference','reference')
 header(c,g['title']);para(c,'Detailed reference',M,460,CW,32,bold=True)
 para(c,'Use the following pages when you need more detail about a rule, permission, exception or troubleshooting step.',M,385,620,17,MUTED)
 para(c,'The visual walkthrough is the quick route. This reference explains why each step matters and how to handle a delayed or unsuccessful result.',M,278,620,13)
 footer(c,n+3,g['title']);c.showPage();c.save();return buf.getvalue()

def build(key,g,args):
 out=args.output;out.mkdir(parents=True,exist_ok=True);tmp=out/'visual-build';tmp.mkdir(exist_ok=True)
 source=(ROOT/(key+'.md')).read_text();source=re.sub(r'<!-- VISUAL WALKTHROUGH START -->.*?<!-- VISUAL WALKTHROUGH END -->','',source,flags=re.S).replace('## Detailed reference\nThe following sections explain the rules, exceptions and troubleshooting behind the visual walkthrough.\n','')
 md=tmp/(key+'.md');md.write_text(source)
 ref=tmp/(key+'-reference.pdf')
 reference.render(md,ref,g['title'],'Detailed operating reference',['Understand','Review','Approve','Track'])
 vis=visual_pdf(key,g,out);(tmp/(key+'-visual.pdf')).write_bytes(vis)
 vr=PdfReader(io.BytesIO(vis));rr=PdfReader(ref);writer=PdfWriter();writer.append(vr,import_outline=True)
 start=len(vr.pages);writer.append(rr,pages=(2,len(rr.pages)),import_outline=True)
 # Replace reference footer with continuous final-page numbering and current edition.
 for idx in range(start,len(writer.pages)):
  page=writer.pages[idx];pw=float(page.mediabox.width);ph=float(page.mediabox.height)
  overlay=io.BytesIO();cc=canvas.Canvas(overlay,pagesize=(pw,ph));cc.setFillColor(white);cc.rect(0,0,pw,34,fill=1,stroke=0)
  cc.setFont('Body',7);cc.setFillColor(MUTED);cc.drawString(45,23,'23 October 2026 | Version 1.1 | Detailed reference | INFRA UAT');cc.drawRightString(pw-45,23,str(idx+1));cc.save()
  page.merge_page(PdfReader(io.BytesIO(overlay.getvalue())).pages[0])
 writer.add_metadata({'/Title':'reSystem Investment - '+g['title'],'/Author':'reSystem Investment','/Subject':'Screenshot walkthrough and detailed reference - CLIENT-UAT-2026-10-23','/Keywords':'visual guide, screenshots, UAT, reSystem'})
 dest=out/('reSystem_'+key+'.pdf');writer.write(dest)
 print(json.dumps({'guide':key,'pages':len(writer.pages),'visual_tasks':len(g['pages']),'bytes':dest.stat().st_size,'path':str(dest)}))

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);parser.add_argument('--fonts',type=Path,required=True);args=parser.parse_args()
 for name,file in [('Body','DejaVuSans.ttf'),('BodyBold','DejaVuSans-Bold.ttf'),('BodyItalic','DejaVuSans-Oblique.ttf'),('Mono','DejaVuSansMono.ttf')]:pdfmetrics.registerFont(TTFont(name,str(args.fonts/file)))
 pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyBold',italic='BodyItalic',boldItalic='BodyBold')
 for key,g in json.loads((ROOT/'visual_walkthroughs.json').read_text())['guides'].items():build(key,g,args)
