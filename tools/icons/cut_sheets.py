import numpy as np, json, os, sys
from PIL import Image
IMG='/tmp/claude-0/-home-user/3e9eabbe-c13e-5268-9a7c-3ccb780bd9ba/images/'
sheets=json.load(open('sheets.json'))
def shift(m,dy,dx):
    o=np.zeros_like(m); H,W=m.shape
    ys=slice(max(dy,0),H+min(dy,0)); yd=slice(max(-dy,0),H+min(-dy,0)); xs=slice(max(dx,0),W+min(dx,0)); xd=slice(max(-dx,0),W+min(-dx,0))
    o[ys,xs]=m[yd,xd]; return o
def dil(m,n=1):
    for _ in range(n): m=shift(m,1,0)|shift(m,-1,0)|shift(m,0,1)|shift(m,0,-1)|m
    return m
def key(im):
    a=np.asarray(im.convert('RGB')).astype(np.int16); r,g,b=a[...,0],a[...,1],a[...,2]
    d=(g-np.maximum(r,b)).astype(np.float32)
    dbg=float(np.median(d[:6,:6].ravel().tolist()+d[-6:,-6:].ravel().tolist()))   # 背景綠的「超出量」（取角落）
    cand=d>0.55*dbg
    reg=cand                                       # 圖示裡沒有用亮綠色，所以整張圖的亮綠一律是背景（含鎖環、齒輪中間這種被圍住的洞）
    edge=dil(reg,2)&~reg                          # 背景邊緣 2px：半透明、去綠邊
    alpha=np.ones(d.shape,np.float32); alpha[reg]=0
    alpha[edge]=np.clip(1-d[edge]/dbg,0,1)
    out=a.copy(); gg=out[...,1]; out[...,1]=np.where(edge,np.minimum(gg,np.maximum(r,b)),gg)
    return np.dstack([out.clip(0,255),(alpha*255)]).astype(np.uint8)
def strip_white(rgba, thr=212):
    al=rgba[...,3]; opaque=al>=250
    white=(rgba[...,0]>thr)&(rgba[...,1]>thr)&(rgba[...,2]>thr)
    region=al<250
    for _ in range(80):
        nr=dil(region)&(white|(al<250))
        if (nr==region).all(): break
        region=nr
    out=rgba.copy(); out[region&white,3]=0
    for _ in range(2):                                 # 再削兩圈殘留的淺色邊
        t=(out[...,3]<10); nb=dil(t)&~t
        light=(out[...,0]>190)&(out[...,1]>190)&(out[...,2]>190)
        out[nb&light,3]=0
    return out
def cell(img,col,row,cols=3,rows=2):
    W,H=img.size; return img.crop((int(col*W/cols),int(row*H/rows),int((col+1)*W/cols),int((row+1)*H/rows)))
def finish(rgba, size=256, pad=0.07):
    im=Image.fromarray(rgba,'RGBA'); bb=im.getchannel('A').point(lambda v:255 if v>10 else 0).getbbox()
    im=im.crop(bb); w,h=im.size; s=max(w,h); sq=Image.new('RGBA',(s,s),(0,0,0,0)); sq.paste(im,((s-w)//2,(s-h)//2))
    inner=int(size*(1-2*pad)); sq=sq.resize((inner,inner),Image.LANCZOS); out=Image.new('RGBA',(size,size),(0,0,0,0)); out.paste(sq,((size-inner)//2,(size-inner)//2),sq); return out
if __name__=='__main__':
    files={1:'3.webp',2:'4.webp',3:'5.webp',4:'6.webp',5:'7.webp',6:'8.webp',7:'9.webp',8:'10.webp',9:'11.webp',10:'12.webp',11:'13.webp',12:'14.webp',13:'15.webp',14:'16.webp',15:'17.webp',16:'18.webp'}
    os.makedirs('cut',exist_ok=True); os.makedirs('cut_keep_white',exist_ok=True); n=0
    for sn,fn in files.items():
        img=Image.open(IMG+fn).convert('RGB'); keys=sheets[sn-1][3]
        for i,k in enumerate(keys):
            c=cell(img,i%3,i//3); rgba=key(c)
            pre='act' if sn>=14 else 'ui'; finish(strip_white(rgba)).save(f'cut/{pre}-{k}.png'); finish(rgba).save(f'cut_keep_white/{pre}-{k}.png'); n+=1
    print(n,'icons')
