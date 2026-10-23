"""Render the three Markdown guides to branded PDFs. Requires reportlab and markdown-it-py.

Usage: python render_guides.py --output /absolute/output/pdf --fonts /folder/with/DejaVu-fonts
Outputs are generated documents, not screenshots of the applications.
"""
from pathlib import Path
import argparse
import html
import re
from markdown_it import MarkdownIt
from reportlab.pdfgen import canvas
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                               PageBreak, Table, TableStyle, KeepTogether, Flowable, Image)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT=Path(__file__).resolve().parent
BLUE=HexColor('#0091FF'); INK=HexColor('#081D2B'); MUTED=HexColor('#687C97')
LIGHT=HexColor('#F4F6FA'); LINE=HexColor('#E1E7EF')
W,H=A4; M=45; CW=W-2*M
MD=MarkdownIt('commonmark').enable('table')

def norm(s):
    return s.replace('\u2011','-').replace('\u2013','-').replace('\u2014',' - ').replace('\u00a0',' ')

def inline(tokens):
    out=[]
    for t in tokens or []:
        if t.type=='text':
            escaped=html.escape(norm(t.content))
            escaped=re.sub(r'https://[A-Za-z0-9./_-]+[A-Za-z0-9/]',lambda m:'<a color="#0074CC" href="'+m[0]+'">'+m[0]+'</a>',escaped)
            out.append(escaped)
        elif t.type=='code_inline': out.append('<font name="Mono" size="8.2">'+html.escape(norm(t.content))+'</font>')
        elif t.type=='strong_open': out.append('<b>')
        elif t.type=='strong_close': out.append('</b>')
        elif t.type=='em_open': out.append('<i>')
        elif t.type=='em_close': out.append('</i>')
        elif t.type=='link_open': out.append('<a color="#0074CC" href="'+html.escape(t.attrGet('href'),quote=True)+'">')
        elif t.type=='link_close': out.append('</a>')
        elif t.type in ('softbreak','hardbreak'): out.append(' ' if t.type=='softbreak' else '<br/>')
    return ''.join(out)

class Journey(Flowable):
    def __init__(self, labels): Flowable.__init__(self);self.labels=labels;self.width=CW;self.height=62
    def draw(self):
        c=self.canv;n=len(self.labels);gap=10;box=(CW-gap*(n-1))/n
        for i,label in enumerate(self.labels):
            x=i*(box+gap);c.setFillColor(LIGHT);c.roundRect(x,10,box,43,7,fill=1,stroke=0)
            c.setFillColor(BLUE);c.setFont('BodyBold',9);c.drawString(x+10,36,f'{i+1:02d}')
            c.setFillColor(INK);c.setFont('Body',8);c.drawString(x+10,21,label)
            if i<n-1:
                c.setStrokeColor(BLUE);c.line(x+box+2,31,x+box+8,31)

