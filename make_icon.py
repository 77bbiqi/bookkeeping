# -*- coding: utf-8 -*-
"""生成 77 记账喽 的 App 图标：粉紫渐变圆角底 + 白色爱心 + 77宝"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

S = 1024

def vgrad(w, h, c1, c2):
    top = Image.new("RGBA", (1, h))
    for y in range(h):
        t = y / max(h - 1, 1)
        px = tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3)) + (255,)
        top.putpixel((0, y), px)
    return top.resize((w, h))

def heart_points(cx, cy, scale, n=260):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * scale, cy - y * scale))
    return pts

# 1. 背景渐变 + 圆角遮罩
grad = vgrad(S, S, (255, 143, 184), (192, 132, 252))
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=230, fill=255)
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
img.paste(grad, (0, 0), mask)

# 2. 爱心阴影
shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
ImageDraw.Draw(shadow).polygon(heart_points(516, 524, 19), fill=(226, 29, 116, 120))
shadow = shadow.filter(ImageFilter.GaussianBlur(18))
img = Image.alpha_composite(img, shadow)

# 3. 白色爱心 + 粉描边
draw = ImageDraw.Draw(img)
hp = heart_points(512, 512, 19)
draw.polygon(hp, fill=(255, 255, 255, 255))
draw.line(hp, fill=(242, 63, 138, 255), width=16, joint="curve")

# 4. 「77宝」两层文字
font = ImageFont.truetype("C:/Windows/Fonts/msyhbd.ttc", 196)
draw.text((516, 538), "77宝", font=font, fill=(226, 29, 116, 255), anchor="mm")
draw.text((512, 534), "77宝", font=font, fill=(255, 255, 255, 255),
          anchor="mm", stroke_width=7, stroke_fill=(242, 63, 138, 255))

img.save("icon-1024.png")
img.resize((512, 512), Image.LANCZOS).save("icon-512.png")
img.resize((192, 192), Image.LANCZOS).save("icon-192.png")
img.resize((180, 180), Image.LANCZOS).save("icon-180.png")
img.resize((32, 32), Image.LANCZOS).save("icon-32.png")
i256 = img.resize((256, 256), Image.LANCZOS)
i256.save("icon.ico", sizes=[(256, 256), (128, 128), (48, 48), (32, 32), (16, 16)])
print("OK: 已生成 icon-1024/512/192/180/32.png + icon.ico")
