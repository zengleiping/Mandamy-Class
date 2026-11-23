# 找東西遊戲：把 Banana 生的圖切成單張（綠幕去背、保留白色物件如蛋／紙）
import os, sys
from PIL import Image
from cut_sheets import key, cell, finish
import numpy as np
from scipy import ndimage
def clean(rgba):
    m=rgba[...,3]>10; lab,n=ndimage.label(m,structure=np.ones((3,3)))
    if n<=1: return rgba
    sz=ndimage.sum(m,lab,range(1,n+1)); big=sz.max(); out=rgba.copy()
    for i,a in enumerate(sz,1):
        if a<0.12*big: out[lab==i,3]=0
    return out
IMG='/tmp/claude-0/-home-user/3e9eabbe-c13e-5268-9a7c-3ccb780bd9ba/images/'
OUT='../../games/find/'
sheets=[('36.webp',['cat','dog','mouse','pen','eraser','paper','book','money']),
        ('37.webp',['bread','egg','burger','sandwich','riceball','bun','cookie','noodle']),
        ('38.webp',['milk','juice','boba','coffee','apple','banana','watermelon','strawberry'])]
os.makedirs(OUT,exist_ok=True)
for fn,keys in sheets:
    img=Image.open(IMG+fn).convert('RGB')
    for i,k in enumerate(keys):
        finish(clean(key(cell(img,i%4,i//4,4,2))),size=192,pad=0.04).save(OUT+'o-%s.png'%k,optimize=True)
img=Image.open(IMG+'39.webp').convert('RGB')
for i,k in enumerate(['lens','hand','robot']):
    finish(clean(key(cell(img,i,0,3,1))),size=160,pad=0.04).save(OUT+'c-%s.png'%k,optimize=True)
p=Image.open(IMG+'40.webp').convert('RGB'); a=key(p); im=Image.fromarray(a,'RGBA'); im=im.crop(im.getchannel('A').point(lambda v:255 if v>10 else 0).getbbox()); im.thumbnail((640,640)); im.save(OUT+'party.png',optimize=True)
Image.open(IMG+'41.webp').convert('RGB').save(OUT+'wall.jpg',quality=82)
print(sorted(os.listdir(OUT)))