class GuideDoc(BaseDocTemplate):
    def __init__(self, filename, title, version="1.0", **kwargs):
        super().__init__(str(filename),pagesize=A4,leftMargin=M,rightMargin=M,
                         topMargin=70,bottomMargin=48,title='reSystem Investment - '+title,
                         author='reSystem Investment',**kwargs)
        self.guide_title=title;self.heading_count=0;self.version=version
        frame=Frame(M,48,CW,H-118,id='body',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
        self.addPageTemplates(PageTemplate(id='Guide',frames=[frame],onPage=self.decorate))
    def beforeDocument(self): self.heading_count=0
    def decorate(self,c,doc):
        c.saveState()
        if doc.page>1:
            c.drawImage(str(ROOT/'assets/brand-mark.png'),M,H-42,width=31.8,height=15,mask='auto')
            c.setFillColor(INK);c.setFont('BodyBold',9);c.drawString(M+36,H-38,'System Investment')
            c.setFillColor(MUTED);c.setFont('Body',8);c.drawRightString(W-M,H-38,self.guide_title)
            c.setStrokeColor(LINE);c.line(M,H-52,W-M,H-52)
        c.setStrokeColor(LINE);c.line(M,35,W-M,35)
        c.setFillColor(MUTED);c.setFont('Body',7)
        c.drawString(M,23,f'23 October 2026  |  Version {self.version}  |  INFRA UAT')
        c.drawRightString(W-M,23,str(doc.page))
        c.restoreState()
    def afterFlowable(self,f):
        if isinstance(f,Paragraph) and f.style.name=='H2':
            key='section-'+str(self.heading_count);self.heading_count+=1
            self.canv.bookmarkPage(key);text=f.getPlainText()
            self.canv.addOutlineEntry(text,key,0,False)
            self.notify('TOCEntry',(0,text,self.page,key))

def render(source,output,title,subtitle,labels,version="1.0"):
    styles={
        'body':ParagraphStyle('BodyText',fontName='Body',fontSize=9.5,leading=14.4,textColor=INK,spaceAfter=8,splitLongWords=True),
        'h2':ParagraphStyle('H2',fontName='BodyBold',fontSize=16,leading=21,textColor=INK,spaceBefore=18,spaceAfter=10,keepWithNext=True),
        'h3':ParagraphStyle('H3',fontName='BodyBold',fontSize=11,leading=16,textColor=BLUE,spaceBefore=11,spaceAfter=6,keepWithNext=True),
        'table':ParagraphStyle('Table',fontName='Body',fontSize=8.1,leading=12,textColor=INK,splitLongWords=True),
        'th':ParagraphStyle('TH',fontName='BodyBold',fontSize=8.1,leading=12,textColor=white,splitLongWords=True),
        'code':ParagraphStyle('Code',fontName='Mono',fontSize=7.5,leading=11,textColor=INK,splitLongWords=True),
        'list':ParagraphStyle('List',fontName='Body',fontSize=9.5,leading=14.4,textColor=INK,leftIndent=16,firstLineIndent=0,bulletIndent=0,spaceAfter=6),
    }
    story=[Spacer(1,45)]
    # Original accepted blue-arrow/RE brand asset plus textual lockup.
    brand=Table([[Image(str(ROOT/'assets/brand-mark.png'),width=63.6,height=30),Paragraph('<b>System Investment</b>',ParagraphStyle('CoverBrand',parent=styles['body'],fontSize=17,leading=24))]],colWidths=[68,CW-68]);brand.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0)]))
    story.append(brand);story.append(Spacer(1,56))
    story.append(Paragraph(title,ParagraphStyle('Cover',fontName='BodyBold',fontSize=35,leading=42,textColor=INK,spaceAfter=22)))
    story.append(Paragraph(subtitle,ParagraphStyle('Deck',fontName='Body',fontSize=15,leading=23,textColor=MUTED,spaceAfter=30)))
    story.append(Journey(labels));story.append(Spacer(1,28))
    story.append(Paragraph(f'<b>CLIENT-UAT-2026-10-23</b><br/>Version {version} | 23 October 2026',styles['body']))
    audience='Internal engineering handover. Includes API collection and operating runbooks.' if 'Developer' in title else 'A practical guide to the current UAT application. Use your own account and review each transaction.'
    story.append(Paragraph(audience,styles['body']))
    story.append(PageBreak())
    story.append(Paragraph('Contents',ParagraphStyle('Contents',parent=styles['h2'])))
    toc=TableOfContents();toc.levelStyles=[ParagraphStyle('TOC',fontName='Body',fontSize=9.5,leading=17,textColor=INK,leftIndent=0,firstLineIndent=0,spaceBefore=3)]
    story += [toc,Spacer(1,18),Paragraph('Use the section links or PDF bookmarks to navigate. Links in the guides open the actual application or supporting material.',styles['body']),PageBreak()]
    tokens=MD.parse(source.read_text());i=0;lists=[];skip_meta=True
    while i<len(tokens):
        t=tokens[i]
        if t.type=='heading_open':
            content=tokens[i+1]
            if t.tag=='h1': i+=3;continue
            if t.tag=='h2': skip_meta=False
            story.append(Paragraph(inline(content.children),styles['h2' if t.tag=='h2' else 'h3']));i+=3;continue
        if skip_meta: i+=1;continue
        if t.type in ('bullet_list_open','ordered_list_open'):
            lists.append({'type':t.type,'count':int(t.attrGet('start') or 1)});i+=1;continue
        if t.type in ('bullet_list_close','ordered_list_close'): lists.pop();story.append(Spacer(1,3));i+=1;continue
        if t.type=='paragraph_open':
            content=tokens[i+1];style=styles['list'] if lists else styles['body'];bullet=None
            if lists:
                bullet='•' if lists[-1]['type']=='bullet_list_open' else str(lists[-1]['count'])+'.'
                lists[-1]['count']+=1
            story.append(Paragraph(inline(content.children),style,bulletText=bullet));i+=3;continue
        if t.type=='fence':
            lines=norm(t.content).rstrip().splitlines()
            paras=[Paragraph(html.escape(line).replace(' ','&#160;') or '&#160;',styles['code']) for line in lines]
            box=Table([[p] for p in paras],colWidths=[CW-20]);box.setStyle(TableStyle([
                ('BACKGROUND',(0,0),(-1,-1),LIGHT),('LEFTPADDING',(0,0),(-1,-1),10),
                ('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),2)]))
            story += [box,Spacer(1,12)];i+=1;continue
        if t.type=='table_open':
            rows=[];row=[];head=False;j=i+1
            while tokens[j].type!='table_close':
                a=tokens[j]
                if a.type=='tr_open': row=[]
                if a.type in ('th_open','td_open'):
                    row.append(Paragraph(inline(tokens[j+1].children),styles['th' if a.type=='th_open' else 'table']))
                if a.type=='tr_close': rows.append(row)
                j+=1
            n=len(rows[0]);widths=([CW*.32,CW*.68] if n==2 else [CW*.28,CW*.35,CW*.37] if n==3 else [CW/n]*n)
            table=Table(rows,colWidths=widths,repeatRows=1,hAlign='LEFT',rowSplitRange=(min(3,len(rows)),len(rows)))
            table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),INK),('VALIGN',(0,0),(-1,-1),'TOP'),
                ('ROWBACKGROUNDS',(0,1),(-1,-1),[LIGHT,white]),('LEFTPADDING',(0,0),(-1,-1),9),
                ('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),
                ('BOTTOMPADDING',(0,0),(-1,-1),8),('LINEBELOW',(0,-1),(-1,-1),.5,LINE)]))
            story += [table,Spacer(1,12)];i=j+1;continue
        i+=1
    doc=GuideDoc(output,title,version=version);doc.multiBuild(story)
    print(output)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True,type=Path);parser.add_argument('--fonts',required=True,type=Path);args=parser.parse_args()
    for name,file in [('Body','DejaVuSans.ttf'),('BodyBold','DejaVuSans-Bold.ttf'),('BodyItalic','DejaVuSans-Oblique.ttf'),('Mono','DejaVuSansMono.ttf')]:
        pdfmetrics.registerFont(TTFont(name,str(args.fonts/file)))
    pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyBold',italic='BodyItalic',boldItalic='BodyBold')
    args.output.mkdir(parents=True,exist_ok=True)
    for stem,title,subtitle,labels in [
        ('DEVELOPER_HANDOVER','Developer handover','Architecture, API collection, local development, security and deployment.', ['Understand','Build & test','Operate','Handover']),
        ('ADMIN_GUIDE','Admin guide','Manage projects, revenue and staff with clear, accountable approvals.', ['Sign in','Prepare','Review & approve','Track']),
        ('INVESTOR_GUIDE','Investor guide','Connect your wallet, invest in fractions and manage your holdings.', ['Connect','Fund & explore','Review & approve','Track & manage']),
    ]: render(ROOT/(stem+'.md'),args.output/('reSystem_'+stem+'.pdf'),title,subtitle,labels)
